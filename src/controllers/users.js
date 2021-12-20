const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await req.orm.User.findAll();
    return res.status(200).send({ users });
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

module.exports = router;
