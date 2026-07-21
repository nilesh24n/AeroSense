// app.js - AeroSense 2.0 SPA Controller & Router

let state = {
  wardId: "anand-vihar",
  cityId: "all",
  lang: "hi",
  simParams: {
    traffic: 30,
    construction: 40,
    biomass: 20,
    industrial: 10,
    smogGun: 50,
  },
  compareWardA: "anand-vihar",
  compareWardB: "bandra",
};

const ROUTES = {
  dashboard: renderDashboard,
  map: renderMapView,
  forecast: renderForecast,
  attribution: renderAttribution,
  simulator: renderSimulator,
  enforcement: renderEnforcement,
  copilot: renderCopilot,
  compare: renderCompare,
};

function currentEntry() {
  return window.AQ_DATA[state.wardId] || Object.values(window.AQ_DATA)[0];
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function wardPicker() {
  const select = el("select", {
    class: "select-control",
    onchange: (e) => {
      state.wardId = e.target.value;
      route();
    },
  });
  window.CITIES.forEach((city) => {
    const group = el("optgroup", { label: city.name });
    city.wards.forEach((w) => {
      group.appendChild(
        el("option", { value: w.id, ...(w.id === state.wardId ? { selected: "selected" } : {}) }, w.name)
      );
    });
    select.appendChild(group);
  });
  return select;
}

function focusWardFromMap(wardId) {
  state.wardId = wardId;
  location.hash = "#dashboard";
}
window.focusWardFromMap = focusWardFromMap;

function navBar(active) {
  const items = [
    ["dashboard", "Dashboard", "📊"],
    ["map", "Live GIS Map", "🗺️"],
    ["forecast", "72h & 7-Day Forecast", "📈"],
    ["attribution", "Source Attribution", "🎯"],
    ["simulator", "AI Policy Simulator", "⚡"],
    ["enforcement", "Enforcement Queue", "🚨"],
    ["copilot", "AeroBot AI Copilot", "🤖"],
    ["compare", "Compare Wards", "⚖️"],
  ];

  return el("nav", { class: "sidenav" }, [
    el("div", { class: "brand-header" }, [
      el("img", {
        src: "assets/logo.png",
        alt: "AeroSense 2.0 Logo",
        class: "brand-logo-img",
        onerror: "this.style.display='none';this.nextSibling.style.display='flex'",
      }),
      el("div", { class: "brand-logo-fallback", style: "display:none;align-items:center;gap:12px;" }, [
        el("div", { class: "brand-icon-wrapper" }, [
          el("div", { html: `<svg viewBox="0 0 24 24" fill="none" stroke="#070A13" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a13 13 0 0 0 0 17M20.5 3.5a13 13 0 0 1 0 17"/></svg>` }),
        ]),
        el("div", {}, [
          el("div", { class: "brand-title" }, "AeroSense 2.0"),
          el("div", { class: "brand-subtitle" }, "Urban Air Intelligence"),
        ]),
      ]),
    ]),
    el("div", { class: "nav-section-title" }, "Intelligence Modules"),
    el("div", { class: "nav-links" }, items.map(([key, label, icon]) =>
      el("a", {
        href: `#${key}`,
        class: `nav-item ${key === active ? "active" : ""}`,
      }, [
        el("span", { class: "nav-icon" }, icon),
        el("span", {}, label),
      ])
    )),
    el("div", { class: "telemetry-status-card" }, [
      el("div", { class: "pulse-dot" }),
      el("div", { class: "telemetry-text" }, [
        el("strong", {}, "Telemetry Feed Active"),
        "NCAP CAAQMS Simulated Data",
      ]),
    ]),
  ]);
}

function mount(node) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.appendChild(node);
}

