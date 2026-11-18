// Food imagery for Season — real photography, no drawings.
//
// dishSymbol() sorts a dish name into a kind of dish ("d-dosa", "d-dal"…);
// photos.js holds the hand-picked photographs for each kind. DishArt and
// IngredientArt keep their old names and props so every page that used the
// drawn plates now shows photographs without further changes.
import { useState } from "react";
import { dishPhotoId, photoUrl, SCENES } from "../lib/photos";

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

// A dish photograph. `size` is the rendered square size in px; inside a
// .tile-cover the CSS stretches it to fill the cover instead.
export function DishArt({ dish, size = 40, style, round = true }) {
  const [failed, setFailed] = useState(false);
  const id = dishPhotoId(dish, dishSymbol);
  // Ask the CDN for 2x the display size (retina), capped for big covers.
  const px = Math.min(Math.max(Math.round(size * 2), 96), 900);
  return (
    <span
      aria-hidden="true"
      className={`art${round ? " art-round" : ""}`}
      style={{ width: size, height: size, ...style }}
    >
      {!failed && (
        <img
          src={photoUrl(id, px, px)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

// A wide photo for a dish (covers, heroes). Returns the URL only.
export function dishPhoto(dish, w = 1600) {
  return photoUrl(dishPhotoId(dish, dishSymbol), w);
}

// Pantry and market items have no photographs: they get a hand-lettered
// kraft label with the item's initial. Large sizes (empty states) show a
// photo of spices instead.
export function IngredientArt({ name = "", size = 44 }) {
  if (size >= 64) {
    return (
      <span aria-hidden="true" className="art art-round" style={{ width: size, height: size }}>
        <img src={photoUrl(SCENES.spices, size * 2, size * 2)} alt="" loading="lazy" />
      </span>
    );
  }
  const initial = (name.trim()[0] ?? "·").toUpperCase();
  return (
    <span aria-hidden="true" className="ing-stamp" style={{ width: size, height: size, fontSize: size * 0.56 }}>
      {initial}
    </span>
  );
}

// Kept for older imports; photography needs no shared SVG definitions.
export function SvgDefs() { return null; }
