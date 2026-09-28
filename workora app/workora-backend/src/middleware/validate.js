const { validationResult } = require("express-validator");

// Run this after a chain of express-validator checks on a route. Keeps every
// route's validation error response in the same shape.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid input", details: errors.array() });
  }
  next();
}

module.exports = validate;
