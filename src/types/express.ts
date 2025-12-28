import { ORM } from './orm';
import { UserModel, ChallengeModel, GameModel } from './models';

// Extend Express Request globally with custom properties
declare global {
  namespace Express {
    interface Request {
      orm: ORM;
      auth?: { sub: string }; // From express-jwt
      currentUser?: UserModel;
      user?: UserModel | { id: string };
      users?: UserModel[];
      game?: GameModel;
      challenge?: ChallengeModel;
    }
  }
}
