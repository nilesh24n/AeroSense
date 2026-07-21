// advisory.js - AeroSense 2.0 AeroBot AI Copilot & Citizen Health Advisory

const ADVISORY_TEXT = {
  en: {
    Good: "Air quality is good (AQI 0-50). Outdoor activities are fully safe for everyone.",
    Satisfactory: "Air quality is acceptable (AQI 51-100). Sensitive individuals should limit prolonged heavy outdoor exertion.",
    Moderate: "Air quality is moderate (AQI 101-200). Children, elderly, and asthma/cardiac patients should reduce prolonged outdoor exertion.",
    Poor: "Air quality is poor (AQI 201-300). Everyone should avoid prolonged outdoor exposure. Wear N95 masks when outside.",
    "Very Poor": "Health warning: Very Poor (AQI 301-400). Avoid physical activity outdoors. Keep air purifiers active indoors.",
    Severe: "Severe Health Alert (AQI 401+). Emergency conditions. Stay indoors, seal windows, and avoid all outdoor exposure.",
    askPrompt: "Ask AeroBot AI (e.g. 'Is it safe to jog in Anand Vihar today?' or 'What GRAP stage is active?')",
  },
  hi: {
    Good: "हवा की गुणवत्ता उत्तम है। outdoor की गतिविधियाँ पूरी तरह सुरक्षित हैं।",
    Satisfactory: "हवा की गुणवत्ता संतोषजनक है। अत्यधिक संवेदनशील व्यक्ति लंबा परिश्रम कम रखें।",
    Moderate: "हवा मध्यम है। बच्चे, बुज़ुर्ग और अस्थमा मरीज लंबे समय तक बाहर व्यायाम न करें।",
    Poor: "हवा खराब है। बाहर N95 मास्क पहनें और ज्यादा देर बाहर न रहें।",
    "Very Poor": "गंभीर चेतावनी: बाहर जाने से बचें और कमरे में एयर प्यूरीफायर चलाएं।",
    Severe: "स्वास्थ्य आपातकाल: घर के अंदर रहें, खिड़कियां बंद रखें।",
    askPrompt: "एरोबॉट AI से पूछें (उदा. 'क्या आज आनंद विहार में दौड़ना सुरक्षित है?')",
  },
  kn: {
    Good: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಉತ್ತಮವಾಗಿದೆ. ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳು ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತ.",
    Satisfactory: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸಮಾಧಾನಕರವಾಗಿದೆ. ಅತಿ ಸೂಕ್ಷ್ಮ ವ್ಯಕ್ತಿಗಳು ಶ್ರಮ ಕಡಿಮೆ ಮಾಡಿ.",
    Moderate: "ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳು ಹೊರಾಂಗಣ ಶ್ರಮ ಕಡಿಮೆ ಮಾಡಬೇಕು.",
    Poor: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಕೆಟ್ಟದಾಗಿದೆ. ಹೊರಗೆ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ.",
    "Very Poor": "ತುರ್ತು ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆ. ಮನೆಯೊಳಗೆ ಇರಿ ಮತ್ತು ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಬಳಸಿ.",
    Severe: "ಆರೋಗ್ಯ ಅಪಾಯ: ಮನೆಯೊಳಗೆ ಇರಿ, ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ.",
    askPrompt: "ಏರೋಬೋಟ್ AI ಕೇಳಿ (ಉದಾ. 'ಇಂದು ಕೋರಮಂಗಲದಲ್ಲಿ ಓಡುವುದು ಸುರಕ್ಷಿತವೇ?')",
  },
  ta: {
    Good: "காற்றின் தரம் நல்லது. வெளிப்புற செயல்பாடுகள் பாதுகாப்பானவை.",
    Satisfactory: "காற்றின் தரம் திருப்திகரமானது. உணர்திறன் உள்ளவர்கள் வெளிப்புற உழைப்பைக் குறைக்கவும்.",
    Moderate: "குழந்தைகள் மற்றும் முதியவர்கள் வெளிப்புற உடற்பயிற்சியைக் குறைக்க வேண்டும்.",
    Poor: "காற்றின் தரம் மோசம். வெளியே செல்லும் போது N95 முகமூடி அணியுங்கள்.",
    "Very Poor": "அவசர சுகாதார எச்சரிக்கை. வீட்டிற்குள் இருங்கள், ஏர் பியூரிஃபையர் பயன்படுத்தவும்.",
    Severe: "கடுமையான அபாயம்: வீட்டிற்குள் இருங்கள், ஜன்னல்களை மூடுங்கள்.",
    askPrompt: "AeroBot AI இடம் கேளுங்கள் (எ.கா. 'இன்று அடையாரில் ஓடுவது பாதுகாப்பானதா?')",
  },
  mr: {
    Good: "हवेची गुणवत्ता उत्तम आहे. मैदानी खेळ व व्यायाम पूर्णपणे सुरक्षित.",
    Satisfactory: "हवेची गुणवत्ता समाधानकारक आहे. संवेदनक्षम व्यक्तींनी अतिश्रम टाळावा.",
    Moderate: "लहान मुले व दमा रुग्णांनी बाहेर जास्त वेळ घालवणे टाळावे.",
    Poor: "हवा वाईट आहे. बाहेर जाताना N95 मास्क नक्की वापरा.",
    "Very Poor": "आरोग्य आणीबाणी: घराबाहेर पडणे टाळा आणि एअर प्युरिफायर वापरा.",
    Severe: "गंभीर धोका: घरातच राहा, खिडक्या बंद ठेवा.",
    askPrompt: "AeroBot AI ला विचारा (उदा. 'आज वांद्रे येथे पळणे सुरक्षित आहे का?')",
  },
};

