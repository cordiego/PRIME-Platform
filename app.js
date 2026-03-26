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
    setTimeout(() => { updateROI(); }, 100);
  }
  // Render simulation results if showing results
  if (pageId === 'results') {
    setTimeout(() => { renderSimResults(); }, 100);
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
// CLIENT-FACING ROI Calculator
// Shows the CLIENT's savings when they switch from naive dispatch to PRIMEngine.
// Based on validated backtest: 55.7% uplift, 36.9x price spread.

const MARKET_PARAMS = {
  // ERCOT hubs
  ercot:       { avgLMP: 57, spreadRatio: 36.9, upliftPct: 55.7, ancillaryRate: 12, currency: 'USD', co2Factor: 0.42 },
  ercot_north: { avgLMP: 52, spreadRatio: 30.0, upliftPct: 50.2, ancillaryRate: 11, currency: 'USD', co2Factor: 0.42 },
  ercot_south: { avgLMP: 48, spreadRatio: 25.0, upliftPct: 48.0, ancillaryRate: 10, currency: 'USD', co2Factor: 0.40 },
  ercot_west:  { avgLMP: 65, spreadRatio: 42.0, upliftPct: 60.0, ancillaryRate: 14, currency: 'USD', co2Factor: 0.45 },
  // PJM (US East — 180 GW)
  pjm:         { avgLMP: 42, spreadRatio: 18.0, upliftPct: 38.0, ancillaryRate: 15, currency: 'USD', co2Factor: 0.38 },
  pjm_comed:   { avgLMP: 38, spreadRatio: 15.0, upliftPct: 35.0, ancillaryRate: 14, currency: 'USD', co2Factor: 0.40 },
  pjm_peco:    { avgLMP: 45, spreadRatio: 20.0, upliftPct: 40.0, ancillaryRate: 16, currency: 'USD', co2Factor: 0.36 },
  // CAISO (California — 80 GW)
  caiso:       { avgLMP: 55, spreadRatio: 25.0, upliftPct: 48.0, ancillaryRate: 18, currency: 'USD', co2Factor: 0.20 },
  caiso_np15:  { avgLMP: 50, spreadRatio: 22.0, upliftPct: 45.0, ancillaryRate: 16, currency: 'USD', co2Factor: 0.18 },
  // MISO (Midwest — 190 GW)
  miso:        { avgLMP: 35, spreadRatio: 12.0, upliftPct: 32.0, ancillaryRate: 8,  currency: 'USD', co2Factor: 0.55 },
  // SPP (Central — 65 GW)
  spp:         { avgLMP: 30, spreadRatio: 15.0, upliftPct: 35.0, ancillaryRate: 7,  currency: 'USD', co2Factor: 0.48 },
  // NYISO (New York — 35 GW)
  nyiso:       { avgLMP: 48, spreadRatio: 22.0, upliftPct: 42.0, ancillaryRate: 20, currency: 'USD', co2Factor: 0.28 },
  // ISONE (New England — 30 GW)
  isone:       { avgLMP: 52, spreadRatio: 20.0, upliftPct: 40.0, ancillaryRate: 18, currency: 'USD', co2Factor: 0.30 },
  // Canada
  ieso:        { avgLMP: 28, spreadRatio: 8.0,  upliftPct: 28.0, ancillaryRate: 5,  currency: 'CAD', co2Factor: 0.03 },
  aeso:        { avgLMP: 65, spreadRatio: 30.0, upliftPct: 52.0, ancillaryRate: 12, currency: 'CAD', co2Factor: 0.55 },
  // SEN nodes (México)
  sen_mty:     { avgLMP: 48, spreadRatio: 14.0, upliftPct: 42.5, ancillaryRate: 8, currency: 'USD', co2Factor: 0.48 },
  sen_vza:     { avgLMP: 45, spreadRatio: 15.5, upliftPct: 44.0, ancillaryRate: 7, currency: 'USD', co2Factor: 0.46 },
  sen_gdl:     { avgLMP: 43, spreadRatio: 11.0, upliftPct: 38.0, ancillaryRate: 7, currency: 'USD', co2Factor: 0.50 },
  sen_her:     { avgLMP: 46, spreadRatio: 13.0, upliftPct: 40.0, ancillaryRate: 8, currency: 'USD', co2Factor: 0.47 },
  sen_qro:     { avgLMP: 42, spreadRatio: 10.5, upliftPct: 36.0, ancillaryRate: 6, currency: 'USD', co2Factor: 0.49 },
  // MIBEL zones (Iberia)
  mibel_es:    { avgLMP: 62, spreadRatio: 9.0,  upliftPct: 45.0, ancillaryRate: 15, currency: 'EUR', co2Factor: 0.22 },
  mibel_pt:    { avgLMP: 58, spreadRatio: 7.5,  upliftPct: 42.0, ancillaryRate: 13, currency: 'EUR', co2Factor: 0.20 },
  // European (ENTSO-E)
  epex:        { avgLMP: 70, spreadRatio: 12.0, upliftPct: 38.0, ancillaryRate: 20, currency: 'EUR', co2Factor: 0.35 },
  epex_fr:     { avgLMP: 55, spreadRatio: 10.0, upliftPct: 35.0, ancillaryRate: 18, currency: 'EUR', co2Factor: 0.05 },
  nordpool:    { avgLMP: 45, spreadRatio: 14.0, upliftPct: 40.0, ancillaryRate: 16, currency: 'EUR', co2Factor: 0.08 },
  elexon:      { avgLMP: 60, spreadRatio: 15.0, upliftPct: 42.0, ancillaryRate: 22, currency: 'GBP', co2Factor: 0.22 },
  // Asia-Pacific
  nem:         { avgLMP: 80, spreadRatio: 40.0, upliftPct: 55.0, ancillaryRate: 25, currency: 'AUD', co2Factor: 0.68 },
  jepx:        { avgLMP: 50, spreadRatio: 8.0,  upliftPct: 30.0, ancillaryRate: 10, currency: 'JPY', co2Factor: 0.45 },
};

function calculateROI(fleetMW, costPerMWh, batteryMWh, capacityFactor, market) {
  const mp = MARKET_PARAMS[market] || MARKET_PARAMS.ercot;
  const hoursPerYear = 8760;

  // Client's current revenue (naive TOU: charge at night, discharge at peak)
  const cyclesPerDay = Math.min(2, batteryMWh / (fleetMW * 4));  // cycles limited by battery size
  const dischargeMWhPerDay = batteryMWh * cyclesPerDay * 0.88;  // roundtrip efficiency
  const naiveRevPerDay = dischargeMWhPerDay * mp.avgLMP * 1.8;  // peak markup
  const naiveChargePerDay = dischargeMWhPerDay * mp.avgLMP * 0.4; // overnight cheap
  const naiveAnnual = (naiveRevPerDay - naiveChargePerDay) * 365;

  // Client's revenue WITH PRIMEngine (validated uplift)
  const upliftFactor = 1 + (mp.upliftPct / 100);
  const hjbAnnual = naiveAnnual * upliftFactor;

  // Client's additional savings from using our platform
  const clientSavings = hjbAnnual - naiveAnnual;
  const ancillaryBonus = batteryMWh > 0 ? batteryMWh * mp.ancillaryRate * 365 * 0.3 : 0;
  const totalClientSavings = clientSavings + ancillaryBonus;

  // PRIMEngine fee: 25% of incremental revenue (value share model)
  const valueShareRate = 0.25;
  const valueShareFee = totalClientSavings * valueShareRate;

  // Minimum annual commitments by tier
  let minCommitment = 50000;  // Growth tier default
  let startingFee = 500000;   // One-time implementation fee
  if (fleetMW > 1000) { minCommitment = 2000000; startingFee = 2500000; }    // Enterprise: >1 GW
  else if (fleetMW > 200) { minCommitment = 500000; startingFee = 1500000; }  // Scale: 200 MW - 1 GW
  else if (fleetMW > 50) { minCommitment = 50000; startingFee = 500000; }     // Growth: <200 MW
  else { minCommitment = 0; startingFee = 0; }                                // Pilot: free

  const licenseCost = Math.max(valueShareFee, minCommitment);

  // CLIENT's ROI on our license (amortize starting fee over 3 years)
  const annualizedStartingFee = startingFee / 3;
  const totalAnnualCost = licenseCost + annualizedStartingFee;
  const roi = totalClientSavings / totalAnnualCost;

  // Battery life extension (degradation-aware dispatch extends life ~20%)
  const batteryLifeExt = batteryMWh > 0 ? 1.8 : 0;

  // CO₂ avoided
  const co2Avoided = dischargeMWhPerDay * 365 * mp.co2Factor * 0.3;

  // 24-hour dispatch comparison (naive vs HJB-optimized)
  const hourlyBaseline = [];
  const hourlyOptimized = [];
  for (let h = 0; h < 24; h++) {
    // Naive: charge at night (0-6), discharge afternoon (14-20)
    let naiveDispatch = 0;
    if (h >= 0 && h <= 6) naiveDispatch = -fleetMW * 0.8;
    else if (h >= 14 && h <= 20) naiveDispatch = fleetMW * 0.9;

    // HJB: charge cheapest hours, discharge at spike moments
    let hjbDispatch = 0;
    const priceShape = 0.3 + 0.7 * Math.exp(-Math.pow((h - 17) / 4, 2));
    if (h >= 1 && h <= 5) hjbDispatch = -fleetMW * 0.95;  // aggressive overnight charge
    else if (h >= 16 && h <= 19) hjbDispatch = fleetMW * 1.0;  // hit the peak hard
    else if (priceShape > 0.7) hjbDispatch = fleetMW * 0.5; // opportunistic

    hourlyBaseline.push(naiveDispatch);
    hourlyOptimized.push(hjbDispatch);
  }

  return {
    annualCost: naiveAnnual,
    totalSavings: totalClientSavings,
    licenseCost, roi,
    savingsPct: mp.upliftPct,
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
      alert('Something went wrong. Please email cordobaurrutia95@gmail.com directly.');
    }
  })
  .catch(() => {
    btn.textContent = origText;
    btn.style.opacity = '1';
    alert('Network error. Please email cordobaurrutia95@gmail.com directly.');
  });
}

