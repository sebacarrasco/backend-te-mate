import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const fieldValidator = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorFields = Object.keys(errors.mapped());
    console.log(`Validation failed for fields: ${errorFields.join(', ')}`);
    return res.status(400).json({
      ok: false,
      errors: errors.mapped(),
    });
  }
  return next();
};
