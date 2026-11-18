// Real food photography for Season.
//
// Dishes carry no photo of their own, so each one is matched to a kind of
// dish (dishSymbol in art.jsx sorts names like "Sagu Masala Dosa" into
// "d-dosa"), and every kind has a few hand-picked photos. A stable hash of
// the dish name picks one, so a dish always shows the same picture and
// neighbouring dishes of the same kind still look different.
//
// All photos are from Unsplash (free licence) and are served from its CDN,
// which resizes on the fly.

const P = {
  "d-icecream":   ["1560008581-09826d1de69e", "1597249536924-b226b1a1259d", "1761281116743-f5112b4c5219"],
  "d-muffin":     ["1607958996333-41aef7caefaa", "1767634480773-37e4b962fa1d"],
  "d-brownie":    ["1636743715220-d8f8dd900b87", "1762922425478-7049c54bfbec", "1606313564200-e75d5e30476c"],
  "d-pie":        ["1620980776848-84ac10194945", "1778448699282-ec9834cb5812", "1771556621626-353ce8ecb5e9"],
  "d-loafcake":   ["1768260732302-12822bd6427b", "1557925923-6982bd9650ff"],
  "d-cookieplate":["1621297075730-16b5bd8913cf", "1509460711270-4affad6eef6a", "1590080874088-eec64895b423"],
  "d-cake":       ["1768260732302-12822bd6427b", "1606890737304-57a1ca8a5b62", "1602351447937-745cb720612f"],
  "d-kheer":      ["1517244683847-7456b63c5969", "1794125342522-c49409ed54c9"],
  "d-laddu":      ["1695568181747-f54dff1d4654", "1635952346904-95f2ccfcd029"],
  "d-jalebi":     ["1778448806852-db6a837fa98f", "1778448806608-4b2d5817eff2"],
  "d-gulabjamun": ["1695568180070-8b5acead5cf4", "1758910536889-43ce7b3199fd"],
  "d-halwa":      ["1794125342522-c49409ed54c9", "1645432524603-2a5172479006"],
  "d-sweet":      ["1758910536889-43ce7b3199fd", "1695568181440-aca4dac18650", "1695568181044-afbbeaf4298d"],
  "d-chai":       ["1619581073186-5b4ae1b0caad", "1544787219-7f47ccb76574", "1625033405953-f20401c7d848"],
  "d-lassi":      ["1692620609860-be6717812f71", "1675064982913-067b64880f5f"],
  "d-drink":      ["1600271886742-f049cd451bba", "1603569283847-aa295f0d016a", "1794231818996-8352d26e3db1"],
  "d-dosa":       ["1668236543090-82eba5ee5976", "1694849789325-914b71ab4075", "1743517894265-c86ab035adef", "1751560455942-f859f1215826"],
  "d-pancake":    ["1528207776546-365bb710ee93", "1612182062633-9ff3b3598e96", "1757635964104-67218db55bca"],
  "d-momo":       ["1694923450868-b432a8ee52aa", "1534422298391-e4f8c172dddb", "1625220194771-7ebdea0b70b9"],
  "d-idli":       ["1680359871322-aabe6b33eff5", "1680359873197-c3eb21ec05c0", "1788621879512-0aefb7a774ff"],
  "d-puri":       ["1788602564560-9bcbf0f9acb6"],
  "d-naan":       ["1655979284091-eea0e93405ee", "1697155406014-04dc649b0953", "1788601988466-9f361c34c6cb"],
  "d-flatbread":  ["1683533743190-89c9b19f9ea6", "1683533746199-9e3920bf3eab", "1708783741187-ff1d081d87da"],
  "d-pizza":      ["1513104890138-7c749659a591", "1565299624946-b28f40a0ae38", "1604382354936-07c5d9983bd3"],
  "d-sandwich":   ["1553909489-cd47e0907980", "1528735602780-2552fd46c7af", "1539252554453-80ab65ce3586", "1792143663878-974883a5c9b7"],
  "d-taco":       ["1626700051175-6818013e1d4f", "1731090389603-d63060ee08a6", "1671572579845-52270341950f", "1566740933430-b5e70b06d2d5"],
  "d-chaat":      ["1788621138170-6854f17c9e2e", "1788620473431-df599434a3d3", "1653850280260-aa3b9e00b230"],
  "d-samosa":     ["1601050690597-df0568f70950", "1772729996007-40bad08b3c40"],
  "d-vada":       ["1730191843435-073792ba22bc", "1683533678059-63c6a0e9e3ef", "1624374053855-39a5a1a41402"],
  "d-pakora":     ["1765360024331-25b63e85272e", "1765360024320-b2ab819c6f75", "1767114915965-7abe87d7c7d8"],
  "d-cutlet":     ["1708782340351-25feb5640076", "1599307767316-776533bb941c"],
  "d-murukku":    ["1589786742305-f24d19eedbe5", "1625242661157-e9e5708ffe5e"],
  "d-snackfry":   ["1768215610440-fcb9631c7ee2", "1518013431117-eb1465fa5752", "1598679253544-2c97992403ea"],
  "d-kebab":      ["1610057099431-d73a1c9d2f2f", "1617692855027-33b14f061079", "1705359573325-f2006d5e459f"],
  "d-shak":       ["1510693206972-df098062cb71", "1766146431872-a4472ccd3889", "1677844592730-ce9c936d8f1a"],
  "d-noodle":     ["1585032226651-759b368d7246", "1612927601601-6638404737ce", "1772729219249-d11a0c1359fb"],
  "d-cacio":      ["1621996346565-e3dbc646d9a9", "1611270629569-8b357cb88da9", "1608897013039-887f21d8c804"],
  "d-pho":        ["1476718406336-bb5a9690ee2a", "1616501268826-ee9731c915d4", "1764015939059-2c5dee249315"],
  "d-upma":       ["1789991184412-c29c9dfa2b39", "1752673508949-f4aeeaef75f0"],
  "d-congee":     ["1654923064926-be7e64267a31", "1633104060731-32143505bacc", "1684403731883-67a71a793d2d"],
  "d-fruitsalad": ["1774041877283-a3aaad1f2ad2", "1760881592698-abbf44a47872", "1641642400143-6be68f1a0918"],
  "d-salad":      ["1512621776951-a57141f2eefd", "1546069901-ba9599a7e63c", "1600335895229-6e75511892c8"],
  "d-raita":      ["1542691457-cbe4df041eb2", "1580050878264-c4985c8ae8e7"],
  "d-pickle":     ["1617854307432-13950e24ba07", "1506368249639-73a05d6f6488"],
  "d-podi":       ["1596040033229-a9821ebd058d", "1581600140682-d4e68c8cde32", "1592457711340-2412dc07b733"],
  "d-chutney":    ["1765118527220-da9c7a560b13", "1580050878264-c4985c8ae8e7"],
  "d-fish":       ["1761314036779-84078bec535c", "1654863404432-cac67587e25d", "1620894580123-466ad3a0ca06", "1626508035297-0cd27c397d67"],
  "d-biryani":    ["1563379091339-03b21ab4a4f8", "1631515243349-e0cb75fb8d3a", "1589302168068-964664d93dc0", "1789990653630-921eda98b866"],
  "d-friedrice":  ["1603133872878-684f208fb84b", "1512058564366-18510be2db19", "1584269600464-37b1b58a9fe7"],
  "d-jollof":     ["1789992252165-28c05878c442", "1697155406055-2db32d47ca07", "1680993032090-1ef7ea9b51e5"],
  "d-saag":       ["1589647363585-f4a7d3877b10", "1767114915936-745dd372f1d8"],
  "d-poriyal":    ["1789475387509-8e62ba3beb09", "1722290680497-389e0f684e05", "1599297915779-0dadbd376d49"],
  "d-stirfry":    ["1794825908413-d1bdbd20f564", "1599297915779-0dadbd376d49"],
  "d-sabzi":      ["1652545296893-ff9227b3512e", "1652545296892-3787063f8b4d", "1652545297020-f5e8ad779eb4"],
  "d-sambar":     ["1626500155537-93690c24099e", "1668337624325-e49fd5bf1446", "1794125283094-ae6a445866a6"],
  "d-dal":        ["1626500155537-93690c24099e", "1788601988466-9f361c34c6cb", "1585937421612-70a008356fbe"],
  "d-korma":      ["1772730065344-4cf131b39951", "1565557623262-b51c2513a641"],
  "d-makhani":    ["1772730064951-89b427965dbc", "1772730064970-a7b2735c93b9", "1631452180519-c014fe946bc7"],
  "d-kofta":      ["1603894584373-5ac82b2ae398", "1728910156510-77488f19b152"],
  "d-kuzhambu":   ["1620894580123-466ad3a0ca06", "1596797038530-2c107229654b"],
  "d-curry":      ["1585937421612-70a008356fbe", "1596797038530-2c107229654b", "1565557623262-b51c2513a641", "1767114915989-c6ab3c8fc42e"],
};
const FALLBACK = ["1680993032090-1ef7ea9b51e5", "1742281257687-092746ad6021", "1589778655375-3e622a9fc91c"];

