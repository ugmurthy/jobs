import { UserPayload, AuthenticatedUser } from '../services/userService.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload | AuthenticatedUser;
    }
  }
}

export {};