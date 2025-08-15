// netlify/functions/helpers/config.js

// Devuelve el modelo según el rol usando variables de entorno.
// Si falta alguna, cae a defaults seguros.
function getModelForRole(role) {
  const models = {
    visitor: process.env.OPENAI_MODEL_VISITOR || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
    guest:   process.env.OPENAI_MODEL_GUEST   || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
    premium: process.env.OPENAI_MODEL_PREMIUM || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o"
  };
  const key = (role || "visitor").toLowerCase();
  return models[key] || models.visitor;
}

// Obtiene la API key de OpenAI o lanza error si no existe.
function getApiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("Missing OPENAI_API_KEY");
  return k;
}

module.exports = {
  getModelForRole,
  getApiKey
};

}

module.exports = {
  getModelMapping,
  setModelMapping
};
