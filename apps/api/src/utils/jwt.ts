import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtAccessPayload, JwtRefreshPayload } from "../types";
import { UserRole } from "@finance/shared";

export function generateAccessToken(user: {
  id: string;
  email: string;
  role: UserRole;
}): string {
  const payload: JwtAccessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(userId: string, tokenId: string): string {
  const payload: JwtRefreshPayload = {
    sub: userId,
    tokenId,
    type: "refresh",
  };
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const payload = jwt.verify(token, config.jwt.accessSecret) as JwtAccessPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as JwtRefreshPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function getRefreshTokenExpiry(): Date {
  // Parse "7d" -> 7 days from now
  const expiry = config.jwt.refreshExpiresIn;
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const date = new Date();
  if (unit === "d") date.setDate(date.getDate() + value);
  else if (unit === "h") date.setHours(date.getHours() + value);
  else if (unit === "m") date.setMinutes(date.getMinutes() + value);
  return date;
}
