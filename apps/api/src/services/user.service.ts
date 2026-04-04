import { prisma } from "../database/client";
import { hashPassword } from "../utils/password";
import { AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../middleware/auditLog";
import type { CreateUserInput, UpdateUserInput } from "@finance/shared";

// Reusable select — never expose passwordHash to callers
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const UserService = {
  /**
   * List all users with pagination.
   */
  async listUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: userSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return user;
  },

  /**
   * Create a user (Admin only — can set any role).
   */
  async createUser(input: CreateUserInput, adminId: string) {
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
        role: input.role ?? "VIEWER",
        passwordHash,
      },
      select: userSelect,
    });

    await createAuditLog({
      userId: adminId,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    });

    return user;
  },

  /**
   * Update user role and/or status (Admin only).
   */
  async updateUser(id: string, input: UpdateUserInput, adminId: string) {
    // Ensure user exists
    await UserService.getUserById(id);

    // Prevent admin from deactivating themselves
    if (id === adminId && input.status === "INACTIVE") {
      throw new AppError("You cannot deactivate your own account.", 400);
    }

    const before = await prisma.user.findUnique({ where: { id }, select: userSelect });

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.role && { role: input.role }),
        ...(input.status && { status: input.status }),
      },
      select: userSelect,
    });

    await createAuditLog({
      userId: adminId,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      meta: { before, after: user },
    });

    return user;
  },

  /**
   * Soft-deactivate a user (sets status to INACTIVE).
   */
  async deactivateUser(id: string, adminId: string) {
    if (id === adminId) {
      throw new AppError("You cannot deactivate your own account.", 400);
    }

    await UserService.getUserById(id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: userSelect,
    });

    // Revoke all active refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });

    await createAuditLog({
      userId: adminId,
      action: "DELETE",
      entity: "User",
      entityId: id,
      meta: { reason: "Admin deactivation" },
    });

    return user;
  },

  /**
   * Get a user's own profile.
   */
  async getProfile(userId: string) {
    return UserService.getUserById(userId);
  },
};
