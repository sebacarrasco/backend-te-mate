const express = require('express');
require('dotenv').config();
const cors = require('cors');
const routes = require('./routes/routes');
const orm = require('./models');

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
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  if (err.name === 'UnauthorizedError') { return res.status(401).send({ message: 'Invalid Token' }); }
  return res.status(err.status || 500).send();
});

app.listen(process.env.PORT, () => {
  console.log(`Running on localhost: ${process.env.PORT}`);
});
