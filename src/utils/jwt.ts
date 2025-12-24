import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => (
  jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRATION_TIME || '14d', algorithm: 'HS256' },
  )
);
