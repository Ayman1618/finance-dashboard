import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const UserRole = z.enum(["VIEWER", "ANALYST", "ADMIN"]);
export type UserRole = z.infer<typeof UserRole>;

export const UserStatus = z.enum(["ACTIVE", "INACTIVE"]);
export type UserStatus = z.infer<typeof UserStatus>;

export const RecordType = z.enum(["INCOME", "EXPENSE"]);
export type RecordType = z.infer<typeof RecordType>;

export const RecordCategory = z.enum([
  "SALARY",
  "FREELANCE",
  "INVESTMENT",
  "RENT",
  "FOOD",
  "TRANSPORT",
  "HEALTHCARE",
  "EDUCATION",
  "ENTERTAINMENT",
  "UTILITIES",
  "SHOPPING",
  "TRAVEL",
  "OTHER",
]);
export type RecordCategory = z.infer<typeof RecordCategory>;

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  role: UserRole.optional().default("VIEWER"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

// ─── User Schemas ────────────────────────────────────────────────────────────

export const CreateUserSchema = RegisterSchema;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: UserRole.optional(),
  status: UserStatus.optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ─── Record Schemas ──────────────────────────────────────────────────────────

export const CreateRecordSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999, "Amount is too large"),
  type: RecordType,
  category: RecordCategory,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  description: z.string().max(500, "Description too long").optional(),
});
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

export const UpdateRecordSchema = CreateRecordSchema.partial();
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;

export const RecordFilterSchema = z.object({
  type: RecordType.optional(),
  category: RecordCategory.optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from date must be YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "to date must be YYYY-MM-DD")
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type RecordFilterInput = z.infer<typeof RecordFilterSchema>;

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
