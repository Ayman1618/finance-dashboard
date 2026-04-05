import { prisma } from "../database/client";
import { AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../middleware/auditLog";
import type { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from "@finance/shared";
import { Prisma } from "@prisma/client";

const recordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  createdBy: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} as const;

export const RecordService = {
  async createRecord(input: CreateRecordInput, userId: string) {
    const record = await prisma.record.create({
      data: {
        amount: new Prisma.Decimal(input.amount),
        type: input.type,
        category: input.category,
        date: new Date(input.date),
        description: input.description,
        createdBy: userId,
      },
      select: recordSelect,
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "Record",
      entityId: record.id,
      meta: { amount: input.amount, type: input.type, category: input.category },
    });

    return record;
  },

  async listRecords(filters: RecordFilterInput) {
    const { page, limit, type, category, from, to, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.RecordWhereInput = {
      isDeleted: false,
      ...(type && { type }),
      ...(category && { category }),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        skip,
        take: limit,
        select: recordSelect,
        orderBy: { date: "desc" },
      }),
      prisma.record.count({ where }),
    ]);

    return {
      data: records,
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

  async getRecordById(id: string) {
    const record = await prisma.record.findFirst({
      where: { id, isDeleted: false },
      select: recordSelect,
    });

    if (!record) {
      throw new AppError("Record not found.", 404);
    }

    return record;
  },

  async updateRecord(id: string, input: UpdateRecordInput, userId: string) {
    const existing = await RecordService.getRecordById(id);

    const updated = await prisma.record.update({
      where: { id },
      data: {
        ...(input.amount !== undefined ? { amount: new Prisma.Decimal(input.amount) } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.date ? { date: new Date(input.date) } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      select: recordSelect,
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "Record",
      entityId: id,
      meta: { before: existing, changes: input },
    });

    return updated;
  },

  async softDeleteRecord(id: string, userId: string) {
    await RecordService.getRecordById(id);

    const record = await prisma.record.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      select: recordSelect,
    });

    await createAuditLog({
      userId,
      action: "DELETE",
      entity: "Record",
      entityId: id,
    });

    return record;
  },
};
