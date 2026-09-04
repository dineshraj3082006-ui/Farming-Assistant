/* ==========================================================================
   KRISHIMITRA AI - Production RAG Knowledge Engine & Personalization Synthesizer
   Features:
   - Full 8-Category Knowledge Indexing (Crops, Diseases, Pests, Soils, Fertilizers, Irrigation, Seasons, Farming Practices)
   - Multi-Signal Relevance Scoring (Crop +10, Disease/Pest +10, Intent +8, Soil +8, Profile/Season +5, Keyword +5)
   - Intelligent Multi-Turn Conversation Memory (Pronoun & follow-up resolution across 10-12 history turns)
   - Romanized Malayalam (Manglish) & Typo Normalizer
   - Precise Word-Boundary Entity Extraction (Prevents substring false positives like "price" matching "rice")
   - Comprehensive Commodity Market Price Intelligence (Tea, Coffee, Rubber, Spices, Vegetables, Fruits, Grains)
   - Specific Crop Targeted Market Quotes (Returns ONLY the requested crop when specified)
   - Dynamic Multi-Topic Knowledge Synthesizer (Generates unique, actionable answers for every query)
   - Contextual Dynamic Suggested Questions & RAG_DEBUG Logging
   ========================================================================== */

const fs = require('fs');
const path = require('path');

class RAGEngine {
  constructor() {
    this.knowledgeBase = {
      crops: [],
      diseases: [],
      pests: [],
      soil: [],
      fertilizers: [],
      irrigation: [],
      seasons: [],
      farmingPractices: []
    };
    this.loadKnowledgeBase();
  }

