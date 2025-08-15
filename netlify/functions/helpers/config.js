// netlify/functions/helpers/config.js
const { getStore } = require('@netlify/blobs');

const CONFIG_BUCKET = 'gv_config';
const MODEL_KEY = 'modelMapping';

function defaultMapping() {
  return {
    defaultModel: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
    roles: {
      visitor: process.env.OPENAI_MODEL_VISITOR || process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
      guest:   process.env.OPENAI_MODEL_GUEST   || process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
      premium: process.env.OPENAI_MODEL_PREMIUM || process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o',
    }
  };
}

async function getModelMapping() {
  const store = getStore(CONFIG_BUCKET);
  const data = await store.get(MODEL_KEY, { type: 'json' });
  return data || defaultMapping();
}

async function setModelMapping(mapping) {
  const store = getStore(CONFIG_BUCKET);
  await store.set(MODEL_KEY, mapping);
}

function pickModelForRoles(roles, mapping) {
  const m = mapping || defaultMapping();
  const r = m.roles || {};
  // priority: premium > guest > visitor
  if (roles.includes('premium') && r.premium) return r.premium;
  if (roles.includes('guest') && r.guest) return r.guest;
  return r.visitor || m.defaultModel || 'gpt-4o-mini';
}

function getApiKey() {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
  return process.env.OPENAI_API_KEY;
}

module.exports = {
  getModelMapping,
  setModelMapping,
  pickModelForRoles,
  getApiKey
};
