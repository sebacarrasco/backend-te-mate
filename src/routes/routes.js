const express = require('express');
const authController = require('../controllers/auth');
const usersController = require('../controllers/users');
const gamesController = require('../controllers/games');
const challengesController = require('../controllers/challenges');

const app = express();

app.use('/auth', authController);
app.use('/users', usersController);
app.use('/games', gamesController);
app.use('/challenges', challengesController);

module.exports = app;
