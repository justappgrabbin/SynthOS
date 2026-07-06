import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3456;
const SCREENSHOT_DIR = path.join(os.homedir(), 'Documents', 'screenshots');

// Ensure screenshot directory exists
try { await fs.mkdir(SCREENSHOT_DIR, { recursive: true }); } catch(e) {}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== MCP TOOLS (Screenshot Server) ====================

// Tool 1: take_screenshot (web page via Puppeteer)
async function takeScreenshot({ url, width = 1920, height = 1080, fullPage = false, selector, waitForSelector, waitForTimeout = 0, outputPath }) {
  // Security: validate URL
  if (!url || !url.match(/^https?:\/\//i)) {
    throw new Error('Invalid URL: must start with http:// or https://');
  }

  const outFile = outputPath || path.join(SCREENSHOT_DIR, `web_${Date.now()}.png`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (waitForTimeout > 0) await new Promise(r => setTimeout(r, waitForTimeout));
    if (waitForSelector) await page.waitForSelector(waitForSelector, { timeout: 10000 });

    let element;
    if (selector) {
      element = await page.$(selector);
      if (!element) throw new Error(`Selector not found: ${selector}`);
    }

    await (element || page).screenshot({
      path: outFile,
      fullPage: selector ? false : fullPage
    });

    return { success: true, path: outFile, url };
  } finally {
    await browser.close();
  }
}

// Tool 2: take_system_screenshot (native OS tools)
async function takeSystemScreenshot({ mode = 'fullscreen', windowId, windowName, region, display, includeCursor = false, format = 'png', delay = 0, outputPath }) {
  const outFile = outputPath || path.join(SCREENSHOT_DIR, `system_${Date.now()}.${format}`);
  const platform = os.platform();

  await new Promise(r => setTimeout(r, delay * 1000));

  if (platform === 'darwin') {
    // macOS screencapture
    const args = ['-x'];
    if (format === 'jpg') args.push('-t', 'jpg');
    if (includeCursor) args.push('-C');
    if (display !== undefined) args.push('-D', String(display + 1));

    if (mode === 'fullscreen') {
      // default
    } else if (mode === 'window' && windowId) {
      args.push('-w', String(windowId));
    } else if (mode === 'window' && windowName) {
      args.push('-w', windowName);
    } else if (mode === 'region' && region) {
      args.push('-R', `${region.x},${region.y},${region.width},${region.height}`);
    }

    args.push(outFile);
    await execFileAsync('screencapture', args);

  } else if (platform === 'linux') {
    // Try maim first, then scrot, then grim
    const tools = ['maim', 'scrot', 'grim', 'gnome-screenshot', 'spectacle', 'import'];
    let tool = null;
    for (const t of tools) {
      try { await execFileAsync('which', [t]); tool = t; break; } catch(e) {}
    }

    if (!tool) throw new Error('No screenshot tool found. Install maim, scrot, grim, or gnome-screenshot.');

    if (tool === 'maim') {
      const args = [];
      if (mode === 'region' && region) {
        args.push('-g', `${region.width}x${region.height}+${region.x}+${region.y}`);
      }
      if (!includeCursor) args.push('--hidecursor');
      args.push(outFile);
      await execFileAsync('maim', args);

    } else if (tool === 'scrot') {
      const args = [];
      if (mode === 'region') args.push('-s');
      if (format === 'jpg') args.push('-q', '85');
      args.push(outFile);
      await execFileAsync('scrot', args);

    } else if (tool === 'grim') {
      if (mode === 'region' && region) {
        await execFileAsync('grim', ['-g', `${region.x},${region.y} ${region.width}x${region.height}`, outFile]);
      } else {
        await execFileAsync('grim', [outFile]);
      }
    } else {
      await execFileAsync(tool, [outFile]);
    }

  } else if (platform === 'win32') {
    // Windows PowerShell
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $bitmap.Save('${outFile.replace(/\\/g, '\\\\')}')
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    await execAsync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);
  }

  return { success: true, path: outFile, mode, platform };
}

// Tool 3: screenshot_dashboard (custom — capture the dashboard itself)
async function screenshotDashboard({ element, fullPage = false, outputPath }) {
  const outFile = outputPath || path.join(SCREENSHOT_DIR, `dashboard_${Date.now()}.png`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000)); // Let animations settle

    if (element) {
      const el = await page.$(element);
      if (el) await el.screenshot({ path: outFile });
      else await page.screenshot({ path: outFile, fullPage });
    } else {
      await page.screenshot({ path: outFile, fullPage });
    }

    return { success: true, path: outFile };
  } finally {
    await browser.close();
  }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', platform: os.platform() });
});

// List modules
app.get('/api/modules', (req, res) => {
  res.json(modules);
});

