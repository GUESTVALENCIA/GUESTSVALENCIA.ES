// netlify/functions/heygen-status.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    const apiKey = process.env.HEYGEN_API_KEY;
    const taskId = (event.queryStringParameters && event.queryStringParameters.task_id) || "";
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Missing HEYGEN_API_KEY" }) };
    if (!taskId) return { statusCode: 400, body: JSON.stringify({ error: "Missing 'task_id'" }) };

    const resp = await fetch(`https://api.heygen.com/v1/task/${taskId}`, {
      headers: { "X-Api-Key": apiKey }
    });
    const data = await resp.json();
    if (!resp.ok) return { statusCode: 500, body: JSON.stringify({ error: "HeyGen error", detail: data }) };
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Unexpected error" }) };
  }
};