// ---------- 1. DASHBOARD ----------
function renderDashboard() {
  const entry = currentEntry();
  const latest = entry.series[entry.series.length - 1];
  const band = window.bandFor(latest.aqi);
  const grap = window.getGRAPStage(latest.aqi);

  // Weather strip
  const weatherBar = el("div", { class: "weather-met-bar" }, [
    metItem("🌬️", latest.met.windSpeed + " km/h", "Wind Speed"),
    metItem("🧭", latest.met.windDirText, "Direction"),
    metItem("🌡️", latest.met.temp + " °C", "Temperature"),
    metItem("💧", latest.met.humidity + " %", "Humidity"),
    metItem("🌫️", latest.met.pblh + " m", "Boundary Layer"),
    metItem("👁️", latest.met.visibility + " km", "Visibility"),
  ]);

  // Pollutants breakdown grid
  const pol = latest.pollutants;
  const pollutantsGrid = el("div", { class: "grid-cols-3" }, [
    pollutantCard("PM 2.5", pol.pm25.val, pol.pm25.unit, pol.pm25.ratio, pol.pm25.standard, "#EF4444"),
    pollutantCard("PM 10", pol.pm10.val, pol.pm10.unit, pol.pm10.ratio, pol.pm10.standard, "#F97316"),
    pollutantCard("NO₂", pol.no2.val, pol.no2.unit, pol.no2.ratio, pol.no2.standard, "#F59E0B"),
    pollutantCard("SO₂", pol.so2.val, pol.so2.unit, pol.so2.ratio, pol.so2.standard, "#84CC16"),
    pollutantCard("CO", pol.co.val, pol.co.unit, pol.co.ratio, pol.co.standard, "#38BDF8"),
    pollutantCard("O₃", pol.o3.val, pol.o3.unit, pol.o3.ratio, pol.o3.standard, "#A855F7"),
  ]);

  // City cards
  const wardCards = el("div", { class: "grid-cols-4" });
  window.CITIES.forEach((city) => {
    city.wards.forEach((ward) => {
      const w = window.AQ_DATA[ward.id];
      const latVal = w.series[w.series.length - 1].aqi;
      const b = window.bandFor(latVal);
      wardCards.appendChild(
        el("div", {
          class: `card-panel ${ward.id === state.wardId ? "active-ward-card" : ""}`,
          style: ward.id === state.wardId ? `border-color:${b.color};box-shadow:0 0 16px ${b.color}33` : "",
          onclick: () => {
            state.wardId = ward.id;
            route();
          },
        }, [
          el("div", { style: "display:flex;justify-content:space-between;align-items:flex-start;" }, [
            el("div", {}, [el("strong", { style: "font-size:15px;" }, ward.name), el("div", { class: "telemetry-text" }, city.name)]),
            el("span", { class: "band-pill-badge", style: `background:${b.badgeBg};color:${b.color};border-color:${b.color}` }, b.label),
          ]),
          el("div", { class: "aqi-hero-number", style: `color:${b.color};margin:12px 0 6px;` }, String(latVal)),
          el("div", { class: "telemetry-text" }, `Dominant: ${ward.dominantPollutant} · Pop ~${(ward.pop/1000).toFixed(0)}k`),
        ])
      );
    });
  });

  mount(
    el("div", { class: "app-container" }, [
      navBar("dashboard"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "City Air Quality Intelligence Control Center"),
            el("p", {}, "Hyperlocal telemetry, pollutant sub-indexes & GRAP mandates"),
          ]),
          wardPicker(),
        ]),
        el("div", { class: "hero-aqi-panel" }, [
          el("div", { class: "hero-breath-container" }, [
            el("div", { class: "breath-ring-outer", style: `--ring-color:${band.color}` }, [
              el("div", { class: "aqi-hero-number", style: `color:${band.color}` }, String(latest.aqi)),
              el("div", { class: "aqi-hero-label" }, "AQI Index"),
            ]),
          ]),
          el("div", { class: "hero-details-column" }, [
            el("h2", {}, `${entry.ward.name}, ${entry.city.name}`),
            el("div", {}, [
              el("span", { class: "band-pill-badge", style: `background:${band.badgeBg};color:${band.color};border-color:${band.color}` }, band.label),
              el("span", { class: "grap-badge", style: `border-color:${grap.color};color:${grap.color}` }, `GRAP: ${grap.stage}`),
            ]),
            el("p", { style: "color:var(--text-muted);font-size:14px;max-width:620px;margin-top:8px;" }, `${band.desc} Population exposed ~${entry.ward.pop.toLocaleString("en-IN")}. ${grap.mandate}`),
          ]),
        ]),
        weatherBar,
        el("h3", { class: "nav-section-title", style: "margin: 24px 0 12px; font-size:12px;" }, "Critical Pollutant Sub-Indexes"),
        pollutantsGrid,
        el("h3", { class: "nav-section-title", style: "margin: 32px 0 12px; font-size:12px;" }, "Monitored City Wards Baseline"),
        wardCards,
      ]),
    ])
  );
}

