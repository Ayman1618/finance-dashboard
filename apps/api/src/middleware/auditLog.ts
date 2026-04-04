import { Request, Response, NextFunction } from "express";
import { prisma } from "../database/client";
import { AuditAction } from "@prisma/client";

/**
 * Creates an audit log entry in the database.
 * Call this directly from service layer for precise control.
 */
export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  meta?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Never fail the main request because of audit logging
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

/**
 * Request logger middleware — logs method, path, status, and duration
 * in a clean, readable format.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color =
      status >= 500 ? "\x1b[31m" : // red
      status >= 400 ? "\x1b[33m" : // yellow
      status >= 300 ? "\x1b[36m" : // cyan
      "\x1b[32m";                   // green
    const reset = "\x1b[0m";
    console.log(`${color}${method}${reset} ${originalUrl} ${color}${status}${reset} - ${duration}ms`);
  });

  next();
}