// Install/uninstall module tool
app.post('/api/modules/:module/:tool', async (req, res) => {
  const { module: modKey, tool } = req.params;
  const { action } = req.body; // 'install' or 'uninstall'

  // Simulate install/uninstall
  if (modules[modKey] && modules[modKey].tools.find(t => t.flag === tool)) {
    const t = modules[modKey].tools.find(t => t.flag === tool);
    t.installed = action === 'install';

    // Broadcast to WebSocket clients
    broadcast({ type: 'module-update', module: modKey, tool, installed: t.installed });

    res.json({ success: true, message: `${t.name} ${action}ed` });
  } else {
    res.status(404).json({ error: 'Module or tool not found' });
  }
});

// Screenshot API: Web page
app.post('/api/screenshot/web', async (req, res) => {
  try {
    const result = await takeScreenshot(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screenshot API: System
app.post('/api/screenshot/system', async (req, res) => {
  try {
    const result = await takeSystemScreenshot(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screenshot API: Dashboard
app.post('/api/screenshot/dashboard', async (req, res) => {
  try {
    const result = await screenshotDashboard(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List screenshots
app.get('/api/screenshots', async (req, res) => {
  try {
    const files = await fs.readdir(SCREENSHOT_DIR);
    const screenshots = files
      .filter(f => f.match(/\.(png|jpg|jpeg)$/i))
      .map(f => ({
        name: f,
        path: path.join(SCREENSHOT_DIR, f),
        url: `/screenshots/${f}`,
        created: (await fs.stat(path.join(SCREENSHOT_DIR, f))).mtime
      }))
      .sort((a, b) => b.created - a.created);
    res.json(screenshots);
  } catch (err) {
    res.json([]);
  }
});

// Serve screenshots
app.get('/screenshots/:file', async (req, res) => {
  const filePath = path.join(SCREENSHOT_DIR, req.params.file);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.status(404).send('Not found');
  }
});

// Environment variables
app.get('/api/env', (req, res) => {
  res.json(envVars);
});

app.post('/api/env', (req, res) => {
  const { name, value, hidden } = req.body;
  const existing = envVars.find(v => v.name === name);
  if (existing) {
    existing.value = value;
    existing.hidden = hidden;
  } else {
    envVars.push({ name, value, hidden });
  }
  res.json({ success: true });
});

app.delete('/api/env/:name', (req, res) => {
  const idx = envVars.findIndex(v => v.name === req.params.name);
  if (idx > -1) {
    envVars.splice(idx, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Brain memories
app.get('/api/brain', (req, res) => {
  res.json(memories);
});

app.post('/api/brain', (req, res) => {
  const memory = {
    ...req.body,
    slug: req.body.slug || 'memory-' + Date.now(),
    date: req.body.date || new Date().toISOString().split('T')[0]
  };
  memories.unshift(memory);
  res.json({ success: true, memory });
});

// MCP Protocol endpoint (SSE for MCP clients)
app.get('/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({
    jsonrpc: '2.0',
    id: null,
    result: {
      tools: [
        {
          name: 'take_screenshot',
          description: 'Capture a web page screenshot using Puppeteer',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to capture' },
              width: { type: 'number', default: 1920 },
              height: { type: 'number', default: 1080 },
              fullPage: { type: 'boolean', default: false },
              selector: { type: 'string' },
              waitForTimeout: { type: 'number', default: 0 }
            },
            required: ['url']
          }
        },
        {
          name: 'take_system_screenshot',
          description: 'Capture system screenshot using native OS tools',
          inputSchema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['fullscreen', 'window', 'region'], default: 'fullscreen' },
              windowName: { type: 'string' },
              region: { type: 'object', properties: { x: {type:'number'}, y: {type:'number'}, width: {type:'number'}, height: {type:'number'} } },
              format: { type: 'string', enum: ['png', 'jpg'], default: 'png' },
              delay: { type: 'number', default: 0 }
            },
            required: ['mode']
          }
        },
        {
          name: 'screenshot_dashboard',
          description: 'Capture the Core-Termux dashboard',
          inputSchema: {
            type: 'object',
            properties: {
              element: { type: 'string', description: 'CSS selector to capture specific element' },
              fullPage: { type: 'boolean', default: false }
            }
          }
        }
      ]
    }
  });

  req.on('close', () => {});
});

// MCP tool invocation
app.post('/mcp/invoke', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    let result;
    switch (name) {
      case 'take_screenshot':
        result = await takeScreenshot(args);
        break;
      case 'take_system_screenshot':
        result = await takeSystemScreenshot(args);
        break;
      case 'screenshot_dashboard':
        result = await screenshotDashboard(args);
        break;
      default:
        return res.status(400).json({ error: 'Unknown tool' });
    }
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== WEBSOCKET ====================

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'Core-Termux MCP connected' }));

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'screenshot-web') {
        const result = await takeScreenshot(msg.data);
        ws.send(JSON.stringify({ type: 'screenshot-result', result }));
      }
      else if (msg.type === 'screenshot-system') {
        const result = await takeSystemScreenshot(msg.data);
        ws.send(JSON.stringify({ type: 'screenshot-result', result }));
      }
      else if (msg.type === 'screenshot-dashboard') {
        const result = await screenshotDashboard(msg.data);
        ws.send(JSON.stringify({ type: 'screenshot-result', result }));
      }
      else if (msg.type === 'command') {
        // Simulate terminal command
        ws.send(JSON.stringify({ type: 'terminal', data: { type: 'prompt', text: msg.command } }));
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'terminal', data: { type: 'output', text: `Executed: ${msg.command}` } }));
        }, 300);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });
});