function metItem(icon, val, label) {
  return el("div", { class: "met-item" }, [
    el("div", { class: "met-icon" }, icon),
    el("div", {}, [
      el("div", { class: "met-val" }, val),
      el("div", { class: "met-label" }, label),
    ]),
  ]);
}

function pollutantCard(title, val, unit, ratio, standard, color) {
  return el("div", { class: "pollutant-card" }, [
    el("div", { class: "pollutant-header" }, [
      el("span", { class: "pollutant-title" }, title),
      el("span", { class: "telemetry-text" }, `Limit: ${standard} ${unit}`),
    ]),
    el("div", { class: "pollutant-value", style: `color:${color}` }, `${val} ${unit}`),
    el("div", { class: "pollutant-bar-track" }, [
      el("div", { class: "pollutant-bar-fill", style: `width:${Math.min(100, ratio)}%;background:${color}` }),
    ]),
    el("div", { class: "telemetry-text", style: "display:flex;justify-content:space-between;" }, [
      el("span", {}, "Standard Ratio:"),
      el("strong", { style: `color:${ratio > 100 ? "#EF4444" : "#10B981"}` }, `${ratio}% of Max`),
    ]),
  ]);
}

// ---------- 2. GIS MAP VIEW ----------
function renderMapView() {
  mount(
    el("div", { class: "app-container" }, [
      navBar("map"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "Geospatial GIS Air Quality Map"),
            el("p", {}, "Interactive ward heatmaps, satellite fire hotspots & wind vector flow"),
          ]),
          el("select", {
            class: "select-control",
            onchange: (e) => {
              state.cityId = e.target.value;
              window.renderMapLayers(state.cityId);
            },
          }, [
            el("option", { value: "all" }, "All Cities View"),
            ...window.CITIES.map((c) => el("option", { value: c.id }, c.name)),
          ]),
        ]),
        el("div", { class: "card-panel", style: "padding:12px;" }, [
          el("div", { id: "map-container-id", class: "map-view-container" }),
        ]),
      ]),
    ])
  );

  setTimeout(() => {
    window.initAirQualityMap("map-container-id", state.cityId);
  }, 100);
}

// ---------- 3. FORECAST VIEW ----------
function renderForecast() {
  const entry = currentEntry();
  const fc72 = window.holtWintersForecast(entry.series, 72);
  const fc7Days = window.generate7DayForecast(entry.series);

  mount(
    el("div", { class: "app-container" }, [
      navBar("forecast"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "72-Hour & 7-Day Hyperlocal AI Forecast"),
            el("p", {}, "Additive Holt-Winters model with 24h seasonal decomposition & uncertainty bounds"),
          ]),
          wardPicker(),
        ]),
        el("div", { class: "card-panel", style: "margin-bottom:24px;" }, [
          el("h3", { style: "margin-bottom:16px;font-family:var(--font-display);" }, "72-Hour AQI Trend Curve"),
          buildChartCanvas(entry.series.slice(-48), fc72),
        ]),
        el("h3", { class: "nav-section-title", style: "margin-bottom:14px;" }, "7-Day AI Outlook Summary"),
        el("div", { class: "grid-cols-4" }, fc7Days.slice(0, 4).map((d) => dayCard(d))),
      ]),
    ])
  );
}

function dayCard(d) {
  return el("div", { class: "card-panel" }, [
    el("div", { style: "display:flex;justify-content:space-between;" }, [
      el("strong", {}, d.dayName),
      el("span", { class: "telemetry-text" }, d.dateStr),
    ]),
    el("div", { class: "aqi-hero-number", style: `color:${d.band.color};margin:10px 0;` }, String(d.aqi)),
    el("span", { class: "band-pill-badge", style: `background:${d.band.badgeBg};color:${d.band.color};border-color:${d.band.color}` }, d.band.label),
    el("div", { class: "telemetry-text", style: "margin-top:8px;" }, `PM2.5 ~${d.pm25} µg/m³ · ${d.condition}`),
  ]);
}

