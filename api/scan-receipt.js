// Vercel serverless function: POST /api/scan-receipt
// Verifies the caller's Supabase session, then extracts grocery items
// from a receipt image using the Gemini API. The Gemini key lives only
// here (server-side env var), never in the client bundle.

const GEMINI_MODEL     = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const SUPABASE_URL      = process.env.SUPABASE_URL      || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const PROMPT = `You are a grocery receipt parser. Extract all food and grocery items from this receipt image.
Return ONLY a JSON array with no explanation or markdown. Each object must have:
- "name": clean item name (string)
- "qty": numeric quantity (number, e.g. 1, 250, 2.5)
- "unit": one of exactly: g, kg, ml, L, oz, lb, pcs, loaf, cartons, tbsp, tsp, cups, bunch
- "category": one of exactly: Produce, Dairy, Grains, Pantry, Bakery, Meat, Seafood, Spices, Frozen

Rules:
- Skip prices, discounts, totals, store name, tax lines, and non-food items
- If the receipt shows an explicit quantity and unit, use those
- unit and category MUST be exactly one of the values listed above — no other words
- Pick the unit that best matches how the item is measured/sold, not always "pcs":
    * liquids (milk, juice, oil, water, cream, soda) -> ml, L, or oz
    * items sold by weight (onions, potatoes, meat, cheese, rice, flour) -> g, kg, lb, or oz
    * items counted individually (eggs, apples, cans, yogurt cups) -> pcs
    * herbs / leafy greens -> bunch; bread -> loaf
- Only use "pcs" when the item is genuinely counted as whole pieces
- For package types not in the list (jar, can, bottle, box, bag, pack), use "pcs"
- If quantity is unclear, default to 1 with the most natural unit for the item
- For any item that isn't clearly Dairy/Produce/Meat/Seafood/Bakery/Grains/Spices/Frozen, use "Pantry"

Example: [{"name":"Whole Milk","qty":1,"unit":"L","category":"Dairy"},{"name":"Garlic","qty":3,"unit":"pcs","category":"Produce"}]`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }

  // 1. Require a valid Supabase session so only logged-in users spend our quota.
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Not signed in." });
  }
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!userRes.ok) {
    return res.status(401).json({ error: "Session invalid or expired. Please sign in again." });
  }

  // 2. Validate the payload.
  const { imageBase64, mimeType } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: "No image provided." });
  }
  const safeMime = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
    ? mimeType : "image/jpeg";

  // 3. Call Gemini with the server-side key.
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: safeMime, data: imageBase64 } },
            { text: PROMPT },
          ],
        }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error?.message ?? `Gemini error ${geminiRes.status}` });
  }

  // 4. Parse the model output into a clean item array.
  const data  = await geminiRes.json();
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    return res.status(422).json({ error: "Could not find any items in the receipt." });
  }

  let items;
  try {
    items = JSON.parse(match[0]);
  } catch {
    return res.status(422).json({ error: "Could not read the receipt response." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: "No grocery items were found on this receipt." });
  }

  return res.status(200).json({ items });
}