// One wide photo per section of the app, shown at the top of each page.
export const SCENES = {
  dashboard: "1680993032090-1ef7ea9b51e5",  // a thali, everything on one plate
  planner:   "1728910156510-77488f19b152",  // a table laid with many dishes
  dishes:    "1581600140682-d4e68c8cde32",  // whole spices on wood
  pantry:    "1778940409463-3b241e700046",  // kitchen shelves with jars
  shopping:  "1542838132-92c53300491e",     // vegetables at the market
  nutrients: "1512621776951-a57141f2eefd",  // a bowl of fresh vegetables
  scanner:   "1488459716781-31db52582fe9",  // fruit stall
  social:    "1463183547458-6a2c760d0912",  // a long shared table
  profile:   "1619581073186-5b4ae1b0caad",  // clay cups of chai
  signin:    "1589778655375-3e622a9fc91c",  // a steel tray of many small dishes
  spices:    "1716816211590-c15a328a5ff0",
};

export function photoUrl(id, w = 800, h) {
  const size = h ? `&h=${h}` : "";
  return `https://images.unsplash.com/photo-${id}?w=${w}${size}&q=72&auto=format&fit=crop`;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// symbolOf is passed in (dishSymbol from art.jsx) to keep this file free of
// React imports.
export function dishPhotoId(dish, symbolOf) {
  const list = P[symbolOf(dish)] ?? FALLBACK;
  return list[hash((dish?.name ?? "").toLowerCase()) % list.length];
}
