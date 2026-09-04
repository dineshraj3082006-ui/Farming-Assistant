/**
 * KrishiMitra AI - Smart Crop Recommendation Service
 * Evaluates Kerala farm parameters (District, Soil Type, Season, Land Area, Water, Previous Crop)
 * Dynamically scores crops using Kerala Agricultural University (KAU) Package of Practices.
 */

function formatINR(val) {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

/**
 * Master Registry of Kerala Crops with Agronomic Attributes
 */
const CROP_DATABASE = [
  {
    id: 'paddy',
    crop: "Rice Paddy (Uma / MO-16 / Jyothi)",
    cropMl: "നെല്ല് (ഉമ / MO-16 / ജ്യോതി)",
    icon: "🌾",
    minIncome: 45000,
    maxIncome: 65000,
    growingPeriod: "120 - 135 Days",
    growingPeriodMl: "120 - 135 ദിവസം",
    waterRequirement: "High (Standing Water)",
    waterRequirementMl: "കൂടുതൽ (കെട്ടിക്കിടക്കുന്ന വെള്ളം)",
    tips: "Treat seeds with Pseudomonas (10g/kg) before sowing. Maintain 2-3 cm standing water during tillering.",
    tipsMl: "വിത്ത് വിതയ്ക്കുന്നതിന് മുൻപ് സ്യൂഡോമോണസ് (10 ഗ്രാം/കിലോ) പുരട്ടുക. കാർഷിക സർവകലാശാല ഉമ വിത്ത് അനുയോജ്യം.",
    calculateScore: (params) => {
      let score = 55;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact
      if (params.water === 'high') {
        score += 25;
        reasonsEn.push("Abundant water allows optimal standing-water cultivation");
        reasonsMl.push("ധാരാളം വെള്ളം ലഭ്യമായതിനാൽ നെൽക്കൃഷിക്ക് ഏറ്റവും അനുയോജ്യം");
      } else if (params.water === 'moderate') {
        score -= 5;
      } else if (params.water === 'low') {
        score -= 40; // Paddy fails under low water
      }

      // Soil impact
      if (params.soil.includes('alluvial') || params.soil.includes('clay') || params.soil.includes('black')) {
        score += 15;
        reasonsEn.push("Clayey alluvial soil retains water and nutrients effectively");
      } else if (params.soil.includes('sandy')) {
        score -= 25; // Sandy drains too fast for paddy
      }

      // Previous Crop / Rotation
      if (params.prevCrop.includes('banana')) {
        score += 22;
        reasonsEn.push("Rotating after banana and flooding the field naturally eliminates root-knot nematodes");
        reasonsMl.push("വാഴയ്ക്ക് ശേഷം പാടത്ത് വെള്ളം കയറ്റി നെല്ല് ചെയ്യുന്നത് നിമാവിരകളെ നശിപ്പിക്കും");
      } else if (params.prevCrop.includes('legume')) {
        score += 18;
        reasonsEn.push("Takes advantage of high residual nitrogen fixed by previous legumes");
      } else if (params.prevCrop.includes('vegetable')) {
        score += 15;
        reasonsEn.push("Flooding cleanses soil-borne vegetable pathogens");
      } else if (params.prevCrop.includes('paddy')) {
        score -= 10; // Continuous paddy increases pest pressure
      }

      // Land Area
      if (params.landArea >= 2.0) {
        score += 10;
        reasonsEn.push(`Holding size of ${params.landArea} acres supports mechanized harvesting and bulk MSP procurement (₹28.20/kg)`);
      } else if (params.landArea < 0.75) {
        score -= 10;
      }

      // Season
      if (params.season.includes('virippu') || params.season.includes('mundakan')) {
        score += 10;
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "High yield potential with Kerala Govt MSP procurement support (₹28.20/kg).",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "കേരളത്തിലെ മണ്ണിൽ ഉയർന്ന വിളവ്. സർക്കാർ സംഭരണവില (₹28.20/കിലോ) ലഭ്യമാണ്."
      };
    }
  },

  {
    id: 'banana',
    crop: "Nendran Banana (Nedunendran / Big Sun)",
    cropMl: "നേന്ത്രവാഴ (നെടുനേന്ത്രൻ / ബിഗ് സൺ)",
    icon: "🍌",
    minIncome: 125000,
    maxIncome: 185000,
    growingPeriod: "9 - 10 Months",
    growingPeriodMl: "9 - 10 മാസം",
    waterRequirement: "Moderate to High",
    waterRequirementMl: "ഇടത്തരം മുതൽ കൂടുതൽ",
    tips: "Plant suckers in 50x50x50 cm pits. Apply 10 kg FYM + 250g Neem Cake + 50g VAM per pit at planting.",
    tipsMl: "കുഴിയൊന്നിന് 10 കിലോ ചാണകപ്പൊടിയും 250 ഗ്രാം വേപ്പിൻപിണ്ണാക്കും നൽകി നടുക.",
    calculateScore: (params) => {
      let score = 55;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact
      if (params.water === 'high' || params.water === 'moderate') {
        score += 20;
        reasonsEn.push("Sufficient moisture ensures heavy bunch formation and thick pseudostem vigor");
      } else {
        score -= 30; // Banana drops drastically under drought
      }

      // Previous Crop
      if (params.prevCrop.includes('banana')) {
        score -= 40; // Avoid banana after banana (Panama wilt & weevil buildup)
      } else if (params.prevCrop.includes('paddy') || params.prevCrop.includes('legume')) {
        score += 24;
        reasonsEn.push("Paddy/legume rotation cuts nematode infestation and provides rich loose soil");
        reasonsMl.push("നെല്ലിനോ പയറിനോ ശേഷം വാഴ വെയ്ക്കുന്നത് കീടബാധ കുറയ്ക്കുകയും വിളവ് കൂട്ടുകയും ചെയ്യും");
      } else if (params.prevCrop.includes('fallow')) {
        score += 15;
      }

      // Soil impact
      if (params.soil.includes('alluvial') || params.soil.includes('laterite') || params.soil.includes('red')) {
        score += 12;
      }

      // Land area suitability (great for 1-4 acres)
      if (params.landArea >= 0.5 && params.landArea <= 4.0) {
        score += 15;
        reasonsEn.push(`Ideal land size for intensive planting (~1,000 pits/acre) with peak festival market demand`);
        reasonsMl.push("ഓണവിപണിയും ചിപ്സ് വിപണിയും ലക്ഷ്യമാക്കി ഉയർന്ന വരുമാനം നേടാം");
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Strong year-round demand for Onam festival and banana chips trade across Kerala.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "ചിപ്സ് വിപണിയിലും ഉത്സവ സീസണിലും മികച്ച വില ലഭിക്കുന്ന ലാഭകരമായ കൃഷി."
      };
    }
  },

  {
    id: 'cowpea',
    crop: "Yardlong Cowpea (Vellayani Jyothika / Sharika)",
    cropMl: "വള്ളിപ്പയർ (വെള്ളായണി ജ്യോതിക / ശാരിക)",
    icon: "🌱",
    minIncome: 75000,
    maxIncome: 105000,
    growingPeriod: "70 - 85 Days",
    growingPeriodMl: "70 - 85 ദിവസം",
    waterRequirement: "Moderate",
    waterRequirementMl: "ഇടത്തരം നനവ്",
    tips: "Provide bamboo stakes or pandal trellis for vigorous pod growth. Spray Neem oil garlic emulsion for aphid prevention.",
    tipsMl: "പന്തൽ ഒരുക്കി നൽകുക. മുഞ്ഞ ശല്യം തടയാൻ വേപ്പെണ്ണ-വെളുത്തുള്ളി മിശ്രിതം തളിക്കുക.",
    calculateScore: (params) => {
      let score = 55;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact
      if (params.water === 'moderate') {
        score += 25;
        reasonsEn.push("Moderate moisture with dry podding periods prevents fungal blossom blight");
      } else if (params.water === 'low') {
        score += 12; // Hardy
      } else if (params.water === 'high') {
        score -= 5;
      }

      // Previous Crop
      if (params.prevCrop.includes('paddy')) {
        score += 28;
        reasonsEn.push("Premier rice-fallow relay crop that utilizes residual soil moisture and enriches soil with nitrogen");
        reasonsMl.push("നെല്ലിന് ശേഷം മണ്ണിൽ നൈട്രജൻ വർദ്ധിപ്പിച്ച് ഫലഭൂയിഷ്ഠത നിലനിർത്താൻ ഏറ്റവും അനുയോജ്യം");
      } else if (params.prevCrop.includes('vegetable')) {
        score += 15;
      }

      // Land area (Ideal for small/marginal homesteads)
      if (params.landArea <= 1.5) {
        score += 20;
        reasonsEn.push(`Quick 75-day turnaround on ${params.landArea} acres with continuous harvest every 3 days provides fast cash flow`);
        reasonsMl.push("ആഴ്ചയിൽ രണ്ട് തവണ വിളവെടുപ്പിലൂടെ സ്ഥിരവരുമാനം ഉറപ്പാക്കാം");
      }

      // Season
      if (params.season.includes('mundakan') || params.season.includes('puncha')) {
        score += 15;
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Fixes atmospheric nitrogen into the soil, providing fast weekly cash flow.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "മണ്ണിൽ നൈട്രജൻ വർദ്ധിപ്പിക്കുന്നു. വേഗത്തിൽ ആദായം ലഭിക്കും."
      };
    }
  },

  {
    id: 'tomato',
    crop: "Hybrid Tomato (Anagha / Manuprabha)",
    cropMl: "തക്കാളി (അനഘ / മനുപ്രഭ)",
    icon: "🍅",
    minIncome: 90000,
    maxIncome: 130000,
    growingPeriod: "90 - 110 Days",
    growingPeriodMl: "90 - 110 ദിവസം",
    waterRequirement: "Moderate (Drip Preferred)",
    waterRequirementMl: "ഇടത്തരം (തുള്ളിനന അനുയോജ്യം)",
    tips: "Mulch with dry straw or polythene sheet to conserve soil moisture and prevent bacterial wilt and fruit rot.",
    tipsMl: "കളകൾ തടയാനും ഈർപ്പം നിലനിർത്താനും വൈക്കോൽ കൊണ്ട് പുതയിടുക. കാർഷിക സർവകലാശാല ബാക്ടീരിയൽ വാട്ട പ്രതിരോധ ഇനം.",
    calculateScore: (params) => {
      let score = 50;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact
      if (params.water === 'moderate') {
        score += 25;
        reasonsEn.push("Moderate controlled irrigation prevents fungal root decay and fruit cracking");
      } else if (params.water === 'high') {
        score -= 20; // High standing water causes fatal bacterial wilt / root asphyxiation
      }

      // Previous Crop
      if (params.prevCrop.includes('paddy') || params.prevCrop.includes('legume')) {
        score += 25;
        reasonsEn.push("Paddy/legume rotation breaks Solanaceae wilt cycles and feeds vegetable growth");
        reasonsMl.push("നെല്ലിനോ പയറിനോ ശേഷം കൃഷി ചെയ്യുന്നത് ബാക്ടീരിയൽ വാട്ട രോഗങ്ങളെ തടയും");
      } else if (params.prevCrop.includes('vegetable')) {
        score -= 30; // Avoid solanaceous vegetable monoculture
      }

      // Land area (Intensive vegetable on small/medium land)
      if (params.landArea <= 1.5) {
        score += 22;
        reasonsEn.push(`High returns per cent on ${params.landArea} acres with intensive trellised cultivation`);
        reasonsMl.push("ചെറിയ സ്ഥലത്ത് പന്തലിൽ കൂടുതൽ വിളവ് തരുന്ന ഇനം");
      }

      // Season
      if (params.season.includes('mundakan') || params.season.includes('puncha')) {
        score += 15;
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Bacterial wilt resistant KAU varieties adapted to Kerala climate with strong local market absorption.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "ബാക്ടീരിയൽ വാട്ട പ്രതിരോധശേഷിയുള്ള മികച്ച ഇനങ്ങൾ. പ്രാദേശിക വിപണിയിൽ ഉയർന്ന ഡിമാൻഡ്."
      };
    }
  },

  {
    id: 'yam',
    crop: "Elephant Foot Yam (Gajendra Chena / Padmaprabha)",
    cropMl: "ചേന (ഗജേന്ദ്ര ചേന / പത്മപ്രഭ)",
    icon: "🥔",
    minIncome: 145000,
    maxIncome: 210000,
    growingPeriod: "8 - 9 Months",
    growingPeriodMl: "8 - 9 മാസം",
    waterRequirement: "Low to Moderate",
    waterRequirementMl: "കുറഞ്ഞ നനവ് മതിയാകും",
    tips: "Cut 1 kg seed corm with central bud. Treat with cow dung slurry + Trichoderma viride before planting in April-May.",
    tipsMl: "1 കിലോ തൂക്കമുള്ള ചേനക്കഷണങ്ങൾ ട്രൈക്കോഡെർമ ചേർത്ത ചാണകവെള്ളത്തിൽ മുക്കി നടുക.",
    calculateScore: (params) => {
      let score = 55;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact
      if (params.water === 'moderate' || params.water === 'low') {
        score += 20;
        reasonsEn.push("Does not require heavy irrigation; thrives in well-drained loams without waterlogging");
      } else if (params.water === 'high') {
        score -= 10;
      }

      // Soil impact
      if (params.soil.includes('laterite') || params.soil.includes('red')) {
        score += 22;
        reasonsEn.push("Loose laterite/red soil permits unrestricted tuber expansion and high starch accumulation");
        reasonsMl.push("ലാറ്ററൈറ്റ്/ചെമ്മണ്ണിൽ കിഴങ്ങ് നല്ല വലിപ്പത്തിൽ വളരുന്നു");
      }

      // Previous Crop
      if (params.prevCrop.includes('fallow') || params.prevCrop.includes('banana')) {
        score += 20;
        reasonsEn.push("Rested/rotated soil gives jumbo-sized disease-free corms with high shelf life");
      }

      // Land area
      if (params.landArea >= 0.5 && params.landArea <= 3.0) {
        score += 15;
        reasonsEn.push(`Commercial block planting on ${params.landArea} acres yields high bulk tonnage for wholesale mandis`);
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Thrives in Kerala laterite soil with zero pest vulnerabilities and long post-harvest shelf life.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "കേരളത്തിലെ മണ്ണിൽ കീടബാധയില്ലാതെ സമൃദ്ധമായി വളരുന്നു. ഏറെക്കാലം കേടുകൂടാതെ സൂക്ഷിക്കാം."
      };
    }
  },

  {
    id: 'tapioca',
    crop: "Cassava / Tapioca (M-4 / Vellayani Hraswa)",
    cropMl: "കപ്പ / മരച്ചീനി (M-4 / വെള്ളായണി ഹ്രസ്വ)",
    icon: "🍠",
    minIncome: 65000,
    maxIncome: 90000,
    growingPeriod: "6 - 7 Months",
    growingPeriodMl: "6 - 7 മാസം",
    waterRequirement: "Low (Drought Hardy)",
    waterRequirementMl: "കുറഞ്ഞ വെള്ളം (വരൾച്ച പ്രതിരോധം)",
    tips: "Plant 20 cm stem cuttings vertically on mounds. Apply wood ash for potassium enrichment.",
    tipsMl: "തടമെടുത്ത് കുത്തനെ കമ്പുകൾ നടുക. ചാരം ഇട്ടുകൊടുക്കുന്നത് കിഴങ്ങ് വലിപ്പം കൂട്ടും.",
    calculateScore: (params) => {
      let score = 50;
      let reasonsEn = [];
      let reasonsMl = [];

      // Water impact (Premier low water crop)
      if (params.water === 'low') {
        score += 32;
        reasonsEn.push("Exceptional drought tolerance; thrives purely on residual moisture and seasonal rainfall");
        reasonsMl.push("കുറഞ്ഞ വെള്ളത്തിലും മികച്ച വിളവ് തരുന്ന ഒന്നാന്തരം വിള");
      } else if (params.water === 'moderate') {
        score += 15;
      } else if (params.water === 'high') {
        score -= 25; // Waterlogging rots tapioca roots
      }

      // Soil impact
      if (params.soil.includes('laterite') || params.soil.includes('red') || params.soil.includes('sandy')) {
        score += 18;
      } else if (params.soil.includes('black') || params.soil.includes('clay')) {
        score -= 15; // Heavy clay restricts tuber growth
      }

      // Previous Crop
      if (params.prevCrop.includes('fallow') || params.prevCrop.includes('vegetable')) {
        score += 16;
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Resilient crop requiring minimal inputs and tolerant to seasonal dry spells.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "കുറഞ്ഞ ചെലവിൽ മികച്ച വിളവ് തരുന്ന വരൾച്ചാ പ്രതിരോധശേഷിയുള്ള വിള."
      };
    }
  },

  {
    id: 'pepper',
    crop: "Malabar Black Pepper (Panniyur-1 / IISR Thevam)",
    cropMl: "കുരുമുളക് (പന്നിയൂർ-1 / തേവം)",
    icon: "🌿",
    minIncome: 180000,
    maxIncome: 260000,
    growingPeriod: "Perennial (Nov-Feb Harvest)",
    growingPeriodMl: "ബഹുവർഷ വിള (വിളവെടുപ്പ് നവംബർ-ഫെബ്രുവരി)",
    waterRequirement: "Moderate Rainfed",
    waterRequirementMl: "മഴയെ ആശ്രയിച്ച് വളർത്താം",
    tips: "Train runner vines on live standards like Erythrina or Silver Oak. Drench base with 1% Bordeaux mixture before monsoon.",
    tipsMl: "മഴക്കാലത്തിന് മുൻപായി 1% ബോർഡോ മിശ്രിതം ചുവട്ടിൽ ഒഴിച്ചു കൊടുക്കുക.",
    calculateScore: (params) => {
      let score = 40;
      let reasonsEn = [];
      let reasonsMl = [];

      // District / Hill zone impact
      if (params.district.includes('wayanad') || params.district.includes('idukki') || params.district.includes('kannur') || params.district.includes('kasaragod')) {
        score += 35;
        reasonsEn.push("Humid hill tract climate provides ideal micro-environment for Malabar black gold");
        reasonsMl.push("വയനാട്/ഇടുക്കി കാലാവസ്ഥയിൽ കുരുമുളകിന് ഉയർന്ന വിളവും മികച്ച വിപണി വിലയും (₹625+/kg)");
      } else {
        score -= 10;
      }

      // Soil impact
      if (params.soil.includes('laterite') || params.soil.includes('red')) {
        score += 15;
      }

      // Water impact
      if (params.water === 'moderate' || params.water === 'low') {
        score += 15;
      } else if (params.water === 'high') {
        score -= 15; // Standing water causes quick wilt
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "High spice terminal prices (₹625+/kg) and excellent export demand.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "വിപണിയിൽ ഉയർന്ന വിലയും കയറ്റുമതി സാധ്യതയുമുള്ള വിള."
      };
    }
  },

  {
    id: 'ginger',
    crop: "Ginger (Varada / Mahima)",
    cropMl: "ഇഞ്ചി (വരദ / മഹിമ)",
    icon: "🫚",
    minIncome: 165000,
    maxIncome: 245000,
    growingPeriod: "8 Months",
    growingPeriodMl: "8 മാസം",
    waterRequirement: "Moderate (Well-drained)",
    waterRequirementMl: "ഇടത്തരം നനവ് (നല്ല നീർവാർച്ച)",
    tips: "Treat seed rhizomes with Mancozeb (0.3%) for 30 mins before planting in raised beds.",
    tipsMl: "നടീൽ വസ്തു മാങ്കോസെബ് ലായനിയിൽ 30 മിനിറ്റ് മുക്കി വെച്ച ശേഷം ഉയർത്തിയ തടങ്ങളിൽ നടുക.",
    calculateScore: (params) => {
      let score = 45;
      let reasonsEn = [];
      let reasonsMl = [];

      // District / Soil
      if (params.district.includes('wayanad') || params.district.includes('idukki') || params.district.includes('palakkad')) {
        score += 25;
      }
      if (params.soil.includes('laterite') || params.soil.includes('red')) {
        score += 15;
        reasonsEn.push("Well-drained porous soil prevents rhizome soft rot");
      }

      // Previous Crop
      if (params.prevCrop.includes('fallow') || params.prevCrop.includes('paddy')) {
        score += 20;
        reasonsEn.push("Planting on rested/paddy soil gives disease-free heavy rhizome yield");
        reasonsMl.push("രോഗബാധയില്ലാത്ത നല്ല വിളവ് തരുന്ന ഇനം");
      }

      // Water impact
      if (params.water === 'moderate') {
        score += 15;
      } else if (params.water === 'high') {
        score -= 20; // Soft rot risk
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "High gingerol content, soft-rot resistance and high farmgate value.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "ഉയർന്ന ഔഷധഗുണവും വിപണിമൂല്യവുമുള്ള മികച്ച ഇനം."
      };
    }
  },

  {
    id: 'coconut',
    crop: "Hybrid Coconut (Keraganga / Komadan / WCT)",
    cropMl: "തെങ്ങ് (കേരഗംഗ / കോമടൻ / WCT)",
    icon: "🥥",
    minIncome: 110000,
    maxIncome: 165000,
    growingPeriod: "Perennial (All Seasons)",
    growingPeriodMl: "ബഹുവർഷ വിള (എല്ലാ സീസണിലും)",
    waterRequirement: "Moderate (Basin Irrigation)",
    waterRequirementMl: "ഇടത്തരം തടം നനയ്ക്കൽ",
    tips: "Apply 500g Urea + 1kg Rock Phosphate + 1.2kg MOP per adult palm per year in two split doses (May-June and Sept-Oct).",
    tipsMl: "ഒരു തെങ്ങിന് പ്രതിവർഷം 1 കിലോ രാജ്ഫോസും 1.2 കിലോ പൊട്ടാഷും രണ്ട് തവണകളായി നൽകുക.",
    calculateScore: (params) => {
      let score = 45;
      let reasonsEn = [];
      let reasonsMl = [];

      // Coastal / Alluvial soil
      if (params.soil.includes('sandy') || params.soil.includes('coastal') || params.soil.includes('alluvial')) {
        score += 30;
        reasonsEn.push("Coastal sandy/alluvial soil ensures deep root aeration and rapid palm growth");
        reasonsMl.push("തീരദേശ/എക്കൽ മണ്ണിൽ വേരോട്ടം കൂടുതൽ, വർഷം മുഴുവൻ തേങ്ങ ഉൽപാദനം");
      }

      // Coastal districts
      if (params.district.includes('alappuzha') || params.district.includes('kollam') || params.district.includes('kozhikode') || params.district.includes('kasaragod') || params.district.includes('ernakulam') || params.district.includes('trivandrum') || params.district.includes('kannur')) {
        score += 20;
      }

      // Land area (great for 1.5+ acres)
      if (params.landArea >= 1.5) {
        score += 15;
        reasonsEn.push(`Holding size of ${params.landArea} acres supports 100+ palms with intercropping beneath`);
      }

      return {
        score,
        reasonEn: reasonsEn.length ? reasonsEn.join('. ') + '.' : "Consistent monthly harvests with strong copra, tender coconut and Neera income.",
        reasonMl: reasonsMl.length ? reasonsMl.join('. ') + '.' : "മാസം തോറും സ്ഥിരവരുമാനം നൽകുന്ന കേരളത്തിന്റെ പ്രധാന വിള."
      };
    }
  }
];

/**
 * Main Crop Recommendation Engine
 */
function recommendCrops(params = {}) {
  const cleanParams = {
    district: (params.district || 'Thrissur').toLowerCase().trim(),
    soil: (params.soil || 'Laterite Soil').toLowerCase().trim(),
    season: (params.season || 'Virippu (Kharif)').toLowerCase().trim(),
    water: (params.water || 'High').toLowerCase().trim(),
    prevCrop: (params.prevCrop || 'Paddy').toLowerCase().trim(),
    landArea: parseFloat(params.land) > 0 ? parseFloat(params.land) : 2.5
  };

  // Evaluate and score every crop dynamically
  const scoredCrops = CROP_DATABASE.map(cropItem => {
    const evaluation = cropItem.calculateScore(cleanParams);
    const rawScore = evaluation.score;

    const minTotal = Math.round(cropItem.minIncome * cleanParams.landArea);
    const maxTotal = Math.round(cropItem.maxIncome * cleanParams.landArea);
    const acresLabel = cleanParams.landArea === 1 ? '1 Acre' : `${cleanParams.landArea} Acres`;

    return {
      crop: cropItem.crop,
      cropMl: cropItem.cropMl,
      icon: cropItem.icon,
      rawScore: rawScore,
      suitability: Math.min(97, Math.max(70, Math.round(rawScore))),
      growingPeriod: cropItem.growingPeriod,
      growingPeriodMl: cropItem.growingPeriodMl,
      waterRequirement: cropItem.waterRequirement,
      waterRequirementMl: cropItem.waterRequirementMl,
      reason: evaluation.reasonEn,
      reasonMl: evaluation.reasonMl,
      tips: cropItem.tips,
      tipsMl: cropItem.tipsMl,
      estIncome: `₹${cropItem.minIncome.toLocaleString('en-IN')} - ₹${cropItem.maxIncome.toLocaleString('en-IN')} / Acre`,
      estTotalIncome: `${formatINR(minTotal)} - ${formatINR(maxTotal)} (Total for ${acresLabel})`,
      estTotalIncomeMl: `${formatINR(minTotal)} - ${formatINR(maxTotal)} (${cleanParams.landArea} ഏക്കറിൽ ആകെ)`,
      landArea: cleanParams.landArea
    };
  });

  // Sort descending by calculated dynamic raw score
  scoredCrops.sort((a, b) => b.rawScore - a.rawScore);

  // Differentiate top 4 suitability scores
  const topCrops = scoredCrops.slice(0, 4);
  const maxRaw = topCrops[0] ? topCrops[0].rawScore : 100;

  return topCrops.map((c, index) => {
    const scoreOffset = index * 3 + Math.round(Math.max(0, (maxRaw - c.rawScore) * 0.25));
    const finalSuitability = Math.min(97 - index, Math.max(72, 97 - scoreOffset));
    return {
      crop: c.crop,
      cropMl: c.cropMl,
      icon: c.icon,
      suitability: finalSuitability,
      growingPeriod: c.growingPeriod,
      growingPeriodMl: c.growingPeriodMl,
      waterRequirement: c.waterRequirement,
      waterRequirementMl: c.waterRequirementMl,
      reason: c.reason,
      reasonMl: c.reasonMl,
      tips: c.tips,
      tipsMl: c.tipsMl,
      estIncome: c.estIncome,
      estTotalIncome: c.estTotalIncome,
      estTotalIncomeMl: c.estTotalIncomeMl,
      landArea: c.landArea
    };
  });
}

module.exports = {
  recommendCrops,
  CROP_DATABASE
};
