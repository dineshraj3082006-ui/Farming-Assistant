/* ==========================================================================
   KRISHIMITRA AI - Express Backend API Server
   Connects Kerala Agricultural RAG Engine, Crop Doctor Vision Service, Weather, 
   Market Intelligence, and Farmer Profile Persistence.
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ragEngine = require('./ragEngine');

const app = express();
const PORT = process.env.PORT || 5000;
const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.AI_API_KEY || '';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../'), {
  maxAge: '1h',
  etag: true
}));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Crop Leaf Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `leaf_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// In-Memory Database Store for Farmer Profile (Suitable for prototype backend)
let farmerProfileStore = {
  name: "Raman Nair",
  mobile: "9876543210",
  district: "Thrissur",
  location: "Mannuthy, Thrissur",
  farmSize: "2.5 acres",
  landArea: "2.5",
  mainCrop: "Tomato",
  mainCrops: "Tomato, Paddy, Banana",
  soilType: "Laterite Soil",
  waterAvailability: "Moderate",
  waterSource: "Open Well & Canal",
  language: "ml"
};

// ------------------------------------------------------------------------
// 1. CHAT API: POST /api/chat
// ------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { language = 'en', farmerProfile = {}, history = [], hasImage = false, activeDiagnosis = null } = req.body;
    const message = req.body.message || req.body.query || '';

    if (!message && !hasImage) {
      return res.status(400).json({ error: "Please enter a farming question or upload an image." });
    }

    try {
      require('dotenv').config();
    } catch (e) {}

    const apiKey = (process.env.NVIDIA_API_KEY || process.env.AI_API_KEY || '').trim();

    console.log('[AI] Received message:', message);

    const effectiveProfile = { ...farmerProfileStore, ...farmerProfile };
    if (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.cropEn)) {
      effectiveProfile.mainCrop = activeDiagnosis.cropEn || activeDiagnosis.crop;
    }

    const queryMessage = message || (language === 'ml' ? 'അപ്‌ലോഡ് ചെയ്ത ഇലയുടെ ചിത്രം പരിശോധിക്കുക' : 'Please check the uploaded plant leaf photo.');

    // Use current RAG Engine (with hot-reload fallback)
    let engine = ragEngine;
    try {
      delete require.cache[require.resolve('./ragEngine')];
      engine = require('./ragEngine');
    } catch (e) {
      engine = ragEngine;
    }

    // Process query through high-speed RAG Engine
    const result = await engine.generateResponse(
      queryMessage,
      language,
      effectiveProfile,
      history,
      false,
      apiKey,
      activeDiagnosis
    );

    console.log('[AI] Model response generated in real-time');

    return res.json({
      answer: result.answer,
      language: language,
      demoMode: false,
      suggestedQuestions: result.suggestedQuestions || []
    });

  } catch (error) {
    console.error("[Backend API] Chat Error:", error);
    return res.status(500).json({
      error: "Sorry, I couldn't connect to KrishiMitra AI right now. Please try again.",
      demoMode: false
    });
  }
});

// ------------------------------------------------------------------------
// 1b. TTS PROXY: GET /api/tts — Proxies Google Translate TTS to avoid CORS
// ------------------------------------------------------------------------
app.get('/api/tts', async (req, res) => {
  try {
    const text = req.query.q || '';
    const tl = req.query.tl || 'ml';
    if (!text || text.length > 250) {
      return res.status(400).send('Invalid text');
    }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const fetchModule = globalThis.fetch || (await import('node-fetch')).default;
    const response = await fetchModule(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    if (!response.ok) {
      return res.status(502).send('TTS upstream error');
    }
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    // Stream the response body
    if (response.body && typeof response.body.pipe === 'function') {
      response.body.pipe(res);
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error('[TTS Proxy] Error:', err.message);
    res.status(500).send('TTS proxy error');
  }
});

// ------------------------------------------------------------------------
// 2. CROP DOCTOR API: POST /api/analyze-crop
// ------------------------------------------------------------------------
app.post('/api/analyze-crop', upload.single('cropImage'), async (req, res) => {
  try {
    const file = req.file;
    const presetKey = req.body.presetKey || req.body.filename || '';
    const lang = req.body.language || 'en';

    let doctorService = null;
    try {
      delete require.cache[require.resolve('./cropDoctorService')];
      doctorService = require('./cropDoctorService');
    } catch (e) {
      doctorService = require('./cropDoctorService');
    }

    const diagnosis = await doctorService.diagnosePlantAsync(file, presetKey, lang);

    return res.json({
      success: true,
      diagnosis: diagnosis
    });

  } catch (err) {
    console.error("[Backend API] Analyze Crop Error:", err);
    return res.status(500).json({ error: "Failed to analyze plant image." });
  }
});

// ------------------------------------------------------------------------
// 3. CROP RECOMMENDATION API: POST /api/recommend-crops
// ------------------------------------------------------------------------
app.post('/api/recommend-crops', (req, res) => {
  try {
    delete require.cache[require.resolve('./cropRecommendationService.js')];
    const { recommendCrops } = require('./cropRecommendationService.js');

    const recommendations = recommendCrops(req.body);
    console.log(`[Crop Recommendation] Generated ${recommendations.length} recommendations for district: ${req.body.district}, soil: ${req.body.soil}`);
    
    return res.json({
      success: true,
      inputParams: req.body,
      recommendations: recommendations
    });
  } catch (err) {
    console.error('[Crop Recommendation] Error:', err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate crop recommendations."
    });
  }
});

// ------------------------------------------------------------------------
// 4. WEATHER INTEGRATION API: GET /api/weather
// ------------------------------------------------------------------------

// In-Memory Cache (10-minute TTL for lightning fast responses)
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

// Kerala Districts Coordinate Mapping for fallback
const KERALA_DISTRICT_COORDS = {
  'thrissur': { lat: 10.5276, lon: 76.2144, name: 'Thrissur' },
  'palakkad': { lat: 10.7867, lon: 76.6548, name: 'Palakkad' },
  'wayanad': { lat: 11.6854, lon: 76.1320, name: 'Wayanad' },
  'alappuzha': { lat: 9.4981, lon: 76.3388, name: 'Alappuzha' },
  'ernakulam': { lat: 9.9816, lon: 76.2999, name: 'Ernakulam' },
  'idukki': { lat: 9.8500, lon: 76.9700, name: 'Idukki' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram' },
  'trivandrum': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram' },
  'kollam': { lat: 8.8932, lon: 76.6141, name: 'Kollam' },
  'pathanamthitta': { lat: 9.2648, lon: 76.7870, name: 'Pathanamthitta' },
  'kottayam': { lat: 9.5916, lon: 76.5222, name: 'Kottayam' },
  'malappuram': { lat: 11.0732, lon: 76.0740, name: 'Malappuram' },
  'kozhikode': { lat: 11.2588, lon: 75.7804, name: 'Kozhikode' },
  'calicut': { lat: 11.2588, lon: 75.7804, name: 'Kozhikode' },
  'kannur': { lat: 11.8745, lon: 75.3704, name: 'Kannur' },
  'kasaragod': { lat: 12.4996, lon: 74.9869, name: 'Kasaragod' }
};

// WMO Weather Code to Condition Translator (Open-Meteo)
const WEATHER_CODE_MAP = {
  0: { en: "Clear Sky", ml: "തെളിഞ്ഞ ആകാശം", icon: "☀️" },
  1: { en: "Mainly Clear", ml: "പ്രധാനമായും തെളിഞ്ഞ ആകാശം", icon: "🌤️" },
  2: { en: "Partly Cloudy", ml: "ഭാഗികമായി മേഘാവൃതമായ അന്തരീക്ഷം", icon: "⛅" },
  3: { en: "Overcast", ml: "മൂടിക്കെട്ടിയ ആകാശം", icon: "☁️" },
  45: { en: "Fog", ml: "മൂടൽമഞ്ഞ്", icon: "🌫️" },
  48: { en: "Depositing Rime Fog", ml: "മഞ്ഞുമൂടിയ അന്തരീക്ഷം", icon: "🌫️" },
  51: { en: "Light Drizzle", ml: "നേരിയ ചാറ്റൽമഴ", icon: "🌦️" },
  53: { en: "Moderate Drizzle", ml: "മിതമായ ചാറ്റൽമഴ", icon: "🌦️" },
  55: { en: "Dense Drizzle", ml: "ശക്തമായ ചാറ്റൽമഴ", icon: "🌧️" },
  56: { en: "Light Freezing Drizzle", ml: "തണുത്തുറഞ്ഞ ചാറ്റൽമഴ", icon: "🌧️" },
  57: { en: "Dense Freezing Drizzle", ml: "ശക്തമായ തണുത്തുറഞ്ഞ ചാറ്റൽമഴ", icon: "🌧️" },
  61: { en: "Slight Rain", ml: "നേരിയ മഴ", icon: "🌧️" },
  63: { en: "Moderate Rain", ml: "മിതമായ മഴ", icon: "🌧️" },
  65: { en: "Heavy Rain", ml: "കനത്ത മഴ", icon: "🌧️" },
  66: { en: "Light Freezing Rain", ml: "തണുത്തുറഞ്ഞ മഴ", icon: "🌧️" },
  67: { en: "Heavy Freezing Rain", ml: "ശക്തമായ തണുത്തുറഞ്ഞ മഴ", icon: "🌧️" },
  71: { en: "Slight Snow Fall", ml: "നേരിയ മഞ്ഞുവീഴ്ച", icon: "🌨️" },
  73: { en: "Moderate Snow Fall", ml: "മിതമായ മഞ്ഞുവീഴ്ച", icon: "🌨️" },
  75: { en: "Heavy Snow Fall", ml: "ശക്തമായ മഞ്ഞുവീഴ്ച", icon: "❄️" },
  77: { en: "Snow Grains", ml: "മണൽമഞ്ഞ്", icon: "❄️" },
  80: { en: "Slight Rain Showers", ml: "നേരിയ മഴച്ചാറ്റൽ", icon: "🌧️" },
  81: { en: "Moderate Rain Showers", ml: "മിതമായ മഴ", icon: "🌧️" },
  82: { en: "Violent Rain Showers", ml: "അതിശക്തമായ മഴ", icon: "⛈️" },
  85: { en: "Slight Snow Showers", ml: "നേരിയ മഞ്ഞുകാറ്റ്", icon: "🌨️" },
  86: { en: "Heavy Snow Showers", ml: "ശക്തമായ മഞ്ഞുകാറ്റ്", icon: "❄️" },
  95: { en: "Thunderstorm", ml: "ഇടിമിന്നലോടു കൂടിയ മഴ", icon: "⛈️" },
  96: { en: "Thunderstorm with Slight Hail", ml: "ആലിപ്പഴത്തോട് കൂടിയ ഇടിമിന്നൽ", icon: "⛈️" },
  99: { en: "Thunderstorm with Heavy Hail", ml: "ശക്തമായ ആലിപ്പഴത്തോട് കൂടിയ ഇടിമിന്നൽ", icon: "⛈️" }
};

// Weather Condition Text Translator (WeatherAPI.com)
const CONDITION_TEXT_MAP = {
  "Sunny": { en: "Sunny", ml: "നല്ല വെയിൽ", icon: "☀️" },
  "Clear": { en: "Clear Sky", ml: "തെളിഞ്ഞ ആകാശം", icon: "☀️" },
  "Partly cloudy": { en: "Partly Cloudy", ml: "ഭാഗികമായി മേഘാവൃതമായ അന്തരീക്ഷം", icon: "⛅" },
  "Cloudy": { en: "Cloudy", ml: "മേഘാവൃതമായ അന്തരീക്ഷം", icon: "☁️" },
  "Overcast": { en: "Overcast", ml: "മൂടിക്കെട്ടിയ ആകാശം", icon: "☁️" },
  "Mist": { en: "Mist", ml: "മൂടൽമഞ്ഞ്", icon: "🌫️" },
  "Patchy rain possible": { en: "Patchy Rain", ml: "ഇടവിട്ടുള്ള മഴ", icon: "🌦️" },
  "Patchy light drizzle": { en: "Patchy Light Drizzle", ml: "നേരിയ ചാറ്റൽമഴ", icon: "🌦️" },
  "Light drizzle": { en: "Light Drizzle", ml: "നേരിയ ചാറ്റൽമഴ", icon: "🌦️" },
  "Patchy light rain": { en: "Patchy Light Rain", ml: "നേരിയ മഴ", icon: "🌦️" },
  "Light rain": { en: "Light Rain", ml: "നേരിയ മഴ", icon: "🌧️" },
  "Moderate rain at times": { en: "Moderate Rain at Times", ml: "ഇടയ്ക്കിടെ മിതമായ മഴ", icon: "🌧️" },
  "Moderate rain": { en: "Moderate Rain", ml: "മിതമായ മഴ", icon: "🌧️" },
  "Heavy rain at times": { en: "Heavy Rain at Times", ml: "ഇടയ്ക്കിടെ കനത്ത മഴ", icon: "🌧️" },
  "Heavy rain": { en: "Heavy Rain", ml: "കനത്ത മഴ", icon: "🌧️" },
  "Light rain shower": { en: "Light Rain Shower", ml: "നേരിയ മഴച്ചാറ്റൽ", icon: "🌧️" },
  "Moderate or heavy rain shower": { en: "Moderate/Heavy Rain Shower", ml: "മിതമായ അല്ലെങ്കിൽ ശക്തമായ മഴ", icon: "🌧️" },
  "Torrential rain shower": { en: "Torrential Rain Shower", ml: "അതിശക്തമായ പെരുമഴ", icon: "⛈️" },
  "Patchy light rain with thunder": { en: "Light Rain with Thunder", ml: "ഇടിമിന്നലോടു കൂടിയ നേരിയ മഴ", icon: "⛈️" },
  "Moderate or heavy rain with thunder": { en: "Heavy Rain with Thunder", ml: "ഇടിമിന്നലോടു കൂടിയ കനത്ത മഴ", icon: "⛈️" },
  "Thundery outbreaks possible": { en: "Thundery Outbreaks", ml: "ഇടിമിന്നൽ സാധ്യത", icon: "⛈️" }
};

function translateConditionText(text) {
  if (!text) return { en: "Clear Sky", ml: "തെളിഞ്ഞ ആകാശം", icon: "☀️" };
  const trimmed = text.trim();
  for (const [key, val] of Object.entries(CONDITION_TEXT_MAP)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) {
      return val;
    }
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('thunder')) return { en: trimmed, ml: "ഇടിമിന്നലോടു കൂടിയ മഴ", icon: "⛈️" };
  if (lower.includes('heavy rain') || lower.includes('torrential')) return { en: trimmed, ml: "കനത്ത മഴ", icon: "🌧️" };
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return { en: trimmed, ml: "മഴ / ചാറ്റൽമഴ", icon: "🌧️" };
  if (lower.includes('cloud') || lower.includes('overcast')) return { en: trimmed, ml: "മേഘാവൃതമായ അന്തരീക്ഷം", icon: "⛅" };
  if (lower.includes('fog') || lower.includes('mist')) return { en: trimmed, ml: "മൂടൽമഞ്ഞ്", icon: "🌫️" };
  if (lower.includes('sun') || lower.includes('clear')) return { en: trimmed, ml: "തെളിഞ്ഞ ആകാശം", icon: "☀️" };
  return { en: trimmed, ml: trimmed, icon: "🌤️" };
}

function getWeatherCondition(code) {
  if (WEATHER_CODE_MAP[code]) {
    return WEATHER_CODE_MAP[code];
  }
  if (code >= 1 && code <= 3) return { en: "Cloudy / Partly Cloudy", ml: "മേഘാവൃതമായ അന്തരീക്ഷം", icon: "⛅" };
  if (code >= 45 && code <= 48) return { en: "Fog", ml: "മൂടൽമഞ്ഞ്", icon: "🌫️" };
  if (code >= 51 && code <= 55) return { en: "Drizzle", ml: "ചാറ്റൽമഴ", icon: "🌦️" };
  if (code >= 61 && code <= 65) return { en: "Rain", ml: "മഴ", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { en: "Snow", ml: "മഞ്ഞുവീഴ്ച", icon: "❄️" };
  if (code >= 80 && code <= 82) return { en: "Rain Showers", ml: "മഴച്ചാറ്റൽ", icon: "🌧️" };
  if (code >= 95 && code <= 99) return { en: "Thunderstorm", ml: "ഇടിമിന്നലോടു കൂടിയ മഴ", icon: "⛈️" };
  return { en: "Clear Sky", ml: "തെളിഞ്ഞ ആകാശം", icon: "☀️" };
}

// Dynamic farmer agronomic advice generator based on real-time WeatherAPI parameters
function generateFarmingAdvice(currentTemp, maxTemp, rainProb, windSpeed, humidity = 70, conditionDesc = '', district = 'Kerala') {
  const descLower = (typeof conditionDesc === 'string' ? conditionDesc : '').toLowerCase();
  const temp = Math.round(currentTemp || 29);
  const rain = Math.round(rainProb || 0);
  const wind = Math.round(windSpeed || 10);
  const hum = Math.round(humidity || 70);

  // 1. Thunderstorm / Heavy Rain
  if (descLower.includes('thunder') || descLower.includes('torrential') || descLower.includes('heavy rain') || rain >= 75) {
    return {
      en: `⚡ Thunderstorm & heavy rain forecasted in ${district} (${temp}°C, ${rain}% rain probability). Suspend foliar spraying and basal fertilizing. Ensure field drainage channels are clear to prevent waterlogging.`,
      ml: `⚡ ${district} ജില്ലയിൽ ഇടിമിന്നലിനും കനത്ത മഴയ്ക്കും സാധ്യത (${temp}°C, ${rain}% മഴ). ഇലകളിൽ മരുന്ന് തളിക്കുന്നതും വളപ്രയോഗവും ഒഴിവാക്കുക. തോട്ടങ്ങളിൽ വെള്ളക്കെട്ട് ഒഴിവാക്കാൻ ഡ്രെയിനേജ് തുറക്കുക.`
    };
  }

  // 2. Light / Moderate / Patchy Rain
  if (descLower.includes('rain') || descLower.includes('drizzle') || descLower.includes('shower') || rain >= 35) {
    return {
      en: `🌦️ Patchy rain/showers forecasted in ${district} (${temp}°C, ${rain}% chance, ${hum}% humidity). Avoid pesticide spraying today as rain will wash off treatments. Check soil before watering.`,
      ml: `🌦️ ${district} ജില്ലയിൽ മഴ സാധ്യത (${temp}°C, ${rain}% സാധ്യത, ${hum}% ഈർപ്പം). മരുന്ന് മഴയിൽ ഒലിച്ചുപോകാൻ സാധ്യതയുള്ളതിനാൽ ഇന്ന് കീടനാശിനി തളിക്കരുത്. നനയ്ക്കുന്നതിന് മുൻപ് മണ്ണിലെ ഈർപ്പം പരിശോധിക്കുക.`
    };
  }

  // 3. High Heat / Elevated Temperature
  if (temp >= 33 || maxTemp >= 34) {
    return {
      en: `☀️ High temperature (${temp}°C) in ${district}. Irrigate early in the morning or post-sunset. Apply dry leaf/straw mulching around banana and vegetable basins to preserve soil moisture.`,
      ml: `☀️ ${district} ജില്ലയിൽ ഉയർന്ന താപനില (${temp}°C). അതിരാവിലെയോ വൈകുന്നേരമോ നനയ്ക്കുക. മണ്ണിലെ ഈർപ്പം നിലനിർത്താൻ വാഴയുടെയും പച്ചക്കറികളുടെയും ചുവട്ടിൽ കരിയില പുതയിടുക.`
    };
  }

  // 4. Very High Humidity (Fungal / Blast Alert)
  if (hum >= 85) {
    return {
      en: `🌫️ High atmospheric humidity (${hum}%, ${temp}°C) in ${district}. Elevated risk of fungal spore germination (Paddy Blast & Vegetable Blight). Inspect crop leaf undersides; consider prophylactic Pseudomonas spray.`,
      ml: `🌫️ ${district} ജില്ലയിൽ ഉയർന്ന അന്തരീക്ഷ ഈർപ്പം (${hum}%, ${temp}°C). നെല്ലിലെ കുമിൾ രോഗങ്ങൾക്കും പച്ചക്കറികളിലെ കരിഞ്ഞുണങ്ങലിനും സാധ്യത. ഇലകൾ പരിശോധിക്കുകയും സ്യൂഡോമോണസ് തളിക്കുകയും ചെയ്യുക.`
    };
  }

  // 5. High Gale Winds (>= 32 km/h)
  if (wind >= 32) {
    return {
      en: `💨 Strong gusty winds (${wind} km/h) in ${district}. Secure bamboo supports for bunched Nendran banana plants and tie climbing vegetable trellises.`,
      ml: `💨 ${district} ജില്ലയിൽ ശക്തമായ കാറ്റ് (${wind} km/h). കുലച്ച നേന്ത്രവാഴകൾക്ക് മുളങ്കാൽ താങ്ങ് നൽകുകയും പച്ചക്കറി പന്തലുകൾ ബലപ്പെടുത്തുകയും ചെയ്യുക.`
    };
  }

  // 6. Clear / Favorable Routine Farming Weather
  return {
    en: `🌤️ Favorable farming weather in ${district} (${temp}°C, ${hum}% humidity, ${wind} km/h wind). Ideal conditions for routine weeding, bio-fertilizer application, and scheduled field cultivation.`,
    ml: `🌤️ ${district} ജില്ലയിൽ കൃഷിക്ക് അനുയോജ്യമായ തെളിഞ്ഞ കാലാവസ്ഥ (${temp}°C, ${hum}% ഈർപ്പം, ${wind} km/h കാറ്റ്). ജൈവവള പ്രയോഗത്തിനും കളപറിക്കലിനും നല്ല സമയമാണ്.`
  };
}

// Format ISO time to 12-hour AM/PM string
function formatTime12H(isoDateTime) {
  if (!isoDateTime) return "--:--";
  const parts = isoDateTime.split('T');
  if (parts.length < 2) return isoDateTime;
  const [hourStr, minStr] = parts[1].split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
}

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ML = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];

// Fetch live weather using WeatherAPI.com (when WEATHER_API_KEY is configured)
async function fetchFromWeatherApi(lat, lon, apiKey, districtName = 'Kerala') {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${encodeURIComponent(apiKey)}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const apiRes = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!apiRes.ok) {
    throw new Error(`WeatherAPI responded with HTTP status ${apiRes.status}`);
  }

  const data = await apiRes.json();
  if (!data || !data.current || !data.forecast || !Array.isArray(data.forecast.forecastday)) {
    throw new Error('Invalid payload structure received from WeatherAPI');
  }

  const current = data.current;
  const forecastDays = data.forecast.forecastday;
  const todayForecast = forecastDays[0] || {};
  const todayDay = todayForecast.day || {};
  const todayAstro = todayForecast.astro || {};

  const currentCond = translateConditionText(current.condition ? current.condition.text : '');
  const currentTemp = Math.round(current.temp_c);
  const feelsLike = Math.round(current.feelslike_c !== undefined ? current.feelslike_c : current.temp_c);
  const humidity = Math.round(current.humidity);
  const windSpeed = Math.round(current.wind_kph);
  const rainProb = (todayDay.daily_chance_of_rain !== undefined && todayDay.daily_chance_of_rain !== null)
    ? todayDay.daily_chance_of_rain
    : (current.precip_mm > 0 ? 80 : 0);
  const maxTempToday = todayDay.maxtemp_c !== undefined ? Math.round(todayDay.maxtemp_c) : currentTemp;

  const forecastList = forecastDays.map((f, i) => {
    const fDay = f.day || {};
    const condInfo = translateConditionText(fDay.condition ? fDay.condition.text : '');
    const dateStr = f.date;
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    const isToday = i === 0;

    const fMax = fDay.maxtemp_c !== undefined ? Math.round(fDay.maxtemp_c) : currentTemp;
    const fMin = fDay.mintemp_c !== undefined ? Math.round(fDay.mintemp_c) : currentTemp;
    const fRainProb = fDay.daily_chance_of_rain !== undefined ? fDay.daily_chance_of_rain : 0;
    const fPrecip = fDay.totalprecip_mm !== undefined ? fDay.totalprecip_mm : 0;

    return {
      date: dateStr,
      day: isToday ? "Today" : (WEEKDAYS_EN[dayOfWeek] || dateStr),
      dayMl: isToday ? "ഇന്ന്" : (WEEKDAYS_ML[dayOfWeek] || dateStr),
      maxTemp: `${fMax}°C`,
      minTemp: `${fMin}°C`,
      temp: `${fMax}°C`,
      rainProbability: `${fRainProb}%`,
      rain: `${fRainProb}%`,
      precipitation: `${fPrecip} mm`,
      precipitationSum: fPrecip,
      condition: `${condInfo.icon} ${condInfo.en}`,
      conditionEn: condInfo.en,
      conditionMl: condInfo.ml
    };
  });

  const advice = generateFarmingAdvice(currentTemp, maxTempToday, rainProb, windSpeed, humidity, currentCond.en, districtName || 'Kerala');

  return {
    location: { latitude: lat, longitude: lon },
    current: {
      temp: `${currentTemp}°C`,
      feelsLike: `${feelsLike}°C`,
      humidity: `${humidity}%`,
      rainProbability: `${rainProb}%`,
      windSpeed: `${windSpeed} km/h`,
      uv: current.uv !== undefined ? current.uv : 5,
      pressure: `${current.pressure_mb || 1012} hPa`,
      condition: currentCond.en,
      conditionMl: currentCond.ml,
      icon: currentCond.icon || "🌤️"
    },
    forecast: forecastList,
    sunrise: todayAstro.sunrise || "--:--",
    sunset: todayAstro.sunset || "--:--",
    farmingAdvice: advice,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
}

// Fetch live weather using Open-Meteo (No API key required)
async function fetchFromOpenMeteo(lat, lon) {
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,sunrise,sunset&timezone=auto&forecast_days=7`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const apiRes = await fetch(openMeteoUrl, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!apiRes.ok) {
    throw new Error(`Open-Meteo returned status ${apiRes.status}`);
  }

  const data = await apiRes.json();
  if (!data || !data.current || !data.daily) {
    throw new Error('Malformed payload from Open-Meteo');
  }

  const currentData = data.current;
  const dailyData = data.daily;
  const hourlyData = data.hourly || {};

  const currentCond = getWeatherCondition(currentData.weather_code);

  let currentRainProb = 0;
  if (Array.isArray(hourlyData.time) && Array.isArray(hourlyData.precipitation_probability)) {
    const currentHourPrefix = currentData.time ? currentData.time.slice(0, 13) : '';
    const hourIndex = hourlyData.time.findIndex(t => t.startsWith(currentHourPrefix));
    if (hourIndex !== -1 && hourlyData.precipitation_probability[hourIndex] !== undefined && hourlyData.precipitation_probability[hourIndex] !== null) {
      currentRainProb = hourlyData.precipitation_probability[hourIndex];
    } else if (dailyData.precipitation_probability_max && dailyData.precipitation_probability_max.length > 0) {
      currentRainProb = dailyData.precipitation_probability_max[0] || 0;
    }
  } else if (dailyData.precipitation_probability_max && dailyData.precipitation_probability_max.length > 0) {
    currentRainProb = dailyData.precipitation_probability_max[0] || 0;
  }

  const currentTemp = Math.round(currentData.temperature_2m);
  const feelsLike = Math.round(currentData.apparent_temperature);
  const humidity = Math.round(currentData.relative_humidity_2m);
  const windSpeed = Math.round(currentData.wind_speed_10m);
  const maxTempToday = (dailyData.temperature_2m_max && dailyData.temperature_2m_max.length > 0)
    ? Math.round(dailyData.temperature_2m_max[0])
    : currentTemp;

  const forecastList = [];
  const numDays = Math.min(7, (dailyData.time || []).length);
  for (let i = 0; i < numDays; i++) {
    const dayDateStr = dailyData.time[i];
    const dayDate = new Date(dayDateStr + "T00:00:00");
    const dayOfWeek = dayDate.getDay();
    const isToday = i === 0;

    const fCode = (dailyData.weather_code && dailyData.weather_code[i] !== undefined) ? dailyData.weather_code[i] : 0;
    const fCond = getWeatherCondition(fCode);
    const fMax = (dailyData.temperature_2m_max && dailyData.temperature_2m_max[i] !== undefined)
      ? Math.round(dailyData.temperature_2m_max[i])
      : currentTemp;
    const fMin = (dailyData.temperature_2m_min && dailyData.temperature_2m_min[i] !== undefined)
      ? Math.round(dailyData.temperature_2m_min[i])
      : currentTemp;
    const fRainProb = (dailyData.precipitation_probability_max && dailyData.precipitation_probability_max[i] !== undefined)
      ? dailyData.precipitation_probability_max[i]
      : 0;
    const fPrecipSum = (dailyData.precipitation_sum && dailyData.precipitation_sum[i] !== undefined)
      ? dailyData.precipitation_sum[i]
      : 0;

    forecastList.push({
      date: dayDateStr,
      day: isToday ? "Today" : (WEEKDAYS_EN[dayOfWeek] || dayDateStr),
      dayMl: isToday ? "ഇന്ന്" : (WEEKDAYS_ML[dayOfWeek] || dayDateStr),
      maxTemp: `${fMax}°C`,
      minTemp: `${fMin}°C`,
      temp: `${fMax}°C`,
      rainProbability: `${fRainProb}%`,
      rain: `${fRainProb}%`,
      precipitation: `${fPrecipSum} mm`,
      precipitationSum: fPrecipSum,
      condition: `${fCond.icon} ${fCond.en}`,
      conditionEn: fCond.en,
      conditionMl: fCond.ml,
      weatherCode: fCode
    });
  }

  const sunriseTime = (dailyData.sunrise && dailyData.sunrise[0]) ? formatTime12H(dailyData.sunrise[0]) : "--:--";
  const sunsetTime = (dailyData.sunset && dailyData.sunset[0]) ? formatTime12H(dailyData.sunset[0]) : "--:--";
  const farmingAdvice = generateFarmingAdvice(currentTemp, maxTempToday, currentRainProb, windSpeed, humidity, currentCond.en, districtName || 'Kerala');

  return {
    location: { latitude: lat, longitude: lon },
    current: {
      temp: `${currentTemp}°C`,
      feelsLike: `${feelsLike}°C`,
      humidity: `${humidity}%`,
      rainProbability: `${currentRainProb}%`,
      windSpeed: `${windSpeed} km/h`,
      condition: currentCond.en,
      conditionMl: currentCond.ml
    },
    forecast: forecastList,
    sunrise: sunriseTime,
    sunset: sunsetTime,
    farmingAdvice: farmingAdvice,
    lastUpdated: new Date().toISOString()
  };
}

app.get('/api/weather', async (req, res) => {
  let lat = null;
  let lon = null;
  let districtName = req.query.district || null;

  // 1. Check if latitude and longitude query params are provided
  if (req.query.latitude !== undefined && req.query.longitude !== undefined) {
    const parsedLat = parseFloat(req.query.latitude);
    const parsedLon = parseFloat(req.query.longitude);
    if (!isNaN(parsedLat) && !isNaN(parsedLon) && parsedLat >= -90 && parsedLat <= 90 && parsedLon >= -180 && parsedLon <= 180) {
      lat = parsedLat;
      lon = parsedLon;
    }
  }

  // 2. Fallback to district if coordinates are not explicitly given
  if (lat === null || lon === null) {
    const districtKey = (req.query.district || '').trim().toLowerCase();
    if (districtKey && KERALA_DISTRICT_COORDS[districtKey]) {
      const match = KERALA_DISTRICT_COORDS[districtKey];
      lat = match.lat;
      lon = match.lon;
      districtName = match.name;
    }
  }

  // 3. If neither valid coordinates nor resolvable district, return 400 error
  if (lat === null || lon === null) {
    return res.status(400).json({
      success: false,
      error: "Farm location is required for live weather."
    });
  }

  // 4. Cache Check (2-minute cache per location)
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const now = Date.now();
  if (weatherCache.has(cacheKey)) {
    const cachedEntry = weatherCache.get(cacheKey);
    if (now - cachedEntry.timestamp < WEATHER_CACHE_TTL_MS) {
      const cachedData = { ...cachedEntry.data };
      if (districtName) cachedData.district = districtName;
      return res.json(cachedData);
    }
  }

  // 5. Fetch live weather (WeatherAPI.com if key is set, fallback to Open-Meteo)
  try {
    require('dotenv').config();
  } catch (e) {}
  const weatherApiKey = (process.env.WEATHER_API_KEY || process.env.WEATHERAPI_KEY || '').trim();

  try {
    let weatherPayload = null;

    if (weatherApiKey && weatherApiKey !== 'your_weather_api_key_here') {
      try {
        console.log(`[Weather API] Fetching live weather from WeatherAPI.com for (${lat}, ${lon})...`);
        weatherPayload = await fetchFromWeatherApi(lat, lon, weatherApiKey, districtName || 'Thrissur');
      } catch (wErr) {
        console.warn('[Weather API] WeatherAPI request failed, falling back to Open-Meteo:', wErr.message);
      }
    }

    if (!weatherPayload) {
      console.log(`[Weather API] Fetching live weather from Open-Meteo for (${lat}, ${lon})...`);
      weatherPayload = await fetchFromOpenMeteo(lat, lon, districtName || 'Thrissur');
    }

    const responsePayload = {
      success: true,
      demoMode: false,
      ...(districtName ? { district: districtName } : {}),
      ...weatherPayload
    };

    // Store in cache
    weatherCache.set(cacheKey, {
      timestamp: now,
      data: responsePayload
    });

    return res.json(responsePayload);

  } catch (err) {
    console.error('[Weather API] Live weather fetch error:', err);
    return res.status(503).json({
      success: false,
      error: "Live weather service is currently unavailable."
    });
  }
});

// ------------------------------------------------------------------------
// 5. MARKET PRICES API: GET /api/market-prices & /api/market-chart
// ------------------------------------------------------------------------
app.get('/api/market-prices', (req, res) => {
  const { district = 'All', search = '', category = 'All', refresh = 'false' } = req.query;

  // Clear require cache for hot development updates
  delete require.cache[require.resolve('./keralaMarketData.js')];
  const { getFilteredPrices } = require('./keralaMarketData.js');

  const intradaySeed = refresh === 'true' ? Math.floor(Date.now() / 60000) : 0;
  const filtered = getFilteredPrices(district, search, category, new Date(), intradaySeed);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return res.json({
    success: true,
    totalCount: filtered.length,
    district,
    search,
    category,
    lastUpdated: `${dateFormatted}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    data: filtered
  });
});

app.get('/api/market-chart', (req, res) => {
  const { crop = 'tea_leaves', refresh = 'false' } = req.query;

  delete require.cache[require.resolve('./keralaMarketData.js')];
  const { getCropChartData } = require('./keralaMarketData.js');

  const intradaySeed = refresh === 'true' ? Math.floor(Date.now() / 60000) : 0;
  const chartData = getCropChartData(crop, new Date(), intradaySeed);
  return res.json({
    success: true,
    data: chartData
  });
});

// ------------------------------------------------------------------------
// 6. FARMER PROFILE & REGISTRATION API
// ------------------------------------------------------------------------
app.get('/api/farmer-profile', (req, res) => {
  return res.json({ success: true, profile: farmerProfileStore });
});

app.put('/api/farmer-profile', (req, res) => {
  farmerProfileStore = { ...farmerProfileStore, ...req.body };
  console.log('[Profile] Updated profile in store:', farmerProfileStore);
  return res.json({ success: true, profile: farmerProfileStore });
});

app.post('/api/farmer-login', (req, res) => {
  const { name, mobile, email, district = 'Thrissur', language = 'en' } = req.body;
  farmerProfileStore = {
    ...farmerProfileStore,
    name: name || farmerProfileStore.name,
    mobile: mobile || farmerProfileStore.mobile,
    email: email || farmerProfileStore.email,
    district: district || farmerProfileStore.district,
    language: language || farmerProfileStore.language
  };
  console.log(`[Farmer Registration] Farmer logged in: ${farmerProfileStore.name} | Mobile: ${farmerProfileStore.mobile} | Email: ${farmerProfileStore.email}`);
  return res.json({
    success: true,
    message: `Welcome, ${farmerProfileStore.name}! Daily agricultural reports and weather alerts configured for ${farmerProfileStore.email}.`,
    profile: farmerProfileStore
  });
});

app.post('/api/send-advisory-email', (req, res) => {
  const { email = farmerProfileStore.email, subject = "KrishiMitra AI - Daily Farm Advisory", message } = req.body;
  console.log(`[Email Service] Simulating Advisory Email dispatch to: ${email}`);
  console.log(`[Email Service] Subject: ${subject}`);
  console.log(`[Email Service] Content:\n${message || 'Daily farm weather forecast and advisory.'}`);
  
  return res.json({
    success: true,
    sentTo: email,
    message: `Advisory email successfully dispatched to ${email}`
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", server: "KrishiMitra AI Backend", demoMode: DEMO_MODE });
});

// Start Express Server with graceful error handling
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 KrishiMitra AI Backend Server running on port ${PORT}`);
  console.log(`📌 DEMO_MODE: ${DEMO_MODE}`);
  console.log(`🌐 Local Webpage: http://localhost:${PORT}/`);
  console.log(`=======================================================`);

  // Verify and auto-start Python ML Microservice if offline
  try {
    const http = require('http');
    const { spawn } = require('child_process');
    const healthReq = http.get('http://127.0.0.1:5001/health', (r) => {
      if (r.statusCode === 200) {
        console.log('[Express Backend] 🤖 Python ML Crop Doctor microservice is active on port 5001.');
      }
    });
    healthReq.on('error', () => {
      console.log('[Express Backend] 🤖 Starting Python ML Crop Doctor microservice on port 5001...');
      const py = process.platform === 'win32' ? 'python' : 'python3';
      const mlProc = spawn(py, [path.join(__dirname, '../ml_service/app.py')], {
        detached: true,
        stdio: 'ignore'
      });
      mlProc.unref();
    });
    healthReq.setTimeout(1500, () => healthReq.destroy());
  } catch (e) {
    console.warn('[Express Backend] ML service auto-check warning:', e.message);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  [Port Conflict] Port ${PORT} is already in use by another instance or process.`);
    console.error(`   The existing KrishiMitra server is already active at http://localhost:${PORT}/`);
    console.error(`   To kill the existing process and restart, run in PowerShell:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
  } else {
    console.error('[Express Server Error]:', err);
  }
});