function buildChartCanvas(history, forecast) {
  const canvas = el("canvas", { width: "1000", height: "340", style: "width:100%;height:auto;display:block;" });
  requestAnimationFrame(() => drawForecastCanvas(canvas, history, forecast));
  return canvas;
}

function drawForecastCanvas(canvas, history, forecast) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const all = [...history.map((p) => p.aqi), ...forecast.map((p) => p.upper)];
  const maxVal = Math.max(...all) * 1.15;
  const total = history.length + forecast.length;
  const stepX = w / (total - 1);
  const y = (v) => h - 35 - (v / maxVal) * (h - 70);
  const x = (i) => i * stepX;

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = 20 + ((h - 70) / 4) * g;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // Divider
  const splitX = x(history.length - 1);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(splitX, 10);
  ctx.lineTo(splitX, h - 25);
  ctx.stroke();
  ctx.setLineDash([]);

  // Uncertainty band
  ctx.beginPath();
  forecast.forEach((p, i) => ctx.lineTo(x(history.length + i), y(p.upper)));
  for (let i = forecast.length - 1; i >= 0; i--) ctx.lineTo(x(history.length + i), y(forecast[i].lower));
  ctx.closePath();
  ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
  ctx.fill();

  // History Line
  ctx.beginPath();
  history.forEach((p, i) => (i === 0 ? ctx.moveTo(x(i), y(p.aqi)) : ctx.lineTo(x(i), y(p.aqi))));
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Forecast Line
  ctx.beginPath();
  ctx.moveTo(x(history.length - 1), y(history[history.length - 1].aqi));
  forecast.forEach((p, i) => ctx.lineTo(x(history.length + i), y(p.mean)));
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "12px Plus Jakarta Sans";
  ctx.fillText("Telemetry History (48h)", 10, 20);
  ctx.fillText("Holt-Winters AI Forecast (72h)", splitX + 10, 20);
}

// ---------- 4. SOURCE ATTRIBUTION ----------
function renderAttribution() {
  const entry = currentEntry();
  const latest = entry.series[entry.series.length - 1];
  const attr = window.attributeSources(entry.ward, entry.city.winterSpike, new Date().getHours(), latest.aqi);

  const bars = el("div", { class: "card-panel" }, [
    el("h3", { style: "margin-bottom:20px;font-family:var(--font-display);" }, "Pollution Source Apportionment Breakdown"),
    ...window.SOURCE_KEYS.map((k) =>
      el("div", { style: "margin-bottom:16px;" }, [
        el("div", { style: "display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;" }, [
          el("span", {}, `${window.SOURCE_ICONS[k]} ${window.SOURCE_LABELS[k]}`),
          el("strong", { style: "color:var(--accent-cyan)" }, `${attr.pct[k]}%`),
        ]),
        el("div", { class: "pollutant-bar-track" }, [
          el("div", { class: "pollutant-bar-fill", style: `width:${attr.pct[k]}%;background:linear-gradient(90deg, #10B981, #38BDF8)` }),
        ]),
      ])
    ),
  ]);

  mount(
    el("div", { class: "app-container" }, [
      navBar("attribution"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "AI Source Attribution & Apportionment"),
            el("p", {}, "Multi-factor land-use, diurnal traffic humps & winter inversion model"),
          ]),
          wardPicker(),
        ]),
        el("div", { class: "grid-cols-2" }, [
          bars,
          el("div", { class: "card-panel" }, [
            el("h3", { style: "margin-bottom:16px;font-family:var(--font-display);" }, "Dominant Driver Analysis"),
            el("div", { style: "font-size:36px;margin-bottom:8px;" }, attr.dominantIcon),
            el("h2", { style: "font-family:var(--font-display);margin-bottom:4px;" }, attr.dominantLabel),
            el("div", { class: "telemetry-text", style: "font-size:14px;color:var(--accent-cyan);margin-bottom:16px;" }, `${attr.dominantShare}% of overall PM mass concentration`),
            el("p", { style: "color:var(--text-muted);font-size:14px;line-height:1.6;" }, attr.dominantDesc),
            el("hr", { style: "border:none;border-top:1px solid var(--border-light);margin:20px 0;" }),
            el("div", { class: "telemetry-text" }, `AI Attribution Model Confidence: ${attr.confidence}%`),
          ]),
        ]),
      ]),
    ])
  );
}

