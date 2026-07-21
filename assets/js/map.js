// map.js - AeroSense 2.0 Interactive Geospatial GIS Map Engine

let mapInstance = null;
let markerLayerGroup = null;
let heatmapLayerGroup = null;
let fireHotspotGroup = null;
let windVectorGroup = null;

function initAirQualityMap(containerId, activeCityId = "all", onWardSelect = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Guard: if Leaflet hasn't loaded from CDN yet, retry up to 20×
  if (typeof L === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8;font-family:Plus Jakarta Sans,sans-serif;flex-direction:column;gap:10px;"><span style="font-size:28px;">🌍</span><span>Loading GIS Map…</span></div>';
    let retries = 0;
    const poll = setInterval(() => {
      retries++;
      if (typeof L !== 'undefined') {
        clearInterval(poll);
        container.innerHTML = '';
        initAirQualityMap(containerId, activeCityId, onWardSelect);
      } else if (retries > 20) {
        clearInterval(poll);
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#EF4444;font-family:Plus Jakarta Sans,sans-serif;">Map failed to load. Please check your internet connection.</div>';
      }
    }, 300);
    return;
  }

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Initial center position
  let initialLat = 20.5937;
  let initialLng = 78.9629;
  let zoom = 5;

  if (activeCityId !== "all") {
    const city = window.CITIES.find((c) => c.id === activeCityId);
    if (city) {
      initialLat = city.lat;
      initialLng = city.lng;
      zoom = 11;
    }
  }

  mapInstance = L.map(containerId, {
    center: [initialLat, initialLng],
    zoom: zoom,
    zoomControl: true,
  });

  // Modern Dark CartoDB Tile Layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> | AeroSense GIS',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(mapInstance);

  markerLayerGroup = L.layerGroup().addTo(mapInstance);
  heatmapLayerGroup = L.layerGroup().addTo(mapInstance);
  fireHotspotGroup = L.layerGroup().addTo(mapInstance);
  windVectorGroup = L.layerGroup().addTo(mapInstance);

  renderMapLayers(activeCityId, onWardSelect);
}

function renderMapLayers(activeCityId = "all", onWardSelect = null) {
  if (!mapInstance) return;

  markerLayerGroup.clearLayers();
  heatmapLayerGroup.clearLayers();
  fireHotspotGroup.clearLayers();
  windVectorGroup.clearLayers();

  const citiesToRender = activeCityId === "all" ? window.CITIES : window.CITIES.filter((c) => c.id === activeCityId);

  citiesToRender.forEach((city) => {
    city.wards.forEach((ward) => {
      const entry = window.AQ_DATA[ward.id];
      if (!entry) return;

      const latest = entry.series[entry.series.length - 1];
      const aqi = latest.aqi;
      const band = window.bandFor(aqi);
      const grap = window.getGRAPStage(aqi);

      // 1. AQI Heatmap Circle Radius & Opacity
      const radius = Math.min(6000, 1500 + aqi * 12);
      const circle = L.circle([ward.lat, ward.lng], {
        color: band.color,
        fillColor: band.color,
        fillOpacity: 0.22,
        radius: radius,
        stroke: true,
        weight: 1,
      });
      heatmapLayerGroup.addLayer(circle);

      // 2. Custom Glowing AQI Badge Marker
      const customIcon = L.divIcon({
        className: "custom-map-marker-container",
        html: `
          <div class="map-badge-marker" style="--marker-color:${band.color}; border-color:${band.color}">
            <div class="marker-aqi">${aqi}</div>
            <div class="marker-ward-name">${ward.name}</div>
          </div>
        `,
        iconSize: [80, 42],
        iconAnchor: [40, 21],
      });

      const marker = L.marker([ward.lat, ward.lng], { icon: customIcon });

      // Interactive Popup
      const popupHtml = `
        <div class="map-popup-card">
          <div class="popup-header">
            <strong>${ward.name}</strong>
            <span class="muted small">${city.name}</span>
          </div>
          <div class="popup-body">
            <div class="popup-aqi-row">
              <span class="popup-aqi-val" style="color:${band.color}">${aqi}</span>
              <span class="popup-band-tag" style="background:${band.badgeBg};color:${band.color}">${band.label}</span>
            </div>
            <div class="popup-meta">
              <div><strong>PM2.5:</strong> ${latest.pollutants.pm25.val} ${latest.pollutants.pm25.unit}</div>
              <div><strong>Dominant:</strong> ${ward.dominantPollutant}</div>
              <div><strong>GRAP:</strong> ${grap.stage}</div>
              <div><strong>Wind:</strong> ${latest.met.windSpeed} km/h ${latest.met.windDirText}</div>
            </div>
            <button class="popup-focus-btn" onclick="window.focusWardFromMap('${ward.id}')">
              Focus Ward Details →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: "dark-map-popup" });
      markerLayerGroup.addLayer(marker);

      // 3. Simulated Wind Vector Indicators
      const windAngle = latest.met.windDirDeg;
      const windLength = 0.015;
      const endLat = ward.lat + Math.cos((windAngle * Math.PI) / 180) * windLength;
      const endLng = ward.lng + Math.sin((windAngle * Math.PI) / 180) * windLength;

      const windLine = L.polyline(
        [
          [ward.lat, ward.lng],
          [endLat, endLng],
        ],
        { color: "rgba(62, 214, 180, 0.65)", weight: 2, dashArray: "4, 4" }
      );
      windVectorGroup.addLayer(windLine);
    });

    // 4. Simulated Satellite Stubble Fire Hotspots for Delhi & North Region
    if (city.winterSpike) {
      const fireOffsetLats = [0.08, -0.09, 0.12];
      const fireOffsetLngs = [-0.11, 0.14, -0.05];
      fireOffsetLats.forEach((offLat, idx) => {
        const fireLat = city.lat + offLat;
        const fireLng = city.lng + fireOffsetLngs[idx];
        const fireIcon = L.divIcon({
          className: "fire-hotspot-icon",
          html: `<div class="fire-pulsing-dot" title="MODIS/VIIRS Satellite Fire Hotspot">🔥</div>`,
          iconSize: [24, 24],
        });
        const fireMarker = L.marker([fireLat, fireLng], { icon: fireIcon });
        fireMarker.bindPopup(`
          <div class="map-popup-card">
            <strong>🔥 Thermal Anomaly Detected</strong>
            <div class="muted small">MODIS Satellite Active Stubble / Biomass Fire</div>
            <div style="margin-top:6px;font-size:12px;color:#EF4444;">Intensity: Moderate High (Confidence 88%)</div>
          </div>
        `, { className: "dark-map-popup" });
        fireHotspotGroup.addLayer(fireMarker);
      });
    }
  });
}

window.initAirQualityMap = initAirQualityMap;
window.renderMapLayers = renderMapLayers;
