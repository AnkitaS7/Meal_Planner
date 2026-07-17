// Spice Route art kit — grain-textured dish plates, ingredient icons,
// spice-mound charts and page watermarks. All vector, all theme-aware.
//
// <SvgDefs/> must be mounted once (App does this); every other component
// references its <symbol>/<filter> definitions by id.

// Fixed "content" colors — spices and food read the same in day and night.
export const SPICE = {
  saffron:  "#E8842C",
  paprika:  "#C0492B",
  turmeric: "#E3A320",
  cardamom: "#C9A96E",
  matcha:   "#7A8B4C",
  chili:    "#C2452F",
  broth:    "#D89540",
  fig:      "#8E3B46",
};

// Nutrient name → spice, for the stall
export const NUTRIENT_SPICE = {
  Calories: SPICE.saffron,
  Protein:  SPICE.paprika,
  Carbs:    SPICE.turmeric,
  Fat:      SPICE.cardamom,
  Fiber:    SPICE.matcha,
  Fibre:    SPICE.matcha,
};

const DISH_IDS = [
  "d-noodle", "d-congee", "d-shak", "d-dal", "d-taco",
  "d-saag", "d-pho", "d-cacio", "d-jollof",
  "d-curry", "d-sabzi", "d-flatbread", "d-dosa", "d-idli", "d-pancake",
  "d-snackfry", "d-chaat", "d-kebab", "d-sandwich", "d-pizza", "d-salad",
  "d-raita", "d-chutney", "d-fish", "d-sweet", "d-kheer", "d-cake",
  "d-icecream", "d-drink",
  "d-muffin", "d-brownie", "d-pie", "d-loafcake", "d-cookieplate",
  "d-laddu", "d-jalebi", "d-gulabjamun", "d-halwa", "d-chai", "d-lassi",
  "d-momo", "d-puri", "d-naan", "d-samosa", "d-vada", "d-pakora",
  "d-cutlet", "d-murukku", "d-upma", "d-fruitsalad", "d-pickle", "d-podi",
  "d-biryani", "d-friedrice", "d-poriyal", "d-stirfry", "d-sambar",
  "d-korma", "d-makhani", "d-kofta", "d-kuzhambu",
];

// Cover-tint color per dish symbol (used behind deck-card plates)
export const DISH_TINT = {
  "d-noodle": "#D89540", "d-congee": "#EFE6CE", "d-shak": "#C24328",
  "d-dal": "#E0A81E", "d-taco": "#E8C87A", "d-saag": "#557A34",
  "d-pho": "#C89050", "d-cacio": "#EAD9A0", "d-jollof": "#D06428",
  "d-curry": "#C0532B", "d-sabzi": "#6E8B3D", "d-flatbread": "#DDB264",
  "d-dosa": "#E0A050", "d-idli": "#9DBB7A", "d-pancake": "#EFBE74",
  "d-snackfry": "#D89540", "d-chaat": "#E3A320", "d-kebab": "#B4502E",
  "d-sandwich": "#D9B96A", "d-pizza": "#C24328", "d-salad": "#6FA048",
  "d-raita": "#A8C48A", "d-chutney": "#A63A22", "d-fish": "#C9A05A",
  "d-sweet": "#D9A44A", "d-kheer": "#D9BC86", "d-cake": "#8E5B34",
  "d-icecream": "#D98CA6", "d-drink": "#E8A23C",
  "d-muffin": "#C98A50", "d-brownie": "#6E4222", "d-pie": "#DDB264",
  "d-loafcake": "#C9A05A", "d-cookieplate": "#C9822F",
  "d-laddu": "#E3A320", "d-jalebi": "#E8842C", "d-gulabjamun": "#8E4A30",
  "d-halwa": "#D98A2B", "d-chai": "#C9A05A", "d-lassi": "#EFE0BC",
  "d-momo": "#D9CBA8", "d-puri": "#E0A050", "d-naan": "#E8C87A",
  "d-samosa": "#D89540", "d-vada": "#C9822F", "d-pakora": "#D08A32",
  "d-cutlet": "#C9784C", "d-murukku": "#D9A44A", "d-upma": "#E8C87A",
  "d-fruitsalad": "#D98CA6", "d-pickle": "#B4772A", "d-podi": "#A63A22",
  "d-biryani": "#E0A050", "d-friedrice": "#D9B96A", "d-poriyal": "#6E8B3D",
  "d-stirfry": "#557A34", "d-sambar": "#C9641F", "d-korma": "#E8D5A8",
  "d-makhani": "#D06428", "d-kofta": "#B4502E", "d-kuzhambu": "#8E4A20",
};

// Ordered form-first rules, tuned against the live dish catalog (6,184
// names reviewed July 2026): specific dish forms (dosa, kebab, salad…)
// outrank sauce words (masala, curry), desserts outrank drinks (panna
// cotta ≠ panna), and word boundaries guard Indian names (paneer ≠ neer,
// kadai ≠ adai, shikampuri ≠ puri).
const DISH_RULES = [
  [/manchurian/, "d-curry"],
  // desserts before drinks (panna cotta ≠ panna, coffee cake ≠ coffee)
  [/ice cream|icecream|kulfi|popsicle|sorbet|gelato|frozen yog|falooda/, "d-icecream"],
  [/muffin|cupcake/, "d-muffin"],
  [/brownie|blondie/, "d-brownie"],
  [/\bpie\b|\btart|cheesecake/, "d-pie"],
  [/banana bread|\bloaf|pound cake|tea cake/, "d-loafcake"],
  [/cookie|biscuit|biscotti|\bmacaron\b|nankhatai/, "d-cookieplate"],
  [/\bcake|pastry|doughnut|donut|croissant|scone|bebinca|anarsa/, "d-cake"],
  [/kheer|payasam|phirni|pudding|custard|mousse|pradhaman|basundi|rabri|rabdi|shrikhand|parfait|panna cotta|fruit cream|trifle|\bsheer\b|sita ?bhog|halbai/, "d-kheer"],
  [/laddu|ladoo|energy ball|bliss ball/, "d-laddu"],
  [/jalebi|imarti|chhena jalebi/, "d-jalebi"],
  [/gulab jamun|rasgulla|ras ?malai|rasmalai|\bjamun\b|gulkand kulfi/, "d-gulabjamun"],
  [/halwa|halva|sheera|kesari|sukhdi|mohanthal|sweet pongal|chakkra pongal/, "d-halwa"],
  [/barfi|burfi|\bpeda\b|modak|mysore pak|kalakand|sandesh|chikki|katli|petha|gujiya|karanji|poornam|boorelu|obbattu|holige|puran poli|toffee|candy|fudge|truffle|aam papad|meetha|mithai/, "d-sweet"],
  [/\bchai\b|\btea\b|coffee|latte|hot chocolate/, "d-chai"],
  [/\blassi\b|smoothie|milkshake|\bshake\b|thandai|buttermilk|sol ?kadhi|dhoog/, "d-lassi"],
  [/\bpanna\b|shorbot|sharbat|sherbet|juice|mojito|cooler|\bkanji\b|shikanji|kokum|jaljeera|\bneera?\b|toddy|panakam?\b|\bdrink|aam ?ras\b/, "d-drink"],
  // griddle & steamed
  [/dosa|dosai|\bdose\b|cheela|chilla|pesarattu|crepe|uttapam|\badai\b/, "d-dosa"],
  [/pancake|waffle|\bappam|pudla|malpua|aebleskiver|æbleskiver|uthappam|unniyappam|vattayappam/, "d-pancake"],
  [/\bmomo|dumpling|dim ?sum|wonton|gyoza/, "d-momo"],
  [/idli|dhokla|idiyappam|puttu|kozhukattai|\bpidi\b|paniyaram|\bappe\b|kadubu|kudumulu/, "d-idli"],
  // breads
  [/\bpuri\b|poori|bhatura|\bluchi\b/, "d-puri"],
  [/\bnaan|kulcha|sheermal/, "d-naan"],
  [/paratha|\broti\b|rottis?\b|chapati|thepla|bhakri|phulka|thalipeeth|khakhra|\bpita\b|focaccia|flatbread|garlic bread|\btoast|pathiri|parotta|akki rotti|\bbread\b/, "d-flatbread"],
  [/pizza|calzone/, "d-pizza"],
  [/sandwich|burger|slider|panini|grilled cheese|vada pav|\bpav\b|dabeli|bunny chow/, "d-sandwich"],
  [/\btaco|quesadilla|burrito|\bwrap|frankie|kathi roll|spring roll|enchilada|fajita|shawarma|tortilla/, "d-taco"],
  // street & fried
  [/chaat|pani ?puri|golgappa|\bbhel|sev puri|dahi puri|papdi|ragda|misal|churumuri|murmura|puffed rice/, "d-chaat"],
  [/samosa|kachori/, "d-samosa"],
  [/\bvada\b|vadai|bonda|\bvade\b/, "d-vada"],
  [/pakora|pakoda|bhajiya|fritter|\b65\b|popper|wings/, "d-pakora"],
  [/cutlet|tikki|patty|croquette|nugget|latkes|kabab? ?patt/, "d-cutlet"],
  [/murukku|chakli|\bsev\b|chivda|namak para|mathri|nippattu|fryums|wafer/, "d-murukku"],
  [/fries\b|chips/, "d-snackfry"],
  [/kebab|kabab|\btikka\b(?! masala)|tandoori|skewer|satay|\bgrill|seekh|\bbbq\b|barbecue|shashlik|galauti/, "d-kebab"],
  // eggs, bowls, plates
  [/shakshuka|omelet|omelette|frittata|bhurji|\bburji\b|aku?ri\b|akoori|\beggs?\b|\banda\b/, "d-shak"],
  [/noodle|ramen|\budon\b|\bsoba\b|chow ?mein|\bhakka\b|maggi|pad thai|\bpho\b|laksa|thukpa|\bsevai\b|semiya|vermicelli/, "d-noodle"],
  [/pasta|spaghetti|penne|macaroni|mac and cheese|lasagn|fettuc|linguine|ravioli|gnocchi|orzo|risotto|aglio|fusilli/, "d-cacio"],
  [/\bsoup|rasam|shorba|\bbroth|\bstew|minestrone|gazpacho|chowder|charu\b/, "d-pho"],
  [/khichdi|khichadi|\bpongal|\bupma\b|\bpoha\b|\bdali?ya\b/, "d-upma"],
  [/congee|porridge|\boats\b|oatmeal|muesli|granola|cereal/, "d-congee"],
  [/fruit salad|fruit chaat|fruit bowl/, "d-fruitsalad"],
  [/salad|kosambari|\bslaw\b|kachumber|koshimbir/, "d-salad"],
  [/raita|pachadi|tzatziki|\bdahi\b|thayir|curd rice/, "d-raita"],
  [/pickle|\bachar\b|murabba|chunda|launji|thokku/, "d-pickle"],
  [/\bpodi\b|\bpowder\b|spice mix|masala powder/, "d-podi"],
  [/chutney|chaatni|\bdip\b|hummus|pesto|salsa|\bjam\b|spread\b|relish|thecha|gojju|thogayal/, "d-chutney"],
  [/\bfish|macher|machh|prawn|shrimp|\bcrab|squid|pomfret|salmon|\btuna\b|jhinga|\bmeen\b|chemmeen|surmai|bangda|sardine/, "d-fish"],
  // rice
  [/biryani|\bdum\b/, "d-biryani"],
  [/fried rice/, "d-friedrice"],
  [/pulao|pilaf|pulav|jollof|paella|\brice\b|\bbath\b|sadam|bisi bele|tahdig|zarda/, "d-jollof"],
  [/\bsaag\b|palak|spinach|keerai|\bshaak\b/, "d-saag"],
  // vegetables
  [/poriyal|thoran|palya|mezhukkupuratti|foogath|usili|sundal/, "d-poriyal"],
  [/stir[- ]fry|saute|szechuan veg|chinese veg/, "d-stirfry"],
  [/sabzi|subzi|bharta|\bbhaji\b|\bfry\b|sukka|chorchori|varuval|\bgobi\b|\bokra\b|bhindi|musallam|\broast\b|\bbhaja\b|labra|baked beans/, "d-sabzi"],
  // dals & curries
  [/sambar|sambhar/, "d-sambar"],
  [/\bdal\b|\bdaal\b|\bdhal\b|\bamti\b|\bvaran\b|chana masala|rajma|chole|kadala|lobia|\busal\b|\bkadhi\b|kootu|lentil/, "d-dal"],
  [/korma|kurma|\bmalai\b|shahi|rezala|\bwhite gravy/, "d-korma"],
  [/makhani|makhanwala|butter chicken|butter masala|tikka masala/, "d-makhani"],
  [/kofta/, "d-kofta"],
  [/kuzhambu|kulambu|theeyal|vatha|puli ?ku|erissery|avial|aviyal|\bkalan\b|\bolan\b|mor ?ku/, "d-kuzhambu"],
  [/curry|masala|gosht|gravy|do pyaza|jalfrezi|vindaloo|xacuti|gh?assi|\bsalan\b|\brassa\b|\bjhol\b|kalia|chettinad|kadai|karahi|handi|pappu|sizzler/, "d-curry"],
];

const CAT_FALLBACK = {
  Dessert: "d-sweet", Beverages: "d-drink", Breakfast: "d-congee",
  Snack: "d-snackfry", Side: "d-sabzi", Main: "d-curry",
};

// Deterministic dish → artwork. Form keywords first, then the dish's
// category, and a stable name hash only when both are missing.
export function dishSymbol(dish) {
  const name = (dish?.name ?? "").toLowerCase();
  for (const [re, id] of DISH_RULES) {
    if (re.test(name)) return id;
  }
  const category = dish?.category ?? "";
  if (CAT_FALLBACK[category]) return CAT_FALLBACK[category];
  const c = category.toLowerCase();
  if (c.includes("breakfast")) return "d-congee";
  if (c.includes("dessert") || c.includes("sweet")) return "d-sweet";
  if (c.includes("beverage") || c.includes("drink")) return "d-drink";
  if (c.includes("soup")) return "d-pho";
  let h = 0;
  const s = name || c || "dish";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return DISH_IDS[h % DISH_IDS.length];
}

// A plated dish. Round, grain-textured, consistent light.
// When real photography lands, this component swaps to an <img> for dishes
// that have a photo URL and keeps the illustration as the fallback.
export function DishArt({ dish, size = 40, style }) {
  const id = dishSymbol(dish);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", display: "inline-block", background: "#F4EFE2",
        boxShadow: "0 4px 10px -4px rgba(10,10,10,0.35), inset 0 0 0 2px rgba(255,255,255,0.5)",
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
        <use href={`#${id}`} />
      </svg>
    </span>
  );
}

