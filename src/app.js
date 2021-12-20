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

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.APP_PORT, () => {
  console.log(`Running on localhost: ${process.env.APP_PORT}`);
});
