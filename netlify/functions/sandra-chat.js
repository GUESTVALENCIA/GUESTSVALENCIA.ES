// netlify/functions/sandra-chat.js
// --- HOTFIX: helpers inline para evitar errores de require ---
function getModelForRole(role) {
  const models = {
    visitor: process.env.OPENAI_MODEL_VISITOR || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
    guest:   process.env.OPENAI_MODEL_GUEST   || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
    premium: process.env.OPENAI_MODEL_PREMIUM || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o"
  };
  const key = (role || "visitor").toLowerCase();
  return models[key] || models.visitor;
}

function getApiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("Missing OPENAI_API_KEY");
  return k;
}

// Limitador simple (24h) en memoria por IP
let __usageLog = {};
function checkLimit(key, limit) {
  const now = Date.now();
  if (!__usageLog[key]) __usageLog[key] = [];
  const DAY_MS = 24 * 60 * 60 * 1000;
  __usageLog[key] = __usageLog[key].filter(ts => now - ts < DAY_MS);
  if (__usageLog[key].length >= limit) return false;
  __usageLog[key].push(now);
  return true;
}

exports.handler = async (event, context) => {
  const debugId = Math.random().toString(36).slice(2, 10);

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (e) {
      console.error(`[${debugId}] JSON parse error:`, e);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({ error: "Invalid JSON body" })
      };
    }

    const message = (body.message || "").toString().trim();
    const role = (body.role || "visitor").toString().trim().toLowerCase();
    if (!message) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({ error: "Missing 'message'" })
      };
    }

    // Límites por rol
    const limits = {
      visitor: parseInt(process.env.LIMIT_VISITOR_TEXT || "5", 10),
      guest:   parseInt(process.env.LIMIT_GUEST_TEXT   || "20", 10),
      premium: parseInt(process.env.LIMIT_PREMIUM_TEXT || "100", 10),
    };
    const limit = limits[role] ?? limits.visitor;

    const ip = event.headers["x-nf-client-connection-ip"]
            || (event.headers["x-forwarded-for"] || "").split(",")[0]
            || "anonymous";
    const usageKey = `${ip}:text`;
    if (!checkLimit(usageKey, limit)) {
      console.warn(`[${debugId}] Rate limit exceeded for ${usageKey} (limit ${limit})`);
      return {
        statusCode: 429,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({
          error: "Rate limit exceeded",
          detail: `Has alcanzado el límite diario de consultas (${limit}) para este rol`
        })
      };
    }

    const model = getModelForRole(role);
    let apiKey;
    try { apiKey = getApiKey(); }
    catch (e) {
      console.error(`[${debugId}] Missing OPENAI_API_KEY`);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" })
      };
    }

    const systemPrompt =
      "Eres Sandra, una asistente de reservas para Guests Valencia. Responde en español con tono cálido, profesional y directo. " +
      "Si el usuario pide reservar: pide fechas (llegada, salida), nº de huéspedes y presupuesto. Sé breve y útil.";

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.6
    };

    console.log(`[${debugId}] Request -> role=${role} model=${model} ip=${ip} msg="${message}"`);
    const t0 = Date.now();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const elapsed = Date.now() - t0;

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "<no body>");
      console.error(
        `[${debugId}] OpenAI error: status=${resp.status} elapsed=${elapsed}ms body=${errText}`
      );
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({
          error: "OpenAI error",
          status: resp.status,
          detail: "Revisa OPENAI_API_KEY, el nombre exacto del modelo y los límites de tu cuenta.",
          debugId
        })
      };
    }

    let data;
    try { data = await resp.json(); }
    catch (e) {
      console.error(`[${debugId}] JSON parse from OpenAI failed after ${elapsed}ms:`, e);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({ error: "Bad response from OpenAI", debugId })
      };
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      console.warn(`[${debugId}] Empty reply from OpenAI after ${elapsed}ms. Raw:`, JSON.stringify(data));
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "x-debug-id": debugId },
        body: JSON.stringify({
          reply: "Lo siento, ahora mismo no puedo responder.",
          modelUsed: model,
          role,
          debugId
        })
      };
    }

    console.log(`[${debugId}] OK: elapsed=${elapsed}ms model=${model}`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "x-debug-id": debugId },
      body: JSON.stringify({ reply, modelUsed: model, role, debugId })
    };

  } catch (e) {
    console.error(`[${debugId}] Unexpected error:`, e);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "x-debug-id": debugId },
      body: JSON.stringify({
        error: "Unexpected error",
        detail: e?.message || String(e),
        debugId
      })
    };
  }
};