// Ordered form-first rules, tuned against the live ingredient catalog
// (8,307 aliases reviewed July 2026 — meat cuts, canned goods, and bakery
// dominate). Specific foods outrank container words (ice cream before
// cream, peanut before butter, noodles before egg).
const ING_RULES = [
  [/ice ?cream|frozen novelt|popsicle|ice type|sherbet|sorbet|kulfi|frozen yog/, "i-frozen"],
  [/chicken|turkey|broiler|fryer|duck\b|poultry|\bhen\b|quail/, "i-chicken"],
  [/\bham\b|bacon|pastrami|prosciutto/, "i-ham"],
  [/sausage|salami|chorizo|frankfurter|hot ?dog|pepperoni/, "i-sausage"],
  [/beef|pork|lamb|veal|mutton|steak|\bloin|\bribs?\b|chuck|sirloin|brisket|\bgoat\b|keema|\bchops?\b|shank|tenderloin|meatball|liver|shoulder|cured|\bmeats?\b|venison|rabbit/, "i-meat"],
  [/crab|lobster/, "i-crab"],
  [/oyster|clam|mussel|scallop|snail|mollusk|squid|octopus/, "i-shellfish"],
  [/shrimp|prawn/, "i-shrimp"],
  [/\bfish|salmon|tuna|\bcod\b|sardine|mackerel|anchov|trout|halibut|pomfret|tilapia|herring|kingfish|rohu|catla|surmai|snapper|carp\b|\beel\b|\broe\b|pollock|seafood|mahi/, "i-fish"],
  [/pasta|noodles?\b|spaghetti|macaroni|vermicelli|penne|lasagn|fusilli/, "i-pastadry"],
  [/lentil|\bdal\b|moong|masoor|toor|urad|chana\b|chickpea|rajma|kidney bean|mature seeds|soya?bean|split pea|lobia|pigeon pea|pulses?\b/, "i-pulses"],
  [/\beggs?\b/, "i-egg"],
  [/\bchips\b|crisps|popcorn|pretzel|snacks?\b|namkeen|trail mix|granola bar|energy bar|cereal bar/, "i-snackpack"],
  [/cookies?|biscuits?|crackers?|biscotti|rusk|wafer/, "i-cookie"],
  [/croissant|pastry|muffin|doughnut|donut|cake\b|brownie|pie\b|danish/, "i-pastry"],
  [/bread|\bbuns?\b|loaf|bagel|toast|pizza\b|tortilla/, "i-bread"],
  [/paneer|tofu|cottage cheese/, "i-paneer"],
  [/cheese|cheddar|mozzarella|parmesan|feta|brie|gouda|ricotta|mascarpone/, "i-cheese"],
  [/chocolate|cocoa|candy|candies|toffee|fudge\b/, "i-choc"],
  [/canned|tinned/, "i-can"],
  [/yogh?urt|curd\b|\bdahi\b|kefir/, "i-curd"],
  [/almond|cashew|peanut|walnut|pistachio|\bpista\b|hazelnut|pecan|\bnuts?\b|macadamia|sesame|flax|chia\b|sunflower seed|pumpkin seed|melon seed/, "i-nuts"],
  [/butter\b(?! ?milk)|ghee|margarine/, "i-butter"],
  [/\btea\b|coffee|espresso|chai patti/, "i-tea"],
  [/honey|\bjam\b|marmalade|preserves?\b|nutella|spread\b/, "i-honeyjam"],
  [/pickle|\bachar\b|murabba|chunda|launji|thokku/, "i-picklejar"],
  [/^salt\b|table salt|sea salt|rock salt|black salt|kala namak|pink salt|baking soda|baking powder|yeast\b/, "i-salt"],
  [/sugar\b|jaggery|\bgur\b|sweetener/, "i-sugar"],
  [/\bmilk\b|cream\b(?! cheese)|buttermilk|condensed/, "i-milk"],
  [/\boil\b|vinegar|dressing/, "i-oil"],
  [/sauce|ketchup|mayonnaise/, "i-saucebottle"],
  [/juice|syrup|soda\b|beverage|drink|water\b|broth|stock\b|extract|essence|smoothie/, "i-bottle"],
  [/\bcorn\b|maize|sweetcorn/, "i-corn"],
  [/mushroom|shiitake|portabella/, "i-mushroom"],
  [/tomato/, "i-tomato"],
  [/onion(?!.*green)|shallot/, "i-onion"],
  [/potato|\byam\b|tapioca|cassava|\barbi\b|colocasia|raw banana|plantain/, "i-potato"],
  [/carrot|radish|beetroot|\bbeet\b|turnip|parsnip/, "i-carrot"],
  [/bell pepper|capsicum/, "i-pepper"],
  [/eggplant|aubergine|brinjal|baingan/, "i-eggplant"],
  [/pumpkin(?! seed)|squash|gourd|lauki|\bdudhi\b/, "i-pumpkin"],
  [/cucumber|zucchini|courgette/, "i-cucumber"],
  [/\bokra\b|bhindi|lady'?s? ?finger/, "i-okra"],
  [/cabbage|lettuce|bok choy|pak choi/, "i-cabbage"],
  [/broccoli|cauliflower/, "i-broccoli"],
  [/peas\b|edamame|\bmatar\b|snow pea|sugar ?snap/, "i-peas"],
  [/lemon|\blime\b|orange|citrus|yuzu|grapefruit|tangerine|mosambi/, "i-lemon"],
  [/banana(?! (flower|stem))/, "i-banana"],
  [/mango|\baam\b/, "i-mango"],
  [/pomegranate|\banar\b/, "i-pom"],
  [/grape\b|grapes|raisin/, "i-grapes"],
  [/melon\b|watermelon|cantaloupe|muskmelon/, "i-melon"],
  [/pineapple/, "i-pineapple"],
  [/berry|berries|cherry|cherries|currant/, "i-berry"],
  [/apple(?! ?gourd)|\bpear\b|peach|plum\b|apricot|kiwi|papaya|guava|\bfigs?\b|\bdates?\b/, "i-apple"],
  [/coconut|kopra|copra/, "i-coconut"],
  [/chili|chilli|jalape|serrano|habanero|cayenne/, "i-chili"],
  [/ginger|galangal/, "i-ginger"],
  [/garlic/, "i-garlic"],
  [/scallion|spring onion|green onion|leek|chive|celery|asparagus|lemongrass|beans?\b|drumstick/, "i-scallion"],
  [/spinach|herb|basil|\bmint\b|cilantro|parsley|kale|greens\b|rosemary|thyme|oregano|curry leaves|methi|fenugreek|dill|\bsage\b|bay lea|arugula|amaranth|leaves\b|\bpaan\b/, "i-herb"],
  [/cumin|cardamom|cloves?\b|cinnamon|peppercorn|black pepper|star anise|fennel seed|mustard seeds?|ajwain|whole spices/, "i-spices"],
  [/\brice\b|flour|\batta\b|wheat|farro|quinoa|oat|barley|millet|ragi|semolina|rava|sooji|suji|grain|poha|sabudana|cereal|couscous|bulgur|cornmeal|breadcrumb/, "i-sack"],
  [/masala|powder|spice|coriander|baking|paste\b|chutney|mustard\b|asafoetida|\bhing\b|saffron|vanilla|gelatin|khus/, "i-jar"],
];

const ING_CAT_FALLBACK = {
  Meat: "i-meat", Seafood: "i-fish", Dairy: "i-bottle", Grains: "i-sack",
  Bakery: "i-bread", Frozen: "i-frozen", Produce: "i-herb",
  Spices: "i-jar", Groceries: "i-jar", Pantry: "i-jar",
};

// Ingredient/pantry-item icon. Spices render as a filled jar in the
// item's category color; unknown items fall back to the jar too.
export function IngredientArt({ name = "", category = "", size = 44, jarColor }) {
  const n = name.toLowerCase();
  let id = null;
  for (const [re, sym] of ING_RULES) {
    if (re.test(n)) { id = sym; break; }
  }
  if (!id) id = ING_CAT_FALLBACK[category] ?? null;
  if (!id) {
    const cat = category.toLowerCase();
    if (cat.includes("produce") || cat.includes("veg")) id = "i-herb";
    else if (cat.includes("dairy")) id = "i-bottle";
    else if (cat.includes("meat")) id = "i-meat";
    else if (cat.includes("sea")) id = "i-fish";
    else if (cat.includes("grain")) id = "i-sack";
    else if (cat.includes("bakery")) id = "i-bread";
    else if (cat.includes("frozen")) id = "i-frozen";
    else id = "i-jar";
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 60" width={size} height={size}
      style={{
        display: "block", margin: "0 auto",
        filter: "drop-shadow(0 3px 4px rgba(10,10,10,0.18))",
        ...(id === "i-jar" ? { "--jc": jarColor ?? SPICE.turmeric } : {}),
      }}
    >
      <use href={`#${id}`} />
    </svg>
  );
}

// One nutrient as a grainy spice pile that fills toward its target.
// `sub` swaps the unit in the caption for a spice name ("Protein · paprika")
// and moves the unit up into the value line instead.
export function SpiceMound({ name, current, target, unit, color, pourDelay = 0.2, sub, style }) {
  const spice = color ?? NUTRIENT_SPICE[name] ?? SPICE.saffron;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const y = 64 - 54 * pct;
  const fmt = v => (Number.isInteger(v) ? v.toLocaleString() : Number(v).toFixed(1));
  return (
    <div style={{ flex: "1 1 96px", minWidth: 90, maxWidth: 180, textAlign: "center", ...style }}>
      <svg
        viewBox="0 0 120 70" width="100%" style={{ display: "block" }}
        role="img"
        aria-label={`${name}: ${fmt(current)} of ${fmt(target)} ${unit ?? ""}`}
      >
        <use href="#moundShape" fill="var(--mound)" />
        <g clipPath="url(#mclip)">
          <g className="sr-pour" style={{ "--pour-delay": `${pourDelay}s` }}>
            <rect x="0" y={y} width="120" height={70 - y} fill={spice} />
            <rect x="0" y={y} width="120" height={70 - y} fill="#3A2208" filter="url(#grain)" opacity="0.45" />
          </g>
        </g>
      </svg>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        <b>{fmt(current)}</b> / {fmt(target)}{sub && unit ? ` ${unit}` : ""}
      </div>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--faint)", marginTop: 2 }}>
        {name}{sub ? ` · ${sub}` : unit ? ` · ${unit}` : ""}
      </div>
    </div>
  );
}

// Oversized faint page motif. Parent must be position:relative + overflow:hidden.
export function Watermark({ symbol, size = 180, style }) {
  return (
    <svg
      className="sr-wm" aria-hidden="true"
      viewBox="0 0 60 60" width={size} height={size} style={style}
    >
      <use href={`#${symbol}`} />
    </svg>
  );
}

