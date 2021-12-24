const findUser = async (req, res, next) => {
  try {
    const user = await req.orm.User.findByPk(req.params.userId || req.body.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt', 'active'],
    });
    if (user === null || !user.active) { return res.status(404).send({ message: 'User not found' }); }
    req.user = user;
    return next();
  } catch (e) {
    return res.status(500).send();
  }
};

module.exports = {
  findUser,
};
