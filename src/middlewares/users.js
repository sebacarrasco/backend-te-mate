const findUser = async (req, res, next) => {
  const userId = req.params.userId || req.body.userId;
  try {
    const user = await req.orm.User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt', 'active'],
    });
    if (user === null || !user.active) {
      console.log(`User ${userId} not found or inactive`);
      return res.status(404).send({ message: 'User not found' });
    }
    req.user = user;
    return next();
  } catch (error) {
    console.error(`Error finding user - ${error.message}`);
    return res.status(500).send();
  }
};

module.exports = {
  findUser,
};
