const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { fieldValidator } = require('../middlewares/field-validator');

const router = express.Router();
router.use(jwt({ secret: process.env.JWT_SECRET, requestProperty: 'authData', algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req, res) => {
  try {
    const users = await req.orm.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt'],
    });
    return res.status(200).send({ users });
  } catch (e) {
    return res.status(500).send();
  }
});

router.get('/:userId', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], async (req, res) => {
  try {
    const user = await req.orm.User.findByPk(req.params.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt', 'active'],
    });
    if (user === null || !user.active) { return res.status(404).send({ message: 'User not found' }); }
    return res.status(200).send({ user });
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
