// data.js - AeroSense 2.0 High-Precision Data & Microclimate Engine

const AQI_BANDS = [
  { max: 50, label: "Good", color: "#10B981", badgeBg: "rgba(16, 185, 129, 0.15)", desc: "Minimal impact. Enjoy outdoor activities." },
  { max: 100, label: "Satisfactory", color: "#84CC16", badgeBg: "rgba(132, 204, 22, 0.15)", desc: "Minor breathing discomfort to sensitive people." },
  { max: 200, label: "Moderate", color: "#F59E0B", badgeBg: "rgba(245, 158, 11, 0.15)", desc: "Breathing discomfort to people with lung, asthma and heart diseases." },
  { max: 300, label: "Poor", color: "#F97316", badgeBg: "rgba(249, 115, 22, 0.15)", desc: "Breathing discomfort to most people on prolonged exposure." },
  { max: 400, label: "Very Poor", color: "#EF4444", badgeBg: "rgba(239, 68, 68, 0.15)", desc: "Respiratory illness on prolonged exposure. GRAP II triggers." },
  { max: 999, label: "Severe", color: "#A855F7", badgeBg: "rgba(168, 85, 247, 0.15)", desc: "Affects healthy people and seriously impacts those with existing diseases. GRAP III/IV emergency." },
];

function bandFor(aqi) {
  return AQI_BANDS.find((b) => aqi <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];
}

