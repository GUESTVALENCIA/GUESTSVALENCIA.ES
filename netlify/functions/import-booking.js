// netlify/functions/import-booking.js
const { getStore } = require('@netlify/blobs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    let body = {}; try { body = JSON.parse(event.body || "{}"); } catch {}
    const store = getStore("gv_listings");
    const existing = (await store.get("listings", { type: "json" })) || { items: [] };
    existing.items.push({ id: Date.now().toString(), source: "import-booking", ...body });
    await store.set("listings", existing);
    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
