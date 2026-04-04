import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { config } from "../config";
import { sendError } from "../utils/response";

/**
 * Global error handler middleware — must be registered LAST in Express.
 * Handles Zod validation errors, known app errors, and unexpected errors.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join(".") || "body";
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);
    }
    sendError(res, "Validation failed.", 400, errors);
    return;
  }

  // Handle Prisma known errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    sendError(res, `A record with this ${field} already exists.`, 409);
    return;
  }

  if (err.code === "P2025") {
    sendError(res, "Record not found.", 404);
    return;
  }

  // Handle known operational errors (thrown intentionally)
  if (err.statusCode) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Log unexpected errors
  console.error("[Unhandled Error]", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak internal details in production
  const message = config.isDevelopment
    ? err.message || "Internal server error"
    : "Internal server error";

  sendError(res, message, 500);
}

/**
 * 404 handler — catches any request not matched by registered routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * AppError — a custom error class for intentional operational errors.
 * Use this to throw known errors from services/controllers.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}
