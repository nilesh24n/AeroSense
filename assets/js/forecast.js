// forecast.js - AeroSense 2.0 Seasonal Holt-Winters & Multi-Day AI Forecast

function holtWintersForecast(series, horizonHours = 72, period = 24) {
  const values = series.map((p) => p.aqi);
  const n = values.length;
  if (n < period * 2) {
    return naiveForecast(series, horizonHours);
  }

  const alpha = 0.25;
  const beta = 0.05;
  const gamma = 0.3;

  const seasonal = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  const overallMean = values.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < period * 2; i++) {
    seasonal[i % period] += values[i] - overallMean;
    counts[i % period] += 1;
  }
  for (let i = 0; i < period; i++) seasonal[i] /= counts[i] || 1;

  let level = values[0];
  let trend = (values[period] - values[0]) / period;
  const fitted = [];

  for (let i = 0; i < n; i++) {
    const s = seasonal[i % period];
    const val = values[i];
    const lastLevel = level;
    level = alpha * (val - s) + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    seasonal[i % period] = gamma * (val - level) + (1 - gamma) * s;
    fitted.push(lastLevel + trend);
  }

  const residuals = values.map((v, i) => v - fitted[i]).slice(period);
  const resStd = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / (residuals.length || 1));

  const lastTimestamp = new Date(series[series.length - 1].t).getTime();
  const out = [];

  for (let h = 1; h <= horizonHours; h++) {
    const s = seasonal[(n + h - 1) % period];
    const point = level + h * trend + s;
    const spread = resStd * (1 + h / horizonHours) * 1.28;
    const meanAqi = Math.max(12, Math.round(point));

    out.push({
      t: new Date(lastTimestamp + h * 3600 * 1000).toISOString(),
      mean: meanAqi,
      lower: Math.max(5, Math.round(point - spread)),
      upper: Math.round(point + spread),
      pm25: Math.round(meanAqi * 0.6),
      pm10: Math.round(meanAqi * 0.9),
      band: window.bandFor(meanAqi),
    });
  }
  return out;
}

function generate7DayForecast(series) {
  const fc72 = holtWintersForecast(series, 72);
  const days = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let d = 0; d < 7; d++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + d);
    const dayName = d === 0 ? "Today" : d === 1 ? "Tomorrow" : daysOfWeek[targetDate.getDay()];

    const hourSlice = fc72.slice(d * 12, (d + 1) * 12);
    let avg = 0;
    if (hourSlice.length > 0) {
      avg = Math.round(hourSlice.reduce((acc, p) => acc + p.mean, 0) / hourSlice.length);
    } else {
      avg = fc72[fc72.length - 1].mean + (d - 2) * 5;
    }

    const band = window.bandFor(avg);
    days.push({
      dateStr: `${targetDate.getDate()} ${targetDate.toLocaleString('en-US', { month: 'short' })}`,
      dayName,
      aqi: avg,
      band,
      pm25: Math.round(avg * 0.6),
      pm10: Math.round(avg * 0.95),
      condition: band.label === "Good" || band.label === "Satisfactory" ? "Favorable" : band.label === "Moderate" ? "Unhealthy for Sensitive Groups" : "Hazardous Spikes",
    });
  }
  return days;
}

function naiveForecast(series, horizonHours) {
  const last = series[series.length - 1];
  const lastTimestamp = new Date(last.t).getTime();
  const out = [];
  for (let h = 1; h <= horizonHours; h++) {
    out.push({
      t: new Date(lastTimestamp + h * 3600 * 1000).toISOString(),
      mean: last.aqi,
      lower: Math.max(5, last.aqi - 20),
      upper: last.aqi + 20,
      pm25: Math.round(last.aqi * 0.6),
      pm10: Math.round(last.aqi * 0.9),
      band: window.bandFor(last.aqi),
    });
  }
  return out;
}

window.holtWintersForecast = holtWintersForecast;
window.generate7DayForecast = generate7DayForecast;