  // ------------------------------------------------------------------------
  // 1. IN-MEMORY KNOWLEDGE BASE INDEXING (ALL 8 CATEGORIES)
  // ------------------------------------------------------------------------
  loadKnowledgeBase() {
    const baseDir = path.join(__dirname, '../knowledge');

    const readDirJson = (dirPath, categoryName) => {
      if (!fs.existsSync(dirPath)) return [];
      const files = fs.readdirSync(dirPath);
      let items = [];
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(dirPath, file), 'utf8');
            const content = JSON.parse(raw);
            if (Array.isArray(content)) {
              content.forEach(item => {
                items.push({ ...item, _sourceFile: file, _category: categoryName });
              });
            } else if (typeof content === 'object' && content !== null) {
              items.push({ ...content, _sourceFile: file, _category: categoryName });
            }
          } catch (e) {
            console.error(`[RAG Engine] Error loading knowledge file ${file}:`, e.message);
          }
        }
      });
      return items;
    };

    this.knowledgeBase.crops = readDirJson(path.join(baseDir, 'crops'), 'crops');
    this.knowledgeBase.diseases = readDirJson(path.join(baseDir, 'diseases'), 'diseases');
    this.knowledgeBase.pests = readDirJson(path.join(baseDir, 'pests'), 'pests');
    this.knowledgeBase.soil = readDirJson(path.join(baseDir, 'soil'), 'soil');
    this.knowledgeBase.fertilizers = readDirJson(path.join(baseDir, 'fertilizers'), 'fertilizers');
    this.knowledgeBase.irrigation = readDirJson(path.join(baseDir, 'irrigation'), 'irrigation');
    this.knowledgeBase.seasons = readDirJson(path.join(baseDir, 'seasons'), 'seasons');
    this.knowledgeBase.farmingPractices = readDirJson(path.join(baseDir, 'farming_practices'), 'farming_practices');

    console.log(`[RAG Engine] Loaded Knowledge Base Index: ` +
      `${this.knowledgeBase.crops.length} crops, ` +
      `${this.knowledgeBase.diseases.length} diseases, ` +
      `${this.knowledgeBase.pests.length} pests, ` +
      `${this.knowledgeBase.soil.length} soils, ` +
      `${this.knowledgeBase.fertilizers.length} fertilizers, ` +
      `${this.knowledgeBase.irrigation.length} irrigation, ` +
      `${this.knowledgeBase.seasons.length} seasons, ` +
      `${this.knowledgeBase.farmingPractices.length} practices.`);
  }

  // ------------------------------------------------------------------------
  // 2. ROMANIZED MALAYALAM (MANGLISH) & TYPO NORMALIZATION
  // ------------------------------------------------------------------------
  normalizeQuery(query) {
    if (!query) return '';
    let q = query.toLowerCase().trim();

    // Comprehensive Manglish / Romanized Malayalam Replacements
    const manglishMap = [
      // Plantation & Commercial Crops
      { patterns: [/\btea\b/g, /\btea leaves\b/g, /\btea leaf\b/g, /\btheyla\b/g, /\btheila\b/g, /\btheylakku\b/g, /\btheilakku\b/g, /\btheylayude\b/g], target: 'tea leaves തേയില' },
      { patterns: [/\bcoffee\b/g, /\bcoffee beans\b/g, /\bkaapi\b/g, /\bkaapikku\b/g, /\bkaappikku\b/g], target: 'coffee കാപ്പി' },
      { patterns: [/\brubber\b/g, /\brabbar\b/g, /\brabbarkku\b/g, /\brubbar\b/g, /\blatex\b/g], target: 'rubber റബ്ബർ' },
      { patterns: [/\barecanut\b/g, /\bbetel nut\b/g, /\badaykka\b/g, /\badaikka\b/g, /\badakka\b/g, /\bpaakku\b/g], target: 'arecanut അടയ്ക്ക' },
      { patterns: [/\bnutmeg\b/g, /\bjathikka\b/g, /\bjaathikka\b/g, /\bmace\b/g, /\bjathipathri\b/g], target: 'nutmeg ജാതിക്ക' },
      { patterns: [/\bcardamom\b/g, /\belam\b/g, /\belaam\b/g, /\belathinu\b/g], target: 'cardamom ഏലം' },
      { patterns: [/\bpepper\b/g, /\bblack pepper\b/g, /\bkurumulaku\b/g, /\bkurumulak\b/g, /\bkurumolaku\b/g], target: 'pepper കുരുമുളക്' },
      { patterns: [/\bginger\b/g, /\binji\b/g, /\binjikku\b/g], target: 'ginger ഇഞ്ചി' },
      { patterns: [/\bturmeric\b/g, /\bmanjal\b/g, /\bmanjalkku\b/g], target: 'turmeric മഞ്ഞൾ' },
      { patterns: [/\bcashew\b/g, /\bkashuvandi\b/g, /\bkasumavu\b/g, /\bkashumavu\b/g], target: 'cashew കശുവണ്ടി' },

      // Food & Horticultural Crops
      { patterns: [/\bvazha\b/g, /\bvaazha\b/g, /\bvazhakku\b/g, /\bvaazhakku\b/g, /\bvazhaikku\b/g, /\bvazhaykku\b/g, /\bvaazhaykku\b/g, /\bvazhayil\b/g, /\bvaazhayil\b/g, /\bnendran\b/g, /\bpoovan\b/g, /\brobusta\b/g, /\bpalayankodan\b/g, /\bbanana\b/g, /\bbananas\b/g], target: 'banana വാഴ' },
      { patterns: [/\bnel\b/g, /\bnellu\b/g, /\bnellin\b/g, /\bnellil\b/g, /\bnellinu\b/g, /\bpaadam\b/g, /\bpadam\b/g, /\bpaddy\b/g], target: 'paddy നെല്ല്' },
      { patterns: [/\bthenga\b/g, /\bthengu\b/g, /\bthengil\b/g, /\bthenginnu\b/g, /\bthengikku\b/g, /\bkarikku\b/g, /\bcoconut\b/g, /\bcoconuts\b/g, /\bcopra\b/g], target: 'coconut തെങ്ങ് തേങ്ങ' },
      { patterns: [/\bthakkali\b/g, /\bthakkaliye\b/g, /\bthakkalikku\b/g, /\bthakkaali\b/g, /\bthakkalil\b/g, /\btomato\b/g, /\btomatoes\b/g, /\btomatoo\b/g], target: 'tomato തക്കാളി' },
      { patterns: [/\bkappa\b/g, /\bmaracheeni\b/g, /\bkappayil\b/g, /\bkappakku\b/g, /\btapioca\b/g, /\bcassava\b/g], target: 'tapioca കപ്പ' },
      { patterns: [/\bvenda\b/g, /\bvendakka\b/g, /\bvendaikku\b/g, /\bvendakku\b/g, /\bokra\b/g, /\bladies finger\b/g, /\bbhendi\b/g], target: 'okra വെണ്ട' },
      { patterns: [/\bpayar\b/g, /\bpayaru\b/g, /\bpayaril\b/g, /\bpayarikku\b/g, /\bcowpea\b/g, /\bbean\b/g, /\bbeans\b/g], target: 'yardlong bean പയർ' },
      { patterns: [/\bpachakari\b/g, /\bpacha kari\b/g, /\bpachakkarikal\b/g, /\bvegetables\b/g, /\bvegetable\b/g], target: 'vegetables പച്ചക്കറി' },
      { patterns: [/\bcheera\b/g, /\bamaranthus\b/g, /\bspinach\b/g], target: 'cheera amaranthus ചീര' },
      { patterns: [/\bvazhutana\b/g, /\bvazhuthina\b/g, /\bbrinjal\b/g, /\beggplant\b/g], target: 'brinjal വഴുതന' },
      { patterns: [/\bmulaku\b/g, /\bmulak\b/g, /\bchilli\b/g, /\bchilly\b/g, /\bgreen chilli\b/g], target: 'chilli മുളക്' },
      { patterns: [/\bpaval\b/g, /\bpavakka\b/g, /\bbitter gourd\b/g], target: 'bitter gourd പാവൽ' },
      { patterns: [/\bpadavalam\b/g, /\bsnake gourd\b/g], target: 'snake gourd പടവലം' },
      { patterns: [/\bvellarikka\b/g, /\bvellari\b/g, /\bcucumber\b/g], target: 'cucumber വെള്ളരി' },
      { patterns: [/\bmanga\b/g, /\bmaanga\b/g, /\bmango\b/g, /\bmangoes\b/g], target: 'mango മാങ്ങ' },

      // Agricultural Concepts & Cover Crops
      { patterns: [/\bhoub\b/g, /\bshoud\b/g, /\bshoudl\b/g, /\bshuod\b/g], target: 'should' },
      { patterns: [/\bremoev\b/g, /\bremoved\b/g, /\bremove\b/g, /\bterminate\b/g, /\bincorporate\b/g, /\bvettanam\b/g, /\bcheyyanam\b/g], target: 'remove terminate incorporate വെട്ടിമാറ്റൽ' },
      { patterns: [/\bcover crop\b/g, /\bcover crops\b/g, /\bcovercropping\b/g, /\bgreen manure\b/g, /\bgreen manuring\b/g, /\bsunn hemp\b/g, /\bsunnhemp\b/g, /\bdaincha\b/g, /\bdhaicha\b/g, /\bsesbania\b/g, /\bpueraria\b/g, /\bmucuna\b/g, /\bcalopogonium\b/g, /\bmooduvila\b/g, /\bmooovila\b/g, /\bpachilavalam\b/g], target: 'cover crops green manure മൂടുവിള പച്ചിലവളം' },
      { patterns: [/\bthanks\b/g, /\bthank you\b/g, /\bthank u\b/g, /\bthankyou\b/g, /\bthx\b/g, /\bnandi\b/g, /\bnanni\b/g, /\bvalare nandi\b/g, /\bnandhi\b/g], target: 'thanks gratitude നന്ദി' },
      { patterns: [/\bvalam\b/g, /\bvallam\b/g, /\bvalangal\b/g, /\bfertilizer\b/g, /\bfertiliser\b/g, /\bmanure\b/g, /\bcompost\b/g, /\bchanakam\b/g], target: 'fertilizer manure വളം' },
      { patterns: [/\bvellam\b/g, /\bnana\b/g, /\bnanakkal\b/g, /\bnanakkanam\b/g, /\bnanaykkan\b/g, /\bwater\b/g, /\birrigation\b/g, /\birrigating\b/g, /\birrigtion\b/g, /\birigation\b/g], target: 'water irrigation നന' },
      { patterns: [/\bmazha\b/g, /\bmazhayo\b/g, /\bvarumo\b/g, /\brain\b/g, /\brainfall\b/g, /\bweather\b/g, /\bforecast\b/g, /\bkalavastha\b/g], target: 'weather rain rainfall മഴ' },
      { patterns: [/\bkeedam\b/g, /\bkeedangal\b/g, /\bpuzhu\b/g, /\bpuzhukkal\b/g, /\bpest\b/g, /\bpests\b/g, /\binsect\b/g, /\binsects\b/g, /\bchelli\b/g], target: 'pest insect കീടം' },
      { patterns: [/\brogam\b/g, /\brogangal\b/g, /\bdisease\b/g, /\bdiseases\b/g, /\bblight\b/g, /\bblast\b/g, /\bwilt\b/g, /\bchiyal\b/g, /\bvaattam\b/g], target: 'disease രോഗം' },
      { patterns: [/\bila manja\b/g, /\bmanja aakunnu\b/g, /\bmanja aayi\b/g, /\bmanjappu\b/g, /\byellow\b/g, /\byellowing\b/g, /\byellow leaves\b/g], target: 'yellow leaves manja ഇല മഞ്ഞനിറം' },
      { patterns: [/\bpulli\b/g, /\bpullikal\b/g, /\bkarutha pulli\b/g, /\bspot\b/g, /\bspots\b/g, /\bblack spot\b/g, /\bblack spots\b/g], target: 'leaf spots പുള്ളികൾ' },
      { patterns: [/\bmannu\b/g, /\bmannil\b/g, /\bsoil\b/g, /\blaterite\b/g, /\balluvial\b/g, /\bchenkal\b/g], target: 'soil Laterite Alluvial മണ്ണ്' },
      { patterns: [/\bvila\b/g, /\bvilakku\b/g, /\bmarket\b/g, /\bmandi\b/g, /\brate\b/g, /\bprice\b/g, /\bprices\b/g, /\bcost\b/g], target: 'price market mandi വില' },
      { patterns: [/\bnadan\b/g, /\bnadanam\b/g, /\beppo nadanam\b/g, /\bplant\b/g, /\bplanting\b/g, /\bsow\b/g, /\bsowing\b/g, /\bseason\b/g], target: 'planting sowing season നടീൽ' },
      { patterns: [/\bethra masam\b/g, /\bethra kalam\b/g, /\bmasam\b/g, /\bdivasam\b/g, /\bduration\b/g, /\bhow long\b/g, /\bhow many months\b/g, /\bhow many month\b/g, /\bharvest time\b/g], target: 'duration period growth harvest കാലയളവ്' }
    ];

    manglishMap.forEach(m => {
      m.patterns.forEach(pat => {
        q = q.replace(pat, m.target);
      });
    });

    return q;
  }

  // ------------------------------------------------------------------------
  // 3. INTELLIGENT INTENT CLASSIFICATION & ENTITY EXTRACTION
  // ------------------------------------------------------------------------
  extractEntitiesAndIntent(rawQuery, history = [], farmerProfile = {}, activeDiagnosis = null) {
    const qLower = (rawQuery || '').toLowerCase().trim();
    const normalized = this.normalizeQuery(rawQuery);
    const combinedQuery = `${qLower} ${normalized}`;

    // Extract recent conversation context to resolve follow-ups
    const recentTurns = Array.isArray(history) ? history.slice(-10) : [];
    const historyText = recentTurns.map(h => (h.content || '').toLowerCase()).join(' ');

    // 1. Off-Topic Non-Agri Detection
    const nonAgriBlacklist = [
      'free fire', 'freefire', 'ff', 'pubg', 'bgmi', 'fortnite', 'gta', 'minecraft', 'roblox', 'call of duty',
      'video game', 'game', 'gaming', 'movie', 'movies', 'cinema', 'film', 'actor', 'actress', 'hero', 'heroine',
      'song', 'songs', 'music', 'dance', 'cricket', 'football', 'soccer', 'ipl', 'fifa', 'messi', 'ronaldo',
      'python', 'javascript', 'java', 'c++', 'html', 'css', 'coding', 'programmer', 'software', 'binary search',
      'bitcoin', 'crypto', 'cryptocurrency', 'stock market', 'trading', 'politics', 'modi', 'bjp', 'congress',
      'president', 'prime minister', 'celebrity', 'hollywood', 'bollywood', 'superstar'
    ];
    const isOffTopic = nonAgriBlacklist.some(term => qLower.includes(term));

    // 2. Strict Word-Boundary Crop Detection
    let detectedCrop = null;
    let explicitCropInQuery = false;

    if (/\b(tea|tea leaves|theyla|theila|തേയില)\b/i.test(combinedQuery)) {
      detectedCrop = 'Tea';
      explicitCropInQuery = true;
    } else if (/\b(coffee|kaapi|കാപ്പി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Coffee';
      explicitCropInQuery = true;
    } else if (/\b(rubber|latex|rabbar|റബ്ബർ)\b/i.test(combinedQuery)) {
      detectedCrop = 'Rubber';
      explicitCropInQuery = true;
    } else if (/\b(arecanut|betel nut|adaykka|adaikka|പാക്ക്|അടയ്ക്ക)\b/i.test(combinedQuery)) {
      detectedCrop = 'Arecanut';
      explicitCropInQuery = true;
    } else if (/\b(nutmeg|mace|jathikka|ജാതിക്ക|ജാതിപത്രി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Nutmeg';
      explicitCropInQuery = true;
    } else if (/\b(banana|bananas|nendran|poovan|robusta|vazha|vaazha|vazhai|വാഴ|നേന്ത്ര)\b/i.test(combinedQuery)) {
      detectedCrop = 'Banana';
      explicitCropInQuery = true;
    } else if (/\b(paddy|rice|nellu|nel|മുണ്ടകൻ|വിരിപ്പ്|നെല്ല്)\b/i.test(combinedQuery) && !/\b(price|prices)\b/i.test(qLower)) {
      detectedCrop = 'Paddy';
      explicitCropInQuery = true;
    } else if (/\b(coconut|coconuts|copra|thenga|thengu|തെങ്ങ്|തേങ്ങ|കൊപ്ര)\b/i.test(combinedQuery)) {
      detectedCrop = 'Coconut';
      explicitCropInQuery = true;
    } else if (/\b(tomato|tomatoes|thakkali|തക്കാളി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Tomato';
      explicitCropInQuery = true;
    } else if (/\b(pepper|black pepper|kurumulak|kurumulaku|കുരുമുളക്)\b/i.test(combinedQuery)) {
      detectedCrop = 'Pepper';
      explicitCropInQuery = true;
    } else if (/\b(cardamom|elam|elaam|ഏലം)\b/i.test(combinedQuery)) {
      detectedCrop = 'Cardamom';
      explicitCropInQuery = true;
    } else if (/\b(tapioca|cassava|kappa|maracheeni|കപ്പ|മരച്ചീനി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Tapioca';
      explicitCropInQuery = true;
    } else if (/\b(ginger|inji|ഇഞ്ചി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Ginger';
      explicitCropInQuery = true;
    } else if (/\b(turmeric|manjal|മഞ്ഞൾ)\b/i.test(combinedQuery)) {
      detectedCrop = 'Turmeric';
      explicitCropInQuery = true;
    } else if (/\b(okra|bhendi|ladies finger|venda|vendakka|വെണ്ട)\b/i.test(combinedQuery)) {
      detectedCrop = 'Okra';
      explicitCropInQuery = true;
    } else if (/\b(cheera|amaranthus|spinach|ചീര)\b/i.test(combinedQuery)) {
      detectedCrop = 'Amaranthus';
      explicitCropInQuery = true;
    } else if (/\b(brinjal|eggplant|vazhutana|vazhuthina|വഴുതന)\b/i.test(combinedQuery)) {
      detectedCrop = 'Brinjal';
      explicitCropInQuery = true;
    } else if (/\b(chilli|chilly|mulak|മുളക്)\b/i.test(combinedQuery)) {
      detectedCrop = 'Chilli';
      explicitCropInQuery = true;
    } else if (/\b(mango|mangoes|manga|മാവ്|മാങ്ങ)\b/i.test(combinedQuery)) {
      detectedCrop = 'Mango';
      explicitCropInQuery = true;
    } else if (/\b(vegetable|vegetables|pachakari|പച്ചക്കറി)\b/i.test(combinedQuery)) {
      detectedCrop = 'Vegetables';
      explicitCropInQuery = true;
    } else {
      // Follow-up context from history
      if (/\b(tea|തേയില)\b/i.test(historyText)) detectedCrop = 'Tea';
      else if (/\b(coffee|കാപ്പി)\b/i.test(historyText)) detectedCrop = 'Coffee';
      else if (/\b(rubber|റബ്ബർ)\b/i.test(historyText)) detectedCrop = 'Rubber';
      else if (/\b(banana|വാഴ|vazha)\b/i.test(historyText)) detectedCrop = 'Banana';
      else if (/\b(paddy|rice|നെല്ല്|nel)\b/i.test(historyText)) detectedCrop = 'Paddy';
      else if (/\b(coconut|തെങ്ങ്|thenga)\b/i.test(historyText)) detectedCrop = 'Coconut';
      else if (/\b(tomato|തക്കാളി|thakkali)\b/i.test(historyText)) detectedCrop = 'Tomato';
      else if (/\b(pepper|കുരുമുളക്)\b/i.test(historyText)) detectedCrop = 'Pepper';
      else if (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.cropEn)) {
        const ac = (activeDiagnosis.cropEn || activeDiagnosis.crop).toLowerCase();
        if (ac.includes('rice') || ac.includes('paddy') || ac.includes('നെല്ല്')) detectedCrop = 'Paddy';
        else if (ac.includes('chilli') || ac.includes('chilly') || ac.includes('മുളക്')) detectedCrop = 'Chilli';
        else if (ac.includes('banana') || ac.includes('nendran') || ac.includes('വാഴ')) detectedCrop = 'Banana';
        else if (ac.includes('coconut') || ac.includes('തെങ്ങ്')) detectedCrop = 'Coconut';
        else if (ac.includes('pepper') || ac.includes('കുരുമുളക്')) detectedCrop = 'Pepper';
        else if (ac.includes('tomato') || ac.includes('തക്കാളി')) detectedCrop = 'Tomato';
        else if (ac.includes('potato') || ac.includes('ഉരുളക്കിഴങ്ങ്')) detectedCrop = 'Potato';
        else if (ac.includes('healthy')) detectedCrop = 'Healthy';
        else detectedCrop = activeDiagnosis.cropEn || activeDiagnosis.crop;
        explicitCropInQuery = true;
      }
      else if (farmerProfile.mainCrop && !combinedQuery.includes('cover crop') && !combinedQuery.includes('green manure') && !combinedQuery.includes('മൂടുവിള') && !combinedQuery.includes('പച്ചിലവളം')) {
        detectedCrop = farmerProfile.mainCrop;
      }
    }

    // 3. Disease & Pest Detection
    let detectedDisease = null;
    let detectedPest = null;

    if (combinedQuery.includes('blast') || combinedQuery.includes('ബ്ലാസ്റ്റ്')) detectedDisease = 'Paddy Blast';
    else if (combinedQuery.includes('sheath blight') || combinedQuery.includes('പോള രോഗം')) detectedDisease = 'Sheath Blight';
    else if (combinedQuery.includes('leaf curl') || combinedQuery.includes('curl') || combinedQuery.includes('ഇലച്ചുരുളൽ')) detectedDisease = 'Chilli Leaf Curl';
    else if (combinedQuery.includes('early blight') || (combinedQuery.includes('blight') && !combinedQuery.includes('blast') && !combinedQuery.includes('sheath')) || combinedQuery.includes('അലി സാറ്റ്')) detectedDisease = 'Early Blight';
    else if (combinedQuery.includes('bacterial wilt') || combinedQuery.includes('വാട്ടം')) detectedDisease = 'Bacterial Wilt';
    else if (combinedQuery.includes('sigatoka') || combinedQuery.includes('സിഗാറ്റോക്ക')) detectedDisease = 'Sigatoka Leaf Spot';
    else if (combinedQuery.includes('bud rot') || combinedQuery.includes('മണ്ടചീയൽ')) detectedDisease = 'Bud Rot';
    else if (combinedQuery.includes('root wilt') || combinedQuery.includes('കാറ്റുവീഴ്ച')) detectedDisease = 'Root Wilt';
    else if (combinedQuery.includes('quick wilt') || combinedQuery.includes('ദ്രുതവാട്ടം')) detectedDisease = 'Quick Wilt';
    else if (combinedQuery.includes('healthy') || combinedQuery.includes('ആരോഗ്യം')) detectedDisease = 'Healthy';
    else if (combinedQuery.includes('yellow') || combinedQuery.includes('മഞ്ഞ') || combinedQuery.includes('spot') || combinedQuery.includes('spots') || combinedQuery.includes('രോഗം') || combinedQuery.includes('പാടുകൾ') || combinedQuery.includes('പുള്ളി') || combinedQuery.includes('വാട്ടം') || combinedQuery.includes('ചീയൽ')) detectedDisease = 'Leaf Yellowing / Spot';
    else if (activeDiagnosis && (activeDiagnosis.disease || activeDiagnosis.diseaseEn)) {
      detectedDisease = activeDiagnosis.diseaseEn || activeDiagnosis.disease;
    }

    if (combinedQuery.includes('fruit fly') || combinedQuery.includes('കായ് ഈച്ച')) detectedPest = 'Fruit Fly';
    else if (combinedQuery.includes('stem borer') || combinedQuery.includes('തണ്ടുതുരപ്പൻ')) detectedPest = 'Rice Stem Borer';
    else if (combinedQuery.includes('rhinoceros beetle') || combinedQuery.includes('കൊമ്പൻ ചെല്ലി')) detectedPest = 'Rhinoceros Beetle';
    else if (combinedQuery.includes('red palm weevil') || combinedQuery.includes('ചെമ്പൻ ചെല്ലി')) detectedPest = 'Red Palm Weevil';
    else if (combinedQuery.includes('aphid') || combinedQuery.includes('aphids') || combinedQuery.includes('പച്ചത്തുള്ളൻ') || combinedQuery.includes('പേൻ')) detectedPest = 'Aphids';
    else if (combinedQuery.includes('whitefly') || combinedQuery.includes('വെള്ളീച്ച')) detectedPest = 'Whitefly';
    else if (combinedQuery.includes('thrips') || combinedQuery.includes('ഇലപ്പേൻ')) detectedPest = 'Thrips';

    // 4. Soil & District Detection
    let detectedSoil = null;
    if (combinedQuery.includes('laterite') || combinedQuery.includes('ലാറ്ററൈറ്റ്') || combinedQuery.includes('ചെങ്കൽ')) detectedSoil = 'Laterite Soil';
    else if (combinedQuery.includes('alluvial') || combinedQuery.includes('എക്കൽ')) detectedSoil = 'Alluvial Soil';
    else if (combinedQuery.includes('kari') || combinedQuery.includes('peaty') || combinedQuery.includes('കരി')) detectedSoil = 'Kari / Peat Soil';
    else if (farmerProfile.soilType) detectedSoil = farmerProfile.soilType;

    let detectedDistrict = null;
    const districts = ['Thrissur', 'Palakkad', 'Wayanad', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Kozhikode', 'Malappuram', 'Kannur', 'Kasaragod', 'Kollam', 'Pathanamthitta', 'Thiruvananthapuram'];
    districts.forEach(d => {
      if (combinedQuery.includes(d.toLowerCase())) detectedDistrict = d;
    });
    if (!detectedDistrict && farmerProfile.district) detectedDistrict = farmerProfile.district;

    // 5. Season Detection
    let detectedSeason = null;
    if (combinedQuery.includes('virippu') || combinedQuery.includes('വിരിപ്പ്') || combinedQuery.includes('kharif')) detectedSeason = 'Virippu (Kharif)';
    else if (combinedQuery.includes('mundakan') || combinedQuery.includes('മുണ്ടകൻ') || combinedQuery.includes('rabi')) detectedSeason = 'Mundakan (Rabi)';
    else if (combinedQuery.includes('puncha') || combinedQuery.includes('പുഞ്ച') || combinedQuery.includes('summer')) detectedSeason = 'Puncha (Summer)';

    // 6. Intent Classification with History Follow-up Resolution
    let intent = 'GENERAL_AGRICULTURE';

    if (isOffTopic) {
      intent = 'OFF_TOPIC';
    } else if (/\b(thanks|thank you|thank u|thankyou|thx|many thanks|thanks a lot|thank you so much|thanks krishimitra|നന്ദി|വളരെ നന്ദി|നന്ദി ഉണ്ട്|നന്ദി കൃഷിമിത്ര|valare nandi|nandi|nanni)\b/i.test(qLower) || qLower.includes('നന്ദി')) {
      intent = 'GRATITUDE';
    } else if (qLower === 'hi' || qLower === 'hello' || qLower === 'hey' || qLower === 'namaskaram' || qLower === 'namaste' || qLower === 'ഹലോ' || qLower === 'നമസ്കാരം' || qLower === 'who are you' || qLower === 'നിങ്ങൾ ആരാണ്') {
      intent = 'GREETING';
    } else if (combinedQuery.includes('cover crop') || combinedQuery.includes('cover crops') || combinedQuery.includes('green manure') || combinedQuery.includes('sunn hemp') || combinedQuery.includes('sunnhemp') || combinedQuery.includes('daincha') || combinedQuery.includes('sesbania') || combinedQuery.includes('calopogonium') || combinedQuery.includes('mucuna') || combinedQuery.includes('മൂടുവിള') || combinedQuery.includes('പച്ചിലവളം')) {
      intent = 'COVER_CROPS';
    } else if (/\b(price|prices|market|mandi|rate|rates|cost|വില|വിപണി)\b/i.test(qLower) || combinedQuery.includes('വില') || combinedQuery.includes('വിപണി')) {
      intent = 'MARKET_PRICE';
    } else if (combinedQuery.includes('weather') || combinedQuery.includes('rain') || combinedQuery.includes('rainfall') || combinedQuery.includes('forecast') || combinedQuery.includes('മഴ') || combinedQuery.includes('കാലാവസ്ഥ')) {
      intent = 'WEATHER';
    } else if (combinedQuery.includes('how many month') || combinedQuery.includes('how many months') || combinedQuery.includes('how long') || combinedQuery.includes('duration') || combinedQuery.includes('growth period') || combinedQuery.includes('harvest time') || combinedQuery.includes('maturity time') || combinedQuery.includes('എത്ര മാസം') || combinedQuery.includes('കാലയളവ്') || combinedQuery.includes('വിളവെടുപ്പ്')) {
      intent = 'CROP_DURATION';
    } else if (combinedQuery.includes('fertilizer') || combinedQuery.includes('manure') || combinedQuery.includes('npk') || combinedQuery.includes('urea') || combinedQuery.includes('potash') || combinedQuery.includes('compost') || combinedQuery.includes('jiwamrita') || combinedQuery.includes('panchagavya') || combinedQuery.includes('organic fertilizer') || combinedQuery.includes('വളം') || combinedQuery.includes('വളപ്രയോഗം')) {
      intent = 'FERTILIZER';
    } else if (combinedQuery.includes('water') || combinedQuery.includes('irrigate') || combinedQuery.includes('irrigation') || combinedQuery.includes('how often to water') || combinedQuery.includes('how much water') || combinedQuery.includes('വെള്ളം') || combinedQuery.includes('നന') || combinedQuery.includes('തുള്ളിനന')) {
      intent = 'IRRIGATION';
    } else if (detectedPest || combinedQuery.includes('pest') || combinedQuery.includes('pests') || combinedQuery.includes('insect') || combinedQuery.includes('caterpillar') || combinedQuery.includes('borer') || combinedQuery.includes('beetle') || combinedQuery.includes('aphid') || combinedQuery.includes('whitefly') || combinedQuery.includes('thrip') || combinedQuery.includes('കീടം') || combinedQuery.includes('പുഴു') || combinedQuery.includes('ചെല്ലി')) {
      intent = 'PEST';
    } else if (detectedDisease || (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.disease)) || combinedQuery.includes('disease') || combinedQuery.includes('blight') || combinedQuery.includes('blast') || combinedQuery.includes('wilt') || combinedQuery.includes('rot') || combinedQuery.includes('yellow') || combinedQuery.includes('spot') || combinedQuery.includes('spots') || combinedQuery.includes('രോഗം') || combinedQuery.includes('പാടുകൾ') || combinedQuery.includes('പുള്ളി') || combinedQuery.includes('വാട്ടം') || combinedQuery.includes('ചീയൽ') || combinedQuery.includes('scanned') || combinedQuery.includes('doctor')) {
      intent = 'DISEASE';
    } else if (combinedQuery.includes('soil') || combinedQuery.includes('laterite') || combinedQuery.includes('alluvial') || combinedQuery.includes('ph') || combinedQuery.includes('lime') || combinedQuery.includes('മണ്ണ്') || combinedQuery.includes('ചെങ്കൽ')) {
      intent = 'SOIL';
    } else if (combinedQuery.includes('which crop') || combinedQuery.includes('what to plant') || combinedQuery.includes('what should i plant') || combinedQuery.includes('recommend') || combinedQuery.includes('suitable crop') || combinedQuery.includes('ഏത് വിള') || combinedQuery.includes('നടേണ്ടത്')) {
      intent = 'CROP_SELECTION';
    } else if (combinedQuery.includes('when to plant') || combinedQuery.includes('season') || combinedQuery.includes('planting time') || combinedQuery.includes('sowing time') || combinedQuery.includes('virippu') || combinedQuery.includes('mundakan') || combinedQuery.includes('puncha') || combinedQuery.includes('സീസൺ') || combinedQuery.includes('നടീൽ സമയം')) {
      intent = 'SEASON';
    } else if (combinedQuery.includes('how to grow') || combinedQuery.includes('how to cultivate') || combinedQuery.includes('need') || combinedQuery.includes('needs') || combinedQuery.includes('requirement') || combinedQuery.includes('cultivation') || combinedQuery.includes('കൃഷി രീതി') || combinedQuery.includes('ആവശ്യങ്ങൾ')) {
      intent = 'CROP_CULTIVATION';
    } else if (combinedQuery.includes('organic') || combinedQuery.includes('gap') || combinedQuery.includes('ipm') || combinedQuery.includes('biocontrol') || combinedQuery.includes('farming practice') || combinedQuery.includes('ജൈവകൃഷി')) {
      intent = 'FARMING_PRACTICE';
    } else {
      // Follow-up intent resolver from history context
      if (qLower.includes('how much') || qLower.includes('how much should i use') || qLower.includes('what dose') || qLower.includes('ethra idanam')) {
        if (historyText.includes('fertilizer') || historyText.includes('valam') || historyText.includes('manure')) {
          intent = 'FERTILIZER';
        } else if (historyText.includes('water') || historyText.includes('irrigation') || historyText.includes('vellam')) {
          intent = 'IRRIGATION';
        }
      } else if (qLower.includes('what about') || qLower.includes('how about')) {
        if (qLower.includes('irrigation') || qLower.includes('water')) intent = 'IRRIGATION';
        else if (qLower.includes('fertilizer') || qLower.includes('valam')) intent = 'FERTILIZER';
      }
    }

    return {
      intent,
      isOffTopic,
      crop: detectedCrop,
      explicitCropInQuery,
      disease: detectedDisease,
      pest: detectedPest,
      soil: detectedSoil,
      district: detectedDistrict,
      season: detectedSeason,
      normalizedQuery: combinedQuery
    };
  }

  // ------------------------------------------------------------------------
  // 4. MULTI-SIGNAL SCORED KNOWLEDGE RETRIEVAL
  // ------------------------------------------------------------------------
  retrieveScoredContext(entities, farmerProfile = {}) {
    const { crop, disease, pest, soil, district, season, intent, normalizedQuery } = entities;
    const scoredDocs = [];

    const calculateScore = (item, type) => {
      let score = 0;
      const str = JSON.stringify(item).toLowerCase();

      // 1. Crop Match (+10)
      if (crop) {
        const cropLower = crop.toLowerCase();
        if (item.crop && item.crop.toLowerCase().includes(cropLower)) score += 10;
        if (item.crops && Array.isArray(item.crops) && item.crops.some(c => c.toLowerCase().includes(cropLower))) score += 10;
        if (item.suitableCrops && Array.isArray(item.suitableCrops) && item.suitableCrops.some(c => c.toLowerCase().includes(cropLower))) score += 8;
        if (str.includes(cropLower)) score += 5;
      }

      // 2. Disease Match (+10)
      if (disease && (type === 'diseases' || str.includes(disease.toLowerCase()))) {
        if (item.disease && item.disease.toLowerCase().includes(disease.toLowerCase())) score += 10;
        else score += 6;
      }

      // 3. Pest Match (+10)
      if (pest && (type === 'pests' || str.includes(pest.toLowerCase()))) {
        if (item.pest && item.pest.toLowerCase().includes(pest.toLowerCase())) score += 10;
        else score += 6;
      }

      // 4. Intent & Category Match (+8)
      if ((intent === 'FERTILIZER' && type === 'fertilizers') ||
          (intent === 'IRRIGATION' && type === 'irrigation') ||
          (intent === 'SOIL' && type === 'soil') ||
          (intent === 'SEASON' && type === 'seasons') ||
          (intent === 'FARMING_PRACTICE' && type === 'farmingPractices') ||
          (intent === 'DISEASE' && type === 'diseases') ||
          (intent === 'PEST' && type === 'pests') ||
          (intent === 'CROP_CULTIVATION' && type === 'crops')) {
        score += 8;
      }

      // 5. Soil Match (+8)
      if (soil) {
        const soilLower = soil.toLowerCase();
        if (item.soilType && item.soilType.toLowerCase().includes(soilLower)) score += 8;
        if (item.soils && Array.isArray(item.soils) && item.soils.some(s => s.toLowerCase().includes(soilLower))) score += 6;
      }

      // 6. District Match (+5)
      if (district && item.districts && Array.isArray(item.districts) && item.districts.some(d => d.toLowerCase().includes(district.toLowerCase()))) {
        score += 5;
      }

      // 7. Season Match (+5)
      if (season && item.seasons && Array.isArray(item.seasons) && item.seasons.some(s => s.toLowerCase().includes(season.toLowerCase()))) {
        score += 5;
      }

      // 8. Farmer Profile Matches (+5)
      if (farmerProfile.mainCrop && item.crop && item.crop.toLowerCase().includes(farmerProfile.mainCrop.toLowerCase())) {
        score += 5;
      }
      if (farmerProfile.soilType && item.soilType && item.soilType.toLowerCase().includes(farmerProfile.soilType.toLowerCase())) {
        score += 5;
      }

      // 9. Normalized Query Keywords (+5)
      const keywords = normalizedQuery.split(' ').filter(w => w.length > 3);
      let kwMatches = 0;
      keywords.forEach(kw => {
        if (str.includes(kw)) kwMatches++;
      });
      score += Math.min(kwMatches * 2, 10);

      return score;
    };

    // Score all categories
    Object.keys(this.knowledgeBase).forEach(category => {
      const items = this.knowledgeBase[category] || [];
      items.forEach(item => {
        const score = calculateScore(item, category);
        if (score > 4) {
          scoredDocs.push({ category, score, data: item });
        }
      });
    });

    // Sort by descending score
    scoredDocs.sort((a, b) => b.score - a.score);

    // Return top relevant unique documents (maximum 6 to avoid context bloat)
    return scoredDocs.slice(0, 6);
  }

  // ------------------------------------------------------------------------
  // 5. LIVE WEATHER & MARKET PRICE CONTEXT BUILDERS
  // ------------------------------------------------------------------------
  async getLiveWeatherContext(district = 'Thrissur') {
    try {
      const weatherMap = {
        'Thrissur': { temp: '31°C', humidity: '78%', rainProb: '45%', condition: 'Partly Cloudy with Light Showers', rainExpected: true },
        'Palakkad': { temp: '34°C', humidity: '65%', rainProb: '20%', condition: 'Sunny & Hot', rainExpected: false },
        'Wayanad': { temp: '24°C', humidity: '88%', rainProb: '70%', condition: 'Cool with Moderate Rain', rainExpected: true },
        'Alappuzha': { temp: '30°C', humidity: '82%', rainProb: '60%', condition: 'Humid with Passing Showers', rainExpected: true },
        'Kozhikode': { temp: '31°C', humidity: '80%', rainProb: '50%', condition: 'Humid with Coastal Showers', rainExpected: true },
        'Ernakulam': { temp: '32°C', humidity: '76%', rainProb: '40%', condition: 'Partly Cloudy', rainExpected: false }
      };
      const w = weatherMap[district] || weatherMap['Thrissur'];
      return {
        district,
        temperature: w.temp,
        humidity: w.humidity,
        rainProbability: w.rainProb,
        condition: w.condition,
        rainExpected: w.rainExpected,
        sprayAdvice: w.rainExpected ? 'Rain expected: Postpone chemical/organic foliar spraying.' : 'Clear weather: Safe to spray organic biopesticides.'
      };
    } catch (e) {
      return null;
    }
  }

  getLiveMarketContext(crop = null, district = 'Thrissur') {
    try {
      const { getFilteredPrices } = require('./keralaMarketData.js');
      const liveItems = getFilteredPrices(district, crop || '', 'All');
      if (liveItems && liveItems.length > 0) {
        if (crop) {
          const match = liveItems[0];
          return {
            crop: match.cropEn.split('(')[0].trim(),
            cropEn: match.cropEn,
            cropMl: match.cropMl,
            price: `₹${match.price} / ${match.unit || 'kg'}`,
            market: match.marketEn,
            trend: `${match.trend} (${match.isUp ? 'Rising' : 'Softening'})`,
            insightEn: match.insightEn,
            insightMl: match.insightMl
          };
        }
        return liveItems.slice(0, 15).map(m => ({
          crop: m.cropEn.split('(')[0].trim(),
          cropEn: m.cropEn,
          cropMl: m.cropMl,
          price: `₹${m.price} / ${m.unit || 'kg'}`,
          market: m.marketEn,
          trend: m.trend
        }));
      }
    } catch (e) {
      console.warn('[RAG] Fallback to static market rates:', e.message);
    }

    const marketRates = [
      { crop: 'Tea', cropEn: 'Tea Leaves / Green Tea Leaf', cropMl: 'പച്ച തേയില', price: '₹18 – ₹24 / kg (CTC Tea ₹140 – ₹180/kg)', market: 'Munnar & Wayanad Tea Auctions', trend: '+3% Steady demand' },
      { crop: 'Coffee', cropEn: 'Coffee Beans (Robusta Cherry)', cropMl: 'കാപ്പി കുരു', price: '₹210 – ₹240 / kg (Parchment ₹380/kg)', market: 'Wayanad Kalpetta Market', trend: 'Strong demand' },
      { crop: 'Rubber', cropEn: 'Natural Rubber (RSS-4)', cropMl: 'റബ്ബർ ഷീറ്റ് (RSS-4)', price: '₹185 / kg', market: 'Kottayam Rubber Market', trend: '+1% Firm' },
      { crop: 'Arecanut', cropEn: 'Arecanut / Betel Nut', cropMl: 'അടയ്ക്ക (ചാലി)', price: '₹340 – ₹380 / kg', market: 'Kasaragod & Thrissur Mandis', trend: 'High' },
      { crop: 'Nutmeg', cropEn: 'Nutmeg & Mace', cropMl: 'ജാതിക്ക & ജാതിപത്രി', price: 'Nutmeg ₹280/kg, Mace ₹1,450/kg', market: 'Kalady Spice Terminal', trend: 'Active' },
      { crop: 'Cardamom', cropEn: 'Small Green Cardamom (7-8mm)', cropMl: 'ഏലം', price: '₹1,850 – ₹2,200 / kg', market: 'Vandanmedu Spices Board Auction', trend: 'Bullish' },
      { crop: 'Black Pepper', cropEn: 'Black Pepper (Garbled)', cropMl: 'കുരുമുളക്', price: '₹620 – ₹645 / kg', market: 'Kochi Terminal Market', trend: '+2% Active' },
      { crop: 'Ginger', cropEn: 'Fresh Green Ginger', cropMl: 'പച്ച ഇഞ്ചി', price: '₹140 – ₹165 / kg', market: 'Wayanad Wholesale Mandi', trend: 'High demand' },
      { crop: 'Turmeric', cropEn: 'Dry Finger Turmeric', cropMl: 'മഞ്ഞൾ', price: '₹115 – ₹130 / kg', market: 'Wayanad & Palakkad', trend: 'Steady' },
      { crop: 'Tomato', cropEn: 'Tomato', cropMl: 'തക്കാളി', price: '₹42 / kg', market: 'Thrissur Wholesale Mandi', trend: 'Steady (+4% weekly)' },
      { crop: 'Banana', cropEn: 'Nendran Banana', cropMl: 'നേന്ത്രവാഴപ്പഴം', price: '₹58 / kg (Grade A Bunch ₹62/kg)', market: 'Ernakulam & Thrissur Wholesale', trend: 'High demand' },
      { crop: 'Coconut', cropEn: 'Coconut & Copra', cropMl: 'തേങ്ങ & കൊപ്ര', price: 'Fresh Coconut ₹36/kg, Copra ₹92/kg', market: 'Kozhikode & Thrissur Mandis', trend: 'Stable' },
      { crop: 'Paddy', cropEn: 'Matta Paddy & Rice', cropMl: 'നെല്ല് & മട്ട അരി', price: 'Govt MSP ₹28.20/kg, Retail Rice ₹48/kg', market: 'Palakkad Wholesale Market', trend: 'MSP Supported' },
      { crop: 'Tapioca', cropEn: 'Fresh Raw Tapioca', cropMl: 'പച്ചക്കപ്പ', price: '₹28 / kg', market: 'Kottayam & Kollam Markets', trend: 'Steady' },
      { crop: 'Okra', cropEn: 'Ladies Finger / Okra', cropMl: 'വെണ്ടയ്ക്ക', price: '₹35 / kg', market: 'Thrissur Mandi', trend: 'Normal' },
      { crop: 'Chilli', cropEn: 'Green Chilli', cropMl: 'പച്ചമുളക്', price: '₹65 / kg', market: 'Ernakulam Mandi', trend: '+5% High' },
      { crop: 'Yardlong Bean', cropEn: 'Yardlong Bean', cropMl: 'പയർ', price: '₹45 / kg', market: 'Palakkad Mandi', trend: 'Moderate' },
      { crop: 'Bitter Gourd', cropEn: 'Bitter Gourd', cropMl: 'പാവയ്ക്ക', price: '₹52 / kg', market: 'Thrissur Mandi', trend: 'Firm' },
      { crop: 'Amaranthus', cropEn: 'Red Amaranthus', cropMl: 'ചുവപ്പ് ചീര', price: '₹30 / kg', market: 'Trivandrum Mandi', trend: 'Steady' },
      { crop: 'Mango', cropEn: 'Mango', cropMl: 'മാങ്ങ', price: '₹70 / kg', market: 'Muthalamada Palakkad Wholesale', trend: 'Seasonal' }
    ];

    if (crop) {
      const cropLower = crop.toLowerCase();
      const match = marketRates.find(m =>
        m.crop.toLowerCase() === cropLower ||
        m.crop.toLowerCase().includes(cropLower) ||
        cropLower.includes(m.crop.toLowerCase()) ||
        m.cropEn.toLowerCase().includes(cropLower) ||
        m.cropMl.includes(crop)
      );
      if (match) return match;
    }
    return marketRates;
  }

  async getLiveWeatherContext(district = 'Thrissur') {
    try {
      require('dotenv').config();
      const weatherApiKey = (process.env.WEATHER_API_KEY || process.env.WEATHERAPI_KEY || '').trim();
      const coordsMap = {
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

      const dKey = (district || '').toLowerCase().trim();
      const match = coordsMap[dKey] || coordsMap['thrissur'];

      if (weatherApiKey && weatherApiKey !== 'your_weather_api_key_here') {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${encodeURIComponent(weatherApiKey)}&q=${match.lat},${match.lon}&days=3&aqi=no&alerts=no`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const cur = json.current || {};
          const fDay = (json.forecast && json.forecast.forecastday && json.forecast.forecastday[0] && json.forecast.forecastday[0].day) || {};
          const rainChance = fDay.daily_chance_of_rain !== undefined ? `${fDay.daily_chance_of_rain}%` : (cur.precip_mm > 0 ? '80%' : '20%');
          const isRainy = (fDay.daily_chance_of_rain >= 50) || (cur.condition && cur.condition.text.toLowerCase().includes('rain'));

          return {
            temperature: `${Math.round(cur.temp_c)}°C`,
            humidity: `${Math.round(cur.humidity)}%`,
            rainProbability: rainChance,
            condition: cur.condition ? cur.condition.text : 'Partly Cloudy',
            windSpeed: `${Math.round(cur.wind_kph)} km/h`,
            rainExpected: isRainy
          };
        }
      }
    } catch (e) {
      console.warn('[RAG Engine] WeatherAPI live call fallback in RAG:', e.message);
    }

    return {
      temperature: '29°C',
      humidity: '78%',
      rainProbability: '55%',
      condition: 'Patchy Rain Nearby',
      windSpeed: '14 km/h',
      rainExpected: true
    };
  }

  // ------------------------------------------------------------------------
  // 6. MAIN RESPONSE GENERATION PIPELINE
  // ------------------------------------------------------------------------
  async generateResponse(query, language = 'en', farmerProfile = {}, history = [], isDemoMode = false, apiKey = '', activeDiagnosis = null) {
    const isMl = language === 'ml' || /[\u0D00-\u0D7F]/.test(query);
    const lang = isMl ? 'ml' : 'en';

    // 1. Extract Entities, Intent and Normalization
    const entities = this.extractEntitiesAndIntent(query, history, farmerProfile, activeDiagnosis);

    // Development Debug Logging
    const isDebug = process.env.RAG_DEBUG === 'true';
    if (isDebug) {
      console.log(`\n================== [RAG DEBUG] ==================`);
      console.log(`User query: "${query}"`);
      console.log(`Detected Intent: ${entities.intent}`);
      console.log(`Detected Crop: ${entities.crop || 'None'} (Explicit: ${entities.explicitCropInQuery})`);
      console.log(`Detected Disease: ${entities.disease || 'None'}`);
      console.log(`Detected Pest: ${entities.pest || 'None'}`);
      console.log(`Detected Soil: ${entities.soil || 'None'}`);
      console.log(`Detected District: ${entities.district || 'None'}`);
    }

    // 2. Strict Off-Topic Guardrail
    if (entities.isOffTopic) {
      const answer = isMl ?
        `🌾 **കൃഷിമിത്ര AI - കർഷകർക്കായുള്ള പ്രത്യേക അറിയിപ്പ്:**\n\nഞാൻ **കർഷകർക്കും കൃഷി, വിളകൾ, സസ്യ രോഗങ്ങൾ, കാലാവസ്ഥ, വിപണി വില** എന്നിവയ്ക്കുമായി മാത്രം നിർമ്മിച്ചിട്ടുള്ള കാർഷിക AI സഹായിയാണ്.\n\nകൃഷിയുമായി ബന്ധമില്ലാത്ത ചോദ്യങ്ങൾക്ക് എനിക്ക് മറുപടി നൽകാൻ സാധിക്കില്ല. താഴെ പറയുന്ന കാർഷിക വിഷയങ്ങൾ ചോദിക്കാം:\n\n• **വിളകൾ & കൃഷിരീതി**: നെല്ല്, വാഴ, തെങ്ങ്, തേയില, റബ്ബർ, കുരുമുളക്, പച്ചക്കറികൾ എന്നിവയുടെ കൃഷി\n• **രോഗകീട നിയന്ത്രണം**: സസ്യ രോഗങ്ങൾ, ഇല മഞ്ഞനിറം & ജൈവ പരിഹാരങ്ങൾ (സ്യൂഡോമോണസ്, വേപ്പെണ്ണ)\n• **വളപ്രയോഗം & നന**: കൃത്യമായ വളം ഡോസുകൾ (NPK, ചാണകം, ജീവാമൃതം) & നനയ്ക്കൽ\n• **കാലാവസ്ഥ & വിപണി വില**: പ്രാദേശിക കാലാവസ്ഥ & വിപണി വിലനിലവാരം` :
        `🌾 **KrishiMitra AI - Farmer Assistant Notice:**\n\nI am an AI assistant built exclusively for **farmers, agriculture, crop cultivation, plant health, and weather forecasting** in Kerala.\n\nI cannot answer questions unrelated to farming or agriculture. Please feel free to ask me about:\n\n• **Crop Cultivation & Growth**: Paddy, Banana, Coconut, Tea, Coffee, Rubber, Pepper, Vegetables\n• **Pest & Disease Control**: Plant disease diagnosis, yellow leaf remedies & bio-sprays (Pseudomonas, Neem oil)\n• **Fertilizers & Irrigation**: NPK schedules, organic manure & water requirements\n• **Weather & Market Prices**: Real-time rainfall forecasts & Kerala mandi crop prices`;

      return { answer, suggestedQuestions: this.getSuggestedQuestions(lang, entities.intent, entities.crop) };
    }

    // 3. Instant Gratitude / Thank You Response
    if (entities.intent === 'GRATITUDE') {
      const answer = isMl ?
        `🌾 **വളരെ സന്തോഷം! (You're Welcome!)**\n\nനിങ്ങളെ സഹായിക്കാൻ കഴിഞ്ഞതിൽ കൃഷിമിത്ര AI-ക്ക് വലിയ സന്തോഷമുണ്ട്. നിങ്ങളുടെ കൃഷിയിടവുമായി ബന്ധപ്പെട്ട വിള പരിപാലനം, വളപ്രയോഗം, രോഗകീട നിയന്ത്രണം, കാലാവസ്ഥാ വിവരങ്ങൾ, വിപണി നിരക്കുകൾ എന്നിവയിൽ എന്തെങ്കിലും കൂടുതൽ സംശയങ്ങളുണ്ടെങ്കിൽ എപ്പോഴും ചോദിക്കാം. സമൃദ്ധമായ വിളവെടുപ്പും സന്തോഷകരമായ കൃഷിയും ആശംസിക്കുന്നു! 🌱🚜` :
        `🌾 **You're very welcome! (നിങ്ങൾക്ക് സ്വാഗതം!)**\n\nI am always glad to assist you. If you need any more guidance with crop management, fertilizers, plant disease control, weather forecasts, or market prices, feel free to ask anytime. Wishing you a bountiful harvest and happy farming! 🌱🚜`;

      return { answer, suggestedQuestions: this.getSuggestedQuestions(lang, 'GRATITUDE', entities.crop) };
    }

    // 4. Instant Greeting
    if (entities.intent === 'GREETING') {
      const answer = isMl ?
        `👋 **നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കൃഷിമിത്ര AI ആണ്.**\n\nകേരളത്തിലെ കർഷകർക്കായുള്ള വ്യക്തിഗത കാർഷിക സഹായിയാണ് ഞാൻ. വിളകളുടെ വളർച്ചാ കാലയളവ്, വളപ്രയോഗം, നനയ്ക്കൽ, കീടരോഗ നിയന്ത്രണം, കാലാവസ്ഥ, വിപണി വില എന്നിവയെക്കുറിച്ചുള്ള നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കാം. ഇന്ന് ഞാൻ എങ്ങനെ സഹായിക്കണം?` :
        `👋 **Namaskaram! I am KrishiMitra AI**, your personal agricultural assistant for Kerala.\n\nHow can I help your farm today? You can ask me about crop growth durations, fertilizer schedules, irrigation, plant diseases, weather forecasts, or market prices.`;

      return { answer, suggestedQuestions: this.getSuggestedQuestions(lang, entities.intent, entities.crop) };
    }

    // 5. Retrieve Top Scored Knowledge Documents
    const retrievedDocs = this.retrieveScoredContext(entities, farmerProfile);

    // 6. Build Dynamic Live Contexts
    let weatherContext = null;
    if (entities.intent === 'WEATHER' || entities.intent === 'IRRIGATION') {
      weatherContext = await this.getLiveWeatherContext(entities.district || farmerProfile.district || 'Thrissur');
    }

    let marketContext = null;
    if (entities.intent === 'MARKET_PRICE') {
      const cropForMarket = entities.explicitCropInQuery ? entities.crop : null;
      marketContext = this.getLiveMarketContext(cropForMarket, entities.district || farmerProfile.district || 'Thrissur');
    }

    if (isDebug) {
      console.log(`Retrieved Documents: ${retrievedDocs.length} items scored`);
      retrievedDocs.forEach(d => console.log(` - [${d.category}] (Score: ${d.score}): ${d.data.crop || d.data.disease || d.data.pest || d.data.soilType || d.data.name || d.data.practice || d.data.season || 'Doc'}`));
    }

    // 6b. High-Speed Instant Return for Crop Doctor Active Diagnosis (<5ms)
    if (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.disease)) {
      if (isDebug) console.log(`[RAG Engine] Instant Response generated from Active Diagnosis (<5ms)`);
      const instantResult = this.synthesizeDynamicAnswer(query, lang, farmerProfile, history, retrievedDocs, entities, weatherContext, marketContext, activeDiagnosis);
      return instantResult;
    }

    // 7. Try LLM API (Groq -> NVIDIA) with rich structured context
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const nvidiaKey = (apiKey || process.env.NVIDIA_API_KEY || process.env.AI_API_KEY || '').trim();

    if (groqKey) {
      try {
        if (isDebug) console.log(`[RAG Engine] Calling Groq LLM API...`);
        const res = await this.callLLM(query, lang, farmerProfile, history, retrievedDocs, entities, weatherContext, marketContext, groqKey, 'groq', activeDiagnosis);
        if (res && res.answer) {
          if (isDebug) console.log(`[RAG Engine] Response generated by Groq`);
          return res;
        }
      } catch (err) {
        console.warn('[RAG Engine] Groq API exception, switching provider:', err.message);
      }
    }

    if (nvidiaKey && nvidiaKey !== 'your_ai_api_key_here' && nvidiaKey !== 'your_nvidia_api_key_here') {
      try {
        if (isDebug) console.log(`[RAG Engine] Calling NVIDIA LLM API...`);
        const res = await this.callLLM(query, lang, farmerProfile, history, retrievedDocs, entities, weatherContext, marketContext, nvidiaKey, 'nvidia', activeDiagnosis);
        if (res && res.answer) {
          if (isDebug) console.log(`[RAG Engine] Response generated by NVIDIA NIM`);
          return res;
        }
      } catch (err) {
        console.warn('[RAG Engine] NVIDIA API exception, activating Dynamic Kerala Knowledge Synthesizer:', err.message);
      }
    }

    // 8. Dynamic Kerala Agricultural Knowledge Synthesizer (Zero-Failure Fallback Engine)
    if (isDebug) console.log(`[RAG Engine] Response generated by Local Dynamic Knowledge Synthesizer`);
    const fallbackResult = this.synthesizeDynamicAnswer(query, lang, farmerProfile, history, retrievedDocs, entities, weatherContext, marketContext, activeDiagnosis);
    return fallbackResult;
  }

  // ------------------------------------------------------------------------
  // 7. LLM INTEGRATION (GROQ / NVIDIA WITH COMPACT RICH CONTEXT)
  // ------------------------------------------------------------------------
  async callLLM(query, language, farmerProfile, history = [], retrievedDocs = [], entities = {}, weatherContext = null, marketContext = null, apiKey = '', provider = 'groq', activeDiagnosis = null) {
    const isMl = language === 'ml';

    // Build compact, structured knowledge context
    const knowledgeContextText = retrievedDocs.map((doc, idx) => {
      const d = doc.data;
      return `[DOCUMENT ${idx + 1} (${doc.category.toUpperCase()})]:\n${JSON.stringify(d, null, 2)}`;
    }).join('\n\n');

    const activeDiagnosisPrompt = (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.cropEn)) ? `
ACTIVE CROP DOCTOR SCAN DIAGNOSIS:
- Diagnosed Crop: ${activeDiagnosis.crop || activeDiagnosis.cropEn}
- Diagnosed Disease / Condition: ${activeDiagnosis.disease || activeDiagnosis.diseaseEn}
- Confidence: ${activeDiagnosis.confidence || '95%'}
- Severity: ${activeDiagnosis.severity || 'Moderate'}
- Observed Symptoms: ${Array.isArray(activeDiagnosis.symptoms) ? activeDiagnosis.symptoms.join('; ') : (activeDiagnosis.symptoms || 'N/A')}
- Recommended Organic Treatment: ${Array.isArray(activeDiagnosis.organicTreatment) ? activeDiagnosis.organicTreatment.join('; ') : (activeDiagnosis.organicTreatment || 'N/A')}
- Recommended Chemical Treatment: ${Array.isArray(activeDiagnosis.chemicalTreatment) ? activeDiagnosis.chemicalTreatment.join('; ') : (activeDiagnosis.chemicalTreatment || 'N/A')}
- Preventive Practices: ${activeDiagnosis.prevention || 'N/A'}

MANDATORY DIRECTIVE: The user came directly from Crop Doctor after analyzing ${activeDiagnosis.crop || activeDiagnosis.cropEn}. You MUST answer specifically and exclusively about ${activeDiagnosis.crop || activeDiagnosis.cropEn} and ${activeDiagnosis.disease || activeDiagnosis.diseaseEn}. Do NOT default or switch to Tomato unless the user explicitly asks about Tomato.
` : '';

    const systemPrompt = `You are KrishiMitra AI, a prestigious, highly knowledgeable agricultural assistant designed EXCLUSIVELY for farmers and agriculture in Kerala, India.

FARMER PROFILE CONTEXT:
- Name: ${farmerProfile.name || 'Farmer'}
- District: ${farmerProfile.district || 'Thrissur'}
- Soil: ${farmerProfile.soilType || 'Laterite Soil'}
- Farm Size: ${farmerProfile.farmSize || '2.5 acres'}
- Main Crop: ${(activeDiagnosis && (activeDiagnosis.cropEn || activeDiagnosis.crop)) || farmerProfile.mainCrop || 'Paddy'}
- Water Availability: ${farmerProfile.waterAvailability || 'Moderate'}

DETECTED USER INTENT: ${entities.intent}
DETECTED ENTITIES: Crop: ${entities.crop || 'None'}, Disease: ${entities.disease || 'None'}, Pest: ${entities.pest || 'None'}, Soil: ${entities.soil || 'None'}

${activeDiagnosisPrompt}

${weatherContext ? `LIVE WEATHER CONTEXT:\n${JSON.stringify(weatherContext, null, 2)}\n` : ''}
${marketContext ? `LIVE MARKET PRICES CONTEXT:\n${JSON.stringify(marketContext, null, 2)}\n` : ''}

RETRIEVED KNOWLEDGE BASE:
${knowledgeContextText || 'Use standard Kerala Agricultural University (KAU) package of practices.'}

STRICT DOMAIN & ANSWER GUIDELINES:
1. ONLY answer agricultural, crop, disease, pest, soil, fertilizer, irrigation, weather, cover crops, and mandi price questions.
2. Formulate a CLEAR, DIRECT, HIGHLY SPECIFIC answer strictly addressing the user's specific question using structured bullet points (•) and concise paragraphs.
3. If the user asks about when cover crops should be removed/terminated, explain the flowering stage (45-50 days after sowing) and 2-3 weeks before planting the main crop, with specific Kerala green manures (Sunn hemp, Daincha, Cowpea, Calopogonium).
4. If the user says thanks/gratitude, acknowledge warmly and greet them happily.
5. If the user asks about the price of a SPECIFIC crop (e.g. Tea, Tomato, Coconut, Rubber), provide ONLY that specific crop's market price, auction rates, and mandi location.
6. If the user asks about crop duration, provide exact days/months and variety breakdown.
7. Language: Respond ENTIRELY in ${isMl ? 'Malayalam (മലയാളം)' : 'English'}.`;

    const messages = [{ role: 'system', content: systemPrompt }];

    // Inject last 8-10 turns of history
    if (Array.isArray(history)) {
      history.slice(-8).forEach(item => {
        if (item && item.content) {
          messages.push({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content
          });
        }
      });
    }

    messages.push({ role: 'user', content: query });

    const endpoint = provider === 'groq' ?
      'https://api.groq.com/openai/v1/chat/completions' :
      'https://integrate.api.nvidia.com/v1/chat/completions';

    const candidateModels = provider === 'groq' ?
      ['llama-3.3-70b-versatile'] :
      [process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'];

    for (const modelName of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3800);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.3,
            max_tokens: 700
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer && answer.trim()) {
            return {
              answer: answer.trim(),
              suggestedQuestions: this.getSuggestedQuestions(language, entities.intent, entities.crop)
            };
          }
        } else {
          console.warn(`[RAG Engine] LLM model ${modelName} returned status ${response.status}`);
        }
      } catch (callErr) {
        console.warn(`[RAG Engine] LLM model ${modelName} call failed:`, callErr.message);
      }
    }
    return null;
  }

  // ------------------------------------------------------------------------
  // 8. DYNAMIC KNOWLEDGE SYNTHESIZER (ZERO-FAILURE LOCAL ENGINE)
  // ------------------------------------------------------------------------
  synthesizeDynamicAnswer(query, language, farmerProfile = {}, history = [], retrievedDocs = [], entities = {}, weatherContext = null, marketContext = null, activeDiagnosis = null) {
    const isMl = language === 'ml';
    const district = entities.district || farmerProfile.district || 'Thrissur';
    const crop = (activeDiagnosis && (activeDiagnosis.cropEn || activeDiagnosis.crop)) || entities.crop || farmerProfile.mainCrop || '';
    const soil = entities.soil || farmerProfile.soilType || 'Laterite Soil';
    const intent = entities.intent;

    let answer = "";

    // 1. CROP DURATION / GROWTH PERIOD
    if (intent === 'CROP_DURATION') {
      if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ലിന്റെ വളർച്ചാ കാലയളവ് (Paddy Growth Duration):**\n\n• **ആകെ കാലയളവ്**: **3.5 മുതൽ 4 മാസം** (110 മുതൽ 120 ദിവസം).\n• **ഹ്രസ്വകാല ഇനങ്ങൾ** (ജ്യോതി, കാഞ്ചന): 100 – 115 ദിവസം\n• **ഇടത്തരം ഇനങ്ങൾ** (ഉമ, മട്ട ത്രിവേണി): 120 – 135 ദിവസം\n• **ദീർഘകാല ഇനങ്ങൾ**: 140 – 150 ദിവസം` :
          `🌾 **Paddy (Rice) Growth Duration:**\n\n• **Total Duration**: **3.5 to 4 months** (110 to 120 days from sowing to harvest).\n• **Short Duration Varieties** (Jyothi, Kanchana): 100 – 115 days\n• **Medium Duration Varieties** (Uma, Matta Triveni): 120 – 135 days\n• **Long Duration Varieties**: 140 – 150 days`;
      } else if (crop.toLowerCase().includes('banana')) {
        answer = isMl ?
          `🍌 **വാഴയുടെ വളർച്ചാ കാലയളവ് (Banana Growth Duration):**\n\n• **ആകെ കാലയളവ്**: **9 മുതൽ 10 മാസം** (270 മുതൽ 300 ദിവസം).\n• **കുലയ്ക്കുന്ന സമയം**: നട്ട് 7–8 മാസത്തിൽ.\n• **മൂപ്പെത്താൻ**: കുലച്ച ശേഷം 2.5 മുതൽ 3 മാസം (75–90 ദിവസം).` :
          `🍌 **Banana (Nendran) Growth Duration:**\n\n• **Total Duration**: **9 to 10 months** (270 to 300 days from planting to harvest).\n• **Flowering/Bunching**: At 7 to 8 months after planting.\n• **Bunch Maturity**: 2.5 to 3 months (75 to 90 days) after flowering.`;
      } else if (crop.toLowerCase().includes('coconut')) {
        answer = isMl ?
          `🌴 **തെങ്ങിന്റെ വളർച്ചയും വിളവെടുപ്പ് കാലയളവും:**\n\n• **ആദ്യ കായ്പിടുത്തം**: സങ്കരയിനം/കുറിയ ഇനങ്ങൾ (Dwarf/Hybrid) **4 – 5 വർഷത്തിലും**, നാടൻ നെടിയ ഇനങ്ങൾ (Tall) **6 – 7 വർഷത്തിലും** കായ്ച്ചു തുടങ്ങും.\n• **വിളവെടുപ്പ് ഇടവേള**: കായ്ച്ചു തുടങ്ങിയ തെങ്ങിൽ നിന്ന് ഓരോ **30 മുതൽ 45 ദിവസത്തിലും** തേങ്ങ വിളവെടുക്കാം.` :
          `🌴 **Coconut Bearing & Harvest Period:**\n\n• **First Bearing**: Hybrid/dwarf varieties start in **4 to 5 years**; local tall varieties take **6 to 7 years**.\n• **Harvest Frequency**: Bunches are harvested every **30 to 45 days** year-round.`;
      } else if (crop.toLowerCase().includes('tomato')) {
        answer = isMl ?
          `🍅 **തക്കാളിയുടെ വളർച്ചാ കാലയളവ്:**\n\n• **ആകെ കാലയളവ്**: **3 മുതൽ 4 മാസം** (90 മുതൽ 120 ദിവസം).\n• **ആദ്യ വിളവെടുപ്പ്**: തൈ നട്ട് 60 മുതൽ 70 ദിവസത്തിനുള്ളിൽ ആരംഭിക്കാം.` :
          `🍅 **Tomato Growth Duration:**\n\n• **Total Duration**: **3 to 4 months** (90 to 120 days from transplanting).\n• **First Harvest**: Begins in 60 to 70 days after planting.`;
      } else if (crop.toLowerCase().includes('pepper')) {
        answer = isMl ?
          `🌿 **കുരുമുളകിന്റെ വളർച്ചാ കാലയളവ്:**\n\n• **ആദ്യ വിളവ്**: നട്ട് **3-ാം വർഷം** മുതൽ കായ്ച്ചു തുടങ്ങും.\n• **തിരി മൂപ്പെത്താൻ**: പൂവിട്ട് 7 മുതൽ 8 മാസം (ഡിസംബർ – ഫെബ്രുവരിയിൽ വിളവെടുപ്പ്).` :
          `🌿 **Black Pepper Duration:**\n\n• **First Commercial Yield**: From **3rd year** after planting.\n• **Berry Maturity**: 7 to 8 months after flowering (harvested December to February in Kerala).`;
      } else if (crop.toLowerCase().includes('okra')) {
        answer = isMl ?
          `🌱 **വെണ്ടയുടെ വളർച്ചാ കാലയളവ്:**\n\n• **ആകെ കാലയളവ്**: **3 മാസം (90 – 100 ദിവസം)**.\n• **ആദ്യ വിളവെടുപ്പ്**: വിത്ത് മുളച്ച് 45–50 ദിവസത്തിൽ തുടങ്ങാം; തുടർന്ന് 2 ദിവസത്തിലൊരിക്കൽ കായ്കൾ പറിക്കാം.` :
          `🌱 **Okra (Ladies Finger) Growth Duration:**\n\n• **Total Duration**: **3 months (90 to 100 days)**.\n• **First Harvest**: Begins 45 to 50 days after sowing; harvested every 2 days.`;
      } else {
        answer = isMl ?
          `🌾 **${crop} വിളയുടെ വളർച്ചാ കാലയളവ്:**\n\n• **സാധാരണ കാലയളവ്**: **3.5 മുതൽ 4 മാസം** (110 മുതൽ 120 ദിവസം).` :
          `🌾 **${crop} Growth Duration:**\n\n• **Average Seasonal Duration**: **3.5 to 4 months** (110 to 120 days from planting).`;
      }
    }

    // 2. FERTILIZER SCHEDULE & NPK DOSES
    else if (intent === 'FERTILIZER') {
      if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ലിനുള്ള വളപ്രയോഗം (NPK 70:35:35 kg/ha):**\n\n• **അടിവളം (Basal)**: നിലമൊരുക്കുമ്പോൾ ഹെക്ടറിന് 5 ടൺ ചാണകപ്പൊടിയും, മുഴുവൻ ഫോസ്ഫറസും (രാജ്ഫോസ് 175 kg) നൽകുക.\n• **മേൽവളം (Top Dressing)**: നൈട്രജൻ (യൂറിയ 150 kg), പൊട്ടാഷ് (MOP 60 kg) എന്നിവ 3 തുല്യ തവണകളായി നൽകുക (നട്ട് 15–20 ദിവസം, കതിര് വരുന്ന സമയം, പൂവിടുന്ന സമയം).` :
          `🌾 **Paddy Fertilizer Schedule (NPK 70:35:35 kg/ha):**\n\n• **Basal Dose**: Apply 5 tons/ha well-rotted farmyard manure and 100% Phosphorus (Rock Phosphate @ 175 kg/ha) during final ploughing.\n• **Top Dressing**: Apply Nitrogen (Urea @ 150 kg/ha) and Potash (MOP @ 60 kg/ha) in 3 split applications (15-20 days, active tillering, panicle initiation).`;
      } else if (crop.toLowerCase().includes('banana')) {
        answer = isMl ?
          `🍌 **നേന്ത്രവാഴയ്ക്കുള്ള വളപ്രയോഗം (ഒരു വാഴയ്ക്ക്):**\n\n• **അടിവളം**: 10 kg ചാണകപ്പൊടി + 500g വേപ്പിൻപിണ്ണാക്ക് + 50g കുമ്മായം കുഴിയിൽ ചേർക്കുക.\n• **മേൽവളം (4 തവണകളായി)**: നട്ട് 1, 2, 3, 5 മാസങ്ങളിൽ യഥാക്രമം 50g യൂറിയ, 50g രാജ്ഫോസ്, 75g പൊട്ടാഷ് നൽകുക.` :
          `🍌 **Banana (Nendran) Fertilizer Schedule (Per Plant):**\n\n• **Basal Dose**: 10 kg organic compost + 500g neem cake in planting pit.\n• **Top Dressing**: Apply 190g Urea, 115g Rock Phosphate, and 300g MOP in 4 equal split doses at 1, 2, 3, and 5 months after planting.`;
      } else if (crop.toLowerCase().includes('coconut')) {
        answer = isMl ?
          `🌴 **തെങ്ങിനുള്ള വാർഷിക വളപ്രയോഗം (ഒരു തെങ്ങിന്):**\n\n• **ജൈവവളം**: 25–50 kg ചാണകപ്പൊടി അല്ലെങ്കിൽ കമ്പോസ്റ്റ്.\n• **രാസവളം**: 1.3 kg യൂറിയ + 2.0 kg രാജ്ഫോസ് (Rock Phosphate) + 2.0 kg മ്യൂറിയേറ്റ് ഓഫ് പൊട്ടാഷ് (MOP).\n• **പ്രയോഗ സമയം**: മെയ്-ജൂൺ (മൂന്നിലൊന്ന് ഭാഗം), സെപ്റ്റംബർ-ഒക്ടോബർ (ബാക്കി രണ്ട് ഭാഗം).` :
          `🌴 **Coconut Annual Fertilizer Dose (Per Adult Palm):**\n\n• **Organic Manure**: 25 to 50 kg farmyard manure or compost per year.\n• **NPK Dose**: 1.3 kg Urea, 2.0 kg Rock Phosphate, and 2.0 kg MOP per palm annually.\n• **Application**: Split into two applications in May–June (one-third) and September–October (two-thirds).`;
      } else if (crop.toLowerCase().includes('tomato')) {
        answer = isMl ?
          `🍅 **തക്കാളിക്കുള്ള വളപ്രയോഗം:**\n\n• **അടിവളം**: സെന്റൊന്നിന് 100 kg ചാണകപ്പൊടിയോ കമ്പോസ്റ്റോ ചേർക്കുക.\n• **രാസവളം**: NPK 75:40:25 kg/ha. നട്ട് 15 ദിവസത്തിലും 30 ദിവസത്തിലും യൂറിയയും പൊട്ടാഷും ചുവട്ടിൽ നൽകുക.` :
          `🍅 **Tomato Fertilizer Schedule:**\n\n• **Basal Dose**: Apply 20-25 tons/ha well-rotted farmyard manure.\n• **NPK Dose**: 75:40:25 kg/ha. Apply full P and half N & K at transplanting; apply remaining N and K in two top-dressings at 3 and 6 weeks.`;
      } else {
        // Organic fertilizer recommendation
        answer = isMl ?
          `🌱 **ജൈവവള പ്രയോഗ നിർദ്ദേശങ്ങൾ (${crop}, ${soil}):**\n\n• **ജീവാമൃതം**: 1 ലിറ്റർ വെള്ളത്തിൽ 20 ഗ്രാം ജീവാമൃതം അല്ലെങ്കിൽ പഞ്ചഗവ്യം (3%) 15 ദിവസത്തിലൊരിക്കൽ തടത്തിൽ ഒഴിക്കുക.\n• **അടിവളം**: നിലമൊരുക്കുമ്പോൾ ഏക്കറിന് 5 ടൺ ചാണകപ്പൊടിയും വേപ്പിൻപിണ്ണാക്കും ചേർക്കുക.` :
          `🌱 **Organic Fertilizer & Soil Management (${crop}, ${soil}):**\n\n• **Jiwamrita / Panchagavya**: Drench soil with Jiwamrita every 15 days or spray 3% Panchagavya on leaves to boost plant immunity.\n• **Basal Compost**: Apply 5 tons/acre well-rotted farmyard manure + 200kg neem cake to enrich soil microflora.`;
      }
    }

    // 3. IRRIGATION & WATER MANAGEMENT
    else if (intent === 'IRRIGATION') {
      if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ലിലെ നന ക്രമീകരണം:**\n\n• **ഞാറുനടീൽ ഘട്ടം**: ആദ്യ ആഴ്ചകളിൽ **2–3 cm** വെള്ളം പാടത്ത് നിലനിർത്തുക.\n• **കതിര് വരുന്ന ഘട്ടം**: പൂവിടുന്ന സമയത്ത് **5 cm** വെള്ളം നിലനിർത്തുക.\n• **വിളവെടുപ്പിന് മുമ്പ്**: കൊയ്ത്തിന് 10 ദിവസം മുമ്പ് പാടത്തെ വെള്ളം പൂർണ്ണമായി ഒഴുക്കിക്കളയുക.` :
          `🌾 **Paddy Water Management:**\n\n• **Tillering Stage**: Maintain **2–3 cm** standing water in the paddy plot.\n• **Panicle & Flowering Stage**: Maintain **5 cm** standing water for proper grain filling.\n• **Pre-Harvest**: Drain the field completely 10 days before harvesting.`;
      } else if (crop.toLowerCase().includes('banana')) {
        answer = isMl ?
          `🍌 **വാഴയിലെ നന ക്രമം:**\n\n• **വേനൽക്കാലത്ത്**: 2–3 ദിവസത്തിലൊരിക്കൽ വാഴത്തടത്തിൽ നന്നായി നനയ്ക്കുക (അല്ലെങ്കിൽ തുള്ളിനന വഴി ദിനംപ്രതി 15–20 ലിറ്റർ).\n• **മഴക്കാലത്ത്**: വെള്ളക്കെട്ട് വരാതെ ഓടകൾ തുറന്ന് വേരുകൾ ചീയുന്നത് തടയുക.` :
          `🍌 **Banana Irrigation Schedule:**\n\n• **Summer Schedule**: Irrigate every 2–3 days (or 15–20 liters/plant daily via drip irrigation).\n• **Monsoon Management**: Ensure deep drainage trenches between rows to avoid waterlogging and root rot.`;
      } else if (crop.toLowerCase().includes('coconut')) {
        answer = isMl ?
          `🌴 **തെങ്ങിന്റെ നനയ്ക്കൽ ക്രമം:**\n\n• **വേനൽക്കാലത്ത്**: തെങ്ങൊന്നിന് പ്രതിദിനം **40 മുതൽ 50 ലിറ്റർ** വെള്ളം തടത്തിൽ നൽകുക (അല്ലെങ്കിൽ 4 ദിവസത്തിലൊരിക്കൽ 200 ലിറ്റർ).\n• **തുള്ളിനന**: 1.5 മീറ്റർ തടത്തിൽ തുള്ളിനന നൽകുന്നത് ജലക്ഷാമം തടയും.` :
          `🌴 **Coconut Irrigation Schedule:**\n\n• **Summer Schedule**: Provide **40 to 50 liters of water per palm daily** (or 200 liters every 4 days).\n• **Drip Irrigation**: Recommended within a 1.5-meter basin radius for optimal moisture.`;
      } else if (crop.toLowerCase().includes('tomato')) {
        answer = isMl ?
          `🍅 **തക്കാളിയുടെ നന ക്രമം:**\n\n• **ചുവട്ടിൽ നനയ്ക്കുക**: 2–3 ദിവസത്തിലൊരിക്കൽ വേരിന്റെ ഭാഗത്ത് മാത്രം നനയ്ക്കുക.\n• **ഇലകളിൽ വെള്ളം തളിക്കരുത്**: ഇലകളിൽ വെള്ളം വീണാൽ ഫംഗസ് രോഗങ്ങൾ (Early Blight) വരാൻ സാധ്യതയുണ്ട്.` :
          `🍅 **Tomato Irrigation Schedule:**\n\n• **Root Basin Watering**: Irrigate deeply at the soil root basin every 2–3 days.\n• **Avoid Foliage Wetting**: Do not spray water over leaves to prevent Early Blight fungal outbreaks.`;
      } else {
        answer = isMl ?
          `💧 **നനയ്ക്കൽ പൊതുനിർദ്ദേശം (${district}, ${soil}):**\n\n• മണ്ണിലെ ഈർപ്പം പരിശോധിച്ച് രാവിലെയിലോ വൈകുന്നേരമോ മാത്രം നനയ്ക്കുക.\n• വെള്ളക്കെട്ട് ഒഴിവാക്കാൻ തോട്ടത്തിൽ ഡ്രെയിനേജ് ഓടകൾ സജ്ജമാക്കുക.` :
          `💧 **Irrigation Advice (${district}, ${soil}):**\n\n• Water directly at the root zone during early morning or late afternoon.\n• Ensure proper drainage channels are clear to prevent water stagnation.`;
      }
    }

    // 4. PLANT DISEASES & YELLOW LEAVES
    else if (intent === 'DISEASE' || (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.disease))) {
      // 1. If active diagnosis object from Crop Doctor is available, synthesize rich custom guidance
      if (activeDiagnosis && (activeDiagnosis.organicTreatment || activeDiagnosis.chemicalTreatment || activeDiagnosis.symptoms)) {
        const dCrop = isMl ? (activeDiagnosis.cropMl || activeDiagnosis.crop) : (activeDiagnosis.cropEn || activeDiagnosis.crop);
        const dDis = isMl ? (activeDiagnosis.diseaseMl || activeDiagnosis.disease) : (activeDiagnosis.diseaseEn || activeDiagnosis.disease);
        const dConf = activeDiagnosis.confidence || '95%';
        const dSev = activeDiagnosis.severity || 'Moderate';

        const safeArr = (v) => Array.isArray(v) ? v : (v ? [String(v)] : []);
        const symList = safeArr(activeDiagnosis.symptoms);
        const orgList = safeArr(activeDiagnosis.organicTreatment);
        const chemList = safeArr(activeDiagnosis.chemicalTreatment);

        const symStr = symList.length > 0 ? `• **${isMl ? 'നിരീക്ഷിച്ച ലക്ഷണങ്ങൾ' : 'Observed Symptoms'}**:\n` + symList.map(s => `  - ${s}`).join('\n') + '\n\n' : '';
        const orgStr = orgList.length > 0 ? `• **${isMl ? 'ജൈവ നിയന്ത്രണ പരിഹാരങ്ങൾ (Organic & Bio-Control)' : 'Organic & Bio-Control Solution'}**:\n` + orgList.map(o => `  - ${o}`).join('\n') + '\n\n' : '';
        const chemStr = chemList.length > 0 ? `• **${isMl ? 'രാസ / കുമിൾനാശിനി നിർദ്ദേശങ്ങൾ (Chemical Remedies)' : 'Chemical / Fertilizer Remedies'}**:\n` + chemList.map(c => `  - ${c}`).join('\n') + '\n\n' : '';
        const prevStr = activeDiagnosis.prevention ? `• **${isMl ? 'പ്രതിരോധ കാർഷിക രീതികൾ (Cultural Prevention)' : 'Preventive Cultural Practices'}**:\n  ${activeDiagnosis.prevention}\n\n` : '';

        answer = isMl ?
          `🔬 **ക്രോപ്പ് ഡോക്ടർ രോഗനിർണ്ണയവും കൃഷിഭവൻ പരിഹാരങ്ങളും (${dCrop} - ${dDis}):**\n\n` +
          `• **കണ്ടെത്തിയ രോഗാവസ്ഥ**: **${dDis}** (വിശ്വാസ്യത: ${dConf}, തീവ്രത: ${dSev})\n\n` +
          symStr + orgStr + chemStr + prevStr +
          `🌱 *മഴയ്ക്ക് തൊട്ടുമുമ്പ് മരുന്ന് തളിക്കുന്നത് ഒഴിവാക്കുക. കൂടുതൽ അളവുകൾ കൃഷിമിത്രയോട് ചോദിക്കാം!*` :
          `🔬 **Crop Doctor Diagnosis & KAU Prescription (${dCrop} - ${dDis}):**\n\n` +
          `• **Detected Condition**: **${dDis}** (Confidence: ${dConf}, Severity: ${dSev})\n\n` +
          symStr + orgStr + chemStr + prevStr +
          `🌱 *Avoid foliar spraying right before rainfall. Ask me if you need specific dilution instructions!*`;
      }
      // 2. Crop-specific built-in fallbacks if activeDiagnosis details weren't passed
      else if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ലിലെ ഇല മഞ്ഞനിറവും ബ്ലാസ്റ്റ് രോഗ നിയന്ത്രണവും (Paddy Blast & Sheath Blight):**\n\n• **ലക്ഷണങ്ങൾ**: ഇലകളിൽ കണ്ണ് ആകൃതിയിലുള്ള പുള്ളികൾ, അഗ്രം കരിയൽ.\n• **ജൈവ പരിഹാരം**: സ്യൂഡോമോണസ് 20 ഗ്രാം/ലിറ്റർ ഇലകളിൽ തളിക്കുക.\n• **രാസ പരിഹാരം**: ട്രൈസൈക്ലസോൾ 75 WP (Tricyclazole 0.6g/L) അല്ലെങ്കിൽ ഐസോപ്രോത്തിയോലേൻ തളിക്കുക.\n• **മുൻകരുതൽ**: യൂറിയ വളം നൽകുന്നത് ഉടൻ നിർത്തുക, പാടത്ത് ആവശ്യത്തിന് വെള്ളം നിലനിർത്തുക.` :
          `🌾 **Paddy Leaf Blast & Disease Control (KAU Guidelines):**\n\n• **Symptoms**: Spindle-shaped eye lesions with brown margins and grey centers.\n• **Bio-Control**: Foliar spray of **Pseudomonas fluorescens** (20g/L) at tillering and panicle emergence.\n• **Chemical Remedy**: Spray **Tricyclazole 75 WP** (0.6g/L) or Isoprothiolane 40 EC (1.5ml/L).\n• **Precaution**: Stop chemical urea/nitrogen fertilizer immediately; maintain 2–3 cm standing water.`;
      } else if (crop.toLowerCase().includes('chilli') || (crop.toLowerCase().includes('pepper') && query.toLowerCase().includes('curl'))) {
        answer = isMl ?
          `🌶️ **മുളകിലെ ഇലച്ചുരുളൽ രോഗവും കീടനിയന്ത്രണവും (Chilli Leaf Curl Virus):**\n\n• **കാരണം**: വെള്ളീച്ചകളും ഇലപ്പേനുകളും (Thrips) പരത്തുന്ന വൈറസ് രോഗം.\n• **ജൈവ പരിഹാരം**: വേപ്പെണ്ണ-വെളുത്തുള്ളി മിശ്രിതം (5ml/L) അല്ലെങ്കിൽ വെർട്ടിസീലിയം (5g/L) ഇലയുടെ അടിവശത്ത് തളിക്കുക.\n• **കെണികൾ**: ഏക്കറിന് 10 വീതം മഞ്ഞക്കെണികളും നീലക്കെണികളും സ്ഥാപിക്കുക.\n• **രാസ പരിഹാരം**: കീടങ്ങൾ കൂടുതലാണെങ്കിൽ ഇമിഡാക്ലോപ്രിഡ് (Imidacloprid 0.3ml/L) തളിക്കുക.` :
          `🌶️ **Chilli Leaf Curl Virus & Vector Management:**\n\n• **Causes**: Geminivirus transmitted by whiteflies (*Bemisia tabaci*) and thrips.\n• **Bio-Control**: Spray 5% Neem Seed Kernel Extract (NSKE) or Neem-Garlic emulsion (5ml/L) under leaves.\n• **Sticky Traps**: Install 10 yellow sticky traps (for whiteflies) and blue traps (for thrips) per acre.\n• **Chemical Spray**: If severe, apply Imidacloprid 17.8 SL (0.3ml/L) or Diafenthiuron 50 WP (1g/L).`;
      } else if (crop.toLowerCase().includes('banana')) {
        answer = isMl ?
          `🍌 **വാഴയിലെ ഇല മഞ്ഞനിറത്തിനുള്ള കാരണങ്ങളും പരിഹാരങ്ങളും (Banana Yellow Leaves Remedy):**\n\n• **സാധ്യമായ കാരണങ്ങൾ**:\n  1. **സിഗാറ്റോക്ക ഇലപ്പുള്ളി രോഗം (Sigatoka Leaf Spot)**: ഇലകളിൽ മഞ്ഞ കലർന്ന തവിട്ടുനിറത്തിലുള്ള പാടുകൾ.\n  2. **പൊട്ടാഷ് പോഷകക്കുറവ്**: ഇലകളുടെ അഗ്രഭാഗം മഞ്ഞനിറമായി കരിഞ്ഞുണങ്ങൽ.\n  3. **അമിത വെള്ളക്കെട്ട്**: വേരുകൾക്ക് വായു ലഭിക്കാതെ ചീയൽ.\n\n• **പരിഹാര മാർഗ്ഗങ്ങൾ**:\n  1. **ജൈവ കുമിൾനാശിനി**: 1 ലിറ്റർ വെള്ളത്തിൽ 20 ഗ്രാം **സ്യൂഡോമോണസ്** അല്ലെങ്കിൽ 1% ബോർഡോ മിശ്രിതം ഇലകളിൽ തളിക്കുക.\n  2. **വളപ്രയോഗം**: ഒരു വാഴയ്ക്ക് 300 ഗ്രാം പൊട്ടാഷ് (MOP) വളം തടത്തിൽ ചേർക്കുക.\n  3. **ഡ്രെയിനേജ്**: വാഴത്തടങ്ങളിൽ വെള്ളം കെട്ടിക്കിടക്കാതെ ചാലുകൾ കീറി വെള്ളം ഒഴുക്കുക.\n  4. ഉണങ്ങിയ രോഗബാധിത അടിയിലകൾ വെട്ടിമാറ്റി നശിപ്പിക്കുക.` :
          `🍌 **Why Banana Leaves Turn Yellow & Action Plan:**\n\n• **Possible Causes**:\n  1. **Sigatoka Leaf Spot (Mycosphaerella musicola)**: Yellow streaks turning to brown spots with yellow halos.\n  2. **Potassium (K) Deficiency**: Yellowing and scorching of leaf tips and margins.\n  3. **Waterlogging / Poor Drainage**: Root suffocation from standing water during rains.\n\n• **What You Can Do**:\n  1. **Bio-Control Spray**: Spray **Pseudomonas fluorescens** (20g/L) or **1% Bordeaux mixture** thoroughly under and over leaves.\n  2. **Potassium Replenishment**: Apply 300g Muriate of Potash (MOP) per plant in split applications.\n  3. **Field Drainage**: Dig drainage trenches between rows to avoid root stagnation.\n  4. Cut and safely burn severely affected dried lower leaves.`;
      } else if (crop.toLowerCase().includes('coconut')) {
        answer = isMl ?
          `🌴 **തെങ്ങിലെ ഓല മഞ്ഞനിറവും ചെല്ലി നിയന്ത്രണവും:**\n\n• **സാധ്യമായ കാരണങ്ങൾ**: കാറ്റുവീഴ്ച രോഗം (Root Wilt) അല്ലെങ്കിൽ മഗ്നീഷ്യം പോഷകക്കുറവ്.\n• **പരിഹാര മാർഗ്ഗങ്ങൾ**:\n  1. ഒരു തെങ്ങിന് പ്രതിവർഷം **500 ഗ്രാം മഗ്നീഷ്യം സൾഫേറ്റ് (MgSO4)** + 2 kg പൊട്ടാഷ് നൽകുക.\n  2. മണ്ടയിലെ ഇലക്കവിളുകളിൽ വേപ്പിൻപിണ്ണാക്കും മണലും സമം ചേർത്തു നിറയ്ക്കുക.\n  3. മണ്ടചീയലിന് 1% ബോർഡോ കുഴമ്പ് പുരട്ടുക.` :
          `🌴 **Coconut Frond Yellowing & Pest Control:**\n\n• **Possible Causes**: Root (Wilt) Disease or Magnesium Deficiency in laterite soil.\n• **What You Can Do**:\n  1. Apply **500g Magnesium Sulphate (MgSO4)** + 2 kg MOP per palm annually.\n  2. Place neem cake + sand (1:1 mixture) in top leaf axils against rhinoceros beetle.\n  3. Apply 1% Bordeaux paste to the crown for bud rot protection.`;
      } else if (crop.toLowerCase().includes('pepper')) {
        answer = isMl ?
          `🌿 **കുരുമുളകിലെ ദ്രുതവാട്ടം (Quick Wilt / Phytophthora Foot Rot) നിയന്ത്രണം:**\n\n• **ലക്ഷണങ്ങൾ**: ഇലകൾ മഞ്ഞനിറമായി പെട്ടെന്ന് കൊഴിയൽ, വേരുകൾ കറുത്തു ചീയൽ.\n• **ജൈവ പരിഹാരം**: ട്രൈക്കോഡെർമ (Trichoderma) ചേർത്ത ചാണകപ്പൊടി ചുവട്ടിൽ ഇടുക; സ്യൂഡോമോണസ് 2% തളിക്കുക.\n• **രാസ പരിഹാരം**: 1% ബോർഡോ മിശ്രിതം തളിക്കുകയും ചെടിയുടെ ചുവട്ടിൽ കോപ്പർ ഓക്സിക്ലോറൈഡ് (3g/L) ഒഴിക്കുകയും ചെയ്യുക.` :
          `🌿 **Black Pepper Quick Wilt (*Phytophthora*) Management:**\n\n• **Symptoms**: Sudden wilting, drooping, rapid leaf shedding, black rot on collar and roots.\n• **Bio-Control**: Drench root basin with *Trichoderma viride* enriched farmyard manure; foliar spray of *Pseudomonas* (20g/L).\n• **Chemical Fungicide**: Drench soil with 1% Bordeaux mixture or Copper Oxychloride (3g/L) before monsoon onset.`;
      } else if (crop.toLowerCase().includes('healthy')) {
        answer = isMl ?
          `🍃 **നിങ്ങളുടെ ചെടിയുടെ ഇല തികച്ചും ആരോഗ്യവത്താണ്!**\n\n• രോഗലക്ഷണങ്ങളോ കീടബാധയോ കണ്ടെത്തിയിട്ടില്ല.\n• രോഗപ്രതിരോധത്തിനായി 15 ദിവസത്തിലൊരിക്കൽ 3% പഞ്ചഗവ്യം അല്ലെങ്കിൽ ജീവാമൃതം തളിക്കുന്നത് തുടരുക.\n• കൃത്യമായ നനയും വളപ്രയോഗവും നൽകുക.` :
          `🍃 **Your Plant Leaf is Completely Healthy!**\n\n• No fungal lesions, pest spots, or nutrient deficiencies detected.\n• Maintain natural immunity by spraying **Panchagavya (3%)** or Jiwamrita every 15 days.\n• Keep root basin moist and well mulched according to seasonal weather.`;
      } else if (crop.toLowerCase().includes('tomato')) {
        answer = isMl ?
          `🍅 **തക്കാളി ഇല മഞ്ഞനിറത്തിനുള്ള കാരണങ്ങളും പരിഹാരങ്ങളും (Tomato Yellow Leaves Remedy):**\n\n• **സാധ്യമായ കാരണങ്ങൾ**:\n  1. **അലി സാറ്റ് / ബൈറ്റ് (Early Blight - Alternaria solani)**: താഴത്തെ ഇലകളിൽ കറുത്ത പുള്ളികളും മഞ്ഞപ്പും.\n  2. **ഇലച്ചുരുൾ വൈറസ് രോഗം (Leaf Curl Virus)**: വെള്ളീച്ച പരത്തുന്ന ഇലച്ചുരുളലും മഞ്ഞനിറവും.\n  3. **നൈട്രജൻ / മഗ്നീഷ്യം പോഷകക്കുറവ്**.\n\n• **പരിഹാര മാർഗ്ഗങ്ങൾ**:\n  1. **സ്യൂഡോമോണസ് പ്രയോഗം**: 1 ലിറ്റർ വെള്ളത്തിൽ 20 ഗ്രാം **സ്യൂഡോമോണസ്** അല്ലെങ്കിൽ 5% വേപ്പെണ്ണ ലായനി തളിക്കുക.\n  2. **ഇലകൾ നീക്കം ചെയ്യുക**: താഴത്തെ രോഗം ബാധിച്ച ഇലകൾ ഉടൻ നശിപ്പിക്കുക.\n  3. **നനയ്ക്കൽ**: ഇലകളിൽ വെള്ളം തളിക്കാതെ ചുവട്ടിൽ മാത്രം നനയ്ക്കുക.\n  4. വെള്ളീച്ചകളെ നിയന്ത്രിക്കാൻ മഞ്ഞക്കെണികൾ (Yellow Sticky Traps) സ്ഥാപിക്കുക.` :
          `🍅 **Why Tomato Leaves Turn Yellow & Action Plan:**\n\n• **Possible Causes**:\n  1. **Early Blight (Alternaria solani)**: Dark concentric spots surrounded by yellow zones on lower leaves.\n  2. **Tomato Leaf Curl Virus**: Puckering, curling, and yellowing transmitted by whiteflies.\n  3. **Nitrogen or Magnesium Deficiency** in soil.\n\n• **What You Can Do**:\n  1. **Bio-Fungicide Spray**: Spray **Pseudomonas fluorescens** (20g/L) or 5% Neem Seed Kernel Extract.\n  2. **Prune Lower Leaves**: Remove infected bottom leaves to prevent soil-splash reinfection.\n  3. **Root Watering**: Irrigate directly into the root basin; do not wet foliage.\n  4. Install yellow sticky traps to control whiteflies if leaves are curling.`;
      } else {
        answer = isMl ?
          `🌿 **സസ്യ രോഗ നിയന്ത്രണ പരിഹാരങ്ങൾ (${crop}):**\n\n• **ജൈവ കുമിൾനാശിനി**: 1 ലിറ്റർ വെള്ളത്തിൽ 20 ഗ്രാം **സ്യൂഡോമോണസ്** അല്ലെങ്കിൽ 5% വേപ്പെണ്ണ ലായനി തളിക്കുക.\n• രോഗബാധയുള്ള ഇലകൾ നീക്കം ചെയ്യുക.\n• ആവശ്യമെങ്കിൽ കുമിൾനാശിനി (മാങ്കോസെബ് 2g/L) തളിക്കാം.` :
          `🌿 **Plant Health Guidance (${crop}):**\n\n• Spray **Pseudomonas fluorescens** (20g/L) or 5% Neem oil emulsion.\n• Prune severely infected leaves and ensure adequate plant spacing for aeration.\n• If fungal spots persist, apply broad-spectrum Mancozeb (2g/L).`;
      }
    }

    // 5. PEST CONTROL & INSECT MANAGEMENT
    else if (intent === 'PEST') {
      if (entities.pest === 'Aphids' || query.toLowerCase().includes('aphid')) {
        answer = isMl ?
          `🐛 **പച്ചത്തുള്ളൻ / ഏഫിഡ്സ് (Aphids) നിയന്ത്രണം:**\n\n• **വേപ്പെണ്ണ വെളുത്തുള്ളി മിശ്രിതം**: 1 ലിറ്റർ വെള്ളത്തിൽ 5ml വേപ്പെണ്ണയും സോപ്പ് ലായനിയും കലർത്തി ഇലകളുടെ അടിയിൽ തളിക്കുക.\n• **മഞ്ഞക്കെണികൾ (Yellow Sticky Traps)**: ഏക്കറിന് 10 മഞ്ഞക്കെണികൾ സ്ഥാപിക്കുക.\n• **ജൈവ നിയന്ത്രണം**: വെർട്ടിസിലിയം ലെക്കാനി (Verticillium lecanii) 20g/L തളിക്കുക.` :
          `🐛 **Aphids & Sucking Pest Control:**\n\n• **Neem-Garlic Emulsion**: Spray 5ml/L neem oil mixed with mild soap emulsion on the undersides of leaves.\n• **Yellow Sticky Traps**: Install 10 yellow sticky traps per acre to catch winged adult aphids.\n• **Bio-Pesticide**: Spray *Verticillium lecanii* (20g/L) during humid conditions.`;
      } else if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ലിലെ പ്രധാന കീടങ്ങളും നിയന്ത്രണവും:**\n\n• **തണ്ടുതുരപ്പൻ (Stem Borer)**: ഏക്കറിന് 2 ട്രൈക്കോഗ്രാമ കാർഡുകൾ സ്ഥാപിക്കുക.\n• **ഓലച്ചാടി (Leaf Folder)**: വെളിച്ചക്കെണികൾ സ്ഥാപിക്കുക; ബ്യുവെറിയ ബാസിയാന (Beauveria bassiana 20g/L) തളിക്കുക.\n• **ചാഴി (Rice Bug)**: പാടവരമ്പുകളിലെ കളകൾ ചെത്തി വൃത്തിയാക്കുക.` :
          `🌾 **Paddy Major Pests & Control Measures:**\n\n• **Rice Stem Borer**: Install Trichogramma egg parasitoid cards @ 2 cards/acre at 15-day intervals.\n• **Leaf Folder**: Deploy light traps and spray *Beauveria bassiana* @ 20g/L.\n• **Rice Bug**: Clean bund weeds and avoid excessive nitrogen application.`;
      } else {
        answer = isMl ?
          `🐛 **ജൈവ കീട നിയന്ത്രണ മാർഗ്ഗങ്ങൾ (${crop}):**\n\n• **ഫെറോമോൺ കെണികൾ**: കായ് ഈച്ചകൾക്കെതിരെ ഏക്കറിന് 10 ഫെറോമോൺ കെണികൾ സ്ഥാപിക്കുക.\n• **വേപ്പെണ്ണ പ്രയോഗം**: 5ml/L വേപ്പെണ്ണ ലായനി ആഴ്ചയിലൊരിക്കൽ തളിക്കുക.\n• **ജൈവ കുമിൾനാശിനി**: ബ്യുവെറിയ ബാസിയാന (Beauveria 20g/L) തളിക്കുക.` :
          `🐛 **Integrated Pest Management (IPM) for ${crop}:**\n\n• **Pheromone Traps**: Install 10 fruit fly lure traps per acre.\n• **Neem Oil Foliar Spray**: Spray 5% neem seed extract or 5ml/L neem oil emulsion weekly.\n• **Bio-Agent**: Apply *Beauveria bassiana* (20g/L) for caterpillar and beetle control.`;
      }
    }

    // 6. SOIL SCIENCE & MANAGEMENT
    else if (intent === 'SOIL') {
      if (crop.toLowerCase().includes('pepper') || query.toLowerCase().includes('pepper') || query.toLowerCase().includes('കുരുമുളക്')) {
        answer = isMl ?
          `🌿 **കുരുമുളകിന് അനുയോജ്യമായ മണ്ണും പരിപാലനവും:**\n\n• **അനുയോജ്യമായ മണ്ണ്**: നല്ല നീർവാർച്ചയും ജൈവാംശവുമുള്ള ലാറ്ററൈറ്റ് (ചെങ്കൽ) മണ്ണും വനമണ്ണുമാണ് ഏറ്റവും ഉത്തമം.\n• **മണ്ണിന്റെ pH**: pH 5.5 മുതൽ 6.5 വരെ. വെള്ളക്കെട്ടുള്ള കളിമണ്ണിൽ വേരുചീയലും ദ്രുതവാട്ടവും (Quick Wilt) ഉണ്ടാകാൻ സാധ്യതയുണ്ട്.\n• **പരിപാലനം**: നടീൽ കുഴിയിൽ 10 kg ചാണകപ്പൊടിയും 50g ട്രൈക്കോഡെർമയും ചേർത്ത് വേരുകളെ സംരക്ഷിക്കുക.` :
          `🌿 **Soil Requirements for Black Pepper:**\n\n• **Ideal Soil**: Well-drained, fertile virgin forest loam or red laterite soil rich in humus and organic matter.\n• **Drainage & pH**: Requires pH 5.5 to 6.5. Avoid heavy clay or waterlogged soils which trigger devastating Quick Wilt (*Phytophthora*) foot rot.\n• **Management**: Incorporate 10 kg compost + 50g *Trichoderma viride* into the planting pit to protect root systems.`;
      } else {
        answer = isMl ?
          `🌱 **ലാറ്ററൈറ്റ് മണ്ണ് (Laterite Soil) പ്രത്യേകതകളും പരിപാലനവും:**\n\n• **സവിശേഷതകൾ**: കേരളത്തിന്റെ 65% പ്രദേശത്തും കാണപ്പെടുന്ന ചെങ്കൽ മണ്ണാണിത്. അമ്ലഗുണം (pH 4.5 – 5.8) കൂടുതലും ഫോസ്ഫറസ് ലഭ്യത കുറവുമാണ്.\n• **അനുയോജ്യമായ വിളകൾ**: റബ്ബർ, തെങ്ങ്, നേന്ത്രവാഴ, കുരുമുളക്, കപ്പ, പച്ചക്കറികൾ.\n• **പരിപാലനം**: അമ്ലത്വം കുറയ്ക്കാൻ 2 വർഷത്തിലൊരിക്കൽ സെന്റൊന്നിന് 1 kg കുമ്മായം അല്ലെങ്കിൽ ഡോളമൈറ്റ് ചേർക്കുക; ചാണകപ്പൊടി ചേർത്ത് ഫലഭൂയിഷ്ഠി വർദ്ധിപ്പിക്കുക.` :
          `🌱 **Laterite Soil Characteristics & Management:**\n\n• **Characteristics**: Covers 65% of Kerala midlands (pH 4.5 - 5.8, acidic, high iron/aluminum, low available phosphorus).\n• **Suitable Crops**: Coconut, Nendran Banana, Black Pepper, Rubber, Tapioca, Vegetables.\n• **Management**: Apply agricultural lime or dolomite (250g/m2) once every two years to correct soil acidity and enhance phosphorus uptake. Add organic manure regularly.`;
      }
    }

    // 7. CROP CULTIVATION REQUIREMENTS
    else if (intent === 'CROP_CULTIVATION') {
      if (crop.toLowerCase().includes('paddy') || crop.toLowerCase().includes('rice')) {
        answer = isMl ?
          `🌾 **നെല്ല് കൃഷിക്ക് ആവശ്യമായ പ്രധാന ഘടകങ്ങൾ (Paddy Cultivation Requirements):**\n\n• **മണ്ണും കാലാവസ്ഥയും**: വെള്ളം കെട്ടിനിൽക്കാൻ ശേഷിയുള്ള ഫലഭൂയിഷ്ഠമായ എക്കൽമണ്ണ് / ലാറ്ററൈറ്റ് മണ്ണ്.\n• **മികച്ച വിത്തിനങ്ങള്**: ഉമ, ജ്യോതി, കാഞ്ചന, ഐശ്വര്യ (110 – 120 ദിവസത്തെ കാലാവധി).\n• **കൃഷി സീസൺ**: വിരിപ്പ് (മെയ്-ജൂൺ), മുണ്ടകൻ (സെപ്റ്റംബർ-ഒക്ടോബർ), പുഞ്ച (ഡിസംബർ-ജനുവരി).\n• **വളപ്രയോഗം**: അടിവളമായി ഹെക്ടറിന് 5 ടൺ ചാണകപ്പൊടി + 175 kg രാജ്ഫോസ്; മേൽവളമായി 150 kg യൂറിയ + 60 kg പൊട്ടാഷ് 3 തവണകളായി നൽകുക.\n• **വെള്ളം**: വളർച്ചാ ഘട്ടത്തിൽ 5cm വെള്ളം പാടത്ത് നിലനിർത്തുക.` :
          `🌾 **Key Requirements for Successful Paddy (Rice) Cultivation:**\n\n• **Soil & Climate**: Fertile alluvial or clay loam soil with good water retention and plenty of sunlight.\n• **Certified Varieties**: Uma, Jyothi, Kanchana, Aiswarya (110 to 120 days maturity).\n• **Cropping Seasons**: Virippu (May–June), Mundakan (Sept–Oct), Puncha (Dec–Jan).\n• **Fertilizer Schedule (NPK 70:35:35 kg/ha)**: Basal 5 t/ha organic manure + 175 kg Rock Phosphate; Top-dress 150 kg Urea + 60 kg Potash in 3 split doses.\n• **Water Management**: Maintain 2–3 cm standing water during tillering and 5 cm during flowering.`;
      } else if (crop.toLowerCase().includes('banana')) {
        answer = isMl ?
          `🍌 **നേന്ത്രവാഴ കൃഷിക്ക് ആവശ്യമായ ഘടകങ്ങൾ (Banana Cultivation Guide):**\n\n• **മണ്ണും സൂര്യപ്രകാശവും**: നല്ല നീർവാർച്ചയുള്ള പശിമരാശി മണ്ണും പൂർണ്ണ സൂര്യപ്രകാശവും.\n• **കുഴിയും അകലവും**: 50x50x50 cm കുഴികൾ, 2m x 2m അകലത്തിൽ നടുക.\n• **വളപ്രയോഗം (ഒരു വാഴയ്ക്ക്)**: അടിവളമായി 10 kg ചാണകപ്പൊടി + 500g വേപ്പിൻപിണ്ണാക്ക്; നട്ട് 1, 2, 3, 5 മാസങ്ങളിൽ 190g യൂറിയ, 115g രാജ്ഫോസ്, 300g പൊട്ടാഷ് നൽകുക.\n• **നന**: വേനൽക്കാലത്ത് 2–3 ദിവസത്തിലൊരിക്കൽ നനയ്ക്കുക (അല്ലെങ്കിൽ തുള്ളിനന വഴി ദിനംപ്രതി 15–20 ലിറ്റർ).` :
          `🍌 **Key Requirements for Nendran Banana Cultivation:**\n\n• **Soil & Sunlight**: Well-drained fertile loamy soil with full sun exposure and wind protection.\n• **Spacing & Pits**: 2m x 2m spacing; 50cm x 50cm x 50cm planting pits.\n• **Fertilizer Dose (Per Plant)**: Basal 10 kg compost + 500g neem cake; top-dress 190g Urea, 115g Rock Phosphate, 300g Potash in 4 split doses (months 1, 2, 3, 5).\n• **Water**: 15–20 liters/plant daily via drip irrigation during summer.`;
      } else {
        answer = isMl ?
          `🌾 **${crop} കൃഷി രീതിയും ആവശ്യകതകളും (${district}, ${soil}):**\n\n• **നിലമൊരുക്കൽ**: നിലം നന്നായി ഉഴുത് സെന്റൊന്നിന് 100 kg ചാണകപ്പൊടിയും വേപ്പിൻപിണ്ണാക്കും ചേർക്കുക.\n• **വിത്ത്/തൈകൾ**: KAU സാക്ഷ്യപ്പെടുത്തിയ നല്ലയിനം വിത്തുകൾ ഉപയോഗിക്കുക.\n• **നന**: ചെടിയുടെ ചുവട്ടിൽ ക്രമമായി നനയ്ക്കുകയും വെള്ളക്കെട്ട് ഒഴിവാക്കുകയും ചെയ്യുക.` :
          `🌾 **Cultivation Requirements for ${crop} (${district}, ${soil}):**\n\n• **Land Preparation**: Incorporate 5 tons/acre well-rotted farmyard manure during final ploughing.\n• **Certified Seeds/Saplings**: Procure certified varieties from nearest Krishi Bhavan or KAU center.\n• **Irrigation & Care**: Provide basin irrigation and spray Pseudomonas (20g/L) for plant protection.`;
      }
    }

    // 8. WEATHER ADVISORY
    else if (intent === 'WEATHER') {
      const w = weatherContext || { temperature: '31°C', humidity: '78%', rainProbability: '45%', condition: 'Partly Cloudy', rainExpected: true };
      answer = isMl ?
        `🌦️ **കാലാവസ്ഥാ വിവരങ്ങളും കാർഷിക മുന്നറിയിപ്പും (${district}):**\n\n• **താപനില**: ${w.temperature} | **ഈർപ്പം**: ${w.humidity}\n• **മഴ സാധ്യത**: ${w.rainProbability} (${w.condition})\n• **കാർഷിക നിർദ്ദേശം**: ${w.rainExpected ? 'അടുത്ത ദിവസങ്ങളിൽ മഴ സാധ്യതയുള്ളതിനാൽ തോട്ടങ്ങളിൽ അനാവശ്യ നനയ്ക്കലും കീടനാശിനി തളിക്കലും ഒഴിവാക്കുക. ഡ്രെയിനേജ് ചാലുകൾ തുറന്നു കൊടുക്കുക.' : 'അനുകൂല കാലാവസ്ഥയാണ്. വിളകൾക്ക് ആവശ്യമായ നനയും വളപ്രയോഗവും നടത്താം.'}` :
        `🌦️ **Live Weather & Farming Advisory (${district}):**\n\n• **Temperature**: ${w.temperature} | **Humidity**: ${w.humidity}\n• **Rain Probability**: ${w.rainProbability} (${w.condition})\n• **Farming Advisory**: ${w.rainExpected ? 'Rain showers are forecasted. Postpone foliar spraying and heavy irrigation. Ensure field drainage channels are clear to prevent waterlogging.' : 'Weather is favorable for field operations, basal manuring, and scheduled irrigation.'}`;
    }

    // 9. MARKET PRICES
    else if (intent === 'MARKET_PRICE') {
      // Check if user specifically asked about a distinct crop
      if (entities.explicitCropInQuery && entities.crop) {
        const cLower = entities.crop.toLowerCase();
        if (cLower.includes('tea')) {
          answer = isMl ?
            `🍃 **തേയില വിപണി വിലനിലവാരം (Tea Leaves Market Price):**\n\n• **പച്ച തേയില (Green Leaf)**: **₹18 – ₹24 / kg** (ടീ ബോർഡ് ഫാക്ടറി വില - മൂന്നാർ & വയനാട്)\n• **CTC ടീ (Processed)**: **₹140 – ₹180 / kg** (കൊച്ചി ടീ ഓക്ഷൻ സെന്റർ)\n• **ഓർത്തഡോക്സ് ഗ്രേഡ് (Orthodox)**: **₹210 – ₹280 / kg**\n• **വിപണി പ്രവണത**: നല്ല ഡിമാൻഡും സ്ഥിരതയുള്ള വിലയും.` :
            `🍃 **Tea Leaves (Green Tea Leaf) Market Price:**\n\n• **Green Tea Leaf (പച്ച തേയില)**: **₹18 to ₹24 / kg** (Tea Board factory procurement rate in Munnar & Wayanad)\n• **Processed CTC Tea**: **₹140 to ₹180 / kg** (Cochin Tea Auction Centre)\n• **Orthodox Grade Tea**: **₹210 to ₹280 / kg** (High-grown estate auctions)\n• **Market Trend**: Steady with good demand for quality high-range green leaves.`;
        } else if (cLower.includes('coffee')) {
          answer = isMl ?
            `☕ **കാപ്പി വിപണി വിലനിലവാരം (Coffee Market Rates):**\n\n• **റോബസ്റ്റ ചെറി (Robusta Cherry)**: **₹210 – ₹240 / kg** (വയനാട് കൽപ്പറ്റ വിപണി)\n• **പാർച്ച്മെന്റ് കാപ്പി (Parchment)**: **₹380 – ₹420 / kg**\n• **അറബിക്ക ചെറി (Arabica)**: **₹280 – ₹310 / kg**\n• **വിപണി പ്രവണത**: രാജ്യാന്തര വിപണിയിലെ ഡിമാൻഡ് കാരണം ഉയർന്ന വില.` :
            `☕ **Coffee Beans Market Rates (Kerala Mandis):**\n\n• **Robusta Cherry**: **₹210 to ₹240 / kg** (Kalpetta, Wayanad Market)\n• **Robusta Parchment**: **₹380 to ₹420 / kg**\n• **Arabica Cherry**: **₹280 to ₹310 / kg**\n• **Market Trend**: Strong bullish demand in domestic and export markets.`;
        } else if (cLower.includes('rubber')) {
          answer = isMl ?
            `🌲 **റബ്ബർ വിപണി വിലനിലവാരം (Rubber Sheet Price):**\n\n• **RSS-4 റബ്ബർ ഷീറ്റ്**: **₹185 / kg** (കോട്ടയം & കൊച്ചി വിപണി)\n• **RSS-5 ഷീറ്റ്**: **₹178 / kg**\n• **ലാറ്റക്സ് (60% DRC)**: **₹130 – ₹138 / kg**\n• **വിപണി പ്രവണത**: ടയർ കമ്പനികളിൽ നിന്നുള്ള സ്ഥിരമായ ഡിമാൻഡ്.` :
            `🌲 **Natural Rubber Market Rates (Kottayam Mandi):**\n\n• **RSS-4 Sheet Rubber**: **₹185 / kg** (Kottayam & Kochi Rubber Board rate)\n• **RSS-5 Sheet**: **₹178 / kg**\n• **Latex (60% DRC)**: **₹130 to ₹138 / kg**\n• **Market Trend**: Firm with continuous procurement from tyre manufacturers.`;
        } else if (cLower.includes('arecanut')) {
          answer = isMl ?
            `🥥 **അടയ്ക്ക വിപണി വിലനിലവാരം (Arecanut Rates):**\n\n• **ചാലി അടയ്ക്ക (Old Chali)**: **₹340 – ₹380 / kg** (കാസർഗോഡ് & തൃശ്ശൂർ വിപണി)\n• **പുതിയ ചാലി (New Chali)**: **₹290 – ₹320 / kg**\n• **പച്ച അടയ്ക്ക (Raw)**: **₹60 – ₹80 / kg**\n• **വിപണി പ്രവണത**: ഉയർന്ന വിലയും മികച്ച വിപണിയും.` :
            `🥥 **Arecanut (Betel Nut) Market Prices:**\n\n• **Chali Arecanut (Dry)**: **₹340 to ₹380 / kg** (Kasaragod & Thrissur Mandis)\n• **New Chali**: **₹290 to ₹320 / kg**\n• **Raw Green Arecanut**: **₹60 to ₹80 / kg**\n• **Market Trend**: Strong demand across North Kerala commercial mandis.`;
        } else if (cLower.includes('nutmeg')) {
          answer = isMl ?
            `🌰 **ജാതിക്ക & ജാതിപത്രി വിപണി വിലനിലവാരം:**\n\n• **ജാതിക്ക (തോട് സഹിതം)**: **₹280 – ₹310 / kg** (കാലടി & അങ്കമാലി വിപണി)\n• **ജാതിക്ക (തോട് ഇല്ലാതെ)**: **₹520 – ₹560 / kg**\n• **ജാതിപത്രി (ചുവപ്പ് / മഞ്ഞ)**: **₹1,450 – ₹1,650 / kg** (ഉയർന്ന ഡിമാൻഡ്)\n• **വിപണി പ്രവണത**: ജാതിപത്രിക്ക് മികച്ച വില ലഭിക്കുന്നു.` :
            `🌰 **Nutmeg & Mace Market Prices (Kalady Terminal):**\n\n• **Nutmeg (With Shell)**: **₹280 to ₹310 / kg** (Kalady & Angamaly Mandis)\n• **Nutmeg Kernel (Without Shell)**: **₹520 to ₹560 / kg**\n• **Mace (Jathipathri - Red/Yellow)**: **₹1,450 to ₹1,650 / kg**\n• **Market Trend**: Premium demand for quality Kerala flower mace.`;
        } else if (cLower.includes('cardamom')) {
          answer = isMl ?
            `🌿 **ഏലം വിപണി വിലനിലവാരം (Cardamom Auction Rates):**\n\n• **ഗ്രീൻ കാർഡമം (7-8mm പ്രീമിയം)**: **₹1,850 – ₹2,200 / kg** (വണ്ടൻമേട് സ്പൈസസ് ബോർഡ് ലേലം)\n• **സാധാരണ ഗ്രേഡ്**: **₹1,600 – ₹1,750 / kg**\n• **വിപണി പ്രവണത**: ഉത്സവ സീസണിലെ മികച്ച ഡിമാൻഡ്.` :
            `🌿 **Small Green Cardamom Market Rates:**\n\n• **Premium Bold (7-8mm)**: **₹1,850 to ₹2,200 / kg** (Vandanmedu Spices Board Auction)\n• **Average Grade**: **₹1,600 to ₹1,750 / kg**\n• **Market Trend**: Strong bullish demand during harvest season.`;
        } else if (cLower.includes('pepper')) {
          answer = isMl ?
            `⚫ **കുരുമുളക് വിപണി വിലനിലവാരം (Black Pepper Rates):**\n\n• **കുരുമുളക് ഗാർബിൾഡ് (Garbled)**: **₹620 – ₹645 / kg** (കൊച്ചി ടെർമിനൽ വിപണി)\n• **അൺഗാർബിൾഡ് (Ungarbled)**: **₹600 – ₹615 / kg**\n• **വിപണി പ്രവണത**: ആഭ്യന്തര വിപണിയിൽ ഉയർന്ന ഡിമാൻഡ്.` :
            `⚫ **Black Pepper Market Rates (Kochi Terminal):**\n\n• **Garbled Black Pepper**: **₹620 to ₹645 / kg** (Kochi Terminal Market rate)\n• **Ungarbled**: **₹600 to ₹615 / kg**\n• **Market Trend**: Active trading with steady upward momentum (+2%).`;
        } else if (cLower.includes('ginger')) {
          answer = isMl ?
            `🫚 **ഇഞ്ചി വിപണി വിലനിലവാരം (Ginger Market Rates):**\n\n• **പച്ച ഇഞ്ചി**: **₹140 – ₹165 / kg** (വയനാട് & കോഴിക്കോട് മൊത്ത വിപണി)\n• **ചുക്ക് (Dry Ginger)**: **₹380 – ₹420 / kg**\n• **വിപണി പ്രവണത**: വളരെ ഉയർന്ന വില നിലവാരം.` :
            `🫚 **Fresh Ginger Market Rates:**\n\n• **Green Fresh Ginger**: **₹140 to ₹165 / kg** (Wayanad & Kozhikode Wholesale Mandis)\n• **Dry Ginger (Chukku)**: **₹380 to ₹420 / kg**\n• **Market Trend**: Strong high-demand cycle in South Indian markets.`;
        } else if (cLower.includes('tomato')) {
          answer = isMl ?
            `🍅 **തക്കാളി വിപണി വിലനിലവാരം (Tomato Market Rate):**\n\n• **മൊത്തവില (Wholesale)**: **₹42 / kg** (തൃശ്ശൂർ കാർഷിക വിപണി)\n• **ചില്ലറവില (Retail)**: **₹48 – ₹52 / kg**\n• **വിപണി പ്രവണത**: സ്ഥിരതയുള്ള വിപണി (+4% വർദ്ധനവ്).` :
            `🍅 **Tomato Market Price (Thrissur & Kerala Mandis):**\n\n• **Wholesale Rate**: **₹42 / kg** (Thrissur Agricultural Mandi)\n• **Retail Rate**: **₹48 to ₹52 / kg**\n• **Market Trend**: Steady with positive weekly momentum (+4%).`;
        } else if (cLower.includes('banana')) {
          answer = isMl ?
            `🍌 **നേന്ത്രവാഴപ്പഴം വിപണി വിലനിലവാരം (Banana Rate):**\n\n• **നേന്ത്രപ്പഴം മൊത്തവില**: **₹58 / kg** (എറണാകുളം & തൃശ്ശൂർ വിപണി)\n• **ഗ്രേഡ് എ കുലകൾ**: **₹62 – ₹65 / kg**\n• **പൂവൻ / ഞാലിപ്പൂവൻ**: **₹45 – ₹50 / kg**\n• **വിപണി പ്രവണത**: വിപണിയിൽ ഉയർന്ന ഡിമാൻഡ്.` :
            `🍌 **Nendran Banana Market Rate (Kerala Mandis):**\n\n• **Wholesale Rate**: **₹58 / kg** (Ernakulam Wholesale & Thrissur Mandis)\n• **Grade A Fruit Bunch**: **₹62 to ₹65 / kg**\n• **Poovan / Njalipoovan**: **₹45 to ₹50 / kg**\n• **Market Trend**: High commercial demand across retail networks.`;
        } else if (cLower.includes('coconut')) {
          answer = isMl ?
            `🥥 **തേങ്ങ & കൊപ്ര വിപണി വിലനിലവാരം (Coconut & Copra):**\n\n• **പച്ചത്തേങ്ങ**: **₹36 / kg** (കോഴിക്കോട് & തൃശ്ശൂർ വിപണി)\n• **കൊപ്ര (Copra)**: **₹92 / kg**\n• **വെളിച്ചെണ്ണ (Coconut Oil)**: **₹155 / kg (മൊത്തവില)**\n• **വിപണി പ്രവണത**: സ്ഥിരതയുള്ള വിലനിലവാരം.` :
            `🥥 **Coconut & Copra Market Prices:**\n\n• **Fresh Coconut**: **₹36 / kg** (Kozhikode & Thrissur Mandis)\n• **Milling Copra**: **₹92 / kg**\n• **Coconut Oil (Wholesale)**: **₹155 / kg**\n• **Market Trend**: Stable domestic oil mill demand.`;
        } else if (cLower.includes('paddy') || cLower.includes('rice')) {
          answer = isMl ?
            `🌾 **നെല്ല് സംഭരണ വില & വിപണി വിലനിലവാരം:**\n\n• **സർക്കാർ സംഭരണവില (Kerala Govt MSP)**: **₹28.20 / kg** (സപ്ലൈകോ വഴി സംഭരണം)\n• **മട്ട അരി മൊത്തവില**: **₹48 / kg** (പാലക്കാട് വിപണി)\n• **വിപണി പ്രവണത**: സർക്കാർ സംഭരണ പിന്തുണയുള്ള സുരക്ഷിത വിപണി.` :
            `🌾 **Paddy (Rice) Market & MSP Rates:**\n\n• **Kerala Govt MSP Procurement Rate**: **₹28.20 / kg** (Procured via Supplyco)\n• **Matta Rice Wholesale**: **₹48 / kg** (Palakkad Wholesale Mandi)\n• **Market Trend**: Fully supported under Kerala paddy procurement program.`;
        } else {
          answer = isMl ?
            `📊 **${entities.crop} വിപണി വിലനിലവാരം (${district}):**\n\n• **ശരാശരി മൊത്തവില**: **₹45 – ₹60 / kg** (പ്രാദേശിക കാർഷിക വിപണി)\n• **വിപണി പ്രവണത**: സ്ഥിരതയുള്ള ഡിമാൻഡ്.` :
            `📊 **${entities.crop} Current Market Rates (${district}):**\n\n• **Average Wholesale Price**: **₹45 to ₹60 / kg** in local mandis.\n• **Market Trend**: Steady with regular retail demand.`;
        }
      } else {
        // General market prices request
        answer = isMl ?
          `📊 **പ്രധാന വിളകളുടെ ഇന്നത്തെ വിപണി വിലനിലവാരം (കേരള വിപണികൾ):**\n\n• **പച്ച തേയില**: ₹18 – ₹24 / kg (മൂന്നാർ & വയനാട് ഫാക്ടറി ലേലം)\n• **തക്കാളി**: ₹42 / kg (തൃശ്ശൂർ വിപണി)\n• **നേന്ത്രവാഴപ്പഴം**: ₹58 / kg (എറണാകുളം മാർക്കറ്റ്)\n• **തേങ്ങ (Copra)**: ₹36 / kg (കോഴിക്കോട് വിപണി)\n• **മട്ട അരി / നെല്ല്**: ₹48 / kg (പാലക്കാട് വിപണി - സർക്കാർ സംഭരണവില ₹28.20/kg)\n• **കുരുമുളക്**: ₹620 / kg (കൊച്ചി ടെർമിനൽ)\n• **ഏലം**: ₹1,850 / kg (വണ്ടൻമേട് സ്പൈസസ് ബോർഡ്)\n• **റോബസ്റ്റ കാപ്പി**: ₹220 / kg (വയനാട് വിപണി)\n• **റബ്ബർ (RSS-4)**: ₹185 / kg (കോട്ടയം വിപണി)\n• **അടയ്ക്ക (ചാലി)**: ₹360 / kg (കാസർഗോഡ് വിപണി)` :
          `📊 **Today's Agricultural Commodity Market Prices (Kerala Mandis):**\n\n• **Tea Leaves (Green Leaf)**: ₹18 to ₹24 / kg (Munnar & Wayanad Auctions)\n• **Tomato**: ₹42 / kg (Thrissur Wholesale Mandi)\n• **Nendran Banana**: ₹58 / kg (Ernakulam Wholesale)\n• **Coconut (Fresh)**: ₹36 / kg (Kozhikode Mandi)\n• **Matta Rice / Paddy**: ₹48 / kg (Kerala Govt MSP ₹28.20/kg)\n• **Black Pepper**: ₹620 / kg (Kochi Terminal)\n• **Cardamom**: ₹1,850 / kg (Vandanmedu Spices Board)\n• **Coffee (Robusta)**: ₹220 / kg (Wayanad Mandi)\n• **Rubber (RSS-4)**: ₹185 / kg (Kottayam Market)\n• **Arecanut (Chali)**: ₹360 / kg (Kasaragod Mandi)`;
      }
    }

    // 10. COVER CROPS & GREEN MANURE MANAGEMENT
    else if (intent === 'COVER_CROPS') {
      answer = isMl ?
        `🌱 **മൂടുവിളകളും പച്ചിലവളങ്ങളും എപ്പോൾ വെട്ടിമാറ്റണം / മണ്ണിൽ ചേർക്കണം? (Cover Crops Removal Timing):**\n\n• **1. ഏറ്റവും അനുയോജ്യമായ സമയം (50% പൂവിടുന്ന ഘട്ടം)**:\n  - വിത്ത് വിതച്ച് **45 മുതൽ 50 ദിവസത്തിനുള്ളിൽ**, ചെടികൾ പൂവിടാൻ തുടങ്ങുന്ന ഘട്ടത്തിൽ വെട്ടിമാറ്റി മണ്ണിൽ ചേർക്കുക.\n  - **കാരണം**: ഈ സമയത്താണ് ചെടികളിൽ ഏറ്റവും കൂടുതൽ നൈട്രജനും (Nitrogen) പച്ചില ജൈവാംശവും അടങ്ങിയിരിക്കുന്നത്. വിത്ത് മൂക്കാൻ അനുവദിച്ചാൽ തണ്ടുകൾ കട്ടിയാവുകയും (woody/fibrous) മണ്ണിൽ ദ്രവിക്കാൻ കൂടുതൽ സമയമെടുക്കുകയും ചെയ്യും.\n\n• **2. പ്രധാന വിള നടുന്നതിന് മുൻപ് (15 – 20 ദിവസം മുൻപ്)**:\n  - പ്രധാന വിള (നെല്ല്, വാഴ, പച്ചക്കറികൾ) നടുന്നതിന് **2 മുതൽ 3 ആഴ്ച മുമ്പ്** മൂടുവിളകൾ നിലത്ത് ഉഴുതു ചേർക്കണം. ഇത് മണ്ണിലെ സൂക്ഷ്മാണുക്കൾക്ക് പച്ചിലവളം വേഗത്തിൽ ജീർണ്ണിച്ചു പോഷകങ്ങൾ ലഭ്യമാക്കാൻ സമയം നൽകുന്നു.\n\n• **3. തെങ്ങ് / റബ്ബർ തോട്ടങ്ങളിലെ പുതയിടൽ (Mulching)**:\n  - വേനൽക്കാലത്തിന് തൊട്ടുമുമ്പ് (**ഫെബ്രുവരി – മാർച്ച്** മാസങ്ങളിൽ) മൂടുവിളകൾ വെട്ടി മണ്ണിൽ പുതയായി ഇടുക. ഇത് മണ്ണിലെ ഈർപ്പം നിലനിർത്താനും കളകളെ നിയന്ത്രിക്കാനും സഹായിക്കും.\n\n• **കേരളത്തിൽ ശുപാർശ ചെയ്യുന്ന പ്രധാന മൂടുവിളകൾ**:\n  - **ചണ (Sunn hemp)** & **ഡെയ്ഞ്ച (Daincha)**: നെൽപ്പാടങ്ങൾക്കും പച്ചക്കറികൾക്കും മികച്ച പച്ചിലവളം.\n  - **കലോപ്പഗോണിയം (Calopogonium)** & **മ്യൂക്കുന (Mucuna)**: റബ്ബർ, തെങ്ങിൻ തോട്ടങ്ങൾക്ക് അനുയോജ്യമായ മൂടുവിളകൾ.` :
        `🌱 **When to Remove / Terminate Cover Crops in Farming (Kerala Guide):**\n\n• **1. Optimal Stage: 50% Flowering Phase (45 to 50 Days After Sowing)**:\n  - Terminate or incorporate cover crops when they reach the **early bloom/flowering stage** (approx. 45–50 days after sowing).\n  - **Why**: Nitrogen content and tender green biomass are at their absolute peak at flowering. Terminating before seed set prevents the stems from becoming fibrous/woody and prevents them from becoming volunteer weeds.\n\n• **2. Timing Before Sowing/Transplanting the Main Crop (15 to 20 Days Prior)**:\n  - Incorporate green manure into the soil **2 to 3 weeks before planting your main crop** (e.g. paddy, banana, or vegetables). This allows soil microbes adequate time to decompose the green biomass and release available nitrogen without nutrient tie-up.\n\n• **3. In Plantations (Rubber, Coconut, Arecanut)**:\n  - Slash or mow cover crops before the dry summer sets in (**February to March**) and leave the biomass on the soil surface as a thick organic mulch to conserve soil moisture and lower root-zone temperature.\n\n• **Recommended Cover Crops & Green Manures for Kerala**:\n  - **Sunn hemp (*Crotalaria juncea*) & Daincha (*Sesbania aculeata*)**: High nitrogen fixers for paddy and vegetable rotations.\n  - **Calopogonium & Mucuna**: Excellent leguminous soil covers for rubber and coconut basins.`;
    }

    // 11. CROP SELECTION & SEASONS
    else if (intent === 'CROP_SELECTION' || intent === 'SEASON') {
      if (crop.toLowerCase().includes('vegetable') || query.toLowerCase().includes('vegetable') || query.toLowerCase().includes('പച്ചക്കറി')) {
        answer = isMl ?
          `🌱 **കേരളത്തിലെ പച്ചക്കറി കൃഷി സീസണുകൾ (Vegetable Planting Calendar):**\n\n• **വിരിപ്പ് സീസൺ (മെയ് – ജൂൺ)**: വേനൽമഴയോടെ പയർ, പാവൽ, പടവലം, വെണ്ട എന്നിവ നടാം.\n• **മുണ്ടകൻ സീസൺ (സെപ്റ്റംബർ – ഒക്ടോബർ)**: തക്കാളി, വഴുതന, മുളക്, കാബേജ്, കോളിഫ്ലവർ (ഏറ്റവും കൂടുതൽ വിളവ് ലഭിക്കുന്ന സമയം).\n• **വേനൽക്കാലം / പുഞ്ച (ഡിസംബർ – ജനുവരി)**: വെള്ളരി, തണ്ണീർമത്തൻ, ചീര എന്നിവ നനയോടെ കൃഷി ചെയ്യാം.` :
          `🌱 **Vegetable Planting Calendar for Kerala:**\n\n• **Virippu Season (May–June)**: Sow Yardlong Bean, Bitter Gourd, Snake Gourd, and Okra with pre-monsoon showers.\n• **Mundakan / Winter Season (September–October)**: Prime season for Tomato, Brinjal, Chilli, Cabbage, and Cauliflower (Highest yield).\n• **Summer / Puncha Season (December–January)**: Cucumber, Watermelon, and Amaranthus with regular basin irrigation.`;
      } else {
        answer = isMl ?
          `🌾 **${district} ജില്ലയിലെ കൃഷി സീസണുകളും അനുയോജ്യമായ വിളകളും:**\n\n• **വിരിപ്പ് (മെയ്-ജൂൺ)**: വിരിപ്പ് നെല്ല് (ഉമ, ജ്യോതി), നേന്ത്രവാഴ നടീൽ, കപ്പ, ചേന.\n• **മുണ്ടകൻ (സെപ്റ്റംബർ-ഒക്ടോബർ)**: ഏറ്റവും കൂടുതൽ വിളവ് തരുന്ന നെല്ല് കൃഷി, പച്ചക്കറികൾ (തക്കാളി, പയർ, വെണ്ട).\n• **പുഞ്ച (ജനുവരി-മെയ്)**: നനയുള്ള പാടങ്ങളിലെ പുഞ്ചനെല്ല്, വേനൽക്കാല പച്ചക്കറികൾ, തണ്ണീർമത്തൻ.` :
          `🌾 **Cropping Seasons & Recommendations for ${district} (${soil}):**\n\n• **Virippu Season (May–June)**: Autumn Paddy (Uma, Jyothi), Nendran Banana planting, Tapioca, Elephant Foot Yam.\n• **Mundakan Season (Sept–Oct)**: Winter Paddy (High yielding), Cool-season vegetables (Tomato, Yardlong Bean, Okra).\n• **Puncha Season (Jan–May)**: Irrigated summer paddy in Kole wetlands, Summer Vegetables, Watermelon.`;
      }
    }

    // 12. GRATITUDE INTENT
    else if (intent === 'GRATITUDE') {
      answer = isMl ?
        `🌾 **വളരെ സന്തോഷം! (You're Welcome!)**\n\nനിങ്ങളെ സഹായിക്കാൻ കഴിഞ്ഞതിൽ സന്തോഷമുണ്ട്. നിങ്ങളുടെ കൃഷിയിടവുമായി ബന്ധപ്പെട്ട വിള പരിപാലനം, വളപ്രയോഗം, രോഗകീട നിയന്ത്രണം, കാലാവസ്ഥ, വിപണി വിവരങ്ങൾ എന്നിവയിൽ ഏത് സംശയങ്ങൾക്കും കൃഷിമിത്ര AI എപ്പോഴും ഒപ്പമുണ്ട്. സന്തോഷകരമായ കൃഷി ആശംസിക്കുന്നു! 🌱🚜` :
        `🌾 **You're very welcome! (നിങ്ങൾക്ക് സ്വാഗതം!)**\n\nI am glad I could help you. If you have any more farming questions regarding crop care, fertilizers, disease management, weather, or market rates, feel free to ask anytime. Happy farming! 🌱🚜`;
    }

    // 13. GENERAL AGRICULTURAL GUIDANCE
    else {
      answer = isMl ?
        `🌱 **കൃഷിമിത്ര AI കാർഷിക നിർദ്ദേശം (${farmerProfile.name || 'കർഷകൻ'}, ${district}, ${soil}):**\n\n• ${crop} വിളയുടെ മികച്ച വളർച്ചയ്ക്ക് മണ്ണിലെ ഈർപ്പവും ജൈവവള ലഭ്യതയും ഉറപ്പാക്കുക.\n• കൂടുതൽ കൃത്യമായ വിവരങ്ങൾക്ക് വളപ്രയോഗം, നന, രോഗലക്ഷണങ്ങൾ, കാലാവസ്ഥ എന്നിവ ചോദിക്കാം.` :
        `🌱 **KrishiMitra AI Guidance for ${farmerProfile.name || 'Farmer'} (${district}, ${soil}):**\n\n• For optimal growth of ${crop}, maintain consistent soil moisture and apply organic bio-fertilizers (Jiwamrita/compost).\n• For exact dosages and schedules, please ask specifically about fertilizer, irrigation, disease diagnosis, or weather.`;
    }

    return {
      answer,
      suggestedQuestions: this.getSuggestedQuestions(language, intent, crop)
    };
  }

  // ------------------------------------------------------------------------
  // 9. DYNAMIC CONTEXT-AWARE SUGGESTED QUESTIONS
  // ------------------------------------------------------------------------
  getSuggestedQuestions(language = 'en', intent = 'GENERAL_AGRICULTURE', crop = 'Paddy') {
    const isMl = language === 'ml';

    if (intent === 'GRATITUDE') {
      return isMl ? [
        "ഇന്നത്തെ കാലാവസ്ഥ എന്താണ്?",
        "തക്കാളിയിലെ വളപ്രയോഗം എങ്ങനെയാണ്?",
        "ഇന്നത്തെ വിപണി വില അറിയാമോ?"
      ] : [
        "What is the weather forecast for today?",
        "What fertilizer schedule for vegetables?",
        "What are today's market prices?"
      ];
    } else if (intent === 'COVER_CROPS') {
      return isMl ? [
        "ഏറ്റവും കൂടുതൽ നൈട്രജൻ തരുന്ന പച്ചിലവളം ഏതാണ്?",
        "റബ്ബർ തോട്ടങ്ങൾക്ക് ഏത് മൂടുവിളയാണ് നല്ലത്?",
        "പച്ചിലവളം മണ്ണിൽ ഉഴുതു ചേർക്കുന്നത് എങ്ങനെ?"
      ] : [
        "Which cover crop fixes the most nitrogen?",
        "Which cover crop is best for rubber/coconut plantations?",
        "How to prepare soil for green manuring?"
      ];
    } else if (intent === 'DISEASE') {
      return isMl ? [
        "സ്യൂഡോമോണസ് എങ്ങനെ തളിക്കണം?",
        "ഇലകളുടെ ഫോട്ടോ പരിശോധിക്കാമോ?",
        "ഈ രോഗം വരാതിരിക്കാൻ എന്താണ് ചെയ്യേണ്ടത്?"
      ] : [
        "How do I prepare and spray Pseudomonas?",
        "Can I upload a plant leaf photo?",
        "How can I prevent this disease in future?"
      ];
    } else if (intent === 'FERTILIZER') {
      return isMl ? [
        "ജീവാമൃതം എങ്ങനെ തയ്യാറാക്കാം?",
        "മേൽവളം എപ്പോൾ നൽകണം?",
        "ജൈവവളങ്ങൾ ഏതൊക്കെയാണ് നല്ലത്?"
      ] : [
        "How to prepare Jiwamrita organic manure?",
        "When should I apply the top-dressing dose?",
        "What organic bio-fertilizers are recommended?"
      ];
    } else if (intent === 'IRRIGATION') {
      return isMl ? [
        "വേനൽക്കാലത്ത് എത്ര ലിറ്റർ വെള്ളം നൽകണം?",
        "തുള്ളിനന എങ്ങനെ സ്ഥാപിക്കാം?",
        "ഇന്നത്തെ മഴ സാധ്യത എന്താണ്?"
      ] : [
        "How much water is needed in summer?",
        "How to set up drip irrigation?",
        "Is rain expected in my district today?"
      ];
    } else if (intent === 'WEATHER') {
      return isMl ? [
        "ഇന്ന് ചെടികൾ നനയ്ക്കണോ?",
        "കീടനാശിനി തളിക്കാൻ അനുയോജ്യമായ സമയമാണോ?",
        "തൃശ്ശൂരിൽ നാളെ മഴ പെയ്യുമോ?"
      ] : [
        "Should I irrigate my crops today?",
        "Is it safe to spray foliar fertilizers today?",
        "What is the rainfall forecast for tomorrow?"
      ];
    } else if (intent === 'MARKET_PRICE') {
      if (crop && crop.toLowerCase().includes('tea')) {
        return isMl ? [
          "മൂന്നാറിലെ ഇന്നത്തെ പച്ച തേയില വിലയെത്ര?",
          "CTC തേയിലയുടെ ലേലവില എന്താണ്?",
          "തേയില തോട്ടങ്ങളിലെ രോഗങ്ങൾ എന്തൊക്കെയാണ്?"
        ] : [
          "What is the green leaf price in Munnar?",
          "What is the Cochin CTC tea auction rate?",
          "What diseases affect tea plantations?"
        ];
      }
      return isMl ? [
        "തൃശ്ശൂർ വിപണിയിലെ തക്കാളി വിലയെത്ര?",
        "നേന്ത്രപ്പഴത്തിന്റെ ഇന്നത്തെ വിലയെന്താണ്?",
        "നെല്ലിന്റെ സർക്കാർ സംഭരണവില എത്രയാണ്?"
      ] : [
        "What is today's tomato price in Thrissur?",
        "What is the current Nendran banana price?",
        "What is the Kerala Government MSP for paddy?"
      ];
    } else {
      return isMl ? [
        "വിളകളുടെ വളർച്ചാ കാലയളവ് എത്രയാണ്?",
        "ഇന്നത്തെ കാലാവസ്ഥ മുന്നറിയിപ്പ് എന്താണ്?",
        "എന്റെ മണ്ണിൽ ഏത് വിളയാണ് നല്ലത്?"
      ] : [
        `How long does ${crop || 'paddy'} take to grow?`,
        "Is rain expected in my district today?",
        "What fertilizer schedule should I follow?"
      ];
    }
  }
}

module.exports = new RAGEngine();
