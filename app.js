// ============================================================
//  PRIME-Platform — Client Application
//  PRIMEnergeia S.A.S.
// ============================================================

// ── Page Routing ──
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update nav links
  document.querySelectorAll('.navbar-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');
  // Initialize demo chart if showing demo
  if (pageId === 'demo') {
    setTimeout(() => {
      updateDemo();
      drawChart();
    }, 100);
  }
}

function toggleMobile() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(5, 8, 16, 0.95)';
    nav.style.borderBottomColor = 'rgba(26, 39, 68, 0.8)';
  } else {
    nav.style.background = 'rgba(5, 8, 16, 0.85)';
    nav.style.borderBottomColor = 'rgba(26, 39, 68, 0.5)';
  }
});

// ── Particle System ──
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 30 : 60;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (8 + Math.random() * 12) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';
    particle.style.width = (1 + Math.random() * 2) + 'px';
    particle.style.height = particle.style.width;
    if (Math.random() > 0.7) {
      particle.style.background = '#00ff88';
    }
    container.appendChild(particle);
  }
}

// ── Granas Simulation Engine (simplified client-side) ──
// This is a simplified analytical model for the demo.
// The real engine uses full TMM + Bayesian GP + HJB on the server.

function granasSimulate(params) {
  const { thickness, bandgap, annealTemp, etlThickness, arcThickness } = params;

  // --- Perovskite top cell ---
  // Optimal thickness ~500nm, bandgap ~1.68eV for tandem
  const thicknessOpt = 500;
  const thicknessPenalty = 1 - 0.15 * Math.pow((thickness - thicknessOpt) / 300, 2);

  // Bandgap: optimal for tandem is ~1.68 eV
  const bgOpt = 1.68;
  const bgPenalty = 1 - 0.25 * Math.pow((bandgap - bgOpt) / 0.15, 2);

  // Annealing: optimal ~120°C, too high causes decomposition
  const annealOpt = 120;
  let annealFactor = 1 - 0.20 * Math.pow((annealTemp - annealOpt) / 60, 2);
  if (annealTemp > 170) annealFactor -= 0.15 * (annealTemp - 170) / 30;

  // ETL: optimal ~25nm SnO₂
  const etlOpt = 25;
  const etlFactor = 1 - 0.10 * Math.pow((etlThickness - etlOpt) / 20, 2);

  // ARC: optimal ~80nm MgF₂
  const arcOpt = 80;
  const arcFactor = 1 - 0.08 * Math.pow((arcThickness - arcOpt) / 40, 2);

  // Combined quality factor
  const quality = Math.max(0.3, Math.min(1.0,
    thicknessPenalty * bgPenalty * annealFactor * etlFactor * arcFactor
  ));

  // --- Performance metrics ---
  const basePCE = 33.7;  // World record tandem
  const pce = Math.max(15, basePCE * quality);

  // Jsc: limited by current matching
  const jscTop = 21.5 * quality * thicknessPenalty;
  const jscBottom = 22.0 * (1 - 0.3 * (bandgap - 1.5) / 0.35);
  const jsc = Math.min(jscTop, jscBottom);

  // Voc: sum of sub-cell Vocs minus recombination
  const vocTop = bandgap - 0.35 - 0.05 * (1 - quality);
  const vocBottom = 0.72;
  const voc = vocTop + vocBottom;

  // Fill factor
  const ff = Math.max(60, Math.min(86, 82 * quality + 4 * Math.random()));

  // LCOE (simplified: inversely proportional to PCE × stability)
  const stability = Math.max(5, 22 * quality - 2);
  const lcoe = Math.max(1.5, 4.5 / (pce / 25) / (stability / 15));

  // EQE spectrum (simplified 30-point curve)
  const eqeTop = [];
  const eqeBottom = [];
  for (let wl = 300; wl <= 1200; wl += 30) {
    let eqt = 0, eqb = 0;
    // Top cell: absorbs 300-780nm
    if (wl >= 350 && wl <= 780) {
      const center = 550;
      const width = 250;
      eqt = quality * 0.92 * Math.exp(-0.5 * Math.pow((wl - center) / width, 2));
      if (wl < 400) eqt *= (wl - 300) / 100;
      if (wl > 700) eqt *= Math.max(0, 1 - (wl - 700) / 100);
    }
    // Bottom cell: absorbs 780-1200nm
    if (wl >= 700 && wl <= 1180) {
      const center = 950;
      const width = 200;
      eqb = quality * 0.88 * Math.exp(-0.5 * Math.pow((wl - center) / width, 2));
      if (wl < 800) eqb *= Math.max(0, (wl - 700) / 100);
      if (wl > 1100) eqb *= Math.max(0, 1 - (wl - 1100) / 80);
    }
    eqeTop.push({ wl, val: eqt * 100 });
    eqeBottom.push({ wl, val: eqb * 100 });
  }

  return {
    pce: pce.toFixed(1),
    jsc: jsc.toFixed(1),
    voc: voc.toFixed(2),
    ff: ff.toFixed(1),
    lcoe: lcoe.toFixed(1),
    t80: stability.toFixed(1),
    eqeTop,
    eqeBottom,
    quality: (quality * 100).toFixed(0)
  };
}

