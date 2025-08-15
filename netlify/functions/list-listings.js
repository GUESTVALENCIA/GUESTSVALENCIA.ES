// netlify/functions/list-listings.js
const { getStore } = require('@netlify/blobs');
exports.handler = async () => {
  try {
    const store = getStore("gv_listings");
    const data = await store.get("listings", { type: "json" });
    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(data || { items: [] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
