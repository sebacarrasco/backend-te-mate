const { Op } = require('sequelize');

const findUsers = async (req, res, next) => {
  if (req.body.userIds.length === 0) { return res.status(400).send({ message: 'userIds cannot be empty array ' }); }
  const userIds = [...req.body.userIds, req.currentUser.id];
  try {
    const users = await req.orm.User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
        active: true,
      },
    });
    if (users.length !== userIds.length) { return res.status(404).send({ message: 'Not every user was found' }); }
    req.users = users;
    return next();
  } catch (e) {
    return res.status(400).send({ message: 'Invalid syntax for type uuid' });
  }
};

module.exports = {
  findUsers,
};