// ---------- 5. SIMULATOR VIEW ----------
function renderSimulator() {
  const entry = currentEntry();

  const simResult = window.runScenarioSimulation(state.wardId, state.simParams);

  const sliderControl = (key, label, icon) => {
    return el("div", { class: "sim-slider-group" }, [
      el("div", { class: "sim-slider-header" }, [
        el("span", {}, `${icon} ${label}`),
        el("span", { style: "color:var(--accent-cyan)" }, `${state.simParams[key]}%`),
      ]),
      el("input", {
        type: "range",
        min: "0",
        max: "100",
        value: String(state.simParams[key]),
        class: "sim-slider",
        oninput: (e) => {
          state.simParams[key] = parseInt(e.target.value, 10);
          route();
        },
      }),
    ]);
  };

  mount(
    el("div", { class: "app-container" }, [
      navBar("simulator"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "AI Policy Intervention & 'What-If' Simulator"),
            el("p", {}, "Simulate municipal interventions and project real-time AQI drop across wards"),
          ]),
          wardPicker(),
        ]),
        el("div", { class: "grid-cols-2-1" }, [
          el("div", { class: "card-panel" }, [
            el("h3", { style: "margin-bottom:20px;font-family:var(--font-display);" }, "Configure Policy Controls"),
            sliderControl("traffic", "Traffic & EV Bypass Restrictions", "🚘"),
            sliderControl("construction", "Construction Dust Suppression Mandate", "🏗️"),
            sliderControl("biomass", "Biomass & Stubble Burning Enforcement", "🌾"),
            sliderControl("industrial", "Industrial Stack Scrubbing & Shift Limits", "🏭"),
            sliderControl("smogGun", "Anti-Smog Water Misting Density", "🚿"),
          ]),
          el("div", { class: "card-panel", style: "background:radial-gradient(circle at 50% 0%, rgba(56,189,248,0.1), var(--surface-card));" }, [
            el("h3", { style: "margin-bottom:16px;font-family:var(--font-display);" }, "Projected AI Impact"),
            el("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;" }, [
              el("div", {}, [
                el("div", { class: "telemetry-text" }, "Current Baseline"),
                el("div", { class: "aqi-hero-number", style: `color:${simResult.baselineBand.color}` }, String(simResult.currentAqi)),
              ]),
              el("div", { style: "font-size:24px;color:var(--accent-cyan);" }, "➔"),
              el("div", {}, [
                el("div", { class: "telemetry-text" }, "Projected AQI"),
                el("div", { class: "aqi-hero-number", style: `color:${simResult.projectedBand.color}` }, String(simResult.projectedAqi)),
              ]),
            ]),
            el("div", { style: "background:rgba(16, 185, 129, 0.15);color:#10B981;border:1px solid #10B981;border-radius:10px;padding:12px;text-align:center;font-weight:700;font-size:18px;margin-bottom:16px;" }, `📉 Total AQI Reduction: -${simResult.totalDrop} Pts`),
            el("p", { style: "color:var(--text-main);font-size:13px;line-height:1.6;" }, simResult.aiInsight),
          ]),
        ]),
      ]),
    ])
  );
}

