const express = require('express');
const cors = require('cors');
const routes = require('../../src/routes/routes');
const orm = require('../../src/models');

const createApp = () => {
  const app = express();
  app.request.orm = orm;

  app.use(cors());
  app.use(express.json());
  app.use(routes);

  // catch 404 and forward to error handler
  app.use((req, res) => res.status(404).send({ message: 'Not Found' }));

  // error handlers
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (err.name === 'UnauthorizedError') { return res.status(401).send({ message: 'Invalid Token' }); }
    return res.status(err.status || 500).send();
  });

  return app;
};

module.exports = { createApp, orm };
