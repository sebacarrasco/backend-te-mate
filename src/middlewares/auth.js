const jwtGenerator = require('jsonwebtoken');

const emailToLowerCase = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  return next();
};

const emailIsUnique = async (req, res, next) => {
  console.log(`Checking if email "${req.body.email}" is unique`);
  const user = await req.orm.User.findOne({ where: { email: req.body.email, active: true } });
  if (user) {
    console.log(`Email "${req.body.email}" already exists`);
    return res.status(409).send({ message: 'An account associated with this email already exists' });
  }
  return next();
};

const setCurrentUserURLToken = async (req, res, next) => {
  console.log('Verifying URL token');
  try {
    const { sub } = await jwtGenerator.verify(req.params.token, process.env.JWT_SECRET);
    console.log(`Token verified, looking up user with id ${sub}`);
    req.currentUser = await req.orm.User.findByPk(sub);
    if (req.currentUser === null) { throw new Error('User not found'); }
    if (req.currentUser.active) { throw new Error('User is already active'); }
    return next();
  } catch (error) {
    console.log(`Token verification failed - ${error.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
};

const setCurrentUser = async (req, res, next) => {
  try {
    const { authData: { sub } } = req;
    console.log(`Looking up user with id ${sub}`);
    req.currentUser = await req.orm.User.findByPk(sub);
    if (req.currentUser === null) { throw new Error('User not found'); }
    if (!req.currentUser.active) { throw new Error('User is not active'); }
    return next();
  } catch (error) {
    console.log(`Authentication failed - ${error.message}`);
    return res.status(401).send({ message: 'Invalid token' });
  }
};

module.exports = {
  emailToLowerCase,
  emailIsUnique,
  setCurrentUserURLToken,
  setCurrentUser,
};
