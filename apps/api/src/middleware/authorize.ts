import { Request, Response, NextFunction } from "express";
import { UserRole } from "@finance/shared";
import { sendError } from "../utils/response";

/**
 * Authorize middleware factory — returns a middleware that restricts
 * access to users with the specified roles.
 *
 * Usage: router.get("/admin-only", authenticate, authorize("ADMIN"), handler)
 * Usage: router.get("/analysts-and-admins", authenticate, authorize("ANALYST", "ADMIN"), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Authentication required.", 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}.`,
        403
      );
      return;
    }

    next();
  };
}
