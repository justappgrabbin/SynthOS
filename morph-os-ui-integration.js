/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║              MORPH OS — UI INTEGRATION (Drop into your existing OS)             ║
 * ║                                                                               ║
 * ║  Add this to your existing morph-engine-v1.4-unified.html                     ║
 * ║  Requires: morph-os-birth-mesh.js loaded before this script                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BIRTH CHART INPUT PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function createBirthChartPanel() {
  const panel = document.createElement('div');
  panel.id = 'birth-chart-panel';
  panel.className = 'morph-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3>🌟 Birth Chart Calculator</h3>
      <button onclick="togglePanel('birth-chart-panel')">✕</button>
    </div>
    <div class="panel-body">
      <div class="input-group">
        <label>Birth Date</label>
        <input type="date" id="birth-date" value="1990-05-15">
      </div>
      <div class="input-group">
        <label>Birth Time</label>
        <input type="time" id="birth-time" value="14:30">
      </div>
      <div class="input-group">
        <label>Location</label>
        <input type="text" id="birth-location" value="New York" placeholder="City name">
      </div>
      <div class="input-group">
        <label>Latitude</label>
        <input type="number" id="birth-lat" value="40.7128" step="0.0001">
      </div>
      <div class="input-group">
        <label>Longitude</label>
        <input type="number" id="birth-lon" value="-74.0060" step="0.0001">
      </div>
      <button class="morph-button primary" onclick="calculateAndActivate()">
        🧬 Calculate & Activate Mesh
      </button>
      <div id="calculation-status" class="status-text"></div>
    </div>
  `;
  return panel;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION & ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateAndActivate() {
  const date = document.getElementById('birth-date').value;
  const time = document.getElementById('birth-time').value;
  const location = document.getElementById('birth-location').value;
  const lat = parseFloat(document.getElementById('birth-lat').value);
  const lon = parseFloat(document.getElementById('birth-lon').value);

  const status = document.getElementById('calculation-status');
  status.textContent = '⏳ Computing three-pipeline chart...';

  // Calculate birth chart
  const chart = MorphOS.computeBirthChart(date, time, location, lat, lon);

  // Store globally for other systems
  window.currentChart = chart;

  // Activate substrate mesh
  const mesh = MorphOS.activateSubstrateMesh(chart);
  window.currentMesh = mesh;

  // Update visualization
  updateMeshVisualization(mesh);

  // Generate WorldGen prompt
  const phs = inferPHSFromChart(chart);
  const worldPrompt = MorphOS.buildWorldGenPrompt(phs, {
    dominantColor: getDominantColor(mesh),
    phase: chart.dominantSystem.system,
    coherence: mesh.coherence
  });

  // Store for WorldGen
  window.worldGenPrompt = worldPrompt;

  // Update UI
  status.innerHTML = `
    ✅ <strong>Chart Computed!</strong><br>
    🧠 System: ${chart.dominantSystem.system}<br>
    ⚡ Circuit: ${chart.dominantSystem.circuit}<br>
    🏗️ Architecture: ${chart.neuralArchitecture.base}<br>
    🔥 Active Gates: ${mesh.activeGateCount}/64<br>
    🔗 Complete Channels: ${mesh.completeChannelCount}/36<br>
    📊 Coherence: ${(mesh.coherence * 100).toFixed(1)}%<br>
    <br>
    <button class="morph-button" onclick="enterIndiverse()">🏠 Enter Indiverse</button>
    <button class="morph-button" onclick="enterResonanceNetwork()">🌐 Enter Resonance Network</button>
  `;

  // Log to console for debugging
  console.log('📊 Birth Chart:', chart);
  console.log('🕸️ Mesh:', mesh);
  console.log('🌍 WorldGen Prompt:', worldPrompt);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESH VISUALIZATION UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

function updateMeshVisualization(mesh) {
  // Replace random particles with actual gate nodes
  if (window.particles && window.particles.length > 0) {
    // Clear existing particles
    window.particles = [];

    // Create gate nodes
    mesh.nodes.forEach(node => {
      window.particles.push({
        x: node.position?.x || Math.random() * canvas.width,
        y: node.position?.y || Math.random() * canvas.height,
        vx: 0, vy: 0,
        radius: node.size,
        color: node.color,
        pulse: node.pulse,
        gate: node.number,
        name: node.name,
        active: node.active,
        circuit: node.circuit,
        center: node.center
      });
    });

    // Store edges for drawing
    window.meshEdges = mesh.edges.filter(e => e.complete).map(e => ({
      from: e.source,
      to: e.target,
      color: e.color,
      width: e.width
    }));
  }

  // Update info panel
  updateInfoPanel(mesh);
}

function updateInfoPanel(mesh) {
  const info = document.getElementById('info-panel');
  if (!info) return;

  const dimCounts = {};
  Object.entries(mesh.dimensions).forEach(([dim, nodes]) => {
    dimCounts[dim] = nodes.filter(n => n.active).length;
  });

  info.innerHTML = `
    <h4>🕸️ Active Mesh</h4>
    <p><strong>Circuit:</strong> ${mesh.dominantCircuit}</p>
    <p><strong>Architecture:</strong> ${mesh.neuralArchitecture.base}</p>
    <p><strong>Function:</strong> ${mesh.neuralArchitecture.function}</p>
    <hr>
    <p><strong>Dimensions:</strong></p>
    ${Object.entries(dimCounts).map(([dim, count]) => 
      `<p>• ${dim}: ${count} gates</p>`
    ).join('')}
    <hr>
    <p><strong>Coherence:</strong> ${(mesh.coherence * 100).toFixed(1)}%</p>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHS INFERENCE FROM CHART
// ═══════════════════════════════════════════════════════════════════════════════

function inferPHSFromChart(chart) {
  // Infer PHS from chart data
  // This is a simplified version — full PHS requires deeper calculation

  const sunGate = chart.tropical.positions['Sun']?.gate || 1;
  const moonGate = chart.tropical.positions['Moon']?.gate || 1;

  // Environment from sun gate
  const envMap = {
    1: 'caves', 2: 'markets', 3: 'kitchens', 4: 'mountains',
    5: 'valleys', 6: 'shores', 7: 'mountains', 8: 'caves',
    9: 'mountains', 10: 'shores', 11: 'markets', 12: 'caves'
  };

  // Tone from moon gate
  const toneMap = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6
  };

  return {
    environment: envMap[sunGate % 12 + 1] || 'valleys',
    tone: toneMap[moonGate % 12 + 1] || 3,
    base: Math.min(Math.max(sunGate % 5 + 1, 1), 5),
    digestion: { frequency: 'intermittent', quality: 'integrative', medium: 'relational' }
  };
}

