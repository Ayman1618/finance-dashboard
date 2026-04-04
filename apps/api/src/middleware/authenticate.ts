import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";
import { prisma } from "../database/client";

/**
 * Authenticate middleware — verifies the JWT access token from the
 * Authorization header and attaches the decoded user to req.user.
 *
 * Expects: Authorization: Bearer <token>
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, "Authentication required. Please provide a valid Bearer token.", 401);
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      sendError(res, "Authentication token is missing.", 401);
      return;
    }

    // Verify the JWT signature and expiry
    const payload = verifyAccessToken(token);

    // Verify the user still exists and is active in the database
    // This prevents tokens from working after a user is deactivated
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      sendError(res, "User account not found.", 401);
      return;
    }

    if (user.status === "INACTIVE") {
      sendError(res, "Your account has been deactivated. Please contact an administrator.", 403);
      return;
    }

    // Attach the authenticated user to the request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      sendError(res, "Your session has expired. Please log in again.", 401);
      return;
    }
    if (error.name === "JsonWebTokenError") {
      sendError(res, "Invalid authentication token.", 401);
      return;
    }
    sendError(res, "Authentication failed.", 401);
  }
}