// ---------- 6. ENFORCEMENT VIEW ----------
function renderEnforcement() {
  const rows = window.rankWards();

  const table = el("table", { class: "data-table" }, [
    el("thead", {}, el("tr", {}, [
      el("th", {}, "Ward & City"),
      el("th", {}, "AQI / Band"),
      el("th", {}, "Risk Score"),
      el("th", {}, "Dominant Source"),
      el("th", {}, "Priority Action"),
      el("th", {}, "Est. Drop"),
      el("th", {}, "Status"),
    ])),
    el("tbody", {}, rows.map((r) =>
      el("tr", {}, [
        el("td", {}, [el("strong", {}, r.ward), el("div", { class: "telemetry-text" }, r.city)]),
        el("td", {}, [
          el("span", { style: `color:${r.band.color};font-weight:700;font-size:16px;` }, String(r.aqi)),
          el("div", { class: "telemetry-text" }, r.grap.stage),
        ]),
        el("td", {}, [
          el("span", { style: `color:${r.priorityColor};font-weight:700;` }, String(r.riskScore)),
          el("div", { class: "telemetry-text" }, r.priorityLevel),
        ]),
        el("td", {}, `${window.SOURCE_LABELS[r.dominantSource]} (${r.dominantShare}%)`),
        el("td", {}, [
          el("strong", { style: "font-size:13px;" }, r.actionTitle),
          el("div", { class: "telemetry-text", style: "max-width:280px;" }, r.actionDesc),
        ]),
        el("td", { style: "color:var(--accent-emerald);font-weight:700;" }, `-${r.expectedDrop} pts`),
        el("td", {}, el("span", { class: "band-pill-badge", style: "background:rgba(56,189,248,0.15);color:var(--accent-cyan);border-color:var(--accent-cyan)" }, r.status)),
      ])
    )),
  ]);

  mount(
    el("div", { class: "app-container" }, [
      navBar("enforcement"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "Enforcement Prioritisation & Municipal Dispatch Queue"),
            el("p", {}, "Prioritised list ranked by Severity × Exposed Population × Source Controllability"),
          ]),
        ]),
        el("div", { class: "card-panel", style: "padding:0;overflow-x:auto;" }, table),
      ]),
    ])
  );
}

// ---------- 7. AEROBOT COPILOT VIEW ----------
function renderCopilot() {
  const entry = currentEntry();
  const advisory = window.healthAdvisory(entry.series[entry.series.length - 1].aqi, state.lang);

  const chatLog = el("div", { class: "copilot-log" }, [
    el("div", { class: "chat-bubble bot" }, `👋 Hello! I am **AeroBot AI**, your urban air quality copilot. Ask me about health advisories, exercise safety, mask recommendations, or municipal mitigation plans for **${entry.ward.name}**.`),
  ]);

  const input = el("input", {
    type: "text",
    class: "copilot-input",
    placeholder: window.ADVISORY_TEXT[state.lang].askPrompt,
  });

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    chatLog.appendChild(el("div", { class: "chat-bubble user" }, text));
    const ans = window.answerQuestion(text, state.wardId);
    chatLog.appendChild(el("div", { class: "chat-bubble bot", html: ans.replace(/\n/g, "<br>") }));
    input.value = "";
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });

  const chips = window.SUGGESTED_PROMPTS.map((p) =>
    el("button", {
      class: "prompt-chip",
      onclick: () => {
        input.value = p;
        send();
      },
    }, p)
  );

  const langs = [
    ["en", "English"],
    ["hi", "हिंदी"],
    ["kn", "ಕನ್ನಡ"],
    ["ta", "தமிழ்"],
    ["mr", "मराठी"],
  ];

  mount(
    el("div", { class: "app-container" }, [
      navBar("copilot"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "AeroBot AI Multilingual Copilot"),
            el("p", {}, "Contextual citizen health guide & municipal decision engine"),
          ]),
          wardPicker(),
        ]),
        el("div", { class: "grid-cols-2" }, [
          el("div", { class: "card-panel" }, [
            el("h3", { style: "margin-bottom:16px;font-family:var(--font-display);" }, "Language & Health Advisory"),
            el("div", { style: "display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;" }, langs.map(([code, name]) =>
              el("button", {
                class: `select-control ${state.lang === code ? "active-lang" : ""}`,
                style: state.lang === code ? "background:var(--accent-cyan);color:var(--bg-dark);font-weight:700;" : "",
                onclick: () => {
                  state.lang = code;
                  route();
                },
              }, name)
            )),
            el("div", { class: "aqi-hero-number", style: `color:${advisory.band.color};margin-bottom:8px;` }, String(entry.series[entry.series.length - 1].aqi)),
            el("span", { class: "band-pill-badge", style: `background:${advisory.band.badgeBg};color:${advisory.band.color};border-color:${advisory.band.color}` }, advisory.band.label),
            el("p", { style: "margin-top:16px;font-size:15px;line-height:1.6;" }, advisory.text),
          ]),
          el("div", { class: "card-panel copilot-chat-box", style: "padding:0;" }, [
            chatLog,
            el("div", { class: "prompt-chips-wrapper" }, chips),
            el("div", { class: "copilot-input-row" }, [
              input,
              el("button", { class: "send-btn-primary", onclick: send }, "Ask AI"),
            ]),
          ]),
        ]),
      ]),
    ])
  );
}