function getGRAPStage(aqi) {
  if (aqi >= 450) return { stage: "Stage IV (Severe+)", code: 4, color: "#9333EA", mandate: "Emergency: Truck entry ban, WFH mandated, primary schools closed, construction halt." };
  if (aqi >= 401) return { stage: "Stage III (Severe)", code: 3, color: "#EF4444", mandate: "Strict: Halt non-essential construction, BS-III petrol & BS-IV diesel vehicle ban." };
  if (aqi >= 301) return { stage: "Stage II (Very Poor)", code: 2, color: "#F97316", mandate: "Active: Diesel generator restrictions, anti-smog guns mandated, parking fee hike." };
  if (aqi >= 201) return { stage: "Stage I (Poor)", code: 1, color: "#F59E0B", mandate: "Standard: Water sprinkling on unpaved roads, strict dust enforcement at construction sites." };
  return { stage: "Normal Operations", code: 0, color: "#10B981", mandate: "Routine monitoring and source surveillance." };
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CITIES = [
  {
    id: "delhi",
    name: "Delhi NCR",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    lang: "hi",
    langLabel: "Hindi",
    winterSpike: true,
    wards: [
      { id: "anand-vihar", name: "Anand Vihar", lat: 28.6469, lng: 77.3160, type: "traffic-industrial", pop: 181000, baseline: 310, dominantPollutant: "PM2.5" },
      { id: "lodhi-road", name: "Lodhi Road", lat: 28.5918, lng: 77.2273, type: "residential-green", pop: 62000, baseline: 140, dominantPollutant: "PM2.5" },
      { id: "okhla-phase2", name: "Okhla Phase II", lat: 28.5308, lng: 77.2711, type: "industrial", pop: 96000, baseline: 275, dominantPollutant: "NO2" },
      { id: "rk-puram", name: "R.K. Puram", lat: 28.5660, lng: 77.1767, type: "mixed-residential", pop: 140000, baseline: 215, dominantPollutant: "PM10" },
      { id: "punjabi-bagh", name: "Punjabi Bagh", lat: 28.6683, lng: 77.1246, type: "traffic-industrial", pop: 165000, baseline: 260, dominantPollutant: "PM2.5" },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai Metro",
    state: "Maharashtra",
    lat: 19.0760,
    lng: 72.8777,
    lang: "en",
    langLabel: "English",
    winterSpike: false,
    wards: [
      { id: "chembur", name: "Chembur", lat: 19.0621, lng: 72.8988, type: "industrial", pop: 155000, baseline: 165, dominantPollutant: "SO2" },
      { id: "bandra", name: "Bandra West", lat: 19.0596, lng: 72.8295, type: "mixed-residential", pop: 130000, baseline: 105, dominantPollutant: "PM2.5" },
      { id: "andheri-east", name: "Andheri East", lat: 19.1136, lng: 72.8697, type: "traffic-industrial", pop: 210000, baseline: 150, dominantPollutant: "PM10" },
      { id: "worli", name: "Worli Sea Face", lat: 19.0176, lng: 72.8178, type: "residential-green", pop: 85000, baseline: 82, dominantPollutant: "PM2.5" },
    ],
  },
  {
    id: "kolkata",
    name: "Kolkata Metropolitan",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    lang: "en",
    langLabel: "English",
    winterSpike: true,
    wards: [
      { id: "howrah-belt", name: "Howrah Industrial Belt", lat: 22.5958, lng: 88.2636, type: "industrial", pop: 175000, baseline: 220, dominantPollutant: "PM10" },
      { id: "salt-lake", name: "Salt Lake Sector V", lat: 22.5867, lng: 88.4171, type: "residential-green", pop: 88000, baseline: 125, dominantPollutant: "PM2.5" },
      { id: "park-street", name: "Park Street Crossing", lat: 22.5551, lng: 88.3517, type: "traffic-industrial", pop: 60000, baseline: 170, dominantPollutant: "NO2" },
    ],
  },
  {
    id: "bengaluru",
    name: "Bengaluru City",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    lang: "kn",
    langLabel: "Kannada",
    winterSpike: false,
    wards: [
      { id: "silk-board", name: "Silk Board Junction", lat: 12.9172, lng: 77.6228, type: "traffic-industrial", pop: 120000, baseline: 145, dominantPollutant: "NO2" },
      { id: "koramangala", name: "Koramangala 4th Block", lat: 12.9352, lng: 77.6245, type: "mixed-residential", pop: 105000, baseline: 88, dominantPollutant: "PM2.5" },
      { id: "peenya", name: "Peenya Industrial Area", lat: 13.0285, lng: 77.5197, type: "industrial", pop: 92000, baseline: 175, dominantPollutant: "PM10" },
      { id: "whitefield", name: "Whitefield IT Corridor", lat: 12.9698, lng: 77.7499, type: "traffic-industrial", pop: 150000, baseline: 130, dominantPollutant: "PM10" },
    ],
  },
  {
    id: "chennai",
    name: "Chennai Urban",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    lang: "ta",
    langLabel: "Tamil",
    winterSpike: false,
    wards: [
      { id: "manali", name: "Manali Industrial Zone", lat: 13.1672, lng: 80.2608, type: "industrial", pop: 98000, baseline: 155, dominantPollutant: "SO2" },
      { id: "t-nagar", name: "T. Nagar Central", lat: 13.0418, lng: 80.2341, type: "traffic-industrial", pop: 145000, baseline: 98, dominantPollutant: "NO2" },
      { id: "adyar", name: "Adyar Eco Park", lat: 13.0012, lng: 80.2565, type: "residential-green", pop: 80000, baseline: 65, dominantPollutant: "PM2.5" },
    ],
  },
];

const SIM_MONTH = 1; // Simulation winter month

function diurnalMultiplier(hourOfDay, wardType) {
  const morning = Math.exp(-Math.pow(hourOfDay - 9, 2) / 6);
  const evening = Math.exp(-Math.pow(hourOfDay - 20, 2) / 8);
  const trafficHump = 0.35 * (morning + evening);

  if (wardType === "traffic-industrial") return 1 + trafficHump;
  if (wardType === "industrial") return 1 + 0.12 * (morning + evening) + 0.1;
  if (wardType === "residential-green") return 1 + 0.5 * trafficHump;
  return 1 + 0.7 * trafficHump;
}

function calculatePollutants(aqi, rand) {
  const pm25 = Math.round(aqi * (0.55 + rand() * 0.15));
  const pm10 = Math.round(aqi * (0.85 + rand() * 0.25));
  const no2 = Math.round(35 + (aqi / 300) * 80 + rand() * 15);
  const so2 = Math.round(12 + (aqi / 300) * 45 + rand() * 10);
  const co = Math.round((0.8 + (aqi / 300) * 3.5 + rand() * 0.4) * 10) / 10;
  const o3 = Math.round(25 + (aqi / 300) * 60 + rand() * 20);

  return {
    pm25: { val: pm25, unit: "µg/m³", standard: 60, ratio: Math.round((pm25 / 60) * 100) },
    pm10: { val: pm10, unit: "µg/m³", standard: 100, ratio: Math.round((pm10 / 100) * 100) },
    no2: { val: no2, unit: "µg/m³", standard: 80, ratio: Math.round((no2 / 80) * 100) },
    so2: { val: so2, unit: "µg/m³", standard: 80, ratio: Math.round((so2 / 80) * 100) },
    co: { val: co, unit: "mg/m³", standard: 2.0, ratio: Math.round((co / 2.0) * 100) },
    o3: { val: o3, unit: "µg/m³", standard: 100, ratio: Math.round((o3 / 100) * 100) },
  };
}

function generateMet(hour, rand) {
  const isNight = hour < 6 || hour > 20;
  const windSpeed = Math.round((4 + rand() * 12) * 10) / 10;
  const angles = [45, 90, 135, 180, 225, 270, 315, 360];
  const windDirDeg = angles[Math.floor(rand() * angles.length)];
  const cardinalMap = { 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW", 360: "N" };
  const temp = Math.round(18 + Math.sin((hour - 6) / 4) * 10 + rand() * 3);
  const humidity = Math.round(55 + Math.cos(hour / 4) * 20 + rand() * 10);
  const pblh = isNight ? Math.round(350 + rand() * 150) : Math.round(1100 + rand() * 400);
  const visibility = Math.round((3.2 + rand() * 6.5) * 10) / 10;

  return {
    windSpeed,
    windDirDeg,
    windDirText: `${cardinalMap[windDirDeg]} (${windDirDeg}°)`,
    temp,
    humidity,
    pblh,
    visibility,
  };
}

function generateSeries(ward, cityWinterSpike, hoursBack = 96) {
  const rand = mulberry32(ward.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + hoursBack);
  const series = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  let drift = 0;

  for (let i = hoursBack; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const hour = t.getHours();

    drift += (rand() - 0.5) * 4;
    drift = Math.max(-30, Math.min(30, drift));

    const winterBump = cityWinterSpike && SIM_MONTH <= 2 ? 45 : 0;
    const noise = (rand() - 0.5) * 16;

    let value = ward.baseline * diurnalMultiplier(hour, ward.type) + drift + winterBump + noise;
    value = Math.max(22, Math.round(value));

    const pollutants = calculatePollutants(value, rand);
    const met = generateMet(hour, rand);

    series.push({
      t: t.toISOString(),
      aqi: value,
      pollutants,
      met,
    });
  }
  return series;
}

window.AQ_DATA = (function build() {
  const out = {};
  CITIES.forEach((city) => {
    city.wards.forEach((ward) => {
      out[ward.id] = {
        ward,
        city,
        series: generateSeries(ward, city.winterSpike),
      };
    });
  });
  return out;
})();

window.CITIES = CITIES;
window.AQI_BANDS = AQI_BANDS;
window.bandFor = bandFor;
window.getGRAPStage = getGRAPStage;
