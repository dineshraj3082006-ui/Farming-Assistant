/**
 * KrishiMitra AI - Comprehensive Kerala Agricultural Commodity Market Prices
 * 50+ Kerala agricultural crops tracked across all 14 districts & commodity boards
 */

const keralaCommodities = [
  // ------------------------------------------------------------------------
  // 1. PLANTATION & CASH CROPS (തോട്ടവിളകൾ)
  // ------------------------------------------------------------------------
  {
    id: "tea_leaves",
    category: "Plantation",
    cropEn: "Tea (Green Leaf)",
    cropMl: "പച്ച തേയില (Tea Leaves)",
    marketEn: "Munnar Auction Mandi",
    marketMl: "മൂന്നാർ ലേല കേന്ദ്രം (ഇടുക്കി)",
    district: "Idukki",
    price: 24,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [21, 22, 22, 23, 23, 24, 24],
    insightEn: "Tea green leaf auction rates in Munnar remain buoyant with steady factory intake.",
    insightMl: "മൂന്നാറിലെ ഫാക്ടറി ലേലത്തിൽ പച്ച തേയിലയ്ക്ക് മികച്ച ഡിമാൻഡ് നിലനിൽക്കുന്നു."
  },
  {
    id: "tea_made",
    category: "Plantation",
    cropEn: "Tea (CTC Made Tea)",
    cropMl: "സി.ടി.സി തേയില (CTC Tea)",
    marketEn: "Cochin Tea Auction",
    marketMl: "കൊച്ചി ടീ ഓക്ഷൻ സെന്റർ (എറണാകുളം)",
    district: "Ernakulam",
    price: 185,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [178, 180, 182, 181, 183, 184, 185],
    insightEn: "Cochin Tea Trade Association reports consistent export inquiries for leaf grades.",
    insightMl: "കൊച്ചി ടീ ഓക്ഷനിൽ കയറ്റുമതി ഡിമാൻഡ് വർദ്ധിച്ചതിനാൽ ലേലവില ഉയർന്നു."
  },
  {
    id: "coffee_robusta",
    category: "Plantation",
    cropEn: "Coffee (Robusta Cherry)",
    cropMl: "റോബസ്റ്റ കാപ്പി (Coffee)",
    marketEn: "Wayanad Coffee Mandi",
    marketMl: "വയനാട് കാപ്പി വിപണി (കൽപ്പറ്റ)",
    district: "Wayanad",
    price: 225,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [210, 212, 215, 218, 220, 222, 225],
    insightEn: "Robusta coffee cherry prices in Wayanad continue bullish run driven by tight global supplies.",
    insightMl: "ആഗോള വിപണിയിലെ ലഭ്യതക്കുറവ് മൂലം വയനാടൻ റോബസ്റ്റ കാപ്പിക്ക് മികച്ച വില ലഭിക്കുന്നു."
  },
  {
    id: "coffee_arabica",
    category: "Plantation",
    cropEn: "Coffee (Arabica Parchment)",
    cropMl: "അറബിക്ക കാപ്പി (Arabica)",
    marketEn: "Idukki Spices & Plantation Market",
    marketMl: "ഇടുക്കി കാപ്പി വിപണി (കുമളി)",
    district: "Idukki",
    price: 345,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [330, 332, 335, 338, 340, 342, 345],
    insightEn: "High-elevation Arabica parchment beans attracting premium buyer bids in Idukki.",
    insightMl: "ഉയർന്ന പ്രദേശങ്ങളിൽ വിളഞ്ഞ അറബിക്ക കാപ്പിക്ക് കുമളി വിപണിയിൽ പ്രീമിയം വില ലഭിക്കുന്നു."
  },
  {
    id: "rubber_rss4",
    category: "Plantation",
    cropEn: "Natural Rubber (RSS-4)",
    cropMl: "സ്വാഭാവിക റബ്ബർ (RSS-4)",
    marketEn: "Kottayam Rubber Board",
    marketMl: "കോട്ടയം റബ്ബർ ബോർഡ് വിപണി",
    district: "Kottayam",
    price: 188,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [180, 182, 183, 185, 186, 187, 188],
    insightEn: "Tyre manufacturing industry demand supports RSS-4 sheet rubber price above ₹185.",
    insightMl: "ടയർ നിർമ്മാണ കമ്പനികളുടെ വർദ്ധിച്ച ആവശ്യം റബ്ബർ ഷീറ്റ് വില ഉയർത്തി നിർത്തിയിരിക്കുന്നു."
  },
  {
    id: "rubber_latex",
    category: "Plantation",
    cropEn: "Rubber Latex (60% DRC)",
    cropMl: "റബ്ബർ പാൽ (Latex)",
    marketEn: "Palai Rubber Market",
    marketMl: "പാലാ റബ്ബർ വിപണി (കോട്ടയം)",
    district: "Kottayam",
    price: 176,
    unit: "kg",
    trend: "+1%",
    isUp: true,
    history: [172, 173, 174, 175, 175, 176, 176],
    insightEn: "Latex procurement rates remain stable across central Travancore tapping centers.",
    insightMl: "മധ്യതിരുവിതാംകൂറിലെ ലാറ്റക്സ് സംഭരണ കേന്ദ്രങ്ങളിൽ സ്ഥിരതയുള്ള വില നിലനിൽക്കുന്നു."
  },
  {
    id: "arecanut_chali",
    category: "Plantation",
    cropEn: "Arecanut (Chali / Raw Betelnut)",
    cropMl: "അടയ്ക്ക / പാക്ക് (Chali Arecanut)",
    marketEn: "Kasaragod APMC Mandi",
    marketMl: "കാസർഗോഡ് കാർഷിക വിപണി",
    district: "Kasaragod",
    price: 365,
    unit: "kg",
    trend: "+6%",
    isUp: true,
    history: [340, 345, 350, 352, 358, 360, 365],
    insightEn: "Arecanut arrivals in Kasaragod and Vittal markets commanding strong upcountry demand.",
    insightMl: "ഉത്തരേന്ത്യൻ ഡിമാൻഡ് ഉയർന്നതോടെ കാസർഗോഡ് ചാലി അടയ്ക്ക വില കുതിച്ചുയർന്നു."
  },
  {
    id: "arecanut_kottapak",
    category: "Plantation",
    cropEn: "Arecanut (Kottapak / Dried)",
    cropMl: "കൊട്ടപ്പാക്ക് (Kottapak)",
    marketEn: "Nedumangad Mandi",
    marketMl: "നെടുമങ്ങാട് മാർക്കറ്റ് (തിരുവനന്തപുരം)",
    district: "Thiruvananthapuram",
    price: 420,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [405, 408, 410, 412, 415, 418, 420],
    insightEn: "Processed Kottapak commanding premium rates in southern wholesale trade.",
    insightMl: "പ്രോസസ് ചെയ്ത കൊട്ടപ്പാക്കിന് തെക്കൻ കേരള വിപണികളിൽ മികച്ച വില ലഭ്യമാണ്."
  },
  {
    id: "coconut_fresh",
    category: "Plantation",
    cropEn: "Coconut (Matured Fresh)",
    cropMl: "തേങ്ങ (Fresh Coconut)",
    marketEn: "Kozhikode Wholesale Mandi",
    marketMl: "കോഴിക്കോട് വലിയങ്ങാടി വിപണി",
    district: "Kozhikode",
    price: 38,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [35, 36, 36, 37, 37, 38, 38],
    insightEn: "Steady festival retail demand and oil mill purchases keeping fresh coconut prices strong.",
    insightMl: "വെളിച്ചെണ്ണ മില്ലുകളുടെയും ചില്ലറ വിപണിയുടെയും ആവശ്യകത തേങ്ങാ വില ഉയർത്തി."
  },
  {
    id: "copra_milling",
    category: "Plantation",
    cropEn: "Copra (Milling Quality)",
    cropMl: "കൊപ്ര (Milling Copra)",
    marketEn: "Alappuzha Copra Market",
    marketMl: "ആലപ്പുഴ കൊപ്ര വിപണി",
    district: "Alappuzha",
    price: 110,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [102, 104, 105, 106, 108, 109, 110],
    insightEn: "Government procurement and strong coconut oil prices pushing copra above ₹108/kg.",
    insightMl: "വെളിച്ചെണ്ണ വില ഉയർന്നതോടെ ആലപ്പുഴ കൊപ്ര വിപണിയിൽ വില ₹110 ലേക്ക് ഉയർന്നു."
  },
  {
    id: "tender_coconut",
    category: "Plantation",
    cropEn: "Tender Coconut (Karikku)",
    cropMl: "കരിക്ക് (Tender Coconut)",
    marketEn: "Palakkad Wholesale Hub",
    marketMl: "പാലക്കാട് കരിക്ക് വിപണി",
    district: "Palakkad",
    price: 45,
    unit: "piece",
    trend: "+0%",
    isUp: true,
    history: [45, 45, 45, 45, 45, 45, 45],
    insightEn: "Consistent summer refreshment demand keeps tender coconut prices steady across state.",
    insightMl: "നാടൻ കരിക്കിന് സ്ഥിരതയുള്ള ഉയർന്ന ഡിമാൻഡ് തുടരുന്നു."
  },
  {
    id: "nutmeg_with_shell",
    category: "Plantation",
    cropEn: "Nutmeg (With Shell)",
    cropMl: "ജാതിക്ക (Nutmeg with shell)",
    marketEn: "Kalady Spices Market",
    marketMl: "കാലടി സുഗന്ധവ്യഞ്ജന വിപണി (എറണാകുളം)",
    district: "Ernakulam",
    price: 315,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [295, 300, 302, 305, 310, 312, 315],
    insightEn: "Kalady spices terminal reports strong export buying for heavy-kernel nutmeg.",
    insightMl: "നല്ല കട്ടിയുള്ള ജാതിക്കയ്ക്ക് കാലടി വിപണിയിൽ കയറ്റുമതി വ്യാപാരികൾ മികച്ച വില നൽകുന്നു."
  },
  {
    id: "mace_flower",
    category: "Plantation",
    cropEn: "Mace (Jathipathri / Red)",
    cropMl: "ജാതിപത്രി (Mace Flower)",
    marketEn: "Angamaly Spices Mandi",
    marketMl: "അങ്കമാലി സ്പൈസസ് മാർക്കറ്റ് (എറണാകുളം)",
    district: "Ernakulam",
    price: 1480,
    unit: "kg",
    trend: "+8%",
    isUp: true,
    history: [1350, 1380, 1400, 1420, 1440, 1460, 1480],
    insightEn: "Top-grade red whole flower mace witnessing severe shortage and escalating prices.",
    insightMl: "ഒന്നാം തരം ചുവന്ന ജാതിപത്രിക്ക് കടുത്ത ക്ഷാമം അനുഭവപ്പെടുന്നതിനാൽ വില ₹1480 കടന്നു."
  },
  {
    id: "cocoa_dry",
    category: "Plantation",
    cropEn: "Cocoa (Dry Beans)",
    cropMl: "കൊക്കോ ഉണക്കക്കുരു (Cocoa)",
    marketEn: "Kochi Terminal",
    marketMl: "കൊച്ചി കൊക്കോ വിപണി",
    district: "Ernakulam",
    price: 285,
    unit: "kg",
    trend: "+7%",
    isUp: true,
    history: [260, 265, 270, 272, 278, 280, 285],
    insightEn: "Global chocolate industry deficit pushing domestic dry cocoa bean rates to record highs.",
    insightMl: "ആഗോള ചോക്ലേറ്റ് വിപണിയിലെ കുറവ് മൂലം കൊക്കോ ഉണക്കക്കുരുവിന് റെക്കോർഡ് വില."
  },

  // ------------------------------------------------------------------------
  // 2. SPICES & CONDIMENTS (സുഗന്ധവ്യഞ്ജനങ്ങൾ)
  // ------------------------------------------------------------------------
  {
    id: "black_pepper",
    category: "Spices",
    cropEn: "Black Pepper (Garbled)",
    cropMl: "കുരുമുളക് (Black Pepper)",
    marketEn: "Kochi Spices Board Terminal",
    marketMl: "കൊച്ചി സ്പൈസസ് ബോർഡ് ടെർമിനൽ",
    district: "Ernakulam",
    price: 628,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [605, 610, 612, 618, 620, 624, 628],
    insightEn: "Malabar black pepper ungarbled and garbled lots witnessing strong North Indian spot demand.",
    insightMl: "മലബാർ കുരുമുളകിന് സ്പൈസസ് ബോർഡ് കൊച്ചി ലേലത്തിൽ മികച്ച വില ലഭിക്കുന്നു."
  },
  {
    id: "cardamom_small",
    category: "Spices",
    cropEn: "Small Green Cardamom (8mm)",
    cropMl: "ഏലം (Small Cardamom)",
    marketEn: "Vandanmedu Spices Auction",
    marketMl: "വണ്ടൻമേട് സ്പൈസസ് ബോർഡ് (ഇടുക്കി)",
    district: "Idukki",
    price: 1890,
    unit: "kg",
    trend: "+6%",
    isUp: true,
    history: [1750, 1780, 1800, 1820, 1850, 1870, 1890],
    insightEn: "High-grade 8mm bold green cardamom fetching strong competitive bids in Vandanmedu.",
    insightMl: "8mm വലിപ്പമുള്ള പച്ച ഏലക്കയ്ക്ക് വണ്ടൻമേട് ലേലത്തിൽ കിലോയ്ക്ക് ₹1890 വരെ ലഭിച്ചു."
  },
  {
    id: "ginger_fresh",
    category: "Spices",
    cropEn: "Fresh Green Ginger (Inji)",
    cropMl: "പച്ച ഇഞ്ചി (Fresh Ginger)",
    marketEn: "Wayanad Agricultural Mandi",
    marketMl: "വയനാട് ഇഞ്ചി വിപണി (സുൽത്താൻ ബത്തേരി)",
    district: "Wayanad",
    price: 115,
    unit: "kg",
    trend: "+7%",
    isUp: true,
    history: [100, 102, 105, 108, 110, 112, 115],
    insightEn: "Wayanad green ginger harvests commanding premium over North Indian supplies.",
    insightMl: "വയനാടൻ പച്ച ഇഞ്ചിക്ക് വിപണിയിൽ ഉയർന്ന ഡിമാൻഡ് തുടരുന്നു."
  },
  {
    id: "dry_ginger_chukku",
    category: "Spices",
    cropEn: "Dry Ginger (Chukku)",
    cropMl: "ചുക്ക് (Dry Ginger)",
    marketEn: "Palakkad Wholesale Hub",
    marketMl: "പാലക്കാട് ചുക്ക് വിപണി",
    district: "Palakkad",
    price: 325,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [305, 310, 312, 315, 320, 322, 325],
    insightEn: "Ayurvedic pharmaceutical companies maintaining consistent bulk dry ginger procurement.",
    insightMl: "ആയുർവേദ ഔഷധ നിർമ്മാതാക്കളുടെ വർദ്ധിച്ച സംഭരണം ചുക്കിന്റെ വില ഉയർത്തുന്നു."
  },
  {
    id: "turmeric_fresh",
    category: "Spices",
    cropEn: "Turmeric (Fresh Rhizome)",
    cropMl: "പച്ച മഞ്ഞൾ (Fresh Turmeric)",
    marketEn: "Kozhikode Mandi",
    marketMl: "കോഴിക്കോട് മഞ്ഞൾ വിപണി",
    district: "Kozhikode",
    price: 48,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [44, 45, 45, 46, 46, 47, 48],
    insightEn: "Fresh high-curcumin turmeric rhizomes trading smoothly across Malabar mandis.",
    insightMl: "കുർക്കുമിൻ കൂടിയ പച്ച മഞ്ഞളിന് മലബാർ വിപണികളിൽ മികച്ച ആവശ്യക്കാരുണ്ട്."
  },
  {
    id: "turmeric_cured",
    category: "Spices",
    cropEn: "Turmeric (Alleppey Finger Cured)",
    cropMl: "ഉണക്ക മഞ്ഞൾ (Alleppey Finger)",
    marketEn: "Alappuzha Spices Market",
    marketMl: "ആലപ്പുഴ സ്പൈസസ് മാർക്കറ്റ്",
    district: "Alappuzha",
    price: 145,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [132, 135, 138, 140, 142, 143, 145],
    insightEn: "Famous Alleppey Finger turmeric with 5% curcumin content commanding export surge.",
    insightMl: "ആലപ്പി ഫിംഗർ മഞ്ഞളിന് അന്താരാഷ്ട്ര വിപണിയിൽ ഉയർന്ന ഡിമാൻഡ്."
  },
  {
    id: "cloves",
    category: "Spices",
    cropEn: "Cloves (Gramboo)",
    cropMl: "ഗ്രാമ്പൂ (Cloves)",
    marketEn: "Idukki Spices Market",
    marketMl: "ഇടുക്കി ഗ്രാമ്പൂ വിപണി (തൊടുപുഴ)",
    district: "Idukki",
    price: 860,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [840, 845, 848, 850, 852, 855, 860],
    insightEn: "Domestic harvest of cloves trading firm with low import volume pressure.",
    insightMl: "തൊടുപുഴ വിപണിയിൽ നാടൻ ഗ്രാമ്പൂവിന് ഉയർന്ന സ്ഥിരതയുള്ള വില."
  },
  {
    id: "cinnamon",
    category: "Spices",
    cropEn: "Cinnamon (Karuvapatta)",
    cropMl: "കറുവപ്പട്ട (Cinnamon)",
    marketEn: "Kannur Spices Center",
    marketMl: "കണ്ണൂർ സുഗന്ധവ്യഞ്ജന വിപണി",
    district: "Kannur",
    price: 385,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [365, 370, 372, 375, 378, 380, 385],
    insightEn: "Pure Ceylon variety cinnamon cultivated in Malabar commanding strong confectionery demand.",
    insightMl: "ശുദ്ധമായ കറുവപ്പട്ടയ്ക്ക് കണ്ണൂർ വിപണിയിൽ ഉയർന്ന വില ലഭിക്കുന്നു."
  },

  // ------------------------------------------------------------------------
  // 3. CEREALS, GRAINS & TUBERS (ധാന്യങ്ങളും കിഴങ്ങുവർഗ്ഗങ്ങളും)
  // ------------------------------------------------------------------------
  {
    id: "matta_rice",
    category: "Cereals & Tubers",
    cropEn: "Palakkadan Matta Rice (Paddy)",
    cropMl: "പാലക്കാടൻ മട്ട നെല്ല് (Matta Rice)",
    marketEn: "Palakkad Wholesale Mandi",
    marketMl: "പാലക്കാട് വലിയ മാർക്കറ്റ്",
    district: "Palakkad",
    price: 48,
    unit: "kg",
    trend: "0%",
    isUp: true,
    history: [48, 48, 48, 48, 48, 48, 48],
    insightEn: "Government MSP procurement at ₹28.20/kg anchors farm gate, while wholesale matta trades at ₹48.",
    insightMl: "സർക്കാർ സംഭരണവില ₹28.20 ആയിരിക്കെ മൊത്ത വിപണിയിൽ മട്ട നെല്ല് ₹48 ൽ വ്യാപാരം നടക്കുന്നു."
  },
  {
    id: "kuttanad_red_rice",
    category: "Cereals & Tubers",
    cropEn: "Kuttanad Red Rice (Uma / Jyothi)",
    cropMl: "കുട്ടനാടൻ ചുവന്നരി (Kuttanad Rice)",
    marketEn: "Alappuzha Paddy Market",
    marketMl: "ആലപ്പുഴ നെല്ല് വിപണി",
    district: "Alappuzha",
    price: 52,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [50, 50, 51, 51, 52, 52, 52],
    insightEn: "Kuttanad puncha harvests moving briskly through Supplyco and private wholesale mills.",
    insightMl: "കുട്ടനാടൻ പുഞ്ചനെല്ലിന് മില്ലുകളിൽ നിന്നും വിപണിയിൽ നിന്നും നല്ല ഡിമാൻഡ്."
  },
  {
    id: "pokkali_rice",
    category: "Cereals & Tubers",
    cropEn: "Pokkali Organic Rice",
    cropMl: "പൊക്കാളി അരി (Pokkali GI Rice)",
    marketEn: "Ernakulam Coastal Farmers Market",
    marketMl: "എറണാകുളം പൊക്കാളി വിപണി (പറവൂർ)",
    district: "Ernakulam",
    price: 88,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [80, 82, 84, 85, 85, 86, 88],
    insightEn: "GI-tagged saline-resistant organic Pokkali rice commanding premium in health food segments.",
    insightMl: "ഭൂപ്രദേശ സൂചിക പദവിയുള്ള ഓർഗാനിക് പൊക്കാളി അരിക്ക് വിപണിയിൽ മികച്ച പ്രീമിയം വില."
  },
  {
    id: "jeerakasala_rice",
    category: "Cereals & Tubers",
    cropEn: "Jeerakasala Scented Rice",
    cropMl: "ജീരകശാല സുഗന്ധ നെല്ല് (Jeerakasala)",
    marketEn: "Wayanad Organic Hub",
    marketMl: "വയനാട് പാരമ്പര്യ നെല്ല് വിപണി (മാനന്തവാടി)",
    district: "Wayanad",
    price: 118,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [110, 112, 114, 115, 116, 117, 118],
    insightEn: "Aromatic Malabar Biryani rice Jeerakasala experiencing high culinary demand.",
    insightMl: "തലശ്ശേരി ദം ബിരിയാണിക്ക് ഉപയോഗിക്കുന്ന ജീരകശാല അരിക്ക് ഉയർന്ന ഡിമാൻഡ്."
  },
  {
    id: "tapioca_fresh",
    category: "Cereals & Tubers",
    cropEn: "Tapioca / Cassava (Fresh Kappa)",
    cropMl: "കപ്പ / മരച്ചീനി (Fresh Tapioca)",
    marketEn: "Kottayam Wholesale Mandi",
    marketMl: "കോട്ടയം മാർക്കറ്റ്",
    district: "Kottayam",
    price: 26,
    unit: "kg",
    trend: "-2%",
    isUp: false,
    history: [28, 28, 27, 27, 26, 26, 26],
    insightEn: "Heavy tapioca harvest arrivals in central districts stabilizing farm-gate prices at ₹24-₹26/kg.",
    insightMl: "വിളവെടുപ്പ് കൂടിയതോടെ കോട്ടയം വിപണിയിൽ പച്ചക്കപ്പ വില കിലോയ്ക്ക് ₹26 ആയി."
  },
  {
    id: "elephant_foot_yam",
    category: "Cereals & Tubers",
    cropEn: "Elephant Foot Yam (Chena)",
    cropMl: "ചേന (Elephant Foot Yam)",
    marketEn: "Thrissur Central Mandi",
    marketMl: "തൃശ്ശൂർ ശക്തൻ മാർക്കറ്റ്",
    district: "Thrissur",
    price: 46,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [42, 42, 43, 44, 45, 45, 46],
    insightEn: "Gajendra variety Chena tubers seeing active trading with regular hotel consumption.",
    insightMl: "ശക്തൻ മാർക്കറ്റിൽ ചേനയ്ക്ക് സ്ഥിരതയുള്ള മികച്ച വില ലഭിക്കുന്നു."
  },
  {
    id: "taro_chembu",
    category: "Cereals & Tubers",
    cropEn: "Taro / Colocasia (Chembu)",
    cropMl: "ചേമ്പ് (Taro / Chembu)",
    marketEn: "Malappuram Vegetable Mandi",
    marketMl: "മലപ്പുറം പച്ചക്കറി വിപണി (മഞ്ചേരി)",
    district: "Malappuram",
    price: 56,
    unit: "kg",
    trend: "+1%",
    isUp: true,
    history: [52, 53, 54, 54, 55, 55, 56],
    insightEn: "Local Kannan Chembu commanding good retail markup across Malabar.",
    insightMl: "നാടൻ കണ്ണൻ ചേമ്പിന് മലബാറിലെ വിപണികളിൽ മികച്ച ഡിമാൻഡ്."
  },
  {
    id: "greater_yam_kachil",
    category: "Cereals & Tubers",
    cropEn: "Greater Yam (Kachil)",
    cropMl: "കാച്ചിൽ (Greater Yam)",
    marketEn: "Pathanamthitta Mandi",
    marketMl: "പത്തനംതിട്ട മാർക്കറ്റ് (അടൂർ)",
    district: "Pathanamthitta",
    price: 62,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [58, 58, 59, 60, 60, 61, 62],
    insightEn: "Nutritious traditional yams fetching consistent farmer margins.",
    insightMl: "പാരമ്പര്യ കിഴങ്ങുവർഗ്ഗമായ കാച്ചിലിന് അടൂർ വിപണിയിൽ നല്ല വില."
  },
  {
    id: "chinese_potato_koorka",
    category: "Cereals & Tubers",
    cropEn: "Chinese Potato (Koorka)",
    cropMl: "കൂർക്ക (Chinese Potato)",
    marketEn: "Thrissur Mandi",
    marketMl: "തൃശ്ശൂർ കൂർക്ക വിപണി",
    district: "Thrissur",
    price: 78,
    unit: "kg",
    trend: "+8%",
    isUp: true,
    history: [68, 70, 72, 74, 75, 76, 78],
    insightEn: "High seasonal demand for cleaned Koorka tubers pushing wholesale price to ₹78.",
    insightMl: "തൃശ്ശൂർ വിപണിയിൽ കൂർക്കയ്ക്ക് മികച്ച ഡിമാൻഡും ഉയർന്ന വിലയും."
  },

  // ------------------------------------------------------------------------
  // 4. BANANAS & FRUITS (പഴങ്ങൾ / വാഴയിനങ്ങൾ)
  // ------------------------------------------------------------------------
  {
    id: "nendran_banana_raw",
    category: "Fruits & Bananas",
    cropEn: "Nendran Banana (Raw / Cooking)",
    cropMl: "നേന്ത്രക്കായ (Raw Nendran)",
    marketEn: "Ernakulam Wholesale Mandi",
    marketMl: "എറണാകുളം മാർക്കറ്റ്",
    district: "Ernakulam",
    price: 49,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [45, 46, 46, 47, 48, 48, 49],
    insightEn: "Banana chips manufacturing units in Kochi maintaining steady raw Nendran procurement.",
    insightMl: "ചിപ്സ് നിർമ്മാണ കമ്പനികളുടെ സംഭരണം മൂലം നേന്ത്രക്കായക്ക് സ്ഥിരതയുള്ള വില."
  },
  {
    id: "nendran_banana_ripe",
    category: "Fruits & Bananas",
    cropEn: "Nendran Banana (Ripe Fruit)",
    cropMl: "നേന്ത്രപ്പഴം (Ripe Nendran)",
    marketEn: "Thrissur Wholesale Mandi",
    marketMl: "തൃശ്ശൂർ ശക്തൻ മാർക്കറ്റ്",
    district: "Thrissur",
    price: 58,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [54, 55, 55, 56, 56, 57, 58],
    insightEn: "Grade-A table Nendran fruit commanding ₹58/kg in central wholesale auctions.",
    insightMl: "നല്ല ഗുണമേന്മയുള്ള നേന്ത്രപ്പഴത്തിന് തൃശ്ശൂർ വിപണിയിൽ ₹58 ലഭിക്കുന്നു."
  },
  {
    id: "robusta_banana",
    category: "Fruits & Bananas",
    cropEn: "Robusta Banana (Pachavazha)",
    cropMl: "റോബസ്റ്റ പഴം (Robusta Banana)",
    marketEn: "Palakkad Mandi",
    marketMl: "പാലക്കാട് പഴം വിപണി",
    district: "Palakkad",
    price: 33,
    unit: "kg",
    trend: "-1%",
    isUp: false,
    history: [35, 34, 34, 33, 33, 33, 33],
    insightEn: "High fruit harvests in border taluks keeping Robusta banana affordable.",
    insightMl: "വിളവെടുപ്പ് ഉയർന്നതോടെ റോബസ്റ്റ വാഴപ്പഴം ₹33 ൽ വ്യാപാരം നടക്കുന്നു."
  },
  {
    id: "poovan_banana",
    category: "Fruits & Bananas",
    cropEn: "Poovan Banana (Mysore Poovan)",
    cropMl: "പൂവൻ പഴം (Poovan Banana)",
    marketEn: "Alappuzha Market",
    marketMl: "ആലപ്പുഴ മാർക്കറ്റ്",
    district: "Alappuzha",
    price: 43,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [40, 40, 41, 41, 42, 42, 43],
    insightEn: "Regular household consumption supports solid Poovan banana realizations.",
    insightMl: "പൂവൻ പഴത്തിന് നിത്യോപയോഗ ഡിമാൻഡ് ശക്തമായി തുടരുന്നു."
  },
  {
    id: "red_banana_chenkadali",
    category: "Fruits & Bananas",
    cropEn: "Red Banana (Chenkadali / Kappa)",
    cropMl: "ചെങ്കദളി / കപ്പപ്പഴം (Red Banana)",
    marketEn: "Thiruvananthapuram Chala Mandi",
    marketMl: "തിരുവനന്തപുരം ചാല മാർക്കറ്റ്",
    district: "Thiruvananthapuram",
    price: 69,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [62, 64, 65, 66, 67, 68, 69],
    insightEn: "Chenkadali red banana commanding premium in Southern Kerala and temple offerings.",
    insightMl: "ചാല മാർക്കറ്റിൽ ചെങ്കദളി പഴത്തിന് ഏറ്റവും ഉയർന്ന പ്രീമിയം വില ലഭിക്കുന്നു."
  },
  {
    id: "njalipoovan_banana",
    category: "Fruits & Bananas",
    cropEn: "Njalipoovan (Small Yellow Banana)",
    cropMl: "ഞാലിപ്പൂവൻ (Njalipoovan)",
    marketEn: "Kottayam Mandi",
    marketMl: "കോട്ടയം ചന്ത",
    district: "Kottayam",
    price: 56,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [52, 52, 53, 54, 55, 55, 56],
    insightEn: "Sweet Njalipoovan bunches seeing steady retail movements.",
    insightMl: "ഞാലിപ്പൂവൻ പഴത്തിന് കോട്ടയം വിപണിയിൽ കിലോയ്ക്ക് ₹56 ലഭിക്കുന്നു."
  },
  {
    id: "pineapple_vazhakulam",
    category: "Fruits & Bananas",
    cropEn: "Vazhakulam Pineapple (Mauritius GI)",
    cropMl: "കണ്ണാറ കൈതച്ചക്ക (Vazhakulam Pineapple)",
    marketEn: "Vazhakulam Pineapple Market",
    marketMl: "വാഴക്കുളം പൈനാപ്പിൾ മാർക്കറ്റ് (ഏഷ്യയിലെ ഏറ്റവും വലിയ വിപണി)",
    district: "Ernakulam",
    price: 46,
    unit: "kg",
    trend: "+6%",
    isUp: true,
    history: [40, 41, 42, 43, 44, 45, 46],
    insightEn: "GI-certified Vazhakulam Mauritius pineapple loading over 50 trucks daily to North Indian metros.",
    insightMl: "വാഴക്കുളം പൈനാപ്പിൾ മാർക്കറ്റിൽ നിന്ന് വടക്കേന്ത്യൻ നഗരങ്ങളിലേക്ക് വൻതോതിൽ കയറ്റുമതി."
  },
  {
    id: "mango_muthalamada",
    category: "Fruits & Bananas",
    cropEn: "Mango (Muthalamada / Neelam)",
    cropMl: "മുതലമട മാങ്ങ (Muthalamada Mango)",
    marketEn: "Muthalamada Mango Hub",
    marketMl: "മുതലമട മാംഗോ സിറ്റി (പാലക്കാട്)",
    district: "Palakkad",
    price: 88,
    unit: "kg",
    trend: "+7%",
    isUp: true,
    history: [78, 80, 82, 84, 85, 86, 88],
    insightEn: "First-harvest mangoes from Muthalamada commanding top export bids in Delhi and Mumbai.",
    insightMl: "ഇന്ത്യയിൽ ഏറ്റവും ആദ്യം വിളവെടുക്കുന്ന മുതലമട മാങ്ങകൾക്ക് ഉയർന്ന വിപണി വില."
  },
  {
    id: "jackfruit_varikka",
    category: "Fruits & Bananas",
    cropEn: "Jackfruit (Varikka)",
    cropMl: "വരിക്കച്ചക്ക (Jackfruit)",
    marketEn: "Idukki Fruit Mandi",
    marketMl: "ഇടുക്കി ചക്ക വിപണി (തൊടുപുഴ)",
    district: "Idukki",
    price: 36,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [32, 33, 34, 34, 35, 35, 36],
    insightEn: "Official state fruit seeing increased value addition in snacks and freeze-dried products.",
    insightMl: "സംസ്ഥാന ഫലമായ ചക്കയ്ക്ക് മൂല്യവർദ്ധിത ഉൽപ്പന്ന മേഖലയിൽ നിന്നും നല്ല ഡിമാൻഡ്."
  },
  {
    id: "papaya_red_lady",
    category: "Fruits & Bananas",
    cropEn: "Papaya (Red Lady Hybrid)",
    cropMl: "റെഡ് ലേഡി പപ്പായ (Papaya)",
    marketEn: "Malappuram Fruit Market",
    marketMl: "മലപ്പുറം പഴം വിപണി",
    district: "Malappuram",
    price: 39,
    unit: "kg",
    trend: "+1%",
    isUp: true,
    history: [36, 36, 37, 37, 38, 38, 39],
    insightEn: "Sweet table papaya varieties trading firmly with daily city juice counter demands.",
    insightMl: "റെഡ് ലേഡി പപ്പായക്ക് വിപണിയിൽ സ്ഥിരതയുള്ള വില ലഭ്യമാണ്."
  },

  // ------------------------------------------------------------------------
  // 5. VEGETABLES & GREENS (പച്ചക്കറികളും ഇലവർഗ്ഗങ്ങളും)
  // ------------------------------------------------------------------------
  {
    id: "tomato_hybrid",
    category: "Vegetables",
    cropEn: "Tomato (Hybrid)",
    cropMl: "തക്കാളി (Tomato)",
    marketEn: "Thrissur Wholesale Mandi",
    marketMl: "തൃശ്ശൂർ മൊത്ത പച്ചക്കറി വിപണി",
    district: "Thrissur",
    price: 42,
    unit: "kg",
    trend: "+4%",
    isUp: true,
    history: [38, 39, 40, 39, 41, 41, 42],
    insightEn: "Tomato rates in Thrissur have increased by 4% due to higher transport demand.",
    insightMl: "തൃശ്ശൂർ വിപണിയിൽ തക്കാളി വില കിലോയ്ക്ക് ₹42 ആയി വർദ്ധിച്ചു."
  },
  {
    id: "green_chilli",
    category: "Vegetables",
    cropEn: "Green Chilli (Pacha Mulaku)",
    cropMl: "പച്ചമുളക് (Green Chilli)",
    marketEn: "Palakkad Vegetable Mandi",
    marketMl: "പാലക്കാട് പച്ചക്കറി ചന്ത",
    district: "Palakkad",
    price: 64,
    unit: "kg",
    trend: "+8%",
    isUp: true,
    history: [55, 56, 58, 60, 61, 62, 64],
    insightEn: "Pungent green chilli arrivals reduced due to intermittent rains, lifting wholesale prices.",
    insightMl: "വരവ് കുറഞ്ഞതിനാൽ പച്ചമുളക് വില ₹64 ലേക്ക് ഉയർന്നു."
  },
  {
    id: "kanthari_chilli",
    category: "Vegetables",
    cropEn: "Kanthari Chilli (Bird's Eye)",
    cropMl: "കാന്താരി മുളക് (Bird's Eye Chilli)",
    marketEn: "Kozhikode Spices Market",
    marketMl: "കോഴിക്കോട് വലിയങ്ങാടി",
    district: "Kozhikode",
    price: 285,
    unit: "kg",
    trend: "+10%",
    isUp: true,
    history: [250, 255, 260, 268, 272, 280, 285],
    insightEn: "Extremely high medicinal and culinary demand for fresh white/green Kanthari mulaku.",
    insightMl: "ഔഷധഗുണമുള്ള കാന്താരി മുളകിന് കിലോയ്ക്ക് ₹285 വരെ ഉയർന്ന വില."
  },
  {
    id: "yardlong_bean_payar",
    category: "Vegetables",
    cropEn: "Yardlong Bean (Vellayani Jyothika)",
    cropMl: "പയർ / വള്ളിപ്പയർ (Yardlong Bean)",
    marketEn: "Ernakulam Vegetable Market",
    marketMl: "എറണാകുളം മാർക്കറ്റ്",
    district: "Ernakulam",
    price: 55,
    unit: "kg",
    trend: "+3%",
    isUp: true,
    history: [50, 50, 52, 52, 53, 54, 55],
    insightEn: "Fresh Jyothika cowpea pods seeing quick daily sales in urban markets.",
    insightMl: "നാടൻ വള്ളിപ്പയറിന് എറണാകുളം വിപണിയിൽ മികച്ച വില."
  },
  {
    id: "okra_vendakka",
    category: "Vegetables",
    cropEn: "Okra / Ladies Finger (Susthira)",
    cropMl: "വെണ്ടയ്ക്ക (Okra / Vendakka)",
    marketEn: "Thrissur Mandi",
    marketMl: "തൃശ്ശൂർ മാർക്കറ്റ്",
    district: "Thrissur",
    price: 38,
    unit: "kg",
    trend: "-2%",
    isUp: false,
    history: [42, 41, 40, 40, 39, 38, 38],
    insightEn: "Steady arrivals from local polyhouse and open farms keeping Okra prices well-balanced.",
    insightMl: "നാടൻ വെണ്ടയ്ക്ക നല്ല വരവോടെ ₹38 ൽ വ്യാപാരം നടക്കുന്നു."
  },
  {
    id: "bitter_gourd_pavakka",
    category: "Vegetables",
    cropEn: "Bitter Gourd (Priyanka / Pavakka)",
    cropMl: "പാവയ്ക്ക (Bitter Gourd)",
    marketEn: "Ernakulam Mandi",
    marketMl: "എറണാകുളം പച്ചക്കറി വിപണി",
    district: "Ernakulam",
    price: 58,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [52, 53, 54, 55, 56, 57, 58],
    insightEn: "White and green bitter gourd receiving high health-conscious consumer orders.",
    insightMl: "ഗുണമേന്മയുള്ള പാവയ്ക്കയ്ക്ക് വിപണിയിൽ മികച്ച വില ലഭ്യമാണ്."
  },
  {
    id: "snake_gourd_padavalanga",
    category: "Vegetables",
    cropEn: "Snake Gourd (Padavalanga)",
    cropMl: "പടവലങ്ങ (Snake Gourd)",
    marketEn: "Thrissur Mandi",
    marketMl: "തൃശ്ശൂർ മാർക്കറ്റ്",
    district: "Thrissur",
    price: 35,
    unit: "kg",
    trend: "+1%",
    isUp: true,
    history: [33, 33, 34, 34, 34, 35, 35],
    insightEn: "Local Padavalanga trading steadily in all central Kerala vegetable hubs.",
    insightMl: "പടവലങ്ങയ്ക്ക് തൃശ്ശൂർ വിപണിയിൽ സ്ഥിരതയുള്ള വില."
  },
  {
    id: "ash_gourd_kumpalanga",
    category: "Vegetables",
    cropEn: "Ash Gourd (Kumpalanga)",
    cropMl: "കുമ്പളങ്ങ (Ash Gourd)",
    marketEn: "Kollam Wholesale Mandi",
    marketMl: "കൊല്ലം പച്ചക്കറി ചന്ത",
    district: "Kollam",
    price: 25,
    unit: "kg",
    trend: "0%",
    isUp: true,
    history: [25, 25, 25, 25, 25, 25, 25],
    insightEn: "Long storage life allows smooth trading of ash gourd at ₹25/kg.",
    insightMl: "കുമ്പളങ്ങ വില കൊല്ലം വിപണിയിൽ ₹25 ൽ സ്ഥിരതയോടെ നിൽക്കുന്നു."
  },
  {
    id: "pumpkin_mathanga",
    category: "Vegetables",
    cropEn: "Pumpkin (Mathanga)",
    cropMl: "മത്തങ്ങ (Pumpkin)",
    marketEn: "Palakkad Mandi",
    marketMl: "പാലക്കാട് മാർക്കറ്റ്",
    district: "Palakkad",
    price: 23,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [21, 21, 22, 22, 22, 23, 23],
    insightEn: "Sweet orange flesh pumpkins moving well to institutional canteens.",
    insightMl: "മത്തങ്ങയ്ക്ക് വിപണിയിൽ സ്ഥിരതയുള്ള വില നിലനിൽക്കുന്നു."
  },
  {
    id: "brinjal_vazhutana",
    category: "Vegetables",
    cropEn: "Brinjal / Eggplant (Surya / Swetha)",
    cropMl: "വഴുതനങ്ങ (Brinjal)",
    marketEn: "Thrissur Mandi",
    marketMl: "തൃശ്ശൂർ മാർക്കറ്റ്",
    district: "Thrissur",
    price: 36,
    unit: "kg",
    trend: "-3%",
    isUp: false,
    history: [40, 39, 38, 37, 37, 36, 36],
    insightEn: "Plentiful local harvests in Thrissur and Palakkad softening Brinjal rates.",
    insightMl: "നാടൻ വഴുതനങ്ങ നല്ല ലഭ്യതയോടെ ₹36 ൽ വ്യാപാരം നടക്കുന്നു."
  },
  {
    id: "cucumber_vellarikka",
    category: "Vegetables",
    cropEn: "Cucumber (Kani Vellarikka)",
    cropMl: "കണിവെള്ളരി / വെള്ളരിക്ക (Cucumber)",
    marketEn: "Ernakulam Mandi",
    marketMl: "എറണാകുളം മാർക്കറ്റ്",
    district: "Ernakulam",
    price: 26,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [24, 24, 25, 25, 25, 26, 26],
    insightEn: "Golden yellow Kani Vellarikka and green salad cucumber trading actively.",
    insightMl: "വെള്ളരിക്കയ്ക്ക് വിപണിയിൽ നല്ല ഡിമാൻഡ് ലഭ്യമാണ്."
  },
  {
    id: "drumstick_muringakkaya",
    category: "Vegetables",
    cropEn: "Drumstick (Murungakkaya)",
    cropMl: "മുരിങ്ങക്കായ (Drumstick)",
    marketEn: "Palakkad Wholesale Mandi",
    marketMl: "പാലക്കാട് മുരിങ്ങക്കായ മാർക്കറ്റ്",
    district: "Palakkad",
    price: 68,
    unit: "kg",
    trend: "+12%",
    isUp: true,
    history: [55, 58, 60, 62, 64, 66, 68],
    insightEn: "Sharp uptick in Drumstick prices due to high culinary demand in Kerala curries.",
    insightMl: "ഡിമാൻഡ് ഉയർന്നതോടെ മുരിങ്ങക്കായ വില ₹68 ആയി വർദ്ധിച്ചു."
  },
  {
    id: "red_amaranthus_cheera",
    category: "Vegetables",
    cropEn: "Red Amaranthus (Chuvappu Cheera)",
    cropMl: "ചുവപ്പ് ചീര (Red Spinach)",
    marketEn: "Thiruvananthapuram Chala Mandi",
    marketMl: "തിരുവനന്തപുരം ചാല മാർക്കറ്റ്",
    district: "Thiruvananthapuram",
    price: 36,
    unit: "bundle",
    trend: "+2%",
    isUp: true,
    history: [32, 33, 34, 34, 35, 35, 36],
    insightEn: "Fresh morning harvests of organic red amaranthus selling rapidly.",
    insightMl: "ചാല മാർക്കറ്റിൽ നാടൻ ചുവപ്പ് ചീരയ്ക്ക് മികച്ച സ്വീകാര്യത."
  },
  {
    id: "curry_leaves_kariveppila",
    category: "Vegetables",
    cropEn: "Curry Leaves (Kariveppila)",
    cropMl: "കറിവേപ്പില (Curry Leaves)",
    marketEn: "Palakkad Wholesale Hub",
    marketMl: "പാലക്കാട് കറിവേപ്പില വിപണി",
    district: "Palakkad",
    price: 48,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [42, 44, 45, 45, 46, 47, 48],
    insightEn: "Pesticide-free Kerala curry leaves fetching higher prices than inter-state trucks.",
    insightMl: "വിഷരഹിത നാടൻ കറിവേപ്പിലയ്ക്ക് വിപണിയിൽ പ്രീമിയം വില."
  },
  {
    id: "cabbage_vattavada",
    category: "Vegetables",
    cropEn: "Cabbage (Vattavada Cool Season)",
    cropMl: "കാബേജ് (Cool-season Cabbage)",
    marketEn: "Vattavada Farm Outlet (Idukki)",
    marketMl: "വട്ടവട ശീതകാല പച്ചക്കറി വിപണി (ഇടുക്കി)",
    district: "Idukki",
    price: 29,
    unit: "kg",
    trend: "+2%",
    isUp: true,
    history: [26, 27, 27, 28, 28, 29, 29],
    insightEn: "Freshly harvested cool-season cabbage from Vattavada terraced farms trading strong.",
    insightMl: "വട്ടവടയിലെ മലയോര തോട്ടങ്ങളിൽ വിളഞ്ഞ കാബേജ് വിപണിയിൽ എത്തി തുടങ്ങി."
  },
  {
    id: "cauliflower_kanthalloor",
    category: "Vegetables",
    cropEn: "Cauliflower (Kanthalloor)",
    cropMl: "കോളിഫ്ലവർ (Cauliflower)",
    marketEn: "Kanthalloor Fruit & Vegetable Mandi",
    marketMl: "കാന്തല്ലൂർ ശീതകാല വിപണി (ഇടുക്കി)",
    district: "Idukki",
    price: 44,
    unit: "kg",
    trend: "+5%",
    isUp: true,
    history: [38, 40, 41, 42, 42, 43, 44],
    insightEn: "Snow-white tender cauliflower heads from Kanthalloor hillocks reaching Ernakulam.",
    insightMl: "കാന്തല്ലൂർ കോളിഫ്ലവറിന് ഉയർന്ന ഡിമാൻഡ്."
  }
];

