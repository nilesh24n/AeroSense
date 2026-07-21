// simulator.js - AeroSense 2.0 AI Intervention & Scenario Predictive Engine

function runScenarioSimulation(wardId, params) {
  const entry = window.AQ_DATA[wardId];
  if (!entry) return null;

  const currentSeries = entry.series;
  const latest = currentSeries[currentSeries.length - 1];
  const currentAqi = latest.aqi;
  const hour = new Date(latest.t).getHours();

  // Get baseline source attribution
  const attr = window.attributeSources(entry.ward, entry.city.winterSpike, hour, currentAqi);
  const shares = attr.pct; // { vehicular, industrial, construction, biomass, meteorological }

  // Extract intervention percentages from params (0-100%)
  const trafficRed = (params.traffic || 0) / 100;
  const constrRed = (params.construction || 0) / 100;
  const biomassRed = (params.biomass || 0) / 100;
  const industryRed = (params.industrial || 0) / 100;
  const smogGunRed = (params.smogGun || 0) / 100;

  // Impact calculations (points dropped per source)
  const vehDrop = (currentAqi * (shares.vehicular / 100)) * (trafficRed * 0.75);
  const constrDrop = (currentAqi * (shares.construction / 100)) * (constrRed * 0.85);
  const bioDrop = (currentAqi * (shares.biomass / 100)) * (biomassRed * 0.90);
  const indDrop = (currentAqi * (shares.industrial / 100)) * (industryRed * 0.80);
  const smogDrop = (currentAqi * 0.12) * (smogGunRed * 0.65); // active atmospheric washing effect

  const totalDrop = Math.round(vehDrop + constrDrop + bioDrop + indDrop + smogDrop);
  const projectedAqi = Math.max(18, currentAqi - totalDrop);

  const baselineBand = window.bandFor(currentAqi);
  const projectedBand = window.bandFor(projectedAqi);
  const baselineGRAP = window.getGRAPStage(currentAqi);
  const projectedGRAP = window.getGRAPStage(projectedAqi);

  // Time to effect estimate
  let hoursToEffect = 6;
  if (smogGunRed > 0.5) hoursToEffect = 3;
  if (trafficRed > 0.6) hoursToEffect = 4;

  return {
    wardName: entry.ward.name,
    cityName: entry.city.name,
    currentAqi,
    projectedAqi,
    totalDrop,
    baselineBand,
    projectedBand,
    baselineGRAP,
    projectedGRAP,
    hoursToEffect,
    drops: {
      traffic: Math.round(vehDrop),
      construction: Math.round(constrDrop),
      biomass: Math.round(bioDrop),
      industrial: Math.round(indDrop),
      smogGun: Math.round(smogDrop),
    },
    aiInsight: generateScenarioAIInsight(currentAqi, projectedAqi, totalDrop, baselineBand, projectedBand, params),
  };
}

function generateScenarioAIInsight(current, projected, drop, oldBand, newBand, params) {
  if (drop === 0) {
    return "Move the intervention sliders above to simulate real-time AI policy enforcement scenarios and project ward-level AQI drops.";
  }

  let text = `Enforcing these selected interventions in ${oldBand.label} conditions is projected to lower AQI by ${drop} points (from ${current} to ${projected}). `;

  if (oldBand.label !== newBand.label) {
    text += `🎯 **Success**: This successfully shifts the ward from **${oldBand.label}** to **${newBand.label}** status! `;
  } else {
    text += `Status remains **${oldBand.label}**, but citizen exposure risk drops by ~${Math.round((drop / current) * 100)}%. `;
  }

  if (params.traffic > 50 && params.construction > 50) {
    text += `Combining traffic congestion diversion with dust suppression produces the highest synergistic return for high-density corridors.`;
  } else if (params.smogGun > 60) {
    text += `Anti-smog misting provides immediate localized relief for PM10 dust within 3-4 hours.`;
  }

  return text;
}

window.runScenarioSimulation = runScenarioSimulation;
