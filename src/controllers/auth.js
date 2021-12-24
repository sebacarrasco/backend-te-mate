const express = require('express');
const { check } = require('express-validator');
const jwtGenerator = require('jsonwebtoken');
const { emailIsUnique, setCurrentUserURLToken, emailToLowerCase } = require('../middlewares/auth');
const { fieldValidator } = require('../middlewares/field-validator');
const sendConfirmAccountEmail = require('../mailers/confirm-account');

const router = express.Router();
router.use(emailToLowerCase);

router.post('/register', [
  check('password', 'password should be at least 6 characters long').isLength({ min: 6 }),
  check('firstName', 'firstName should be at least 2 characters long').isLength({ min: 2 }),
  check('lastName', 'lastName should be at least 2 characters long').isLength({ min: 2 }),
  check('email', 'email format is not valid').isEmail(),
  fieldValidator,
], emailIsUnique, async (req, res) => {
  try {
    const [user] = await req.orm.User.findOrCreate({
      where: { email: req.body.email },
      defaults: {
        ...req.body,
      },
    });
    const token = jwtGenerator.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );
    await sendConfirmAccountEmail(user, token);
    return res.status(201).send({ message: 'User was successfully created' });
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/login', [
  check('password', 'password should be at least 6 characters long').isLength({ min: 6 }),
  check('email', 'email format is not valid').isEmail(),
  fieldValidator,
], async (req, res) => {
  const { email, password } = req.body;
  const user = await req.orm.User.findOne({ where: { email, active: true } });
  if (!user) return res.status(404).send({ message: `No user found with ${email}` });
  const authenticated = await user.checkPassword(password);
  if (!authenticated) return res.status(401).send({ message: 'Invalid password' });

  try {
    const token = jwtGenerator.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7 days' },
    );
    return res.status(201).send({ access_token: token, tokenType: 'Bearer' });
  } catch (error) {
    return res.status(500).send({ message: 'Error generating the jwt' });
  }
});

router.get('/confirmation/:token', setCurrentUserURLToken, async (req, res) => {
  try {
    req.currentUser.active = true;
    await req.currentUser.save();
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}confirmation-success`);
  } catch {
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

router.get('/desconfirmation/:token', setCurrentUserURLToken, async (req, res) => {
  try {
    await req.currentUser.destroy();
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}desconfirmation-success`);
  } catch {
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

module.exports = router;
