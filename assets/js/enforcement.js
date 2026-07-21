// enforcement.js - AeroSense 2.0 Priority Enforcement & GRAP Action Dispatch

const CONTROLLABILITY = {
  vehicular: 0.55,
  industrial: 0.80,
  construction: 0.90,
  biomass: 0.65,
  meteorological: 0.05,
};

const ACTIONS = {
  vehicular: {
    title: "Traffic Diversion & EV Shuttle Enforcement",
    desc: "Deploy traffic police at congestion bottlenecks; enforce odd-even / heavy vehicle bypass for 48h.",
    expectedDrop: 28,
  },
  industrial: {
    title: "Industrial Stack & Fuel Audit Inspection",
    desc: "Issue immediate audit notice for unapproved coal/petcoke boilers; cross-check CEMS telemetry against permit limits.",
    expectedDrop: 45,
  },
  construction: {
    title: "Construction Dust Suppression & Anti-Smog Mandate",
    desc: "Deploy 4 anti-smog water misting guns; mandate 100% geotextile covering over unpaved earth within 4 hours.",
    expectedDrop: 36,
  },
  biomass: {
    title: "Biomass Burning Patrol & Satellite Fire Response",
    desc: "Dispatch municipal flying squads to active hotspot coordinates; cross-reference satellite thermal anomalies.",
    expectedDrop: 32,
  },
  meteorological: {
    title: "Public Health Emergency Advisory & Passive Mitigation",
    desc: "Issue respiratory health warning; increase mechanical street washing and public misting sprays.",
    expectedDrop: 10,
  },
};

function rankWards() {
  const hourOfDay = new Date().getHours();
  const rows = Object.values(window.AQ_DATA).map(({ ward, city }) => {
    const latest = window.AQ_DATA[ward.id].series.slice(-1)[0].aqi;
    const attribution = window.attributeSources(ward, city.winterSpike, hourOfDay, latest);

    let dominant = "meteorological";
    let bestScore = -1;
    window.SOURCE_KEYS.forEach((k) => {
      const score = (attribution.pct[k] / 100) * CONTROLLABILITY[k];
      if (score > bestScore) {
        bestScore = score;
        dominant = k;
      }
    });

    const popWeight = Math.min(1.5, ward.pop / 100000);
    const severityWeight = Math.min(2.5, latest / 140);
    const riskScore = Math.round(severityWeight * popWeight * (0.5 + bestScore) * 100) / 10;

    const actionObj = ACTIONS[dominant];
    const grap = window.getGRAPStage(latest);

    let priorityLevel = "P2 - Medium";
    let priorityColor = "#F59E0B";
    if (riskScore >= 2.5 || latest >= 300) {
      priorityLevel = "P0 - CRITICAL";
      priorityColor = "#EF4444";
    } else if (riskScore >= 1.6 || latest >= 200) {
      priorityLevel = "P1 - High";
      priorityColor = "#F97316";
    }

    return {
      city: city.name,
      ward: ward.name,
      wardId: ward.id,
      aqi: latest,
      band: window.bandFor(latest),
      grap,
      dominantSource: dominant,
      dominantShare: attribution.pct[dominant],
      confidence: attribution.confidence,
      riskScore,
      priorityLevel,
      priorityColor,
      actionTitle: actionObj.title,
      actionDesc: actionObj.desc,
      expectedDrop: actionObj.expectedDrop,
      officerAssigned: `Team ${ward.id.slice(0, 3).toUpperCase()}-04`,
      status: latest > 250 ? "DISPATCHED" : "MONITORING",
    };
  });

  return rows.sort((a, b) => b.riskScore - a.riskScore);
}

window.rankWards = rankWards;
