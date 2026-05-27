/**
 * NoSQL injection sanitization middleware.
 * Recursively strips keys starting with "$" from req.body, req.query, and req.params
 * to prevent MongoDB operator injection attacks.
 */

const stripDollarKeys = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripDollarKeys);
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) continue;
    cleaned[key] = stripDollarKeys(obj[key]);
  }
  return cleaned;
};

const sanitize = (req, _res, next) => {
  if (req.body) req.body = stripDollarKeys(req.body);
  if (req.query) req.query = stripDollarKeys(req.query);
  if (req.params) req.params = stripDollarKeys(req.params);
  next();
};

export default sanitize;
