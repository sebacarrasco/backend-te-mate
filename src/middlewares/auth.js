const jwtGenerator = require('jsonwebtoken');

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
    if (req.currentUser === null || req.currentUser.active === true) { throw new Error('User not found'); }
    return next();
  } catch {
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
};

module.exports = {
  emailIsUnique,
  setCurrentUserURLToken,
};