function getParams() {
  return {
    thickness: +document.getElementById('slider-thickness').value,
    bandgap: +document.getElementById('slider-bandgap').value / 100,
    annealTemp: +document.getElementById('slider-anneal').value,
    etlThickness: +document.getElementById('slider-etl').value,
    arcThickness: +document.getElementById('slider-arc').value,
  };
}

function updateDemo() {
  const p = getParams();
  document.getElementById('val-thickness').textContent = p.thickness + ' nm';
  document.getElementById('val-bandgap').textContent = p.bandgap.toFixed(2) + ' eV';
  document.getElementById('val-anneal').textContent = p.annealTemp + ' °C';
  document.getElementById('val-etl').textContent = p.etlThickness + ' nm';
  document.getElementById('val-arc').textContent = p.arcThickness + ' nm';

  const r = granasSimulate(p);
  document.getElementById('result-pce').innerHTML = r.pce + '<span class="result-metric-unit"> %</span>';
  document.getElementById('result-jsc').innerHTML = r.jsc + '<span class="result-metric-unit"> mA/cm²</span>';
  document.getElementById('result-voc').innerHTML = r.voc + '<span class="result-metric-unit"> V</span>';
  document.getElementById('result-ff').innerHTML = r.ff + '<span class="result-metric-unit"> %</span>';
  document.getElementById('result-lcoe').innerHTML = r.lcoe + '<span class="result-metric-unit"> ¢/kWh</span>';
  document.getElementById('result-t80').innerHTML = r.t80 + '<span class="result-metric-unit"> years</span>';
}

function runSimulation() {
  const btn = document.querySelector('.demo-run-btn');
  btn.textContent = '⏳ Simulating...';
  btn.style.opacity = '0.7';

  setTimeout(() => {
    updateDemo();
    drawChart();
    btn.textContent = '▶ Run Simulation';
    btn.style.opacity = '1';
  }, 800);
}

// ── EQE Chart (Canvas) ──
function drawChart() {
  const canvas = document.getElementById('demoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = rect.width - 48;
  canvas.height = Math.max(200, rect.height - 48);

  const w = canvas.width;
  const h = canvas.height;
  const p = getParams();
  const r = granasSimulate(p);

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(26, 39, 68, 0.5)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y <= 100; y += 20) {
    const py = h - 40 - (y / 100) * (h - 60);
    ctx.beginPath();
    ctx.moveTo(50, py);
    ctx.lineTo(w - 10, py);
    ctx.stroke();

    ctx.fillStyle = '#3a4a6b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(y + '%', 45, py + 4);
  }

  // X-axis labels
  const data = r.eqeTop;
  const xMin = data[0].wl;
  const xMax = data[data.length - 1].wl;
  for (let wl = 400; wl <= 1200; wl += 200) {
    const px = 50 + ((wl - xMin) / (xMax - xMin)) * (w - 60);
    ctx.fillStyle = '#3a4a6b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(wl + 'nm', px, h - 10);
  }

  // Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText('External Quantum Efficiency (EQE)', 50, 15);

  // Draw EQE curves
  function drawCurve(data, color, alpha) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    data.forEach((p, i) => {
      const px = 50 + ((p.wl - xMin) / (xMax - xMin)) * (w - 60);
      const py = h - 40 - (p.val / 100) * (h - 60);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Fill
    ctx.lineTo(50 + ((data[data.length-1].wl - xMin) / (xMax - xMin)) * (w - 60), h - 40);
    ctx.lineTo(50 + ((data[0].wl - xMin) / (xMax - xMin)) * (w - 60), h - 40);
    ctx.closePath();
    ctx.fillStyle = color.replace('1)', alpha + ')').replace('rgb', 'rgba');
    ctx.fill();
  }

  drawCurve(r.eqeTop, 'rgba(0, 209, 255, 1)', 0.15);
  drawCurve(r.eqeBottom, 'rgba(255, 99, 71, 1)', 0.10);

  // Legend
  const legendY = 35;
  ctx.fillStyle = '#00d1ff';
  ctx.fillRect(50, legendY, 12, 3);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Inter';
  ctx.textAlign = 'left';
  ctx.fillText('Perovskite (top)', 66, legendY + 4);

  ctx.fillStyle = '#FF6347';
  ctx.fillRect(170, legendY, 12, 3);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Silicon (bottom)', 186, legendY + 4);
}

// ── Contact Form ──
function handleSubmit(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('contact-name').value,
    company: document.getElementById('contact-company').value,
    email: document.getElementById('contact-email').value,
    interest: document.getElementById('contact-interest').value,
    message: document.getElementById('contact-message').value,
    timestamp: new Date().toISOString()
  };
  console.log('Contact submission:', data);
  // In production, this would POST to a backend
  document.getElementById('form-success').style.display = 'block';
  document.getElementById('contactForm').reset();
  setTimeout(() => {
    document.getElementById('form-success').style.display = 'none';
  }, 5000);
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  createParticles();

  // Handle window resize for chart
  window.addEventListener('resize', () => {
    if (document.getElementById('page-demo').classList.contains('active')) {
      drawChart();
    }
  });
});