// Mounted once in App. Holds every shared filter/clip/symbol.
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <path id="moundShape" d="M6 64 C 30 60 42 28 60 10 C 78 28 90 60 114 64 Z" />
        <clipPath id="mclip"><use href="#moundShape" /></clipPath>
        <clipPath id="cp36"><circle cx="50" cy="50" r="36" /></clipPath>

        {/* dishes */}
        <symbol id="d-noodle" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#2E6E68" /><circle cx="50" cy="50" r="40" fill="#3D7D75" /><circle cx="50" cy="50" r="36" fill="#D89540" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A5010" filter="url(#grain)" opacity=".35" />
            <path d="M22 46 C 38 38 62 38 78 48 M24 56 C 40 49 60 49 76 57 M28 64 C 42 59 58 59 72 65" stroke="#F2DCA8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="35" cy="41" rx="11" ry="9" fill="#FBF3E0" /><circle cx="35" cy="41" r="4.5" fill="#E8A23C" />
            <circle cx="63" cy="38" r="3.5" fill="none" stroke="#6E8B3D" strokeWidth="2.2" />
            <path d="M52 30 c 5 -2 9 1 7 5 c -3 4 -9 1 -7 -5 Z" fill="#5E7A34" />
            <path d="M44 68 l 7 3" stroke="#C24E32" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-congee" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E8E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" /><circle cx="50" cy="50" r="36" fill="#EFE6CE" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B09860" filter="url(#grain)" opacity=".22" />
            <path d="M30 50 C 38 42 62 42 70 52 C 60 60 40 60 30 50 Z" fill="#F7F0DE" opacity=".8" />
            <path d="M38 40 l 9 -4 M52 38 l 9 3" stroke="#C98F3C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="42" cy="57" r="1.5" fill="#3A2E1E" /><circle cx="56" cy="58" r="1.5" fill="#3A2E1E" />
            <circle cx="62" cy="63" r="3" fill="none" stroke="#6E8B3D" strokeWidth="2" />
          </g>
        </symbol>
        <symbol id="d-shak" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#3A3A3E" /><circle cx="50" cy="50" r="41" fill="#2E2E32" /><circle cx="50" cy="50" r="36" fill="#C24328" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#701E0E" filter="url(#grain)" opacity=".4" />
            <circle cx="38" cy="42" r="9" fill="#F7F1E2" /><circle cx="38" cy="42" r="4" fill="#E8A23C" />
            <circle cx="62" cy="40" r="8.5" fill="#F7F1E2" /><circle cx="62" cy="40" r="3.8" fill="#E8A23C" />
            <circle cx="50" cy="62" r="9" fill="#F7F1E2" /><circle cx="50" cy="62" r="4" fill="#E8A23C" />
            <path d="M30 58 l 5 2 M68 56 l 5 -2" stroke="#5E7A34" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-dal" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#E0A81E" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A6208" filter="url(#grain)" opacity=".35" />
            <path d="M32 46 C 44 40 58 42 70 50" stroke="#F2DCA8" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
            <path d="M40 60 c 6 -3 12 -3 18 0" stroke="#C24E32" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M35 34 c 4 -4 8 -2 7 2 c -2 4 -8 2 -7 -2 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-taco" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="42" fill="#F2EBDA" />
          <path d="M20 62 A 18 18 0 0 1 56 62 Z" fill="#E8C87A" transform="rotate(-9 38 58)" />
          <path d="M24 58 h 28" stroke="#B4502E" strokeWidth="4" transform="rotate(-9 38 58)" />
          <path d="M26 54 h 24" stroke="#6E8B3D" strokeWidth="2.6" transform="rotate(-9 38 58)" />
          <path d="M44 66 A 18 18 0 0 1 80 66 Z" fill="#EED292" transform="rotate(7 62 62)" />
          <path d="M48 62 h 28" stroke="#B4502E" strokeWidth="4" transform="rotate(7 62 62)" />
          <path d="M50 58 h 24" stroke="#6E8B3D" strokeWidth="2.6" transform="rotate(7 62 62)" />
        </symbol>
        <symbol id="d-saag" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4A30" /><circle cx="50" cy="50" r="40" fill="#8A5638" /><circle cx="50" cy="50" r="36" fill="#557A34" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#2C4416" filter="url(#grain)" opacity=".4" />
            <rect x="34" y="36" width="12" height="12" rx="3" fill="#F7F1E2" /><rect x="54" y="42" width="11" height="11" rx="3" fill="#F2ECD9" /><rect x="42" y="56" width="11" height="11" rx="3" fill="#F7F1E2" />
            <path d="M62 60 l 6 3" stroke="#C24E32" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-pho" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E2D2" /><circle cx="50" cy="50" r="40" fill="#F4EFE2" /><circle cx="50" cy="50" r="36" fill="#C89050" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E5620" filter="url(#grain)" opacity=".3" />
            <path d="M24 52 C 40 44 60 44 76 54 M28 60 C 42 54 58 54 72 61" stroke="#F2E4C0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="40" cy="40" rx="9" ry="5.5" fill="#B87868" /><ellipse cx="58" cy="37" rx="8.5" ry="5" fill="#C4877A" />
            <path d="M68 46 c 4 -4 9 -2 8 2 c -2 5 -9 3 -8 -2 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-cacio" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="42" fill="#F2EBDA" />
          <path d="M30 52 C 36 40 64 40 70 52 C 64 64 36 64 30 52 Z" fill="#EAD9A0" />
          <path d="M32 50 C 40 42 60 42 68 51 M34 56 C 42 49 58 49 66 56" stroke="#DFC888" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="48" r="1.4" fill="#2E2A22" /><circle cx="55" cy="45" r="1.4" fill="#2E2A22" /><circle cx="61" cy="54" r="1.4" fill="#2E2A22" />
        </symbol>
        <symbol id="d-jollof" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#6E2E22" /><circle cx="50" cy="50" r="40" fill="#7E3628" /><circle cx="50" cy="50" r="36" fill="#D06428" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E3208" filter="url(#grain)" opacity=".5" />
            <path d="M38 56 l 8 -2 M54 58 l 8 -3" stroke="#B02E20" strokeWidth="3" strokeLinecap="round" />
            <path d="M46 34 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-curry" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4630" /><circle cx="50" cy="50" r="40" fill="#8A5238" /><circle cx="50" cy="50" r="36" fill="#C0532B" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#6E2510" filter="url(#grain)" opacity=".4" />
            <path d="M30 46 C 42 40 58 40 70 47" stroke="#F2E4C8" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85" />
            <ellipse cx="40" cy="58" rx="7" ry="5.5" fill="#A63A18" /><ellipse cx="57" cy="60" rx="6.5" ry="5" fill="#A63A18" />
            <circle cx="64" cy="40" r="2.2" fill="#E8A23C" /><circle cx="34" cy="38" r="2" fill="#E8A23C" />
            <path d="M48 32 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-sabzi" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EDDFB8" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#A88430" filter="url(#grain)" opacity=".2" />
            <path d="M30 44 l 12 4 M42 56 l 12 -4 M56 48 l 12 5 M34 62 l 11 3" stroke="#557A34" strokeWidth="5" strokeLinecap="round" />
            <path d="M46 38 l 9 2 M58 62 l 9 -2" stroke="#6FA048" strokeWidth="4" strokeLinecap="round" />
            <circle cx="40" cy="50" r="2" fill="#3A2E1E" /><circle cx="60" cy="56" r="2" fill="#3A2E1E" />
            <path d="M64 36 l 6 4" stroke="#C24E32" strokeWidth="3" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-flatbread" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <circle cx="48" cy="50" r="30" fill="#E8C87A" />
          <g clipPath="url(#cp36)">
            <circle cx="48" cy="50" r="30" fill="#B4834A" filter="url(#grain)" opacity=".3" />
          </g>
          <path d="M48 20 A 30 30 0 0 1 78 50 L 48 50 Z" fill="#F2D794" stroke="#C9A050" strokeWidth="1.5" />
          <circle cx="38" cy="42" r="2.5" fill="#B4834A" /><circle cx="52" cy="62" r="2.8" fill="#B4834A" />
          <circle cx="33" cy="58" r="2" fill="#B4834A" /><circle cx="62" cy="58" r="2.2" fill="#B4834A" />
        </symbol>
        <symbol id="d-dosa" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <g transform="rotate(-18 50 52)">
            <rect x="20" y="44" width="60" height="17" rx="8.5" fill="#E0A050" />
            <rect x="20" y="44" width="60" height="17" rx="8.5" fill="#A86420" filter="url(#grain)" opacity=".3" />
            <path d="M26 49 h 48" stroke="#F2C878" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="30" cy="72" r="5" fill="#F4EFE0" /><circle cx="46" cy="76" r="5" fill="#6E8B3D" /><circle cx="62" cy="73" r="5" fill="#C0532B" />
        </symbol>
        <symbol id="d-idli" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#4A6B2E" /><circle cx="50" cy="50" r="40" fill="#557A34" /><circle cx="50" cy="50" r="36" fill="#5E8A3A" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#2C4416" filter="url(#grain)" opacity=".35" />
            <path d="M20 50 C 40 44 60 44 80 50" stroke="#4A6B2E" strokeWidth="1.5" fill="none" />
            <ellipse cx="38" cy="42" rx="11" ry="8" fill="#F7F3E8" /><ellipse cx="62" cy="42" rx="11" ry="8" fill="#F2EDDF" />
            <ellipse cx="50" cy="60" rx="11" ry="8" fill="#F7F3E8" />
            <circle cx="72" cy="64" r="4.5" fill="#C0532B" />
          </g>
        </symbol>
        <symbol id="d-pancake" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <ellipse cx="50" cy="62" rx="26" ry="8" fill="#D89540" />
          <ellipse cx="50" cy="54" rx="24" ry="8" fill="#E8B05C" />
          <ellipse cx="50" cy="46" rx="22" ry="8" fill="#EFBE74" />
          <g clipPath="url(#cp36)">
            <ellipse cx="50" cy="46" rx="22" ry="8" fill="#A86420" filter="url(#grain)" opacity=".25" />
          </g>
          <path d="M36 44 C 40 50 46 50 48 45 M56 45 C 60 51 64 49 66 44" stroke="#8E5B2C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="45" y="36" width="10" height="7" rx="2" fill="#F7E9B0" />
        </symbol>
        <symbol id="d-snackfry" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EFE3C4" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B08840" filter="url(#grain)" opacity=".18" />
            <path d="M38 30 L 52 54 L 24 54 Z" fill="#D89540" />
            <path d="M38 30 L 52 54 L 24 54 Z" fill="#8A5010" filter="url(#grain)" opacity=".4" />
            <circle cx="62" cy="46" r="9" fill="#C9822F" /><circle cx="62" cy="46" r="9" fill="#7E4E10" filter="url(#grain)" opacity=".45" />
            <circle cx="52" cy="66" r="7.5" fill="#D08A32" /><circle cx="52" cy="66" r="7.5" fill="#7E4E10" filter="url(#grain)" opacity=".4" />
            <circle cx="72" cy="66" r="5.5" fill="#6E8B3D" />
          </g>
        </symbol>
        <symbol id="d-chaat" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EFE0BC" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B08840" filter="url(#grain)" opacity=".2" />
            <circle cx="38" cy="44" r="10" fill="#E8C87A" /><circle cx="60" cy="42" r="9" fill="#E3BC6A" /><circle cx="49" cy="62" r="10" fill="#E8C87A" />
            <path d="M30 40 C 44 34 60 34 70 42" stroke="#F7F3E8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M32 52 C 46 46 60 48 68 54" stroke="#8E4A20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M36 68 l 6 -1 M52 72 l 7 -2 M58 60 l 7 1" stroke="#E3A320" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="44" cy="48" r="1.8" fill="#C2452F" /><circle cx="56" cy="52" r="1.8" fill="#C2452F" /><circle cx="50" cy="38" r="1.8" fill="#C2452F" />
          </g>
        </symbol>
        <symbol id="d-kebab" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#3A3A3E" /><circle cx="50" cy="50" r="41" fill="#2E2E32" /><circle cx="50" cy="50" r="36" fill="#4A4440" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#1E1A16" filter="url(#grain)" opacity=".4" />
            <path d="M24 36 L 76 36" stroke="#C9C2B0" strokeWidth="2" />
            <rect x="30" y="30" width="11" height="12" rx="3" fill="#B4502E" /><rect x="45" y="30" width="11" height="12" rx="3" fill="#C9641F" /><rect x="60" y="30" width="11" height="12" rx="3" fill="#B4502E" />
            <path d="M24 60 L 76 60" stroke="#C9C2B0" strokeWidth="2" />
            <rect x="34" y="54" width="11" height="12" rx="3" fill="#C9641F" /><rect x="49" y="54" width="11" height="12" rx="3" fill="#B4502E" />
            <path d="M66 56 a 6 6 0 1 0 0 8" stroke="#E8C87A" strokeWidth="2.5" fill="none" />
            <path d="M33 33 l 5 6 M48 33 l 5 6" stroke="#5E3418" strokeWidth="1.6" />
          </g>
        </symbol>
        <symbol id="d-sandwich" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M28 40 L 72 40 L 50 66 Z" fill="#F2E2B8" stroke="#C99A50" strokeWidth="2.5" />
          <path d="M31 44 L 69 44" stroke="#6E8B3D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M34 49 L 65 49" stroke="#C24E32" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M38 54 L 61 54" stroke="#F2CC60" strokeWidth="3" strokeLinecap="round" />
          <circle cx="68" cy="62" r="3.5" fill="#6E8B3D" />
        </symbol>
        <symbol id="d-pizza" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <circle cx="50" cy="50" r="31" fill="#D89540" />
          <circle cx="50" cy="50" r="26" fill="#C24328" />
          <circle cx="50" cy="50" r="24" fill="#EFCB7E" />
          <g clipPath="url(#cp36)">
            <circle cx="50" cy="50" r="24" fill="#A87218" filter="url(#grain)" opacity=".25" />
          </g>
          <circle cx="42" cy="42" r="4.5" fill="#B02E20" /><circle cx="60" cy="46" r="4.5" fill="#B02E20" /><circle cx="48" cy="60" r="4.5" fill="#B02E20" />
          <path d="M58 58 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          <path d="M50 26 L 50 74 M26 50 L 74 50" stroke="#E8B96A" strokeWidth="1.6" opacity=".8" />
        </symbol>
        <symbol id="d-salad" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#4A6B2E" /><circle cx="50" cy="50" r="40" fill="#557A34" /><circle cx="50" cy="50" r="36" fill="#DDE8B8" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7A8B4C" filter="url(#grain)" opacity=".22" />
            <path d="M32 46 c -2 -9 6 -14 12 -10 M46 38 c 4 -7 14 -5 14 3 M62 46 c 8 -2 12 6 6 11" stroke="#5E8F3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M36 58 c -6 2 -6 10 1 11 M52 64 c 4 5 12 2 11 -5" stroke="#6FA048" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M50 50 L 58 58 M44 54 L 40 62" stroke="#4A7A34" strokeWidth="3" strokeLinecap="round" />
            <circle cx="44" cy="46" r="4" fill="#D64530" /><circle cx="60" cy="58" r="4" fill="#D64530" />
            <circle cx="52" cy="42" r="3" fill="#F7F3E8" /><circle cx="34" cy="54" r="2.6" fill="#F7F3E8" />
          </g>
        </symbol>
        <symbol id="d-raita" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#F7F3E8" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#C9B890" filter="url(#grain)" opacity=".18" />
            <circle cx="40" cy="46" r="4" fill="#DDE8B8" stroke="#A8C070" strokeWidth="1.5" />
            <circle cx="58" cy="54" r="4" fill="#DDE8B8" stroke="#A8C070" strokeWidth="1.5" />
            <circle cx="50" cy="64" r="3.4" fill="#DDE8B8" stroke="#A8C070" strokeWidth="1.5" />
            <path d="M44 34 c 4 -4 9 -1 7 3 c -2 4 -9 1 -7 -3 Z" fill="#5E7A34" />
            <path d="M32 58 c 5 2 8 6 8 10 M62 38 c 3 3 4 6 3 9" stroke="#C0532B" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
            <circle cx="36" cy="40" r="1.4" fill="#8E4A20" /><circle cx="64" cy="62" r="1.4" fill="#8E4A20" />
          </g>
        </symbol>
        <symbol id="d-chutney" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <circle cx="36" cy="46" r="15" fill="#8A5A2E" /><circle cx="36" cy="46" r="12" fill="#6E8B3D" />
          <g clipPath="url(#cp36)"><circle cx="36" cy="46" r="12" fill="#3A5216" filter="url(#grain)" opacity=".4" /></g>
          <circle cx="63" cy="58" r="13" fill="#8A5A2E" /><circle cx="63" cy="58" r="10" fill="#A63A22" />
          <g clipPath="url(#cp36)"><circle cx="63" cy="58" r="10" fill="#5E1808" filter="url(#grain)" opacity=".4" /></g>
          <path d="M30 42 c 3 -2 7 -1 8 2" stroke="#DDE8B8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="66" cy="55" r="1.5" fill="#F2C878" /><circle cx="60" cy="61" r="1.5" fill="#F2C878" />
          <path d="M52 30 l 7 3" stroke="#C24E32" strokeWidth="2.5" strokeLinecap="round" />
        </symbol>
        <symbol id="d-fish" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EDE2C0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#A88430" filter="url(#grain)" opacity=".15" />
            <path d="M26 50 C 34 40 54 38 64 48 C 56 58 36 60 26 50 Z" fill="#C9A05A" />
            <path d="M26 50 C 34 40 54 38 64 48 C 56 58 36 60 26 50 Z" fill="#7E5A20" filter="url(#grain)" opacity=".3" />
            <path d="M64 48 L 76 40 L 74 50 L 76 58 Z" fill="#B8904E" />
            <circle cx="34" cy="47" r="1.8" fill="#3A2E1E" />
            <path d="M40 44 l 3 8 M48 42 l 3 9 M56 42 l 2 8" stroke="#8E6428" strokeWidth="2" strokeLinecap="round" />
            <circle cx="38" cy="66" r="6" fill="#F2DE7A" stroke="#C9A21B" strokeWidth="1.6" />
            <path d="M62 64 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-sweet" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" /><circle cx="50" cy="50" r="36" fill="#F2E8D0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#C0A050" filter="url(#grain)" opacity=".15" />
            <path d="M40 32 L 54 42 L 40 52 L 26 42 Z" fill="#F2E6C8" stroke="#D9C9A0" strokeWidth="1.5" />
            <path d="M40 34 L 51 42 L 40 50 L 29 42 Z" fill="#E4E4E8" opacity=".7" />
            <circle cx="60" cy="56" r="11" fill="#E3A320" />
            <circle cx="60" cy="56" r="11" fill="#A87208" filter="url(#grain)" opacity=".45" />
            <circle cx="38" cy="62" r="8" fill="#D98A2B" /><circle cx="38" cy="62" r="8" fill="#96560E" filter="url(#grain)" opacity=".4" />
            <path d="M56 52 l 3 2 M62 60 l 3 -2" stroke="#5E7A34" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-kheer" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#F2E8D0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#C9A868" filter="url(#grain)" opacity=".2" />
            <path d="M28 48 C 40 42 60 42 72 49" stroke="#F7F1E2" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".9" />
            <path d="M36 56 l 7 -2 M52 60 l 8 -2 M44 40 l 6 2" stroke="#C9822F" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M56 36 c 3 1 5 3 5 6 M62 40 c 2 1 3 3 3 5" stroke="#E8842C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <circle cx="34" cy="62" r="2.2" fill="#6E8B3D" /><circle cx="64" cy="58" r="2" fill="#6E8B3D" />
          </g>
        </symbol>
        <symbol id="d-cake" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M32 62 L 50 30 L 68 62 Z" fill="#8E5B34" />
          <g clipPath="url(#cp36)"><path d="M32 62 L 50 30 L 68 62 Z" fill="#4E2A10" filter="url(#grain)" opacity=".35" /></g>
          <path d="M38 52 L 62 52 M42 44 L 58 44" stroke="#F2D7A8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 62 L 68 62" stroke="#6E4222" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="27" r="4" fill="#C2452F" />
          <path d="M50 23 c 0 -3 2 -4 3 -5" stroke="#5E7A34" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="d-icecream" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#D8E4E8" /><circle cx="50" cy="50" r="40" fill="#E8F0F2" />
          <path d="M28 56 A 22 22 0 0 0 72 56 L 66 70 L 34 70 Z" fill="#B8CCD4" />
          <circle cx="38" cy="48" r="11" fill="#F7E9C8" /><circle cx="60" cy="48" r="11" fill="#D98CA6" /><circle cx="49" cy="38" r="10" fill="#8E5B34" />
          <g clipPath="url(#cp36)">
            <circle cx="38" cy="48" r="11" fill="#C0A050" filter="url(#grain)" opacity=".25" />
            <circle cx="60" cy="48" r="11" fill="#96405E" filter="url(#grain)" opacity=".25" />
            <circle cx="49" cy="38" r="10" fill="#4E2A10" filter="url(#grain)" opacity=".3" />
          </g>
          <path d="M64 34 c 4 -4 9 -1 7 3 c -2 4 -9 1 -7 -3 Z" fill="#5E7A34" />
          <path d="M36 44 a 4 4 0 0 1 4 -3" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
        </symbol>
        <symbol id="d-drink" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#D8E4E8" /><circle cx="50" cy="50" r="40" fill="#E8F0F2" />
          <path d="M36 26 L 64 26 L 60 74 L 40 74 Z" fill="#F2F6F7" stroke="#A8BCC4" strokeWidth="2" />
          <path d="M38 40 L 62 40 L 60 72 L 40 72 Z" fill="#E8A23C" />
          <g clipPath="url(#cp36)"><path d="M38 40 L 62 40 L 60 72 L 40 72 Z" fill="#A86410" filter="url(#grain)" opacity=".25" /></g>
          <path d="M56 24 L 66 10" stroke="#C24E32" strokeWidth="4" strokeLinecap="round" />
          <path d="M42 46 a 6 6 0 0 1 5 -4" stroke="#F2C878" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M32 22 c 5 -2 9 1 7 5 c -3 4 -9 0 -7 -5 Z" fill="#5E7A34" />
        </symbol>
        <symbol id="d-muffin" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M34 52 L 66 52 L 62 74 L 38 74 Z" fill="#C97A9E" />
          <path d="M38 54 v 18 M44 53 v 20 M50 53 v 21 M56 53 v 20 M62 54 v 18" stroke="#B0628A" strokeWidth="1.8" />
          <path d="M30 52 C 28 38 40 30 50 30 C 60 30 72 38 70 52 Z" fill="#C98A50" />
          <g clipPath="url(#cp36)"><path d="M30 52 C 28 38 40 30 50 30 C 60 30 72 38 70 52 Z" fill="#8A5010" filter="url(#grain)" opacity=".3" /></g>
          <circle cx="44" cy="40" r="2" fill="#5E3418" /><circle cx="54" cy="37" r="2" fill="#5E3418" /><circle cx="60" cy="44" r="2" fill="#5E3418" />
        </symbol>
        <symbol id="d-brownie" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M28 46 L 56 38 L 72 46 L 44 54 Z" fill="#8E5B34" />
          <path d="M28 46 L 44 54 L 44 66 L 28 58 Z" fill="#5E3418" />
          <path d="M72 46 L 44 54 L 44 66 L 72 58 Z" fill="#6E4222" />
          <g clipPath="url(#cp36)"><path d="M28 46 L 56 38 L 72 46 L 44 66 Z" fill="#3A1E08" filter="url(#grain)" opacity=".4" /></g>
          <circle cx="50" cy="44" r="1.8" fill="#F2D7A8" /><circle cx="60" cy="47" r="1.6" fill="#F2D7A8" />
        </symbol>
        <symbol id="d-pie" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <circle cx="50" cy="50" r="30" fill="#DDB264" />
          <circle cx="50" cy="50" r="24" fill="#C24E42" />
          <g clipPath="url(#cp36)"><circle cx="50" cy="50" r="24" fill="#7A1E14" filter="url(#grain)" opacity=".3" /></g>
          <path d="M32 40 L 68 60 M32 50 L 68 50 M32 60 L 68 40 M40 32 L 60 68 M50 30 L 50 70 M60 32 L 40 68" stroke="#E8C87A" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#C99A50" strokeWidth="3" />
        </symbol>
        <symbol id="d-loafcake" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M28 42 C 30 34 44 32 46 40 L 46 66 L 28 66 Z" fill="#C9A05A" />
          <g clipPath="url(#cp36)"><path d="M28 42 C 30 34 44 32 46 40 L 46 66 L 28 66 Z" fill="#8A6428" filter="url(#grain)" opacity=".35" /></g>
          <path d="M50 40 C 52 32 68 32 70 40 L 70 64 L 50 64 Z" fill="#F2E2B8" />
          <path d="M52 46 h 16 M52 54 h 16" stroke="#D9B984" strokeWidth="2" />
          <circle cx="58" cy="42" r="1.6" fill="#8E5B34" /><circle cx="64" cy="50" r="1.6" fill="#8E5B34" />
        </symbol>
        <symbol id="d-cookieplate" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <circle cx="40" cy="44" r="14" fill="#C9822F" />
          <g clipPath="url(#cp36)"><circle cx="40" cy="44" r="14" fill="#7E4E10" filter="url(#grain)" opacity=".35" /></g>
          <circle cx="35" cy="40" r="2.2" fill="#5E3418" /><circle cx="45" cy="43" r="2.2" fill="#5E3418" /><circle cx="38" cy="50" r="2" fill="#5E3418" />
          <circle cx="62" cy="58" r="12" fill="#D89540" />
          <g clipPath="url(#cp36)"><circle cx="62" cy="58" r="12" fill="#8A5010" filter="url(#grain)" opacity=".3" /></g>
          <circle cx="58" cy="55" r="1.8" fill="#5E3418" /><circle cx="66" cy="60" r="1.8" fill="#5E3418" />
        </symbol>
        <symbol id="d-laddu" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <circle cx="40" cy="42" r="13" fill="#E3A320" />
          <circle cx="62" cy="50" r="11" fill="#D98A2B" />
          <circle cx="46" cy="62" r="11" fill="#E3A320" />
          <g clipPath="url(#cp36)">
            <circle cx="40" cy="42" r="13" fill="#A87208" filter="url(#grain)" opacity=".5" />
            <circle cx="62" cy="50" r="11" fill="#96560E" filter="url(#grain)" opacity=".45" />
            <circle cx="46" cy="62" r="11" fill="#A87208" filter="url(#grain)" opacity=".5" />
          </g>
          <path d="M36 38 l 3 2 M60 46 l 3 2 M43 59 l 3 2" stroke="#5E7A34" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="45" cy="40" r="1.4" fill="#C9641F" /><circle cx="65" cy="53" r="1.4" fill="#C9641F" />
        </symbol>
        <symbol id="d-jalebi" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <g fill="none" stroke="#E8842C" strokeWidth="5" strokeLinecap="round">
            <path d="M50 50 m 0 -3 a 3 3 0 0 1 3 3 a 6 6 0 0 1 -6 6 a 10 10 0 0 1 -10 -10 a 14 14 0 0 1 14 -14 a 18 18 0 0 1 18 18 a 21 21 0 0 1 -7 15" />
          </g>
          <g fill="none" stroke="#C4641C" strokeWidth="1.8" opacity=".6">
            <path d="M50 50 m 0 -3 a 3 3 0 0 1 3 3 a 6 6 0 0 1 -6 6 a 10 10 0 0 1 -10 -10 a 14 14 0 0 1 14 -14 a 18 18 0 0 1 18 18 a 21 21 0 0 1 -7 15" />
          </g>
          <circle cx="36" cy="66" r="1.6" fill="#E8A23C" /><circle cx="64" cy="34" r="1.6" fill="#E8A23C" />
        </symbol>
        <symbol id="d-gulabjamun" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#C99850" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A5A10" filter="url(#grain)" opacity=".3" />
            <circle cx="40" cy="44" r="12" fill="#6E3420" /><circle cx="61" cy="52" r="11" fill="#7A3C24" />
            <circle cx="40" cy="44" r="12" fill="#3A1408" filter="url(#grain)" opacity=".4" />
            <circle cx="36" cy="40" r="3" fill="#A05A3C" opacity=".8" />
            <path d="M30 62 C 40 66 55 67 68 63" stroke="#E8C87A" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M48 32 l 4 2 M58 44 l 4 1" stroke="#5E7A34" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-halwa" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M30 60 C 30 44 42 36 50 36 C 58 36 70 44 70 60 C 62 64 38 64 30 60 Z" fill="#D98A2B" />
          <g clipPath="url(#cp36)"><path d="M30 60 C 30 44 42 36 50 36 C 58 36 70 44 70 60 C 62 64 38 64 30 60 Z" fill="#96560E" filter="url(#grain)" opacity=".45" /></g>
          <path d="M42 44 l 5 2 M54 42 l 5 2 M48 54 l 5 2" stroke="#F2D7A8" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="45" cy="49" r="1.6" fill="#5E7A34" /><circle cx="58" cy="50" r="1.6" fill="#5E7A34" />
        </symbol>
        <symbol id="d-chai" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <path d="M36 34 L 64 34 L 60 72 L 40 72 Z" fill="#F2F6F7" stroke="#C4B89C" strokeWidth="2" />
          <path d="M38 42 L 62 42 L 59 70 L 41 70 Z" fill="#C9884E" />
          <g clipPath="url(#cp36)"><path d="M38 42 L 62 42 L 59 70 L 41 70 Z" fill="#8A5010" filter="url(#grain)" opacity=".3" /></g>
          <path d="M40 46 a 8 8 0 0 1 6 -3" stroke="#E8C09A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M44 28 C 42 24 46 22 45 18 M54 28 C 52 24 56 22 55 18" stroke="#A8968A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="d-lassi" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#D8E4E8" /><circle cx="50" cy="50" r="40" fill="#E8F0F2" />
          <path d="M36 28 L 64 28 L 60 74 L 40 74 Z" fill="#F7F3E8" stroke="#C4CCD0" strokeWidth="2" />
          <path d="M37 36 L 63 36 L 60 72 L 40 72 Z" fill="#F2E8D0" />
          <path d="M38 30 C 44 26 56 26 62 30 C 60 34 40 34 38 30 Z" fill="#FBF7EC" />
          <circle cx="44" cy="30" r="1.6" fill="#E8D5A8" /><circle cx="52" cy="29" r="1.6" fill="#E8D5A8" /><circle cx="58" cy="31" r="1.4" fill="#E8D5A8" />
          <path d="M46 44 l 8 -2 M45 54 l 9 -2" stroke="#E8842C" strokeWidth="2" strokeLinecap="round" opacity=".6" />
          <path d="M42 40 c 3 1 5 3 5 6" stroke="#FBF7EC" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="d-momo" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A6438" /><circle cx="50" cy="50" r="40" fill="#9C7444" /><circle cx="50" cy="50" r="36" fill="#C4A870" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E5620" filter="url(#grain)" opacity=".25" />
            <path d="M20 50 C 40 44 60 44 80 50" stroke="#A88850" strokeWidth="1.5" fill="none" />
            <path d="M28 46 C 28 38 38 36 40 42 C 44 37 50 40 48 46 C 42 50 32 50 28 46 Z" fill="#F2EBDA" />
            <path d="M54 44 C 54 36 64 34 66 40 C 70 36 75 39 73 45 C 68 48 58 48 54 44 Z" fill="#EFE6D0" />
            <path d="M40 58 C 40 50 50 48 52 54 C 56 50 62 53 60 59 C 54 62 44 62 40 58 Z" fill="#F2EBDA" />
            <path d="M32 43 q 3 -3 6 0 M58 41 q 3 -3 6 0 M44 55 q 3 -3 6 0" stroke="#D9CBA8" strokeWidth="1.6" fill="none" />
            <circle cx="70" cy="60" r="4.5" fill="#C0532B" />
          </g>
        </symbol>
        <symbol id="d-puri" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <circle cx="40" cy="44" r="16" fill="#E0A050" />
          <g clipPath="url(#cp36)"><circle cx="40" cy="44" r="16" fill="#A86420" filter="url(#grain)" opacity=".35" /></g>
          <path d="M30 38 a 13 13 0 0 1 10 -6" stroke="#F2C878" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="62" cy="58" r="13" fill="#D89540" />
          <g clipPath="url(#cp36)"><circle cx="62" cy="58" r="13" fill="#8A5010" filter="url(#grain)" opacity=".35" /></g>
          <path d="M54 54 a 10 10 0 0 1 8 -5" stroke="#EFBE74" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="d-naan" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <path d="M40 26 C 56 26 68 36 68 50 C 68 64 58 72 48 72 C 38 72 30 62 32 48 C 33 38 34 30 40 26 Z" fill="#E8C87A" />
          <g clipPath="url(#cp36)"><path d="M40 26 C 56 26 68 36 68 50 C 68 64 58 72 48 72 C 38 72 30 62 32 48 C 33 38 34 30 40 26 Z" fill="#A87828" filter="url(#grain)" opacity=".3" /></g>
          <circle cx="44" cy="40" r="2.6" fill="#B4834A" /><circle cx="56" cy="48" r="3" fill="#B4834A" /><circle cx="46" cy="58" r="2.4" fill="#B4834A" /><circle cx="58" cy="62" r="2" fill="#B4834A" />
          <path d="M40 32 c 4 -2 8 -3 12 -2" stroke="#F2DFA0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="d-samosa" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <path d="M42 26 L 62 62 L 22 62 Z" fill="#D89540" />
          <g clipPath="url(#cp36)"><path d="M42 26 L 62 62 L 22 62 Z" fill="#8A5010" filter="url(#grain)" opacity=".4" /></g>
          <path d="M42 26 L 52 44 L 32 44 Z" fill="#E8B05C" opacity=".7" />
          <path d="M58 48 L 74 70 L 44 70 Z" fill="#C9822F" />
          <g clipPath="url(#cp36)"><path d="M58 48 L 74 70 L 44 70 Z" fill="#7E4E10" filter="url(#grain)" opacity=".4" /></g>
          <circle cx="70" cy="42" r="5" fill="#6E8B3D" />
        </symbol>
        <symbol id="d-vada" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#4A6B2E" /><circle cx="50" cy="50" r="40" fill="#557A34" /><circle cx="50" cy="50" r="36" fill="#5E8A3A" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#2C4416" filter="url(#grain)" opacity=".35" />
            <circle cx="42" cy="44" r="14" fill="#C9822F" />
            <circle cx="42" cy="44" r="14" fill="#7E4E10" filter="url(#grain)" opacity=".45" />
            <circle cx="42" cy="44" r="4.5" fill="#5E8A3A" />
            <circle cx="63" cy="59" r="11" fill="#D08A32" />
            <circle cx="63" cy="59" r="11" fill="#7E4E10" filter="url(#grain)" opacity=".4" />
            <circle cx="63" cy="59" r="3.5" fill="#5E8A3A" />
            <path d="M34 36 a 10 10 0 0 1 8 -4" stroke="#E8B05C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-pakora" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EFE3C4" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B08840" filter="url(#grain)" opacity=".18" />
            <path d="M34 36 C 40 30 48 33 47 40 C 53 38 57 44 53 49 C 47 53 37 51 34 45 C 32 41 32 39 34 36 Z" fill="#D08A32" />
            <path d="M34 36 C 40 30 48 33 47 40 C 53 38 57 44 53 49 C 47 53 37 51 34 45 C 32 41 32 39 34 36 Z" fill="#7E4E10" filter="url(#grain)" opacity=".45" />
            <path d="M56 54 C 62 48 70 52 68 58 C 72 60 70 66 65 66 C 59 67 54 62 56 54 Z" fill="#C9822F" />
            <path d="M56 54 C 62 48 70 52 68 58 C 72 60 70 66 65 66 C 59 67 54 62 56 54 Z" fill="#7E4E10" filter="url(#grain)" opacity=".4" />
            <path d="M40 60 C 44 56 50 58 49 63 C 46 67 40 65 40 60 Z" fill="#D89540" />
            <circle cx="66" cy="38" r="5" fill="#6E8B3D" /><path d="M62 42 l 8 -8" stroke="#C24E32" strokeWidth="2" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-cutlet" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <ellipse cx="42" cy="44" rx="15" ry="11" fill="#C9784C" />
          <g clipPath="url(#cp36)"><ellipse cx="42" cy="44" rx="15" ry="11" fill="#7E3C14" filter="url(#grain)" opacity=".4" /></g>
          <ellipse cx="60" cy="60" rx="13" ry="10" fill="#B4693E" />
          <g clipPath="url(#cp36)"><ellipse cx="60" cy="60" rx="13" ry="10" fill="#6E3410" filter="url(#grain)" opacity=".4" /></g>
          <path d="M34 40 a 11 8 0 0 1 8 -5" stroke="#E8A874" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M66 44 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
        </symbol>
        <symbol id="d-murukku" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <g fill="none" stroke="#D9A44A" strokeWidth="4.5" strokeLinecap="round">
            <path d="M50 50 m 0 -2.5 a 2.5 2.5 0 0 1 2.5 2.5 a 5 5 0 0 1 -5 5 a 8.5 8.5 0 0 1 -8.5 -8.5 a 12 12 0 0 1 12 -12 a 15.5 15.5 0 0 1 15.5 15.5 a 19 19 0 0 1 -19 19" />
          </g>
          <g fill="none" stroke="#A87818" strokeWidth="1.4" opacity=".7">
            <path d="M50 50 m 0 -2.5 a 2.5 2.5 0 0 1 2.5 2.5 a 5 5 0 0 1 -5 5 a 8.5 8.5 0 0 1 -8.5 -8.5 a 12 12 0 0 1 12 -12 a 15.5 15.5 0 0 1 15.5 15.5 a 19 19 0 0 1 -19 19" />
          </g>
          <circle cx="38" cy="40" r="1.2" fill="#5E3418" /><circle cx="58" cy="60" r="1.2" fill="#5E3418" /><circle cx="52" cy="38" r="1.2" fill="#5E3418" />
        </symbol>
        <symbol id="d-upma" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#EFD9A0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B08840" filter="url(#grain)" opacity=".3" />
            <path d="M34 44 C 38 36 62 36 66 44 C 64 54 36 54 34 44 Z" fill="#F2E4B8" opacity=".8" />
            <path d="M40 42 l 5 1 M54 41 l 5 2" stroke="#C0532B" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="46" cy="47" r="1.6" fill="#3A2E1E" /><circle cx="56" cy="46" r="1.6" fill="#3A2E1E" />
            <path d="M44 58 c 4 2 8 2 12 0" stroke="#6E8B3D" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M62 32 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-fruitsalad" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#D8E4E8" /><circle cx="50" cy="50" r="40" fill="#E8F0F2" /><circle cx="50" cy="50" r="36" fill="#F4F1E8" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#C0A050" filter="url(#grain)" opacity=".12" />
            <circle cx="38" cy="42" r="7" fill="#D64530" />
            <path d="M52 34 A 8 8 0 0 1 60 42 L 52 42 Z" fill="#F2CC60" />
            <circle cx="60" cy="56" r="6.5" fill="#8A6AAE" />
            <circle cx="42" cy="60" r="6" fill="#7AAA56" />
            <path d="M50 48 a 6 6 0 0 1 6 -4" stroke="#E8842C" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="36" cy="39" r="1.6" fill="#F2A08A" /><circle cx="58" cy="54" r="1.4" fill="#B49AD0" />
            <path d="M48 28 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-pickle" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E9E0CC" /><circle cx="50" cy="50" r="40" fill="#F4EDDB" />
          <rect x="36" y="24" width="28" height="9" rx="4" fill="#A83E24" />
          <path d="M34 33 h 32 v 32 c 0 5 -4 8 -8 8 h -16 c -4 0 -8 -3 -8 -8 Z" fill="#E8D5A0" opacity=".92" />
          <path d="M38 40 l 9 4 M52 38 l 9 5 M40 54 l 10 4 M54 52 l 8 5" stroke="#C4641C" strokeWidth="5" strokeLinecap="round" />
          <circle cx="46" cy="48" r="1.8" fill="#8E2A10" /><circle cx="58" cy="62" r="1.8" fill="#8E2A10" />
          <path d="M38 66 c 8 3 16 3 24 0" stroke="#C9A050" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
        </symbol>
        <symbol id="d-podi" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" />
          <path d="M30 62 C 32 48 42 42 50 42 C 58 42 68 48 70 62 C 60 66 40 66 30 62 Z" fill="#A63A22" />
          <g clipPath="url(#cp36)"><path d="M30 62 C 32 48 42 42 50 42 C 58 42 68 48 70 62 C 60 66 40 66 30 62 Z" fill="#5E1808" filter="url(#grain)" opacity=".45" /></g>
          <path d="M44 48 l 4 1 M54 50 l 4 1" stroke="#E8B05C" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M62 38 l 6 -4" stroke="#C24E32" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="52" r="1.4" fill="#3A2E1E" /><circle cx="60" cy="56" r="1.4" fill="#3A2E1E" />
        </symbol>
        <symbol id="d-biryani" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#6E2E22" /><circle cx="50" cy="50" r="40" fill="#7E3628" /><circle cx="50" cy="50" r="36" fill="#EFD9A0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#B08840" filter="url(#grain)" opacity=".25" />
            <path d="M32 42 l 8 2 M48 38 l 8 2 M58 46 l 8 2 M36 54 l 8 2 M52 56 l 8 2" stroke="#E8842C" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 46 l 6 1 M56 40 l 6 2" stroke="#C9641F" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 62 c 4 2 10 2 14 0" stroke="#6E8B3D" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M46 30 c 4 -3 8 0 6 4 c -3 3 -8 0 -6 -4 Z" fill="#5E7A34" />
            <ellipse cx="64" cy="60" rx="5" ry="3.5" fill="#8E4A30" />
          </g>
        </symbol>
        <symbol id="d-friedrice" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#2E6E68" /><circle cx="50" cy="50" r="40" fill="#3D7D75" /><circle cx="50" cy="50" r="36" fill="#E8D5A0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#A88430" filter="url(#grain)" opacity=".25" />
            <path d="M34 44 l 6 1 M46 40 l 6 1 M58 45 l 6 1 M38 56 l 6 1 M52 58 l 6 1" stroke="#D9B96A" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="42" y="46" width="6" height="6" rx="1.5" fill="#E8842C" transform="rotate(12 45 49)" />
            <rect x="58" y="52" width="5" height="5" rx="1.5" fill="#C24E32" transform="rotate(-14 60 54)" />
            <path d="M32 50 l 5 3 M64 38 l 5 3" stroke="#5E8F3C" strokeWidth="3" strokeLinecap="round" />
            <circle cx="52" cy="34" r="2.5" fill="#F7F1E2" />
          </g>
        </symbol>
        <symbol id="d-poriyal" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#E4DBC6" /><circle cx="50" cy="50" r="40" fill="#F2EBDA" /><circle cx="50" cy="50" r="36" fill="#EDE3C0" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#A88430" filter="url(#grain)" opacity=".18" />
            <path d="M30 44 l 11 3 M44 40 l 11 3 M56 48 l 11 3 M34 56 l 11 3 M50 58 l 10 3" stroke="#557A34" strokeWidth="5" strokeLinecap="round" />
            <circle cx="38" cy="42" r="1.8" fill="#F7F3E8" /><circle cx="52" cy="46" r="1.8" fill="#F7F3E8" /><circle cx="46" cy="58" r="1.8" fill="#F7F3E8" /><circle cx="62" cy="54" r="1.8" fill="#F7F3E8" />
            <circle cx="42" cy="50" r="1.6" fill="#3A2E1E" /><circle cx="58" cy="42" r="1.6" fill="#3A2E1E" />
            <path d="M64 36 l 6 4" stroke="#C24E32" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-stirfry" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#3A3A3E" /><circle cx="50" cy="50" r="41" fill="#2E2E32" /><circle cx="50" cy="50" r="36" fill="#4A4440" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#1E1A16" filter="url(#grain)" opacity=".4" />
            <path d="M32 44 l 10 4 M48 40 l 10 4 M38 56 l 10 4" stroke="#5E9A3C" strokeWidth="5" strokeLinecap="round" />
            <rect x="54" y="52" width="9" height="9" rx="2" fill="#D64530" transform="rotate(16 58 56)" />
            <rect x="30" y="34" width="8" height="8" rx="2" fill="#E8B84A" transform="rotate(-12 34 38)" />
            <path d="M60 34 a 6 6 0 1 0 0 8" stroke="#E8C87A" strokeWidth="2.5" fill="none" />
            <circle cx="44" cy="50" r="1.6" fill="#F2E4C8" /><circle cx="52" cy="62" r="1.6" fill="#F2E4C8" />
          </g>
        </symbol>
        <symbol id="d-sambar" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4630" /><circle cx="50" cy="50" r="40" fill="#8A5238" /><circle cx="50" cy="50" r="36" fill="#C9641F" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#7E3208" filter="url(#grain)" opacity=".4" />
            <rect x="30" y="40" width="18" height="7" rx="3.5" fill="#8FB86A" />
            <path d="M32 43 h 14" stroke="#7AAA56" strokeWidth="1.5" />
            <ellipse cx="60" cy="52" rx="8" ry="6" fill="#E8842C" />
            <circle cx="42" cy="58" r="5" fill="#F2CC60" />
            <path d="M30 34 C 42 30 58 30 70 35" stroke="#F2E4C8" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M52 62 c 4 2 8 2 12 0" stroke="#5E7A34" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-korma" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8A5A2E" /><circle cx="50" cy="50" r="40" fill="#9C6A38" /><circle cx="50" cy="50" r="36" fill="#EFDFB8" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#C0A050" filter="url(#grain)" opacity=".22" />
            <ellipse cx="42" cy="48" rx="8" ry="6" fill="#E8D5A8" /><ellipse cx="58" cy="54" rx="7" ry="5.5" fill="#E3CC9A" />
            <path d="M30 40 C 44 34 58 34 70 41" stroke="#FBF3E0" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M38 60 l 5 -1 M56 42 l 5 -1" stroke="#C9822F" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="62" r="1.8" fill="#5E7A34" /><circle cx="64" cy="46" r="1.6" fill="#C24E32" />
          </g>
        </symbol>
        <symbol id="d-makhani" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4630" /><circle cx="50" cy="50" r="40" fill="#8A5238" /><circle cx="50" cy="50" r="36" fill="#D06428" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#8A3008" filter="url(#grain)" opacity=".35" />
            <path d="M28 46 C 36 40 46 40 50 46 C 56 40 66 40 72 47" stroke="#F7F1E2" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".9" />
            <ellipse cx="42" cy="56" rx="7" ry="5.5" fill="#B4502E" /><ellipse cx="58" cy="58" rx="6.5" ry="5" fill="#A84828" />
            <rect x="46" y="30" width="8" height="6" rx="1.5" fill="#F7E9B0" />
            <path d="M36 38 l 4 2" stroke="#5E7A34" strokeWidth="2" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="d-kofta" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#7A4630" /><circle cx="50" cy="50" r="40" fill="#8A5238" /><circle cx="50" cy="50" r="36" fill="#B4502E" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#6E2510" filter="url(#grain)" opacity=".4" />
            <circle cx="40" cy="44" r="10" fill="#8A4224" /><circle cx="40" cy="44" r="10" fill="#3A1408" filter="url(#grain)" opacity=".4" />
            <circle cx="60" cy="52" r="9" fill="#96482A" /><circle cx="60" cy="52" r="9" fill="#3A1408" filter="url(#grain)" opacity=".35" />
            <circle cx="47" cy="62" r="8" fill="#8A4224" />
            <path d="M28 38 C 38 33 54 33 66 38" stroke="#F2E4C8" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
            <path d="M36 40 l 3 2 M56 48 l 3 2" stroke="#E8A874" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M62 64 c 3 -2 6 0 5 3 c -2 3 -7 1 -5 -3 Z" fill="#5E7A34" />
          </g>
        </symbol>
        <symbol id="d-kuzhambu" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#5E3A28" /><circle cx="50" cy="50" r="40" fill="#6E442E" /><circle cx="50" cy="50" r="36" fill="#8E4A20" />
          <g clipPath="url(#cp36)">
            <rect x="14" y="14" width="72" height="72" fill="#4A2008" filter="url(#grain)" opacity=".4" />
            <path d="M28 44 C 40 38 60 38 72 45" stroke="#C9884E" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".8" />
            <circle cx="42" cy="52" r="6.5" fill="#6E3418" /><circle cx="58" cy="56" r="5.5" fill="#7A3C1C" />
            <path d="M34 60 c 3 -2 6 -2 9 0 M60 44 l 6 2" stroke="#E8B05C" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M50 34 c 2 -3 6 -3 8 -1" stroke="#5E7A34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <circle cx="66" cy="60" r="2" fill="#C24E32" />
          </g>
        </symbol>

        {/* ingredients */}
        <symbol id="i-scallion" viewBox="0 0 60 60">
          <path d="M22 48 C 24 30 24 18 20 6" stroke="#5E8F2C" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M30 48 C 32 32 36 16 42 8" stroke="#6FA03A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="26" cy="50" rx="9" ry="6" fill="#F4EFE0" />
        </symbol>
        <symbol id="i-chili" viewBox="0 0 60 60">
          <path d="M12 44 C 20 50 38 44 46 26 C 48 20 42 16 38 22 C 32 36 20 42 12 40 Z" fill="#C2452F" />
          <path d="M44 22 c 2 -6 8 -6 10 -2" stroke="#4A6B28" strokeWidth="3" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-lemon" viewBox="0 0 60 60">
          <circle cx="30" cy="32" r="17" fill="#C9A21B" /><circle cx="30" cy="32" r="14.5" fill="#F2DE7A" />
          <g stroke="#E9C63C" strokeWidth="2">
            <path d="M30 32 v-13 M30 32 l 11 -6 M30 32 l 11 7 M30 32 v 13 M30 32 l -11 7 M30 32 l -11 -6" />
          </g>
          <circle cx="30" cy="32" r="2.5" fill="#E9C63C" />
        </symbol>
        <symbol id="i-ginger" viewBox="0 0 60 60">
          <path d="M14 38 C 10 28 20 24 26 28 C 28 20 40 18 42 26 C 52 24 54 34 46 38 C 48 46 36 50 32 44 C 26 50 16 46 14 38 Z" fill="#C89A5E" />
          <path d="M22 34 c 4 2 8 2 12 0 M30 40 c 4 1 8 0 10 -2" stroke="#A87838" strokeWidth="1.5" fill="none" />
        </symbol>
        <symbol id="i-garlic" viewBox="0 0 60 60">
          <path d="M30 14 C 26 22 16 26 16 38 C 16 48 24 52 30 52 C 36 52 44 48 44 38 C 44 26 34 22 30 14 Z" fill="#F2ECDC" />
          <path d="M30 20 v 30 M24 26 c -2 8 -2 16 0 24 M36 26 c 2 8 2 16 0 24" stroke="#D8CCB4" strokeWidth="1.5" fill="none" />
          <path d="M30 14 c 0 -4 2 -6 4 -8" stroke="#8FA05A" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-herb" viewBox="0 0 60 60">
          <path d="M30 54 C 30 40 30 24 30 10" stroke="#4A7A34" strokeWidth="2.5" fill="none" />
          <path d="M30 22 c -9 -2 -13 -8 -13 -15 c 9 0 13 7 13 15 Z" fill="#5E8F3C" />
          <path d="M30 22 c 9 -2 13 -8 13 -15 c -9 0 -13 7 -13 15 Z" fill="#6FA048" />
          <path d="M30 38 c -7 -1 -10 -6 -10 -12 c 7 0 10 5 10 12 Z" fill="#5E8F3C" />
          <path d="M30 38 c 7 -1 10 -6 10 -12 c -7 0 -10 5 -10 12 Z" fill="#6FA048" />
        </symbol>
        <symbol id="i-egg" viewBox="0 0 60 60">
          <path d="M16 30 C 12 18 28 10 38 15 C 50 19 48 34 42 42 C 34 50 18 46 16 30 Z" fill="#F7F1E2" />
          <circle cx="30" cy="29" r="8" fill="#E8A23C" /><circle cx="27" cy="26" r="2.5" fill="#F2C878" />
        </symbol>
        <symbol id="i-bottle" viewBox="0 0 60 60">
          <path d="M25 8 h 10 v 8 c 6 4 8 10 8 18 v 16 c 0 4 -3 6 -6 6 h -14 c -3 0 -6 -2 -6 -6 v -16 c 0 -8 2 -14 8 -18 Z" fill="#F2ECDC" />
          <rect x="24" y="6" width="12" height="5" rx="2" fill="#C9C2B0" />
          <rect x="19" y="32" width="22" height="12" rx="2" fill="#FFFFFF" opacity=".7" />
        </symbol>
        <symbol id="i-jar" viewBox="0 0 60 60">
          <rect x="16" y="14" width="28" height="8" rx="3" fill="#A89878" />
          <path d="M18 22 h 24 v 26 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#EDE6D6" />
          <path d="M18 32 h 24 v 16 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="var(--jc, #E0A81E)" />
        </symbol>
        <symbol id="i-sack" viewBox="0 0 60 60">
          <path d="M18 20 C 14 34 14 44 20 50 C 28 54 34 54 40 50 C 46 44 46 34 42 20 Z" fill="#E4D6B4" />
          <path d="M16 18 h 28 v 5 h -28 Z" fill="#D0BE94" />
          <path d="M24 34 h 12 M24 40 h 12" stroke="#B8A276" strokeWidth="1.6" />
        </symbol>
        <symbol id="i-meat" viewBox="0 0 60 60">
          <path d="M14 32 C 12 20 26 12 38 16 C 50 20 52 34 44 44 C 36 52 18 50 14 32 Z" fill="#EFD9C4" />
          <path d="M18 32 C 17 23 27 17 36 20 C 45 23 47 33 41 40 C 34 47 21 45 18 32 Z" fill="#B84A3A" />
          <path d="M24 28 c 4 -2 8 -1 11 2 M23 36 c 4 2 9 2 13 -1" stroke="#E8B0A0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="24" r="4" fill="#F7F1E2" /><circle cx="40" cy="24" r="1.6" fill="#D8C8B0" />
        </symbol>
        <symbol id="i-chicken" viewBox="0 0 60 60">
          <path d="M16 26 C 14 14 30 8 40 16 C 50 24 46 40 34 42 L 28 38 C 18 38 17 32 16 26 Z" fill="#C98A50" />
          <path d="M16 26 C 14 14 30 8 40 16 C 50 24 46 40 34 42 L 28 38 C 18 38 17 32 16 26 Z" fill="#8A5010" filter="url(#grain)" opacity=".3" />
          <path d="M30 40 L 20 52" stroke="#F2ECDC" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="17" cy="53" r="3.2" fill="#F2ECDC" /><circle cx="22" cy="55" r="3.2" fill="#F2ECDC" />
        </symbol>
        <symbol id="i-fish" viewBox="0 0 60 60">
          <path d="M10 32 C 18 22 36 20 46 30 C 38 40 20 42 10 32 Z" fill="#8FB0C9" />
          <path d="M14 34 C 22 40 34 40 43 33" stroke="#C9DCE8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M46 30 L 54 24 L 52 31 L 54 38 Z" fill="#7A9CB8" />
          <circle cx="18" cy="30" r="1.8" fill="#2A3240" />
          <path d="M26 26 l 2 7 M33 25 l 2 7" stroke="#7A9CB8" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="i-shrimp" viewBox="0 0 60 60">
          <path d="M18 20 C 34 12 50 24 44 38 C 40 48 26 50 20 42 C 26 44 34 42 36 36 C 39 28 30 20 18 20 Z" fill="#E8896A" />
          <path d="M24 24 c 6 0 12 5 12 11 M22 30 c 5 1 9 4 9 8" stroke="#C9634A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M18 20 L 10 16 M18 20 L 12 24" stroke="#C9634A" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 42 L 14 48 L 22 47 Z" fill="#E8896A" />
        </symbol>
        <symbol id="i-cheese" viewBox="0 0 60 60">
          <path d="M8 40 L 52 24 L 52 46 L 8 46 Z" fill="#F2C94C" />
          <path d="M8 40 L 52 24 L 52 29 L 8 44 Z" fill="#E3B33C" />
          <circle cx="24" cy="41" r="2.6" fill="#D9A82C" /><circle cx="38" cy="37" r="2.2" fill="#D9A82C" /><circle cx="44" cy="42" r="1.8" fill="#D9A82C" />
        </symbol>
        <symbol id="i-butter" viewBox="0 0 60 60">
          <path d="M10 44 L 50 44 L 46 50 L 14 50 Z" fill="#E4DBC6" />
          <rect x="16" y="28" width="28" height="14" rx="2" fill="#F7E9B0" />
          <rect x="16" y="28" width="28" height="5" rx="2" fill="#FBF3CC" />
          <rect x="36" y="20" width="10" height="8" rx="1.5" fill="#F7E9B0" transform="rotate(8 41 24)" />
        </symbol>
        <symbol id="i-curd" viewBox="0 0 60 60">
          <path d="M14 26 C 12 40 18 50 30 50 C 42 50 48 40 46 26 Z" fill="#C98A50" />
          <path d="M14 26 C 12 40 18 50 30 50 C 42 50 48 40 46 26 Z" fill="#8A5010" filter="url(#grain)" opacity=".3" />
          <ellipse cx="30" cy="26" rx="16" ry="5" fill="#F7F3E8" />
          <path d="M24 24 c 4 2 8 2 12 0" stroke="#E8E0CC" strokeWidth="1.6" fill="none" />
        </symbol>
        <symbol id="i-choc" viewBox="0 0 60 60">
          <rect x="14" y="14" width="32" height="32" rx="3" fill="#6E4222" transform="rotate(-8 30 30)" />
          <g transform="rotate(-8 30 30)" stroke="#8A5A34" strokeWidth="2">
            <path d="M30 14 L 30 46 M14 30 L 46 30" />
          </g>
          <path d="M14 14 L 24 10 L 50 12 L 46 17" fill="#C9C2D0" opacity=".9" />
        </symbol>
        <symbol id="i-can" viewBox="0 0 60 60">
          <path d="M16 14 h 28 v 32 a 14 5 0 0 1 -28 0 Z" fill="#D0D6D8" />
          <rect x="16" y="24" width="28" height="14" fill="#C24E32" />
          <circle cx="30" cy="31" r="4.5" fill="#F2E4C8" />
          <ellipse cx="30" cy="14" rx="14" ry="5" fill="#E4E8EA" />
          <ellipse cx="30" cy="14" rx="10" ry="3.2" fill="#B8C0C4" />
        </symbol>
        <symbol id="i-bread" viewBox="0 0 60 60">
          <path d="M10 46 C 8 30 16 20 30 20 C 44 20 52 30 50 46 Z" fill="#D89540" />
          <path d="M10 46 C 8 30 16 20 30 20 C 44 20 52 30 50 46 Z" fill="#8A5010" filter="url(#grain)" opacity=".3" />
          <path d="M20 28 l 5 6 M30 26 l 5 6 M40 28 l 5 6" stroke="#F2D794" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 46 h 40" stroke="#B4772A" strokeWidth="2.5" strokeLinecap="round" />
        </symbol>
        <symbol id="i-nuts" viewBox="0 0 60 60">
          <ellipse cx="22" cy="26" rx="8" ry="11" fill="#C98A50" transform="rotate(-18 22 26)" />
          <path d="M18 20 c 3 4 4 9 2 13" stroke="#A86A38" strokeWidth="1.6" fill="none" />
          <path d="M34 36 C 30 44 38 50 44 46 C 50 42 46 32 38 33 C 36 33 35 34 34 36 Z" fill="#E3C08A" />
          <circle cx="44" cy="22" r="7" fill="#A86A38" />
          <path d="M40 18 a 7 7 0 0 1 8 0" stroke="#8A5024" strokeWidth="2" fill="none" />
        </symbol>
        <symbol id="i-snackpack" viewBox="0 0 60 60">
          <path d="M16 12 l 4 3 4 -3 4 3 4 -3 4 3 4 -3 v 36 l -4 3 -4 -3 -4 3 -4 -3 -4 3 -4 -3 Z" fill="#E3A320" />
          <path d="M16 12 l 4 3 4 -3 4 3 4 -3 4 3 4 -3 v 36 l -4 3 -4 -3 -4 3 -4 -3 -4 3 -4 -3 Z" fill="#A87208" filter="url(#grain)" opacity=".25" />
          <circle cx="30" cy="30" r="9" fill="#F2E4C8" />
          <path d="M26 30 c 2 -3 6 -3 8 0 c -2 3 -6 3 -8 0 Z" fill="#C24E32" />
        </symbol>
        <symbol id="i-corn" viewBox="0 0 60 60">
          <path d="M24 12 C 34 12 38 24 36 38 C 35 46 32 52 28 52 C 24 52 21 46 20 38 C 18 24 20 12 24 12 Z" fill="#F2CC60" transform="rotate(10 28 32)" />
          <g transform="rotate(10 28 32)" stroke="#D9A82C" strokeWidth="1.4">
            <path d="M22 18 c 4 1 8 1 11 0 M21 26 c 5 1 10 1 14 0 M21 34 c 5 1 10 1 14 0 M22 42 c 4 1 8 1 10 0" />
            <path d="M24 14 c 1 12 1 26 2 36 M30 14 c 1 12 1 26 1 36" />
          </g>
          <path d="M18 44 C 12 38 12 26 18 18 C 20 28 20 38 18 44 Z" fill="#6E8B3D" />
          <path d="M38 42 C 46 36 46 24 40 18 C 39 28 39 36 38 42 Z" fill="#5E7A34" />
        </symbol>
        <symbol id="i-mushroom" viewBox="0 0 60 60">
          <path d="M12 30 C 12 18 22 10 30 10 C 38 10 48 18 48 30 Z" fill="#C9A05A" />
          <path d="M12 30 C 12 18 22 10 30 10 C 38 10 48 18 48 30 Z" fill="#8A6428" filter="url(#grain)" opacity=".3" />
          <path d="M14 30 h 32" stroke="#B08848" strokeWidth="2" />
          <path d="M25 30 C 24 40 25 46 26 50 L 34 50 C 35 46 36 40 35 30 Z" fill="#F2ECDC" />
          <circle cx="24" cy="20" r="2.5" fill="#E8D9B8" /><circle cx="36" cy="18" r="2" fill="#E8D9B8" />
        </symbol>
        <symbol id="i-tomato" viewBox="0 0 60 60">
          <circle cx="30" cy="34" r="17" fill="#D64530" />
          <circle cx="30" cy="34" r="17" fill="#8A1E10" filter="url(#grain)" opacity=".2" />
          <path d="M30 18 l -3 -6 M30 18 l 4 -5" stroke="#4A7A34" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 20 C 26 17 34 17 38 20 L 34 24 L 30 21 L 26 24 Z" fill="#5E8F3C" />
          <path d="M23 29 a 8 8 0 0 1 6 -4" stroke="#F2A08A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-onion" viewBox="0 0 60 60">
          <path d="M30 14 C 18 22 14 30 14 38 C 14 46 21 52 30 52 C 39 52 46 46 46 38 C 46 30 42 22 30 14 Z" fill="#B87A9E" />
          <path d="M30 14 C 24 24 22 34 23 50 M30 14 C 36 24 38 34 37 50 M30 14 C 30 26 30 38 30 52" stroke="#96547A" strokeWidth="1.6" fill="none" />
          <path d="M30 14 c 0 -4 1 -6 3 -8 M30 14 c -2 -3 -2 -6 -1 -8" stroke="#8A6A50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-potato" viewBox="0 0 60 60">
          <path d="M14 34 C 12 22 24 14 34 17 C 46 20 50 32 44 42 C 38 50 18 48 14 34 Z" fill="#C9A05A" />
          <path d="M14 34 C 12 22 24 14 34 17 C 46 20 50 32 44 42 C 38 50 18 48 14 34 Z" fill="#8A6428" filter="url(#grain)" opacity=".35" />
          <path d="M24 26 a 2 2 0 0 0 2 2 M38 30 a 2 2 0 0 0 2 2 M28 40 a 2 2 0 0 0 2 2" stroke="#8A6428" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-carrot" viewBox="0 0 60 60">
          <path d="M22 20 C 28 18 34 20 36 26 C 38 32 32 46 26 52 C 24 46 20 32 22 20 Z" fill="#E8842C" transform="rotate(-14 28 36)" />
          <path d="M24 28 c 3 1 6 1 8 0 M23 36 c 3 1 5 1 7 0 M24 44 c 2 1 4 1 5 0" stroke="#C4641C" strokeWidth="1.5" fill="none" transform="rotate(-14 28 36)" />
          <path d="M32 16 C 34 10 38 8 42 8 M34 18 C 38 14 43 13 47 15 M35 20 C 39 19 43 20 45 23" stroke="#5E8F3C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-pepper" viewBox="0 0 60 60">
          <path d="M20 22 C 14 26 13 38 18 45 C 22 51 28 52 30 48 C 32 52 38 51 42 45 C 47 38 46 26 40 22 C 36 19 33 20 30 22 C 27 20 24 19 20 22 Z" fill="#5E9A3C" />
          <path d="M24 26 C 22 32 22 40 24 45 M36 26 C 38 32 38 40 36 45" stroke="#4A7A2C" strokeWidth="1.8" fill="none" />
          <path d="M30 22 c 0 -4 1 -6 3 -8" stroke="#4A6B28" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-banana" viewBox="0 0 60 60">
          <path d="M14 20 C 14 36 24 48 42 48 C 46 48 48 45 46 42 C 34 42 24 32 22 18 C 21 14 14 15 14 20 Z" fill="#F2CC60" />
          <path d="M20 24 C 22 34 30 42 40 44" stroke="#D9A82C" strokeWidth="1.6" fill="none" />
          <path d="M15 17 l 3 -3" stroke="#8A6A38" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 44 l 2 2" stroke="#6E5228" strokeWidth="3" strokeLinecap="round" />
        </symbol>
        <symbol id="i-mango" viewBox="0 0 60 60">
          <path d="M18 24 C 26 12 44 16 46 30 C 48 42 38 50 28 48 C 16 45 12 32 18 24 Z" fill="#F2A93B" />
          <path d="M20 26 C 24 18 34 17 40 22" stroke="#E88A6A" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7" />
          <path d="M20 22 c -2 -4 -1 -7 1 -9" stroke="#6E5228" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M22 14 c 5 -2 9 0 10 4 c -5 2 -9 0 -10 -4 Z" fill="#5E8F3C" />
        </symbol>
        <symbol id="i-berry" viewBox="0 0 60 60">
          <path d="M22 18 C 28 14 36 14 42 18 C 44 30 38 42 32 46 C 26 42 20 30 22 18 Z" fill="#D64530" />
          <path d="M27 26 l 1 2 M34 24 l 1 2 M30 34 l 1 2 M36 32 l 1 2 M26 34 l 1 2" stroke="#F2C878" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M26 18 L 32 12 L 38 18 L 32 21 Z" fill="#5E8F3C" />
          <circle cx="16" cy="42" r="6" fill="#5A6BA8" /><circle cx="26" cy="50" r="5" fill="#4A5A98" />
          <circle cx="14" cy="40" r="1.4" fill="#8A9AC8" />
        </symbol>
        <symbol id="i-apple" viewBox="0 0 60 60">
          <path d="M30 20 C 22 14 12 20 12 32 C 12 42 20 52 26 50 C 28 49 32 49 34 50 C 40 52 48 42 48 32 C 48 20 38 14 30 20 Z" fill="#C24E42" />
          <path d="M30 20 C 22 14 12 20 12 32 C 12 42 20 52 26 50 C 28 49 32 49 34 50 C 40 52 48 42 48 32 C 48 20 38 14 30 20 Z" fill="#7A1E14" filter="url(#grain)" opacity=".2" />
          <path d="M30 20 c 0 -5 2 -8 4 -10" stroke="#6E5228" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M34 12 c 5 -2 9 1 9 5 c -5 2 -9 -1 -9 -5 Z" fill="#5E8F3C" />
          <path d="M19 28 a 9 9 0 0 1 5 -6" stroke="#E8968A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-coconut" viewBox="0 0 60 60">
          <circle cx="30" cy="32" r="18" fill="#8A5A2E" />
          <circle cx="30" cy="32" r="18" fill="#4E2A10" filter="url(#grain)" opacity=".45" />
          <circle cx="30" cy="32" r="13" fill="#F7F3E8" />
          <circle cx="30" cy="32" r="7" fill="#E8F0F2" />
          <path d="M22 16 c 2 -4 6 -6 10 -6 M28 14 c 3 -3 7 -4 11 -2" stroke="#6E8B3D" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-frozen" viewBox="0 0 60 60">
          <rect x="12" y="16" width="36" height="32" rx="4" fill="#A8C4D8" />
          <rect x="12" y="16" width="36" height="8" rx="4" fill="#8FB0C9" />
          <g stroke="#F2F8FA" strokeWidth="2.4" strokeLinecap="round">
            <path d="M30 28 v 14 M23 31.5 l 14 7 M37 31.5 l -14 7" />
          </g>
        </symbol>
        <symbol id="i-ham" viewBox="0 0 60 60">
          <ellipse cx="30" cy="38" rx="18" ry="11" fill="#E8A0A0" />
          <ellipse cx="30" cy="32" rx="18" ry="11" fill="#EFB4B0" />
          <ellipse cx="30" cy="32" rx="14" ry="8" fill="#E8A0A0" />
          <circle cx="30" cy="32" r="3.5" fill="#F7F1E2" />
          <path d="M18 30 a 12 7 0 0 1 8 -5" stroke="#F7D9D4" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-sausage" viewBox="0 0 60 60">
          <rect x="8" y="24" width="26" height="11" rx="5.5" fill="#B45036" transform="rotate(-12 21 30)" />
          <rect x="26" y="30" width="26" height="11" rx="5.5" fill="#A84830" transform="rotate(10 39 36)" />
          <path d="M33 26 l 2 6" stroke="#7E3020" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 24 l 3 3 M42 40 l 3 3" stroke="#D9836A" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
        <symbol id="i-crab" viewBox="0 0 60 60">
          <ellipse cx="30" cy="36" rx="14" ry="10" fill="#D64530" />
          <path d="M18 30 C 12 24 10 18 14 14 C 18 18 20 22 22 26 M42 30 C 48 24 50 18 46 14 C 42 18 40 22 38 26" stroke="#D64530" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M18 42 l -6 4 M22 46 l -4 5 M42 42 l 6 4 M38 46 l 4 5" stroke="#B03424" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="25" cy="33" r="1.8" fill="#3A1008" /><circle cx="35" cy="33" r="1.8" fill="#3A1008" />
        </symbol>
        <symbol id="i-shellfish" viewBox="0 0 60 60">
          <path d="M16 20 C 26 22 30 32 28 44 C 18 42 12 32 16 20 Z" fill="#4A5A78" />
          <path d="M18 26 c 3 4 5 9 5 13" stroke="#6A7A98" strokeWidth="1.6" fill="none" />
          <path d="M44 18 C 34 20 30 30 32 42 C 42 40 48 30 44 18 Z" fill="#5A6A88" />
          <path d="M34 40 C 36 34 40 30 44 28" stroke="#E8C87A" strokeWidth="3" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-pastadry" viewBox="0 0 60 60">
          <g transform="rotate(6 30 30)">
            <rect x="22" y="8" width="16" height="44" fill="#F2CC60" />
            <path d="M24 8 v 44 M28 8 v 44 M32 8 v 44 M36 8 v 44" stroke="#D9A82C" strokeWidth="1.4" />
            <rect x="18" y="24" width="24" height="14" rx="2" fill="#4238A6" />
            <ellipse cx="30" cy="31" rx="7" ry="4.5" fill="#F2E4C8" />
          </g>
        </symbol>
        <symbol id="i-pulses" viewBox="0 0 60 60">
          <rect x="16" y="14" width="28" height="8" rx="3" fill="#A89878" />
          <path d="M18 22 h 24 v 26 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#EDE6D6" />
          <path d="M18 26 h 24 v 8 h -24 Z" fill="#E3A320" />
          <path d="M18 34 h 24 v 8 h -24 Z" fill="#C9641F" />
          <path d="M18 42 h 24 v 6 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#8A6438" />
          <circle cx="24" cy="30" r="1.2" fill="#C9871B" /><circle cx="32" cy="38" r="1.2" fill="#A84E12" /><circle cx="36" cy="46" r="1.2" fill="#6E4C28" />
        </symbol>
        <symbol id="i-cookie" viewBox="0 0 60 60">
          <circle cx="24" cy="26" r="13" fill="#C9822F" />
          <circle cx="24" cy="26" r="13" fill="#7E4E10" filter="url(#grain)" opacity=".3" />
          <circle cx="20" cy="22" r="2" fill="#5E3418" /><circle cx="28" cy="26" r="2" fill="#5E3418" /><circle cx="22" cy="31" r="1.8" fill="#5E3418" />
          <path d="M38 30 a 13 13 0 1 1 -8 16 a 9 9 0 0 0 8 -16 Z" fill="#D89540" />
          <circle cx="40" cy="40" r="1.8" fill="#5E3418" /><circle cx="35" cy="46" r="1.6" fill="#5E3418" />
        </symbol>
        <symbol id="i-pastry" viewBox="0 0 60 60">
          <path d="M10 38 C 10 26 20 18 30 18 C 40 18 50 26 50 38 C 46 34 42 32 38 32 C 36 26 24 26 22 32 C 18 32 14 34 10 38 Z" fill="#E0A050" />
          <path d="M10 38 C 14 42 20 44 24 42 C 26 46 34 46 36 42 C 40 44 46 42 50 38" fill="#D89540" />
          <path d="M22 32 C 24 38 36 38 38 32 M24 42 C 26 38 34 38 36 42" stroke="#B4772A" strokeWidth="1.8" fill="none" />
        </symbol>
        <symbol id="i-paneer" viewBox="0 0 60 60">
          <path d="M14 34 L 30 28 L 46 34 L 30 40 Z" fill="#FBF7EC" />
          <path d="M14 34 L 14 44 L 30 50 L 30 40 Z" fill="#EDE6D6" />
          <path d="M46 34 L 46 44 L 30 50 L 30 40 Z" fill="#F4EDDE" />
          <path d="M22 22 L 34 18 L 44 22 L 32 26 Z" fill="#FBF7EC" />
          <path d="M22 22 L 22 28 L 32 32 L 32 26 Z" fill="#EDE6D6" />
          <path d="M44 22 L 44 28 L 32 32 L 32 26 Z" fill="#F4EDDE" />
        </symbol>
        <symbol id="i-tea" viewBox="0 0 60 60">
          <rect x="16" y="18" width="28" height="34" rx="4" fill="#C24E32" />
          <rect x="16" y="18" width="28" height="8" rx="4" fill="#A83E24" />
          <rect x="14" y="14" width="32" height="6" rx="3" fill="#8A5A2E" />
          <circle cx="30" cy="38" r="8" fill="#F2E4C8" />
          <path d="M30 42 c -4 -2 -4 -8 0 -10 c 4 2 4 8 0 10 Z" fill="#5E8F3C" />
        </symbol>
        <symbol id="i-honeyjam" viewBox="0 0 60 60">
          <path d="M18 24 h 24 v 24 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#E8A23C" />
          <path d="M18 24 h 24 v 24 c 0 4 -3 6 -6 6 h -12 c -3 0 -6 -2 -6 -6 Z" fill="#A86410" filter="url(#grain)" opacity=".3" />
          <path d="M14 20 C 20 14 40 14 46 20 C 44 24 40 26 30 26 C 20 26 16 24 14 20 Z" fill="#F2E4C8" />
          <circle cx="24" cy="20" r="1.2" fill="#C9A050" /><circle cx="32" cy="18" r="1.2" fill="#C9A050" /><circle cx="38" cy="21" r="1.2" fill="#C9A050" />
          <path d="M18 32 h 24" stroke="#C9871B" strokeWidth="2" />
        </symbol>
        <symbol id="i-picklejar" viewBox="0 0 60 60">
          <rect x="18" y="12" width="24" height="7" rx="3" fill="#A83E24" />
          <path d="M17 19 h 26 v 29 c 0 4 -3 6 -6 6 h -14 c -3 0 -6 -2 -6 -6 Z" fill="#D9E4C8" opacity=".9" />
          <path d="M20 26 l 8 4 M32 24 l 7 5 M22 38 l 9 3 M34 36 l 7 4" stroke="#6E8B3D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="26" cy="32" r="1.6" fill="#C24E32" /><circle cx="36" cy="44" r="1.6" fill="#C24E32" />
        </symbol>
        <symbol id="i-salt" viewBox="0 0 60 60">
          <path d="M22 24 C 22 18 38 18 38 24 L 40 46 C 40 52 20 52 20 46 Z" fill="#F4F1E8" />
          <path d="M23 20 C 23 14 37 14 37 20 L 37 22 C 37 26 23 26 23 22 Z" fill="#C9C2B0" />
          <circle cx="27" cy="18" r="1" fill="#8A8578" /><circle cx="30" cy="17" r="1" fill="#8A8578" /><circle cx="33" cy="18" r="1" fill="#8A8578" />
          <path d="M24 36 c 4 2 8 2 12 0" stroke="#D8D2C0" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-sugar" viewBox="0 0 60 60">
          <path d="M12 32 C 12 44 20 50 30 50 C 40 50 48 44 48 32 Z" fill="#D8E4E8" />
          <path d="M12 32 h 36" stroke="#B8C8D0" strokeWidth="2" />
          <rect x="20" y="22" width="9" height="9" rx="1.5" fill="#FBF9F2" transform="rotate(-8 24 26)" />
          <rect x="32" y="20" width="9" height="9" rx="1.5" fill="#F4F1E8" transform="rotate(10 36 24)" />
          <rect x="27" y="13" width="8" height="8" rx="1.5" fill="#FBF9F2" transform="rotate(-4 31 17)" />
        </symbol>
        <symbol id="i-milk" viewBox="0 0 60 60">
          <path d="M20 22 L 40 22 L 44 30 L 44 52 L 16 52 L 16 30 Z" fill="#F2F6F7" />
          <path d="M20 22 L 40 22 L 44 30 L 16 30 Z" fill="#E0E8EA" />
          <path d="M20 22 L 30 10 L 40 22" fill="#E8EEF0" stroke="#C4D0D4" strokeWidth="1.5" />
          <rect x="16" y="36" width="28" height="9" fill="#5A6BA8" />
          <circle cx="30" cy="40.5" r="3" fill="#F2F6F7" />
        </symbol>
        <symbol id="i-oil" viewBox="0 0 60 60">
          <path d="M26 8 h 8 v 10 c 5 3 7 8 7 15 v 15 c 0 4 -3 6 -6 6 h -10 c -3 0 -6 -2 -6 -6 v -15 c 0 -7 2 -12 7 -15 Z" fill="#E8DFA8" opacity=".9" />
          <path d="M20 34 c 0 -5 1 -9 4 -12 h 12 c 3 3 4 7 4 12 v 14 c 0 3 -2 5 -5 5 h -10 c -3 0 -5 -2 -5 -5 Z" fill="#C9A21B" />
          <rect x="25" y="6" width="10" height="5" rx="2" fill="#8A5A2E" />
          <path d="M24 38 a 7 7 0 0 1 4 -6" stroke="#E8CB5A" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-saucebottle" viewBox="0 0 60 60">
          <path d="M24 20 h 12 c 4 6 6 12 6 20 c 0 8 -5 12 -12 12 c -7 0 -12 -4 -12 -12 c 0 -8 2 -14 6 -20 Z" fill="#C24328" />
          <path d="M24 20 h 12 c 4 6 6 12 6 20 c 0 8 -5 12 -12 12 c -7 0 -12 -4 -12 -12 c 0 -8 2 -14 6 -20 Z" fill="#701E0E" filter="url(#grain)" opacity=".25" />
          <rect x="26" y="10" width="8" height="10" fill="#A83E24" />
          <rect x="25" y="7" width="10" height="5" rx="2" fill="#F4F1E8" />
          <ellipse cx="30" cy="38" rx="7" ry="9" fill="#F2E4C8" opacity=".85" />
          <ellipse cx="30" cy="38" rx="4" ry="6" fill="#D64530" />
        </symbol>
        <symbol id="i-eggplant" viewBox="0 0 60 60">
          <path d="M34 20 C 44 24 48 36 42 44 C 36 52 24 52 20 44 C 16 36 22 24 34 20 Z" fill="#6E3A8E" />
          <path d="M34 20 C 44 24 48 36 42 44 C 36 52 24 52 20 44 C 16 36 22 24 34 20 Z" fill="#3A1058" filter="url(#grain)" opacity=".25" />
          <path d="M34 20 c 1 -4 3 -6 6 -8" stroke="#4A7A34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M28 18 C 32 16 38 17 40 21 C 36 24 30 23 28 18 Z" fill="#5E8F3C" />
          <path d="M25 30 a 9 9 0 0 1 5 -6" stroke="#9A6ABE" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-pumpkin" viewBox="0 0 60 60">
          <ellipse cx="30" cy="36" rx="19" ry="15" fill="#E8842C" />
          <ellipse cx="30" cy="36" rx="19" ry="15" fill="#A84E10" filter="url(#grain)" opacity=".25" />
          <path d="M22 22 C 18 30 18 42 22 50 M38 22 C 42 30 42 42 38 50 M30 21 C 28 30 28 42 30 51" stroke="#C4641C" strokeWidth="1.8" fill="none" />
          <path d="M30 21 c 0 -4 1 -7 4 -9" stroke="#6E5228" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M34 12 c 4 -1 7 1 8 4" stroke="#5E8F3C" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-cucumber" viewBox="0 0 60 60">
          <rect x="8" y="26" width="36" height="12" rx="6" fill="#5E9A3C" transform="rotate(-16 26 32)" />
          <path d="M14 28 l 2 2 M22 25 l 2 2 M30 22 l 2 2" stroke="#4A7A2C" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="45" cy="42" r="8" fill="#DDE8B8" stroke="#5E9A3C" strokeWidth="2.5" />
          <circle cx="45" cy="42" r="2" fill="#C4D490" />
          <path d="M45 36 v 12 M39 42 h 12" stroke="#C4D490" strokeWidth="1.4" />
        </symbol>
        <symbol id="i-okra" viewBox="0 0 60 60">
          <path d="M16 14 C 24 16 30 28 30 46 C 28 48 24 48 22 46 C 16 34 14 22 16 14 Z" fill="#6FA048" />
          <path d="M16 14 l -2 -4" stroke="#4A7A2C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 14 C 46 16 50 28 48 46 C 46 48 42 48 40 46 C 36 34 34 22 38 14 Z" fill="#5E9A3C" />
          <path d="M38 14 l -1 -5" stroke="#4A7A2C" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="43" cy="26" r="1.4" fill="#DDE8B8" /><circle cx="44" cy="34" r="1.4" fill="#DDE8B8" /><circle cx="44" cy="42" r="1.4" fill="#DDE8B8" />
        </symbol>
        <symbol id="i-cabbage" viewBox="0 0 60 60">
          <circle cx="30" cy="34" r="18" fill="#A8C48A" />
          <path d="M14 28 C 20 20 40 20 46 28 C 40 24 20 24 14 28 Z" fill="#8FB06A" />
          <path d="M30 16 C 24 24 22 36 24 50 M30 16 C 36 24 38 36 36 50 M18 24 C 22 32 24 42 24 50 M42 24 C 38 32 36 42 36 50" stroke="#7A9A56" strokeWidth="1.6" fill="none" />
        </symbol>
        <symbol id="i-broccoli" viewBox="0 0 60 60">
          <circle cx="22" cy="24" r="9" fill="#4A7A34" /><circle cx="34" cy="18" r="8" fill="#557A34" /><circle cx="42" cy="28" r="8" fill="#4A7A34" /><circle cx="30" cy="30" r="9" fill="#3E6B2A" />
          <circle cx="22" cy="24" r="9" fill="#2C4416" filter="url(#grain)" opacity=".35" />
          <path d="M28 38 C 27 44 26 48 24 52 L 34 52 C 33 48 33 44 33 38 Z" fill="#C4D490" />
        </symbol>
        <symbol id="i-peas" viewBox="0 0 60 60">
          <path d="M12 26 C 20 18 42 18 50 30 C 44 40 22 42 12 26 Z" fill="#5E8F3C" />
          <circle cx="22" cy="28" r="5" fill="#8FB86A" /><circle cx="32" cy="29" r="5.5" fill="#7AAA56" /><circle cx="42" cy="30" r="5" fill="#8FB86A" />
          <circle cx="20" cy="26" r="1.4" fill="#C4E0A8" /><circle cx="30" cy="27" r="1.4" fill="#C4E0A8" />
          <path d="M12 26 c -2 -3 -2 -6 0 -9" stroke="#4A7A2C" strokeWidth="2" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="i-pom" viewBox="0 0 60 60">
          <circle cx="30" cy="34" r="16" fill="#B02E48" />
          <circle cx="30" cy="34" r="16" fill="#5E0A1E" filter="url(#grain)" opacity=".25" />
          <path d="M25 15 L 27 20 M30 14 L 30 19 M35 15 L 33 20" stroke="#8A2038" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 18 L 36 18 L 33 23 L 27 23 Z" fill="#B02E48" />
          <circle cx="25" cy="31" r="2" fill="#E86A88" /><circle cx="31" cy="29" r="2" fill="#E86A88" /><circle cx="35" cy="35" r="2" fill="#E86A88" /><circle cx="27" cy="38" r="2" fill="#E86A88" />
        </symbol>
        <symbol id="i-grapes" viewBox="0 0 60 60">
          <circle cx="24" cy="26" r="6" fill="#7A5A9E" /><circle cx="36" cy="26" r="6" fill="#8A6AAE" /><circle cx="18" cy="35" r="6" fill="#8A6AAE" /><circle cx="30" cy="36" r="6" fill="#6E4E92" /><circle cx="42" cy="35" r="6" fill="#7A5A9E" /><circle cx="24" cy="45" r="6" fill="#7A5A9E" /><circle cx="36" cy="45" r="6" fill="#6E4E92" /><circle cx="30" cy="53" r="5" fill="#7A5A9E" />
          <path d="M30 20 c 0 -5 2 -8 5 -10" stroke="#8A6A50" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M35 10 c 5 -2 9 1 9 5 c -5 2 -9 -1 -9 -5 Z" fill="#5E8F3C" />
          <circle cx="22" cy="24" r="1.6" fill="#B49AD0" />
        </symbol>
        <symbol id="i-melon" viewBox="0 0 60 60">
          <path d="M8 24 A 26 26 0 0 0 52 24 Z" fill="#4A7A34" />
          <path d="M11 24 A 22 22 0 0 0 49 24 Z" fill="#C4E0A8" />
          <path d="M14 24 A 18 18 0 0 0 46 24 Z" fill="#E05A48" />
          <path d="M14 24 A 18 18 0 0 0 46 24 Z" fill="#8A1E10" filter="url(#grain)" opacity=".2" />
          <circle cx="24" cy="30" r="1.6" fill="#2A1A10" /><circle cx="34" cy="32" r="1.6" fill="#2A1A10" /><circle cx="29" cy="37" r="1.6" fill="#2A1A10" />
        </symbol>
        <symbol id="i-pineapple" viewBox="0 0 60 60">
          <ellipse cx="30" cy="38" rx="13" ry="16" fill="#E8B84A" />
          <ellipse cx="30" cy="38" rx="13" ry="16" fill="#A87818" filter="url(#grain)" opacity=".3" />
          <path d="M20 30 L 40 46 M20 38 L 38 52 M22 24 L 42 40 M20 46 L 32 54 M28 22 L 42 33" stroke="#C49232" strokeWidth="1.5" />
          <path d="M40 30 L 20 46 M42 38 L 24 52 M38 24 L 18 40" stroke="#C49232" strokeWidth="1.5" />
          <path d="M30 22 C 26 16 24 12 24 8 C 28 10 29 14 30 18 C 31 12 33 8 36 6 C 36 12 34 16 32 20 C 36 16 40 14 44 14 C 41 18 36 21 32 22 Z" fill="#5E8F3C" />
        </symbol>
        <symbol id="i-spices" viewBox="0 0 60 60">
          <circle cx="30" cy="32" r="20" fill="#C9C2B0" />
          <circle cx="30" cy="32" r="17" fill="#E4DBC6" />
          <circle cx="23" cy="25" r="6" fill="#C0532B" /><circle cx="37" cy="25" r="6" fill="#E3A320" />
          <circle cx="23" cy="39" r="6" fill="#7A8B4C" /><circle cx="37" cy="39" r="6" fill="#8E4A20" />
          <circle cx="23" cy="25" r="6" fill="#701E0E" filter="url(#grain)" opacity=".3" />
          <circle cx="37" cy="25" r="6" fill="#A87208" filter="url(#grain)" opacity=".3" />
          <circle cx="30" cy="32" r="2.5" fill="#A89878" />
        </symbol>

        {/* watermark-only motifs */}
        <symbol id="w-steam" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <path d="M16 56 C 10 44 20 40 14 28 C 10 20 16 14 14 4" />
            <path d="M32 56 C 26 44 36 40 30 28 C 26 20 32 14 30 4" />
            <path d="M48 56 C 42 44 52 40 46 28 C 42 20 48 14 46 4" />
          </g>
        </symbol>
        <symbol id="w-rings" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="30" cy="30" r="27" /><circle cx="30" cy="30" r="20" /><circle cx="30" cy="30" r="7" />
          </g>
        </symbol>
        <symbol id="w-receipt" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 4 h32 v46 l-4 -4 -4 4 -4 -4 -4 4 -4 -4 -4 4 -4 -4 -4 4 Z" />
            <path d="M21 15 h18 M21 23 h18 M21 31 h12" strokeWidth="2" />
          </g>
        </symbol>
        <symbol id="w-lens" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <circle cx="26" cy="26" r="14" />
            <path d="M36.5 36.5 L 48 48" />
          </g>
        </symbol>
        <symbol id="w-plates" viewBox="0 0 60 60">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="21" cy="30" r="17" /><circle cx="21" cy="30" r="6" />
            <circle cx="39" cy="30" r="17" /><circle cx="39" cy="30" r="6" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}