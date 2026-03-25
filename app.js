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
  // Initialize ROI calculator if showing demo
  if (pageId === 'demo') {
    setTimeout(() => {
      updateROI();
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

// ── Grid Dispatch ROI Calculator ──
// Computes annual savings from HJB-optimal dispatch vs naive baseline.

const MARKET_PRICES = {
  ercot: { avgLMP: 45, peakMultiplier: 3.2, ancillaryRate: 12, currency: 'USD', co2Factor: 0.42 },
  sen:   { avgLMP: 55, peakMultiplier: 2.5, ancillaryRate: 8,  currency: 'MXN', co2Factor: 0.48 },
  mibel: { avgLMP: 60, peakMultiplier: 2.8, ancillaryRate: 15, currency: 'EUR', co2Factor: 0.35 },
};

function calculateROI(fleetMW, costPerMWh, batteryMWh, capacityFactor, market) {
  const mp = MARKET_PRICES[market] || MARKET_PRICES.ercot;
  const hoursPerYear = 8760;
  const effectiveHours = hoursPerYear * (capacityFactor / 100);

  // Annual energy throughput
  const annualMWh = fleetMW * effectiveHours;
  const annualCost = annualMWh * costPerMWh;

  // HJB savings range (8-15% from optimization)
  const baseSavingsPct = 0.08 + 0.04 * Math.min(1, batteryMWh / (fleetMW * 4));
  const ancillaryBonus = batteryMWh > 0 ? batteryMWh * mp.ancillaryRate * 365 : 0;
  const totalSavings = annualCost * baseSavingsPct + ancillaryBonus;

  // License cost (scales with fleet size)
  let licenseCost = 200000;
  if (fleetMW > 500) licenseCost = 500000;
  else if (fleetMW > 200) licenseCost = 350000;
  else if (fleetMW > 50) licenseCost = 200000;
  else licenseCost = 150000;

  const roi = totalSavings / licenseCost;

  // Battery life extension (degradation-aware dispatch extends life by 15-25%)
  const batteryLifeExt = batteryMWh > 0 ? 1.5 + (baseSavingsPct / 0.15) * 1.5 : 0;

  // CO₂ avoided (from efficiency gains)
  const co2Avoided = annualMWh * baseSavingsPct * mp.co2Factor;

  // Generate 24-hour dispatch comparison
  const hourlyBaseline = [];
  const hourlyOptimized = [];
  for (let h = 0; h < 24; h++) {
    const loadShape = 0.5 + 0.5 * Math.exp(-Math.pow((h - 16) / 5, 2));
    const basePrice = costPerMWh * loadShape * (1 + 0.3 * Math.sin(h * Math.PI / 12));
    const optPrice = basePrice * (1 - baseSavingsPct - 0.03 * (batteryMWh > 0 ? Math.sin(h * Math.PI / 8) : 0));
    hourlyBaseline.push(Math.max(10, basePrice));
    hourlyOptimized.push(Math.max(8, optPrice));
  }

  return {
    annualCost, totalSavings, licenseCost, roi,
    savingsPct: baseSavingsPct * 100,
    batteryLifeExt, co2Avoided,
    hourlyBaseline, hourlyOptimized,
  };
}

function formatUSD(val) {
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'K';
  return '$' + val.toFixed(0);
}

function updateROI() {
  const fleetMW = +document.getElementById('slider-fleet').value;
  const costPerMWh = +document.getElementById('slider-cost').value;
  const batteryMWh = +document.getElementById('slider-battery').value;
  const cf = +document.getElementById('slider-cf').value;
  const market = document.getElementById('select-market').value;

  // Update labels
  document.getElementById('val-fleet').textContent = fleetMW + ' MW';
  document.getElementById('val-cost').textContent = '$' + costPerMWh + ' /MWh';
  document.getElementById('val-battery').textContent = batteryMWh + ' MWh';
  document.getElementById('val-cf').textContent = cf + '%';

  const r = calculateROI(fleetMW, costPerMWh, batteryMWh, cf, market);

  document.getElementById('result-annual-cost').innerHTML =
    formatUSD(r.annualCost) + '<span class="result-metric-unit"> /yr</span>';
  document.getElementById('result-savings').innerHTML =
    formatUSD(r.totalSavings) + '<span class="result-metric-unit"> /yr</span>';
  document.getElementById('result-license').innerHTML =
    formatUSD(r.licenseCost) + '<span class="result-metric-unit"> /yr</span>';
  document.getElementById('result-roi').innerHTML =
    r.roi.toFixed(0) + 'x<span class="result-metric-unit"> return</span>';
  document.getElementById('result-battery-life').innerHTML =
    '+' + r.batteryLifeExt.toFixed(1) + '<span class="result-metric-unit"> years</span>';
  document.getElementById('result-co2').innerHTML =
    Math.round(r.co2Avoided).toLocaleString() + '<span class="result-metric-unit"> tons/yr</span>';

  drawChart(r);
}

// ── Dispatch Cost Chart (Canvas) ──
function drawChart(roiResult) {
  const canvas = document.getElementById('demoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = rect.width - 48;
  canvas.height = Math.max(200, rect.height - 48);

  const w = canvas.width;
  const h = canvas.height;

  if (!roiResult) {
    const fleetMW = +document.getElementById('slider-fleet').value;
    const costPerMWh = +document.getElementById('slider-cost').value;
    const batteryMWh = +document.getElementById('slider-battery').value;
    const cf = +document.getElementById('slider-cf').value;
    const market = document.getElementById('select-market').value;
    roiResult = calculateROI(fleetMW, costPerMWh, batteryMWh, cf, market);
  }

  ctx.clearRect(0, 0, w, h);

  const baseline = roiResult.hourlyBaseline;
  const optimized = roiResult.hourlyOptimized;
  const maxVal = Math.max(...baseline) * 1.1;
  const barWidth = (w - 80) / 24 / 2.4;
  const chartH = h - 70;

  // Grid lines
  ctx.strokeStyle = 'rgba(26, 39, 68, 0.5)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y <= 4; y++) {
    const val = (maxVal / 4) * y;
    const py = h - 40 - (y / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(55, py);
    ctx.lineTo(w - 10, py);
    ctx.stroke();
    ctx.fillStyle = '#3a4a6b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText('$' + val.toFixed(0), 52, py + 4);
  }

  // Bars
  for (let i = 0; i < 24; i++) {
    const x = 60 + i * ((w - 80) / 24);

    // Baseline bar
    const bh = (baseline[i] / maxVal) * chartH;
    ctx.fillStyle = 'rgba(255, 99, 71, 0.6)';
    ctx.fillRect(x, h - 40 - bh, barWidth, bh);

    // Optimized bar
    const oh = (optimized[i] / maxVal) * chartH;
    ctx.fillStyle = 'rgba(0, 209, 255, 0.8)';
    ctx.fillRect(x + barWidth + 1, h - 40 - oh, barWidth, oh);

    // Hour label (every 4h)
    if (i % 4 === 0) {
      ctx.fillStyle = '#3a4a6b';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(i + 'h', x + barWidth, h - 10);
    }
  }

  // Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText('24-Hour Dispatch Cost Comparison ($/MWh)', 55, 15);

  // Legend
  ctx.fillStyle = 'rgba(255, 99, 71, 0.6)';
  ctx.fillRect(55, 32, 12, 8);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Inter';
  ctx.fillText('Baseline', 72, 40);

  ctx.fillStyle = 'rgba(0, 209, 255, 0.8)';
  ctx.fillRect(140, 32, 12, 8);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('PRIMEngine Optimized', 157, 40);
}

// ── Contact Form (Formspree) ──
function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const btn = form.querySelector('button[type="submit"]');
  const origText = btn.textContent;
  btn.textContent = '⏳ Sending...';
  btn.style.opacity = '0.7';

  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  .then(res => {
    btn.textContent = origText;
    btn.style.opacity = '1';
    if (res.ok) {
      document.getElementById('form-success').style.display = 'block';
      form.reset();
      setTimeout(() => {
        document.getElementById('form-success').style.display = 'none';
      }, 5000);
    } else {
      alert('Something went wrong. Please email contact@primenergeia.com directly.');
    }
  })
  .catch(() => {
    btn.textContent = origText;
    btn.style.opacity = '1';
    alert('Network error. Please email contact@primenergeia.com directly.');
  });
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
