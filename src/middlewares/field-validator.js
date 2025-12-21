const { validationResult } = require('express-validator');

const fieldValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorFields = Object.keys(errors.mapped());
    console.log(`Validation failed for fields: ${errorFields.join(', ')}`);
    return res.status(400).json({
      ok: false,
      errors: errors.mapped(),
    });
  }
  return next();
};

module.exports = {
  fieldValidator,
};