// ── Simulation Results Data ──
const SIMULATION_RESULTS = {
  na: [
    { id: 'ercot',  name: 'ERCOT',  region: 'Texas', gw: 85,  uplift: 55.7, annual: 4870000, roi: 9.7, co2: 42, color: '#00d1ff', validated: true },
    { id: 'pjm',    name: 'PJM',    region: 'US East', gw: 180, uplift: 32.4, annual: 3180000, roi: 6.4, co2: 38, color: '#42A5F5' },
    { id: 'caiso',  name: 'CAISO',  region: 'California', gw: 80, uplift: 44.2, annual: 4250000, roi: 8.5, co2: 20, color: '#26C6DA', duck: true },
    { id: 'miso',   name: 'MISO',   region: 'Midwest', gw: 190, uplift: 18.5, annual: 1520000, roi: 3.0, co2: 55, color: '#78909C' },
    { id: 'spp',    name: 'SPP',    region: 'Central', gw: 65, uplift: 28.3, annual: 1980000, roi: 4.0, co2: 48, color: '#66BB6A' },
    { id: 'nyiso',  name: 'NYISO',  region: 'New York', gw: 35, uplift: 38.6, annual: 3650000, roi: 7.3, co2: 28, color: '#AB47BC' },
    { id: 'isone',  name: 'ISO-NE', region: 'New England', gw: 30, uplift: 34.1, annual: 3020000, roi: 6.0, co2: 30, color: '#EF5350' },
    { id: 'ieso',   name: 'IESO',   region: 'Ontario', gw: 38, uplift: 12.8, annual: 680000,  roi: 1.4, co2: 3,  color: '#FF7043' },
    { id: 'aeso',   name: 'AESO',   region: 'Alberta', gw: 17, uplift: 46.5, annual: 5120000, roi: 10.2, co2: 55, color: '#FF5722' },
  ],
  mx: [
    { id: 'sen_vza', name: 'SEN VZA-400', region: 'Valle de México', gw: 75, uplift: 44.0, annual: 231243, roi: 4.6, co2: 46, color: '#00ff88', validated: true, flagship: true },
    { id: 'sen_mty', name: 'SEN Monterrey', region: 'Noreste', gw: 75, uplift: 42.5, annual: 1980000, roi: 4.0, co2: 48, color: '#00ff88' },
    { id: 'sen_gdl', name: 'SEN Guadalajara', region: 'Occidental', gw: 75, uplift: 38.0, annual: 1640000, roi: 3.3, co2: 50, color: '#00ff88' },
    { id: 'sen_her', name: 'SEN Hermosillo', region: 'Noroeste', gw: 75, uplift: 40.0, annual: 1750000, roi: 3.5, co2: 47, color: '#00ff88' },
    { id: 'sen_qro', name: 'SEN Querétaro', region: 'Central', gw: 75, uplift: 36.0, annual: 1520000, roi: 3.0, co2: 49, color: '#00ff88' },
  ],
  eu: [
    { id: 'mibel_es', name: 'MIBEL España', region: 'Spain', gw: 110, uplift: 22.5, annual: 2680000, roi: 5.4, co2: 22, color: '#F1C40F' },
    { id: 'mibel_pt', name: 'MIBEL Portugal', region: 'Portugal', gw: 110, uplift: 19.8, annual: 2150000, roi: 4.3, co2: 20, color: '#F1C40F' },
    { id: 'epex',     name: 'EPEX Germany', region: 'Germany', gw: 220, uplift: 28.4, annual: 3870000, roi: 7.7, co2: 35, color: '#FFA726', duck: true },
    { id: 'epex_fr',  name: 'EPEX France', region: 'France', gw: 130, uplift: 16.2, annual: 1680000, roi: 3.4, co2: 5,  color: '#FFA726' },
    { id: 'nordpool', name: 'Nord Pool', region: 'Nordics', gw: 100, uplift: 24.5, annual: 2350000, roi: 4.7, co2: 8,  color: '#64B5F6' },
    { id: 'elexon',   name: 'Elexon', region: 'UK', gw: 80, uplift: 30.2, annual: 3420000, roi: 6.8, co2: 22, color: '#9575CD' },
  ],
  ap: [
    { id: 'nem',  name: 'NEM', region: 'Australia', gw: 55, uplift: 58.5, annual: 8900000, roi: 17.8, co2: 68, color: '#AB47BC' },
    { id: 'jepx', name: 'JEPX', region: 'Japan', gw: 280, uplift: 9.4, annual: 920000, roi: 1.8, co2: 45, color: '#E91E63' },
  ],
};