function getDominantColor(mesh) {
  const colors = mesh.nodes.filter(n => n.active).map(n => n.color);
  if (colors.length === 0) return 'silver';

  // Count occurrences
  const counts = {};
  colors.forEach(c => counts[c] = (counts[c] || 0) + 1);

  // Return most common
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

function enterIndiverse() {
  const chart = window.currentChart;
  const mesh = window.currentMesh;

  if (!chart || !mesh) {
    alert('Please calculate a birth chart first!');
    return;
  }

  // Generate personal world prompt
  const phs = inferPHSFromChart(chart);
  const prompt = MorphOS.buildWorldGenPrompt(phs, {
    dominantColor: getDominantColor(mesh),
    phase: chart.dominantSystem.system,
    coherence: mesh.coherence
  });

  // Transition to You-n-i-verse view
  transitionView('indiverse', {
    chart,
    mesh,
    worldPrompt: prompt,
    title: `${chart.location.name}'s Indiverse`
  });
}

function enterResonanceNetwork() {
  const chart = window.currentChart;
  const mesh = window.currentMesh;

  if (!chart || !mesh) {
    alert('Please calculate a birth chart first!');
    return;
  }

  // Transition to Resonance Network view
  transitionView('resonance', {
    chart,
    mesh,
    title: 'Resonance Network'
  });
}

function transitionView(viewName, data) {
  // Hide all views
  document.querySelectorAll('.morph-view').forEach(v => v.classList.remove('active'));

  // Show target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.add('active');
    target.dispatchEvent(new CustomEvent('view-activate', { detail: data }));
  }

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function initMorphOS() {
  // Add birth chart panel to UI
  const container = document.getElementById('app-container') || document.body;
  container.appendChild(createBirthChartPanel());

  // Add menu item
  const nav = document.querySelector('.bottom-nav') || document.querySelector('.dock');
  if (nav) {
    const birthBtn = document.createElement('button');
    birthBtn.className = 'nav-item';
    birthBtn.innerHTML = '🌟';
    birthBtn.title = 'Birth Chart';
    birthBtn.onclick = () => togglePanel('birth-chart-panel');
    nav.appendChild(birthBtn);
  }

  console.log('🌟 MorphOS Birth & Mesh Engine initialized');
  console.log('📦 Version:', MorphOS.version);
  console.log('🔮 Ready to calculate birth charts');
}

// Helper functions
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.toggle('active');
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMorphOS);
} else {
  initMorphOS();
}
