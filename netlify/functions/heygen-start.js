// netlify/functions/heygen-start.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    const apiKey = process.env.HEYGEN_API_KEY;
    const avatarId = process.env.HEYGEN_AVATAR_ID;
    if (!apiKey || !avatarId) return { statusCode: 500, body: JSON.stringify({ error: "Missing HEYGEN_API_KEY or HEYGEN_AVATAR_ID" }) };
    let body = {}; try { body = JSON.parse(event.body || "{}"); } catch {}
    const text = body.text;
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: "Missing 'text'" }) };

    const payload = {
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId },
        voice: { type: "elevenlabs", voice_id: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM" },
        content: [{ type: "dialogue", script: text }]
      }],
      dimension: { width: 720, height: 1280 }
    };

    const resp = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) return { statusCode: 500, body: JSON.stringify({ error: "HeyGen error", detail: data }) };
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: data.data?.task_id || data.task_id || null, raw: data }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Unexpected error" }) };
  }
};
