
function cors(body, status = 200, headers = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async () => {
  const id = process.env.PAYPAL_CLIENT_ID || null;
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ ok: !!id, clientId: id })
  };
};
