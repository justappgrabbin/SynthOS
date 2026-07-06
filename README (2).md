# Core-Termux + MCP Screenshot Server

A unified app that combines **Core-Termux** (modular dev environment dashboard) with **MCP Screenshot Server** (web + system screenshot capabilities via Model Context Protocol).

## What This Is

- **Core-Termux Dashboard** — Manage modules, AI agents, brain memories, environment variables, voice commands, and terminal — all from a web UI
- **MCP Screenshot Server** — Capture web pages (Puppeteer), system screenshots (native OS tools), and the dashboard itself — exposed as MCP tools
- **WebSocket + REST API** — Real-time communication between dashboard and server

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open http://localhost:3456 in your browser
```

## Features

| Feature | Description |
|---------|-------------|
| 🏠 Dashboard | Overview of all 9 modules with install status |
| 📦 Modules | Install/uninstall individual tools per module |
| 🤖 AI Agents | 10+ coding agents (Ollama, OpenCode, Claude, etc.) |
| 🧠 Second Brain | Save/search markdown memories with categories |
| 📸 Screenshot MCP | Web capture, system capture, dashboard capture |
| 🎙️ Voice | Voice-to-agent with AI agent selection |
| ⚙️ Environment | Manage env vars with hidden secrets |
| 💻 Terminal | Functional command simulator |
| 🔧 Settings | Framework updates, shell config, maintenance |

## MCP Integration

The server exposes MCP tools compatible with Claude Desktop, Cursor, and any MCP client:

### Tools

1. **`take_screenshot`** — Capture any web page via Puppeteer
   - `url` (required), `width`, `height`, `fullPage`, `selector`, `waitForTimeout`

2. **`take_system_screenshot`** — Capture desktop/system via native tools
   - `mode`: `fullscreen` | `window` | `region`
   - `windowName`, `region` {x,y,width,height}, `format`, `delay`

3. **`screenshot_dashboard`** — Capture the Core-Termux dashboard itself
   - `element` (CSS selector), `fullPage`

### MCP Client Config (Claude Desktop)

```json
{
  "mcpServers": {
    "core-termux-screenshot": {
      "command": "node",
      "args": ["/path/to/core-termux-mcp/src/index.js"]
    }
  }
}
```

Or use the SSE endpoint: `http://localhost:3456/mcp/sse`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/modules` | List all modules |
| POST | `/api/modules/:module/:tool` | Install/uninstall tool |
| POST | `/api/screenshot/web` | Capture web page |
| POST | `/api/screenshot/system` | Capture system |
| POST | `/api/screenshot/dashboard` | Capture dashboard |
| GET | `/api/screenshots` | List saved screenshots |
| GET | `/api/env` | List environment variables |
| POST | `/api/env` | Create/update env var |
| GET | `/api/brain` | List memories |
| POST | `/api/brain` | Save memory |
| GET | `/mcp/sse` | MCP SSE endpoint |
| POST | `/mcp/invoke` | MCP tool invocation |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `screenshot-web` | Client → Server | Request web screenshot |
| `screenshot-system` | Client → Server | Request system screenshot |
| `screenshot-dashboard` | Client → Server | Request dashboard screenshot |
| `screenshot-result` | Server → Client | Screenshot completed |
| `command` | Client → Server | Execute terminal command |
| `terminal` | Server → Client | Terminal output |
| `module-update` | Server → Client | Module status changed |

## Project Structure

```
core-termux-mcp/
├── src/
│   └── index.js          # Express server + MCP tools + WebSocket
├── public/
│   └── index.html        # Dashboard UI (single file)
├── package.json
└── README.md
```

## Platform Support

| Feature | macOS | Linux | Windows | Termux |
|---------|-------|-------|---------|--------|
| Web Screenshot | ✅ | ✅ | ✅ | ⚠️ (needs proot) |
| System Screenshot | ✅ (screencapture) | ✅ (maim/scrot/grim) | ✅ (PowerShell) | ⚠️ (termux-api) |
| Dashboard Screenshot | ✅ | ✅ | ✅ | ✅ |
| MCP Protocol | ✅ | ✅ | ✅ | ✅ |

## Termux Notes

For Termux on Android:
- Install Node.js: `pkg install nodejs`
- Install screenshot tools: `pkg install termux-api` (for system capture)
- Run: `node src/index.js`
- Access via browser or `termux-open-url http://localhost:3456`

## License

MIT
