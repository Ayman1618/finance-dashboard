import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validate middleware factory — validates request body, query, or params
 * against a Zod schema. Passes ZodError to the global error handler on failure.
 *
 * Usage:
 *   router.post("/", validate(CreateRecordSchema), createRecord)
 *   router.get("/", validate(FilterSchema, "query"), listRecords)
 */
export function validate(
  schema: ZodSchema,
  target: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(result.error);
      return;
    }

    // Replace req[target] with the parsed+transformed data (e.g. coerced numbers)
    req[target] = result.data;
    next();
  };
}
