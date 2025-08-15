// netlify/functions/helpers/usage.js
// Limitador simple en memoria por ventana de 24h.
// Clave recomendada: `${ip}:text` o `${userId}:text`

let usageLog = {}; // { key: [timestamps...] }

/**
 * Devuelve true si aún no se ha alcanzado el límite, y registra el uso.
 * @param {string} key - Identificador del sujeto (IP/usuario) + tipo (text/audio/etc.)
 * @param {number} limit - Máximo permitido en 24h.
 * @returns {boolean}
 */
function checkLimit(key, limit) {
  const now = Date.now();
  if (!usageLog[key]) usageLog[key] = [];

  // Mantener solo eventos de las últimas 24 horas
  const DAY_MS = 24 * 60 * 60 * 1000;
  usageLog[key] = usageLog[key].filter(ts => now - ts < DAY_MS);

  if (usageLog[key].length >= limit) {
    return false; // Límite alcanzado
  }

  usageLog[key].push(now);
  return true;
}

/**
 * Resetea todo (útil para pruebas locales).
 */
function resetUsage() {
  usageLog = {};
}

module.exports = {
  checkLimit,
  resetUsage
};
