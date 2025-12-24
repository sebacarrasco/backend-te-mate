const jwtGenerator = require('jsonwebtoken');

const emailToLowerCase = (req, res, next) => {
  if (req.body?.email) {
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
  const redirectToInvalid = () => res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);

  let sub;
  try {
    ({ sub } = jwtGenerator.verify(req.params.token, process.env.JWT_SECRET));
  } catch (error) {
    console.log(`Token verification failed - ${error.message}`);
    return redirectToInvalid();
  }

  console.log(`Token verified, looking up user with id ${sub}`);
  req.currentUser = await req.orm.User.findByPk(sub);

  if (req.currentUser === null) {
    console.log('User not found');
    return redirectToInvalid();
  }
  if (req.currentUser.active) {
    console.log('User is already active');
    return redirectToInvalid();
  }

  return next();
};

const setCurrentUser = async (req, res, next) => {
  const respondWithInvalidToken = () => res.status(401).send({ message: 'Invalid token' });

  const sub = req.authData?.sub;
  if (!sub) {
    console.log('Authentication failed - no sub in authData');
    return respondWithInvalidToken();
  }

  console.log(`Looking up user with id ${sub}`);
  req.currentUser = await req.orm.User.findByPk(sub);

  if (req.currentUser === null) {
    console.log('Authentication failed - user not found');
    return respondWithInvalidToken();
  }
  if (!req.currentUser.active) {
    console.log('Authentication failed - user is not active');
    return respondWithInvalidToken();
  }

  return next();
};

module.exports = {
  emailToLowerCase,
  emailIsUnique,
  setCurrentUserURLToken,
  setCurrentUser,
};
