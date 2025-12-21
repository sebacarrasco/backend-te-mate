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
  console.log(`Registering new user with email ${req.body.email}`);
  try {
    const [user] = await req.orm.User.findOrCreate({
      where: { email: req.body.email },
      defaults: {
        ...req.body,
      },
    });
    console.log(`User with email ${user.email} created with id ${user.id}`);
    const token = jwtGenerator.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );
    await sendConfirmAccountEmail(user, token);
    console.log(`Confirmation email sent to ${user.email}`);
    return res.status(201).send({ message: 'User was successfully created' });
  } catch (error) {
    console.error(`Error registering user - ${error.message}`);
    return res.status(500).send();
  }
});

router.post('/login', [
  check('password', 'password should be at least 6 characters long').isLength({ min: 6 }),
  check('email', 'email format is not valid').isEmail(),
  fieldValidator,
], async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for ${email}`);
  const user = await req.orm.User.findOne({ where: { email, active: true } });
  if (!user) {
    console.log(`Login failed - no user found with ${email}`);
    return res.status(404).send({ message: `No user found with ${email}` });
  }
  const authenticated = await user.checkPassword(password);
  if (!authenticated) {
    console.log(`Login failed - invalid password for ${email}`);
    return res.status(401).send({ message: 'Invalid password' });
  }

  try {
    const token = jwtGenerator.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME || '14d' },
    );
    console.log(`Login successful for ${email}`);
    return res.status(201).send({ access_token: token, tokenType: 'Bearer' });
  } catch (error) {
    console.error(`Error generating JWT for ${email} - ${error.message}`);
    return res.status(500).send({ message: 'Error generating the jwt' });
  }
});

router.get('/confirmation/:token', setCurrentUserURLToken, async (req, res) => {
  console.log(`Confirming account for user ${req.currentUser.email}`);
  try {
    req.currentUser.active = true;
    await req.currentUser.save();
    console.log(`Account confirmed successfully for ${req.currentUser.email}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}confirmation-success`);
  } catch (error) {
    console.error(`Error confirming account - ${error.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

router.get('/desconfirmation/:token', setCurrentUserURLToken, async (req, res) => {
  console.log(`Desconfirming account for user ${req.currentUser.email}`);
  try {
    await req.currentUser.destroy();
    console.log(`Account deleted for ${req.currentUser.email}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}desconfirmation-success`);
  } catch (error) {
    console.error(`Error deleting account - ${error.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

module.exports = router;
