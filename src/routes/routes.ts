import express from 'express';
import authController = require('../controllers/auth');
import usersController = require('../controllers/users');
import gamesController = require('../controllers/games');
import challengesController = require('../controllers/challenges');

const router = express.Router();

router.use('/auth', authController);
router.use('/users', usersController);
router.use('/games', gamesController);
router.use('/challenges', challengesController);

export = router;
