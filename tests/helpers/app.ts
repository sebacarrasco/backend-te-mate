import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes = require('../../src/routes/routes');
import orm from '../../src/models';
import '../../src/types/express';

interface HttpError extends Error {
  status?: number;
}

const createApp = () => {
  const app = express();

  // Attach ORM to all requests via middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.orm = orm;
    next();
  });

  app.use(cors());
  app.use(express.json());
  app.use(routes);

  // catch 404 and forward to error handler
  app.use((_req: Request, res: Response) => res.status(404).send({ message: 'Not Found' }));

  // error handlers
  app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (err.name === 'UnauthorizedError') { return res.status(401).send({ message: 'Invalid Token' }); }
    return res.status(err.status || 500).send();
  });

  return app;
};

export { createApp, orm };
