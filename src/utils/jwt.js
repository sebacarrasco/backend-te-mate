const jwt = require('jsonwebtoken');

const generateToken = (userId) => (
  jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION_TIME || '14d', algorithm: 'HS256' },
  )
);

module.exports = { generateToken };