// ------------------------------------------------------------------------
// DAILY LIVE MARKET PRICE DYNAMICS ENGINE
// Simulates real-world Kerala Mandi daily price fluctuations based on calendar date
// ------------------------------------------------------------------------

const mlMonths = ['ജനു', 'ഫെബ്രു', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗ', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം', 'ഡിസം'];
const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCalendarDays(referenceDate = new Date()) {
  const dates = [];
  const labelsEn = [];
  const labelsMl = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    dates.push(d);

    const dayNum = String(d.getDate()).padStart(2, '0');
    const mEn = enMonths[d.getMonth()];
    const mMl = mlMonths[d.getMonth()];

    if (i === 0) {
      labelsEn.push(`Today (${mEn} ${dayNum})`);
      labelsMl.push(`ഇന്ന് (${mMl} ${dayNum})`);
    } else {
      labelsEn.push(`${mEn} ${dayNum}`);
      labelsMl.push(`${mMl} ${dayNum}`);
    }
  }

  return { dates, labelsEn, labelsMl };
}

function computeDailyPrice(basePrice, id, date, intradaySeed = 0) {
  const dayIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));

  let idHash = 0;
  for (let i = 0; i < id.length; i++) {
    idHash = (idHash * 31 + id.charCodeAt(i)) % 9973;
  }

  // 1. Weekly mandi trading rhythm (e.g., peak procurement days vs weekend trade)
  const weeklyCycle = Math.sin(((dayIndex + idHash) % 7) * (Math.PI * 2 / 7)) * 0.035;

  // 2. Monthly macro trend (seasonal availability wave)
  const monthlyCycle = Math.cos(((dayIndex + idHash * 3) % 30) * (Math.PI * 2 / 30)) * 0.04;

  // 3. Daily mandi auction noise (-2.2% to +2.2%)
  const x = Math.sin(dayIndex * 12.9898 + idHash * 78.233 + intradaySeed * 5.71) * 43758.5453;
  const pseudoRand = x - Math.floor(x);
  const dailyNoise = (pseudoRand - 0.5) * 0.044;

  const factor = Math.max(0.7, 1 + weeklyCycle + monthlyCycle + dailyNoise);
  const rawPrice = basePrice * factor;

  if (basePrice >= 100) {
    return Math.round(rawPrice);
  } else if (basePrice >= 15) {
    return Math.round(rawPrice * 2) / 2; // e.g. 24.5, 42.0
  } else {
    return Math.round(rawPrice * 10) / 10;
  }
}

