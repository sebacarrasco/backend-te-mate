const express = require('express');
const authController = require('../controllers/auth');
const usersController = require('../controllers/users');

const app = express();

app.use('/auth', authController);
app.use('/users', usersController);

module.exports = app;