// ---------- 8. WARD COMPARISON VIEW ----------
function renderCompare() {
  const entryA = window.AQ_DATA[state.compareWardA] || Object.values(window.AQ_DATA)[0];
  const entryB = window.AQ_DATA[state.compareWardB] || Object.values(window.AQ_DATA)[1];

  const latestA = entryA.series[entryA.series.length - 1];
  const latestB = entryB.series[entryB.series.length - 1];

  const bandA = window.bandFor(latestA.aqi);
  const bandB = window.bandFor(latestB.aqi);

  const wardSelect = (key) =>
    el("select", {
      class: "select-control",
      onchange: (e) => {
        state[key] = e.target.value;
        route();
      },
    }, Object.values(window.AQ_DATA).map(({ ward, city }) =>
      el("option", { value: ward.id, ...(ward.id === state[key] ? { selected: "selected" } : {}) }, `${ward.name} (${city.name})`)
    ));

  mount(
    el("div", { class: "app-container" }, [
      navBar("compare"),
      el("main", { class: "main-content" }, [
        el("div", { class: "top-app-bar" }, [
          el("div", { class: "view-header-title" }, [
            el("h1", {}, "Side-by-Side Ward Comparison Matrix"),
            el("p", {}, "Compare telemetry, pollutant levels and met conditions between 2 locations"),
          ]),
        ]),
        el("div", { class: "grid-cols-2" }, [
          el("div", { class: "card-panel" }, [
            wardSelect("compareWardA"),
            el("h2", { style: "margin-top:16px;font-family:var(--font-display);" }, entryA.ward.name),
            el("div", { class: "aqi-hero-number", style: `color:${bandA.color};margin:10px 0;` }, String(latestA.aqi)),
            el("span", { class: "band-pill-badge", style: `background:${bandA.badgeBg};color:${bandA.color};border-color:${bandA.color}` }, bandA.label),
            el("hr", { style: "border:none;border-top:1px solid var(--border-light);margin:16px 0;" }),
            el("div", { class: "telemetry-text" }, `PM2.5: ${latestA.pollutants.pm25.val} µg/m³`),
            el("div", { class: "telemetry-text" }, `PM10: ${latestA.pollutants.pm10.val} µg/m³`),
            el("div", { class: "telemetry-text" }, `Wind: ${latestA.met.windSpeed} km/h ${latestA.met.windDirText}`),
          ]),
          el("div", { class: "card-panel" }, [
            wardSelect("compareWardB"),
            el("h2", { style: "margin-top:16px;font-family:var(--font-display);" }, entryB.ward.name),
            el("div", { class: "aqi-hero-number", style: `color:${bandB.color};margin:10px 0;` }, String(latestB.aqi)),
            el("span", { class: "band-pill-badge", style: `background:${bandB.badgeBg};color:${bandB.color};border-color:${bandB.color}` }, bandB.label),
            el("hr", { style: "border:none;border-top:1px solid var(--border-light);margin:16px 0;" }),
            el("div", { class: "telemetry-text" }, `PM2.5: ${latestB.pollutants.pm25.val} µg/m³`),
            el("div", { class: "telemetry-text" }, `PM10: ${latestB.pollutants.pm10.val} µg/m³`),
            el("div", { class: "telemetry-text" }, `Wind: ${latestB.met.windSpeed} km/h ${latestB.met.windDirText}`),
          ]),
        ]),
      ]),
    ])
  );
}

function route() {
  const hash = (location.hash || "#dashboard").slice(1);
  (ROUTES[hash] || renderDashboard)();
}

window.addEventListener("hashchange", route);
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", route);
} else {
  route();
}