// ==================== MODULE DATA ====================

const modules = {
  lang: {
    name: 'Languages', icon: '🔤', color: '#58a6ff',
    desc: 'Programming languages and runtimes',
    tools: [
      { name: 'Node.js LTS', flag: 'nodejs', desc: 'Long-term support release of Node.js', installed: true },
      { name: 'Python', flag: 'python', desc: 'Python 3 interpreter', installed: true },
      { name: 'Perl', flag: 'perl', desc: 'Perl scripting language', installed: false },
      { name: 'PHP', flag: 'php', desc: 'PHP interpreter', installed: false },
      { name: 'Rust', flag: 'rust', desc: 'Rust compiler and Cargo', installed: false },
      { name: 'C/C++', flag: 'clang', desc: 'LLVM C/C++ compiler', installed: false },
      { name: 'Go', flag: 'golang', desc: 'Go programming language', installed: false }
    ]
  },
  db: {
    name: 'Databases', icon: '🗄️', color: '#a371f7',
    desc: 'Database servers and clients',
    tools: [
      { name: 'PostgreSQL', flag: 'postgresql', desc: 'Advanced relational database', installed: true },
      { name: 'MariaDB', flag: 'mariadb', desc: 'MySQL-compatible database', installed: false },
      { name: 'SQLite', flag: 'sqlite', desc: 'Lightweight embedded database', installed: true },
      { name: 'MongoDB', flag: 'mongodb', desc: 'Document-oriented NoSQL database', installed: false }
    ]
  },
  ai: {
    name: 'AI Agents', icon: '🤖', color: '#f0883e',
    desc: 'AI-powered coding assistants and agents',
    tools: [
      { name: 'Qwen Code', flag: 'qwen-code', desc: "Alibaba's AI coding assistant", installed: false },
      { name: 'Gemini CLI', flag: 'gemini-cli', desc: "Google's AI assistant with Gemini", installed: false },
      { name: 'Claude Code', flag: 'claude-code', desc: "Anthropic's CLI tool with Claude AI", installed: false },
      { name: 'Mistral Vibe', flag: 'mistral-vibe', desc: 'Coding assistant powered by Mistral', installed: false },
      { name: 'OpenClaude', flag: 'openclaude', desc: 'Open source Claude Code alternative', installed: false },
      { name: 'Ollama', flag: 'ollama', desc: 'Run open-source LLMs locally', installed: true },
      { name: 'Codex CLI', flag: 'codex', desc: 'OpenAI coding agent', installed: false },
      { name: 'OpenCode', flag: 'opencode', desc: 'Open-source terminal coding agent', installed: true },
      { name: 'Kimi Code', flag: 'kimi-code', desc: 'Kimi Code CLI for next-gen agents', installed: false },
      { name: 'MiMoCode', flag: 'mimocode', desc: "Xiaomi's fast local AI coding agent", installed: false }
    ]
  },
  editor: {
    name: 'Editor', icon: '✏️', color: '#3fb950',
    desc: 'Code editor and IDE components',
    tools: [
      { name: 'Neovim', flag: 'neovim', desc: 'Fast, extensible code editor', installed: true },
      { name: 'NvChad', flag: 'nvchad', desc: 'Modern Neovim configuration', installed: true },
      { name: 'GitHub Copilot', flag: 'copilot', desc: 'AI-powered code completion', installed: false },
      { name: 'CodeCompanion', flag: 'codecompanion', desc: 'AI chat assistant for code', installed: false }
    ]
  },
  dev: {
    name: 'Dev Tools', icon: '🛠️', color: '#58a6ff',
    desc: 'Development utilities and CLI tools',
    tools: [
      { name: 'GitHub CLI', flag: 'gh', desc: 'Official GitHub command-line tool', installed: true },
      { name: 'Wget', flag: 'wget', desc: 'File downloader', installed: true },
      { name: 'Curl', flag: 'curl', desc: 'HTTP client and transfer tool', installed: true },
      { name: 'LSD', flag: 'lsd', desc: 'Modern ls replacement with icons', installed: true },
      { name: 'Bat', flag: 'bat', desc: 'Modern cat replacement with syntax highlighting', installed: true },
      { name: 'Fzf', flag: 'fzf', desc: 'Command-line fuzzy finder', installed: true },
      { name: 'jq', flag: 'jq', desc: 'Lightweight JSON processor', installed: true },
      { name: 'Tree', flag: 'tree', desc: 'Recursive directory listing', installed: false },
      { name: 'ImageMagick', flag: 'imagemagick', desc: 'Image manipulation suite', installed: false },
      { name: 'Cloudflared', flag: 'cloudflared', desc: 'Cloudflare Tunnel client', installed: false }
    ]
  },
  npm: {
    name: 'NPM Global', icon: '📦', color: '#f85149',
    desc: 'Global Node.js packages',
    tools: [
      { name: 'TypeScript', flag: 'typescript', desc: 'TypeScript compiler', installed: true },
      { name: 'Prettier', flag: 'prettier', desc: 'Code formatter', installed: true },
      { name: 'Vercel CLI', flag: 'vercel', desc: 'Vercel deployment CLI', installed: false },
      { name: 'Ngrok', flag: 'ngrok', desc: 'Secure tunnel to localhost', installed: false },
      { name: 'Localtunnel', flag: 'localtunnel', desc: 'Expose localhost to internet', installed: false }
    ]
  },
  shell: {
    name: 'Shell', icon: '🐚', color: '#a371f7',
    desc: 'ZSH shell configuration and plugins',
    tools: [
      { name: 'ZSH', flag: 'zsh', desc: 'Z shell with plugins', installed: true },
      { name: 'Powerlevel10k', flag: 'p10k', desc: 'Modern fast theme', installed: true },
      { name: 'zsh-autosuggestions', flag: 'autosuggestions', desc: 'Smart autocompletion', installed: true },
      { name: 'zsh-syntax-highlighting', flag: 'syntax-highlight', desc: 'Syntax highlighting', installed: true },
      { name: 'fzf-tab', flag: 'fzf-tab', desc: 'Fuzzy navigation in completions', installed: true }
    ]
  },
  ui: {
    name: 'UI', icon: '🎨', color: '#f0883e',
    desc: 'Termux UI components and enhancements',
    tools: [
      { name: 'Termux:API', flag: 'termux-api', desc: 'Termux API access', installed: true },
      { name: 'Termux:GUI', flag: 'termux-gui', desc: 'GUI plugin for Termux', installed: false },
      { name: 'Termux:Widget', flag: 'termux-widget', desc: 'Home screen widgets', installed: false }
    ]
  },
  auto: {
    name: 'Automation', icon: '⚡', color: '#3fb950',
    desc: 'Automation and workflow tools',
    tools: [
      { name: 'n8n', flag: 'n8n', desc: 'Workflow automation platform', installed: false },
      { name: 'Tasker', flag: 'tasker', desc: 'Android automation app', installed: false }
    ]
  }
};

