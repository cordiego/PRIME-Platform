# ⚡ PRIME-Platform

**Client-facing sales platform for PRIMEnergeia** — interactive Granas perovskite simulator + full product catalog.

<p align="center">
  <a href="https://cordiego.github.io/PRIME-Platform">🌐 Live Site</a> ·
  <a href="https://github.com/cordiego">GitHub</a>
</p>

---

## Overview

PRIME-Platform is the public-facing sales website for PRIMEnergeia S.A.S., showcasing 5 Strategic Business Units across energy, materials science, and trading:

| SBU | Engines | Highlights |
|-----|---------|------------|
| **Energy Core** | Grid Control · Battery BESS · PRIM Wind | HJB dispatch across SEN 🇲🇽 ERCOT 🇺🇸 MIBEL 🇪🇸🇵🇹 |
| **PRIMEngines** | HY-P100 H₂ Turbine · PEM-PB-50 · PRIMEcycle | Brayton cycle · Nernst OCV · Circular economy |
| **Granas Materials** | Optics · SDL · Blueprint + 7 engines | TMM/Mie · Bayesian GP · Tandem perovskite |
| **Eureka Trading** | Eureka Sovereign | VIX-regime volatility targeting · 5 assets |
| **Platform** | PRIME Kernel · PRIMStack | Shared HJB solver · Multi-timescale dispatch |

## Features

- 🎨 **Premium dark-mode design** — glassmorphism, particle effects, gradient typography
- 🔬 **Interactive perovskite simulator** — client-side Granas demo with real-time EQE charts
- 💰 **Tiered pricing** — Explorer (free) → Researcher → Professional → Enterprise
- 📬 **Contact form** — Formspree-powered lead capture
- 📱 **Responsive** — works on mobile, tablet, and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 semantic |
| Styling | Vanilla CSS + CSS variables |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Forms | Formspree |
| Hosting | GitHub Pages |

## Local Development

```bash
# Clone
git clone https://github.com/cordiego/PRIME-Platform.git
cd PRIME-Platform

# Serve locally (any static server works)
python3 -m http.server 8000
# → http://localhost:8000
```

## Deployment

Deployed automatically via **GitHub Pages** from the `main` branch.

Live at: **[cordiego.github.io/PRIME-Platform](https://cordiego.github.io/PRIME-Platform)**

---

<p align="center">
  <strong>PRIMEnergeia S.A.S.</strong><br>
  Lead Computational Physicist: Diego Córdoba Urrutia<br>
  Soberanía Energética Global ⚡🇲🇽🇺🇸🇪🇸🇵🇹
</p>