function renderSimResults() {
  const grids = { na: 'results-grid-na', mx: 'results-grid-mx', eu: 'results-grid-eu', ap: 'results-grid-ap' };
  for (const [region, gridId] of Object.entries(grids)) {
    const container = document.getElementById(gridId);
    if (!container || container.children.length > 0) continue; // already rendered
    const markets = SIMULATION_RESULTS[region];
    markets.forEach((m, i) => {
      const barWidth = Math.min(100, (m.uplift / 60) * 100);
      const flagshipBadge = m.flagship ? `<span style="display:inline-block;padding:2px 6px;font-size:9px;font-family:var(--font-mono);background:rgba(0,255,136,0.15);color:#00ff88;border-radius:4px;margin-left:6px;">VALIDATED ✓</span>` : '';
      const validatedBadge = m.validated && !m.flagship ? `<span style="display:inline-block;padding:2px 6px;font-size:9px;font-family:var(--font-mono);background:rgba(0,209,255,0.15);color:#00d1ff;border-radius:4px;margin-left:6px;">PROVEN</span>` : '';
      const duckBadge = m.duck ? `<span style="display:inline-block;padding:2px 6px;font-size:9px;font-family:var(--font-mono);background:rgba(241,196,15,0.15);color:#F1C40F;border-radius:4px;margin-left:6px;">DUCK CURVE</span>` : '';
      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 16px;
        transition: all 0.3s ease; opacity: 0; transform: translateY(12px); cursor: default;
      `;
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${m.color};">${m.name}</span>
            ${flagshipBadge}${validatedBadge}${duckBadge}
          </div>
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${m.region}</span>
        </div>
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px;">
            <span>Dispatch Uplift</span>
            <span style="color:${m.color};font-weight:700;">${m.uplift}%</span>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;height:6px;overflow:hidden;">
            <div class="sim-bar" data-width="${barWidth}" style="height:100%;border-radius:4px;background:${m.color};width:0%;transition:width 0.8s ease ${i*0.08}s;"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:12px;color:white;font-weight:600;">$${(m.annual/1e6).toFixed(1)}M</div>
            <div style="font-size:9px;color:var(--text-muted);">Annual Savings</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:12px;color:white;font-weight:600;">${m.roi}×</div>
            <div style="font-size:9px;color:var(--text-muted);">ROI</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:12px;color:white;font-weight:600;">−${m.co2}%</div>
            <div style="font-size:9px;color:var(--text-muted);">CO₂</div>
          </div>
        </div>
      `;
      // Add hover effect
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = m.color;
        card.style.boxShadow = `0 0 24px ${m.color}22`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'var(--border)';
        card.style.boxShadow = 'none';
      });
      container.appendChild(card);
      // Animate in
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        // Animate bars
        const bar = card.querySelector('.sim-bar');
        if (bar) bar.style.width = bar.dataset.width + '%';
      }, 60 + i * 80);
    });
  }
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