let envVars = [
  { name: 'OPENAI_API_KEY', value: 'sk-...', hidden: true },
  { name: 'DATABASE_URL', value: 'postgresql://localhost:5432/core', hidden: false },
  { name: 'CORE_DEBUG', value: '1', hidden: false },
  { name: 'GH_TOKEN', value: 'ghp_...', hidden: true },
  { name: 'NODE_ENV', value: 'development', hidden: false }
];

let memories = [
  { title: 'React Hook Form + Zod validation', category: 'frontend', tags: ['react','forms','zod'], date: '2026-06-23', slug: 'react-hook-form-zod' },
  { title: 'PostgreSQL connection pooling', category: 'devops', tags: ['postgres','performance'], date: '2026-06-20', slug: 'postgres-pooling' },
  { title: 'Termux API voice capture', category: 'android', tags: ['termux','voice'], date: '2026-06-18', slug: 'termux-voice' },
  { title: 'Next.js Turbopack on ARM', category: 'frontend', tags: ['nextjs','turbopack','arm'], date: '2026-06-15', slug: 'nextjs-turbopack-arm' },
  { title: 'ZSH persistent sessions', category: 'shell', tags: ['zsh','termux'], date: '2026-06-10', slug: 'zsh-sessions' }
];

// ==================== START ====================

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Core-Termux + MCP Screenshot Server                 ║
╠══════════════════════════════════════════════════════════════╣
║  Dashboard:  http://localhost:${PORT}                           ║
║  MCP SSE:    http://localhost:${PORT}/mcp/sse                   ║
║  MCP Invoke: POST /mcp/invoke                                ║
║  Health:     GET  /api/health                                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
