// netlify/functions/model-config.js
const { getModelMapping, setModelMapping } = require('./helpers/config');

function isAdmin(context) {
  const user = context && context.clientContext && context.clientContext.user;
  const roles = (user && (user.app_metadata?.roles || user.app_metadata?.authorization?.roles)) || [];
  return roles.map(r => String(r).toLowerCase()).includes('admin');
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod === 'GET') {
      const mapping = await getModelMapping();
      return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify(mapping) };
    }
    if (event.httpMethod === 'POST') {
      if (!isAdmin(context)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: admin only' }) };
      }
      let body = {}; try { body = JSON.parse(event.body || '{}'); } catch {}
      if (!body || typeof body !== 'object') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) };
      }
      await setModelMapping(body);
      return { statusCode: 204, body: '' };
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