function getEnhancedCommodity(item, referenceDate = new Date(), intradaySeed = 0) {
  const { dates } = getCalendarDays(referenceDate);
  const history = dates.map(d => computeDailyPrice(item.price, item.id, d, intradaySeed));

  const todayPrice = history[6];
  const yesterdayPrice = history[5];
  const diff = Math.round((todayPrice - yesterdayPrice) * 100) / 100;
  const pctChange = yesterdayPrice > 0 ? ((diff / yesterdayPrice) * 100) : 0;
  const trendSign = diff >= 0 ? '+' : '';
  const trendStr = `${trendSign}${pctChange.toFixed(1)}%`;
  const isUp = diff >= 0;

  // Dynamic daily mandi market insights
  let insightEn = item.insightEn;
  let insightMl = item.insightMl;

  if (diff > 0) {
    insightEn = `${item.cropEn} rates in ${item.marketEn} climbed to ₹${todayPrice}/${item.unit} (+${pctChange.toFixed(1)}%) driven by brisk wholesale auction demand.`;
    insightMl = `${item.marketMl}-ൽ ${item.cropMl} വില കിലോയ്ക്ക് ₹${todayPrice} ആയി ഉയർന്നു (+${pctChange.toFixed(1)}%). ശക്തമായ വിപണി ഡിമാൻഡ്.`;
  } else if (diff < 0) {
    insightEn = `${item.cropEn} rates in ${item.marketEn} softened to ₹${todayPrice}/${item.unit} (${pctChange.toFixed(1)}%) with higher mandi arrivals today.`;
    insightMl = `${item.marketMl}-ൽ പുതിയ വിളവ് കൂടുതലായി എത്തിയതോടെ ${item.cropMl} വില ₹${todayPrice} ആയി ക്രമപ്പെട്ടു (${pctChange.toFixed(1)}%).`;
  } else {
    insightEn = `${item.cropEn} rates remained steady today at ₹${todayPrice}/${item.unit} across ${item.marketEn}.`;
    insightMl = `${item.marketMl}-ൽ ${item.cropMl} വില ഇന്ന് മാറ്റമില്ലാതെ ₹${todayPrice} ൽ തുടരുന്നു.`;
  }

  return {
    ...item,
    basePrice: item.price,
    price: todayPrice,
    yesterdayPrice: yesterdayPrice,
    changeAmount: diff,
    trend: trendStr,
    isUp: isUp,
    history: history,
    insightEn: insightEn,
    insightMl: insightMl,
    dateUpdated: referenceDate.toISOString().split('T')[0]
  };
}

