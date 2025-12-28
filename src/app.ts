import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import cors from 'cors';
import routes = require('./routes/routes');
import orm from './models';
import './types/express'; // Import for global type extension

const app = express();

// Attach ORM to all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  req.orm = orm;
  next();
});

app.use(cors());
app.use(express.json());
app.use(routes);

// catch 404 and forward to error handler
app.use((req: Request, res: Response) => res.status(404).send({ message: 'Not Found' }));

// error handlers
interface HttpError extends Error {
  status?: number;
}

app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  console.error({
    message: err.message,
    stack: err.stack,
    status: err.status,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'UnauthorizedError') { return res.status(401).send({ message: 'Invalid Token' }); }
  return res.status(err.status || 500).send();
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Running on localhost: ${process.env.PORT}`);
});

export default app;
