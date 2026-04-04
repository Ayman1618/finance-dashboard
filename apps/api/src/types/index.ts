import { Request } from "express";
import { UserRole } from "@finance/shared";

// Extends Express Request with authenticated user payload
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Augment the Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface JwtAccessPayload {
  sub: string;    // user id
  email: string;
  role: UserRole;
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string; // refresh token DB id for revocation
  type: "refresh";
}