module.exports = {
  keralaCommodities,
  getCalendarDays,
  computeDailyPrice,
  getEnhancedCommodity,

  getFilteredPrices(districtFilter = 'All', searchQuery = '', categoryFilter = 'All', referenceDate = new Date(), intradaySeed = 0) {
    const q = (searchQuery || '').toLowerCase().trim();
    const dist = (districtFilter || 'All').toLowerCase().trim();
    const cat = (categoryFilter || 'All').toLowerCase().trim();

    return keralaCommodities
      .filter(item => {
        // District match
        const matchDistrict = dist === 'all' || item.district.toLowerCase() === dist || item.marketEn.toLowerCase().includes(dist) || item.marketMl.toLowerCase().includes(dist);
        
        // Category match
        const matchCat = cat === 'all' || item.category.toLowerCase() === cat;

        // Query match
        const matchQuery = !q || 
          item.cropEn.toLowerCase().includes(q) || 
          item.cropMl.toLowerCase().includes(q) || 
          item.id.toLowerCase().includes(q) || 
          item.marketEn.toLowerCase().includes(q) || 
          item.marketMl.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);

        return matchDistrict && matchCat && matchQuery;
      })
      .map(item => getEnhancedCommodity(item, referenceDate, intradaySeed));
  },

  getCropChartData(cropNameOrId = 'tea_leaves', referenceDate = new Date(), intradaySeed = 0) {
    const term = (cropNameOrId || '').toLowerCase().trim();
    const rawItem = keralaCommodities.find(c => 
      c.id.toLowerCase() === term || 
      c.cropEn.toLowerCase().includes(term) || 
      c.cropMl.toLowerCase().includes(term)
    ) || keralaCommodities[0];

    const enhanced = getEnhancedCommodity(rawItem, referenceDate, intradaySeed);
    const { labelsEn, labelsMl } = getCalendarDays(referenceDate);

    return {
      cropEn: enhanced.cropEn,
      cropMl: enhanced.cropMl,
      marketEn: enhanced.marketEn,
      marketMl: enhanced.marketMl,
      price: enhanced.price,
      yesterdayPrice: enhanced.yesterdayPrice,
      changeAmount: enhanced.changeAmount,
      unit: enhanced.unit,
      trend: enhanced.trend,
      isUp: enhanced.isUp,
      insightEn: enhanced.insightEn,
      insightMl: enhanced.insightMl,
      labels: labelsEn,
      labelsMl: labelsMl,
      data: enhanced.history,
      lastUpdatedDate: enhanced.dateUpdated
    };
  }
};
