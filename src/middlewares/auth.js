const jwtGenerator = require('jsonwebtoken');

const emailToLowerCase = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  return next();
};

const emailIsUnique = async (req, res, next) => {
  const user = await req.orm.User.findOne({ where: { email: req.body.email, active: true } });
  if (user) {
    return res.status(409).send({ message: 'An account associated with this email already exists' });
  }
  return next();
};

const setCurrentUserURLToken = async (req, res, next) => {
  try {
    const { sub } = await jwtGenerator.verify(req.params.token, process.env.JWT_SECRET);
    req.currentUser = await req.orm.User.findByPk(sub);
    if (req.currentUser === null || req.currentUser.active) { throw new Error('User not found'); }
    return next();
  } catch {
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
};

const setCurrentUser = async (req, res, next) => {
  try {
    const { authData: { sub } } = req;
    req.currentUser = await req.orm.User.findByPk(sub);
    if (req.currentUser === null || !req.currentUser.active) { throw new Error('User not found'); }
    return next();
  } catch {
    return res.status(401).send({ message: 'Invalid token' });
  }
};

module.exports = {
  emailToLowerCase,
  emailIsUnique,
  setCurrentUserURLToken,
  setCurrentUser,
};
