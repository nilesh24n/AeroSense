// attribution.js - AeroSense 2.0 AI Source Apportionment & Breakdown Engine

const SOURCE_KEYS = ["vehicular", "industrial", "construction", "biomass", "meteorological"];

const SOURCE_ICONS = {
  vehicular: "🚘",
  industrial: "🏭",
  construction: "🏗️",
  biomass: "🌾",
  meteorological: "🌬️",
};

const SOURCE_DESCS = {
  vehicular: "Diesel exhaust, vehicular traffic emissions, idling at bottleneck intersections.",
  industrial: "Factory stacks, boiler fuel burning, unlicensed small manufacturing units.",
  construction: "Uncovered construction debris, road dust re-suspension, unpaved shoulders.",
  biomass: "Open waste burning, stubble burning from surrounding agricultural regions, wood fires.",
  meteorological: "Thermal boundary layer inversion, calm winds trapping ground-level particulate matter.",
};

function attribute(ward, cityWinterSpike, hourOfDay, currentAqi) {
  const w = {
    vehicular: 20,
    industrial: 20,
    construction: 15,
    biomass: 10,
    meteorological: 35,
  };

  const isRush = (hourOfDay >= 7 && hourOfDay <= 10) || (hourOfDay >= 18 && hourOfDay <= 21);
  const isDaytime = hourOfDay >= 9 && hourOfDay <= 18;

  if (ward.type === "traffic-industrial") {
    w.vehicular += isRush ? 32 : 16;
    w.industrial += 12;
    w.meteorological -= 15;
  } else if (ward.type === "industrial") {
    w.industrial += 38;
    w.vehicular += 5;
    w.meteorological -= 15;
  } else if (ward.type === "residential-green") {
    w.meteorological += 15;
    w.vehicular -= 5;
  } else {
    w.vehicular += isRush ? 18 : 6;
  }

  if (isDaytime) w.construction += 12;

  if (cityWinterSpike) {
    w.biomass += 24;
    w.meteorological += 12;
  }

  SOURCE_KEYS.forEach((k) => (w[k] = Math.max(3, w[k])));
  const total = SOURCE_KEYS.reduce((a, k) => a + w[k], 0);
  const pct = {};
  SOURCE_KEYS.forEach((k) => (pct[k] = Math.round((w[k] / total) * 1000) / 10));

  const deviationScore = Math.min(1, Math.abs(currentAqi - ward.baseline) / ward.baseline);
  const confidence = Math.round((0.60 + 0.35 * deviationScore) * 100);

  // Dominant source
  let dominant = "vehicular";
  let maxPct = 0;
  SOURCE_KEYS.forEach((k) => {
    if (pct[k] > maxPct) {
      maxPct = pct[k];
      dominant = k;
    }
  });

  return {
    pct,
    confidence,
    isRush,
    isDaytime,
    dominant,
    dominantShare: maxPct,
    dominantLabel: window.SOURCE_LABELS[dominant],
    dominantIcon: SOURCE_ICONS[dominant],
    dominantDesc: SOURCE_DESCS[dominant],
  };
}

window.attributeSources = attribute;
window.SOURCE_KEYS = SOURCE_KEYS;
window.SOURCE_ICONS = SOURCE_ICONS;
window.SOURCE_DESCS = SOURCE_DESCS;
window.SOURCE_LABELS = {
  vehicular: "Vehicular Emissions",
  industrial: "Industrial Stacks",
  construction: "Construction & Road Dust",
  biomass: "Biomass & Waste Burning",
  meteorological: "Meteorological Trapping",
};