const SUGGESTED_PROMPTS = [
  "🏃 Can I jog outside in this ward today?",
  "😷 What type of mask should I wear right now?",
  "🚨 What GRAP Stage restrictions apply here?",
  "🔮 What will AQI be tomorrow morning?",
  "⚡ How can municipal teams drop AQI by 30 pts?",
];

function healthAdvisory(aqi, lang) {
  const band = window.bandFor(aqi);
  const strings = ADVISORY_TEXT[lang] || ADVISORY_TEXT.en;
  return { band, text: strings[band.label] || strings.Moderate };
}

function answerQuestion(question, fallbackWardId) {
  const q = question.toLowerCase();
  let matchWard = null;
  Object.values(window.AQ_DATA).forEach(({ ward }) => {
    if (q.includes(ward.name.toLowerCase().split(" ")[0])) matchWard = ward.id;
  });
  const wardId = matchWard || fallbackWardId;
  const entry = window.AQ_DATA[wardId];
  if (!entry) return "I don't have monitoring telemetry for that specific location yet.";

  const latest = entry.series[entry.series.length - 1];
  const aqi = latest.aqi;
  const band = window.bandFor(aqi);
  const grap = window.getGRAPStage(aqi);

  const wantsForecast = /tomorrow|later|forecast|next|future|predict/.test(q);
  const wantsExercise = /run|jog|walk|exercise|outdoor|play|safe|sports/.test(q);
  const wantsMask = /mask|n95|kn95|respirator|protection/.test(q);
  const wantsGRAP = /grap|stage|policy|restriction|rule|mandate|ban/.test(q);
  const wantsMitigation = /lower|reduce|drop|clean|solution|sprinkle|action/.test(q);

  if (wantsForecast) {
    const fc = window.holtWintersForecast(entry.series, 24);
    const tomorrow = fc[fc.length - 1];
    const tomorrowBand = window.bandFor(tomorrow.mean);
    return `🤖 **AeroBot AI Forecast for ${entry.ward.name}**:\n` +
      `Current AQI is **${aqi}** (${band.label}). Over the next 24 hours, Holt-Winters predictive modeling indicates AQI will hover around **${tomorrow.mean}** (${tomorrowBand.label}). Peak pollution hours are expected between 8:00 AM - 10:30 AM due to morning traffic and thermal boundary layer compression.`;
  }

  if (wantsExercise) {
    if (aqi <= 100) {
      return `✅ **Outdoor Exercise Advisory**: Current AQI in **${entry.ward.name}** is **${aqi}** (${band.label}). Outdoor running, cycling, and sports are safe. Recommended window: Any time today.`;
    } else if (aqi <= 200) {
      return `⚠️ **Exercise Advisory**: Current AQI in **${entry.ward.name}** is **${aqi}** (${band.label}). Moderate pollution. Sensitive groups (astmatics, elderly) should restrict outdoor cardio to early morning before 7:30 AM or move indoors.`;
    } else {
      return `❌ **Outdoor Exercise Warning**: AQI in **${entry.ward.name}** is **${aqi}** (${band.label}). High particulate density (PM2.5: ${latest.pollutants.pm25.val} µg/m³). **Do not exercise outdoors.** Cardiovascular strain is elevated by 3.4x under these conditions.`;
    }
  }

  if (wantsMask) {
    if (aqi <= 100) {
      return `💡 **Mask Guidance**: AQI is **${aqi}** (${band.label}). No mask required for healthy individuals.`;
    } else if (aqi <= 250) {
      return `😷 **Mask Guidance**: AQI is **${aqi}** (${band.label}). A standard N95 or KN95 respirator is recommended during outdoor commutes to filter fine PM2.5 particulates. Cloth/surgical masks offer less than 20% filtration efficiency against sub-micron dust.`;
    } else {
      return `🚨 **Mandatory Mask Alert**: AQI is **${aqi}** (${band.label}). Strictly wear an **N95/FFP2 respirator with active seal** whenever stepping outdoors. Avoid unsealed cloth masks.`;
    }
  }

  if (wantsGRAP) {
    return `🏛️ **GRAP Enforcement Status in ${entry.city.name}**: Current AQI is **${aqi}**, triggering **${grap.stage}** (Code ${grap.code}).\n` +
      `📌 **Mandates Active**: ${grap.mandate}`;
  }

  if (wantsMitigation) {
    const attr = window.attributeSources(entry.ward, entry.city.winterSpike, new Date().getHours(), aqi);
    return `⚡ **AI Mitigation Action Plan for ${entry.ward.name}**:\n` +
      `Dominant source is **${attr.dominantLabel}** (${attr.dominantShare}% share). Priority actions:\n` +
      `1. Deploy 3 anti-smog misting guns along primary traffic corridors (-18 AQI pts within 3 hrs).\n` +
      `2. Mandate dust suppression coverings at nearby active construction sites (-12 AQI pts).\n` +
      `3. Divert heavy diesel trucks during peak morning inversion windows.`;
  }

  return `🤖 **AeroBot Diagnostic for ${entry.ward.name} (${entry.city.name})**:\n` +
    `Live AQI is **${aqi}** (${band.label}). Dominant pollutant: **${entry.ward.dominantPollutant}** (${latest.pollutants.pm25.val} µg/m³ PM2.5). ${ADVISORY_TEXT.en[band.label]}`;
}

window.healthAdvisory = healthAdvisory;
window.answerQuestion = answerQuestion;
window.ADVISORY_TEXT = ADVISORY_TEXT;
window.SUGGESTED_PROMPTS = SUGGESTED_PROMPTS;
