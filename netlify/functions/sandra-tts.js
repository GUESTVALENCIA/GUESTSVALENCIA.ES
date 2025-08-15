// netlify/functions/sandra-tts.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    const text = body.text;
    const voiceId = body.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!text)  return { statusCode: 400, body: JSON.stringify({ error: "Missing 'text'" }) };
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }) };

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey, "accept": "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if (!resp.ok) {
      const err = await resp.text();
      return { statusCode: 500, body: JSON.stringify({ error: "ElevenLabs error", detail: err }) };
    }
    const arrayBuf = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: `data:audio/mpeg;base64,${base64}` }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Unexpected error" }) };
  }
};
