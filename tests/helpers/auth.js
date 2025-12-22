const jwt = require('jsonwebtoken');

const generateInvalidToken = () => jwt.sign({ sub: 'fake-id' }, 'wrong-secret', { algorithm: 'HS256' });

module.exports = { generateInvalidToken };
