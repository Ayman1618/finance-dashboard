import { prisma } from "../database/client";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../middleware/auditLog";
import type { LoginInput, RegisterInput } from "@finance/shared";

export const AuthService = {
  /**
   * Register a new user. Admins can assign any role;
   * public registration defaults to VIEWER.
   */
  async register(input: RegisterInput, createdByAdmin?: boolean) {
    // Check for existing email
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError("A user with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        // Only admins can set roles; everyone else gets VIEWER
        role: createdByAdmin ? (input.role ?? "VIEWER") : "VIEWER",
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    });

    return user;
  },

  /**
   * Login — validates credentials and issues access + refresh token pair.
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Use the same error message as wrong password to prevent email enumeration
      throw new AppError("Invalid email or password.", 401);
    }

    if (user.status === "INACTIVE") {
      throw new AppError("Your account has been deactivated.", 403);
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Issue a refresh token stored in the DB
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: "pending", // temporary, updated below
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id, refreshTokenRecord.id);

    // Store the actual signed token
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  /**
   * Refresh — validates the refresh token, revokes it (rotation),
   * and issues a new access + refresh token pair.
   */
  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token.", 401);
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new AppError("Refresh token has been revoked.", 401);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError("Refresh token has expired.", 401);
    }

    if (tokenRecord.user.status === "INACTIVE") {
      throw new AppError("Your account has been deactivated.", 403);
    }

    // Revoke the old token (rotation — prevents token reuse)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Issue a new pair
    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        token: "pending",
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const newAccessToken = generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    const newRefreshToken = generateRefreshToken(
      tokenRecord.user.id,
      newRefreshTokenRecord.id
    );

    await prisma.refreshToken.update({
      where: { id: newRefreshTokenRecord.id },
      data: { token: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  /**
   * Logout — revokes the refresh token so it can't be used again.
   */
  async logout(refreshToken: string, userId: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await createAuditLog({
      userId,
      action: "LOGOUT",
      entity: "User",
      entityId: userId,
    });
  },
};
