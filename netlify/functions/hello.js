// netlify/functions/hello.js
exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ hello: "from Netlify Functions" }) });
