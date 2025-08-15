// helper functions to handle user roles and usage limits
const { get, set } = require('@netlify/blobs');

// TTL for usage counters (seconds). A value of 24 hours ensures
// that usage limits reset each day.
const DAY_TTL = 60 * 60 * 24;

/**
 * Extracts the authenticated user and roles from the Netlify function context.
 * If no user is authenticated, a fallback identifier based on IP is used.
 *
 * @param {Object} event The event object passed to the Netlify function.
 * @param {Object} context The context object passed to the Netlify function.
 * @returns {{ userId: string, roles: string[] }} An object containing the userId and an array of roles.
 */
async function getUser(event, context) {
  // Netlify Identity attaches the authenticated user to context.clientContext.user.
  const user = context && context.clientContext && context.clientContext.user;
  let roles = [];
  let userId;
  if (user) {
    // roles can be stored either directly on app_metadata.roles or nested under authorization.roles
    roles = (user.app_metadata && (user.app_metadata.roles || (user.app_metadata.authorization && user.app_metadata.authorization.roles))) || [];
    // The user ID can be the user.id or subject; fallback to email if available
    userId = user.id || user.sub || user.email;
  }
  // Fallback identifier when the user is not logged in. We use the client IP as a best effort.
  if (!userId) {
    userId = event && event.headers && event.headers['x-forwarded-for'] ? event.headers['x-forwarded-for'].split(',')[0] : 'anonymous';
  }
  return { userId, roles };
}

/**
 * Determine the limit configuration for a given set of roles.
 * The first matching role is returned based on the order: premium > guest > visitor.
 *
 * @param {string[]} roles The roles associated with the user.
 * @param {Object} limits A map of limits keyed by role name.
 * @returns {Object} The limit object corresponding to the user's role.
 */
function getLimitForRoles(roles, limits) {
  if (roles && roles.includes('premium') && limits.premium) return limits.premium;
  if (roles && roles.includes('guest') && limits.guest) return limits.guest;
  // default to visitor limits when no matching role found
  return limits.visitor;
}

/**
 * Retrieve the usage counters for a user from Netlify blobs.
 *
 * @param {string} userId The identifier for the user.
 * @returns {Promise<Object>} A usage object containing counters per usage type.
 */
async function getUsage(userId) {
  const key = `usage:${userId}`;
  const stored = await get(key);
  if (!stored) {
    // Initialize all counters to 0 if not present
    return { text: 0, audio: 0, avatar: 0 };
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    // if parsing fails, reset counters
    return { text: 0, audio: 0, avatar: 0 };
  }
}

/**
 * Persist the updated usage counters for a user to Netlify blobs with a TTL.
 *
 * @param {string} userId The identifier for the user.
 * @param {Object} usage A usage object with updated counters.
 */
async function setUsage(userId, usage) {
  const key = `usage:${userId}`;
  await set(key, JSON.stringify(usage), { ttl: DAY_TTL });
}

/**
 * Check whether a user has remaining allowance for a given usage type and, if so,
 * increment the counter. Returns a boolean indicating if the request should proceed.
 *
 * @param {string} userId The identifier for the user.
 * @param {string} type The usage category (e.g. 'text', 'audio', 'avatar').
 * @param {number} limit The maximum allowed count per day for this category.
 * @returns {Promise<{ allowed: boolean, usage: Object }>} An object indicating permission and the updated usage.
 */
async function checkAndIncrement(userId, type, limit) {
  const usage = await getUsage(userId);
  if (!(type in usage)) {
    usage[type] = 0;
  }
  if (usage[type] >= limit) {
    return { allowed: false, usage };
  }
  usage[type] += 1;
  await setUsage(userId, usage);
  return { allowed: true, usage };
}

module.exports = {
  DAY_TTL,
  getUser,
  getLimitForRoles,
  getUsage,
  setUsage,
  checkAndIncrement
};