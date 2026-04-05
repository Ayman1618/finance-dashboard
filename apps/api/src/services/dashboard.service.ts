import { prisma } from "../database/client";
import { Prisma } from "@prisma/client";

export const DashboardService = {
  /**
   * Overall summary: total income, total expenses, net balance, record count.
   */
  async getSummary(from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const [incomeAgg, expenseAgg, count] = await Promise.all([
      prisma.record.aggregate({
        where: { isDeleted: false, type: "INCOME", ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.record.aggregate({
        where: { isDeleted: false, type: "EXPENSE", ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.record.count({ where: { isDeleted: false, ...dateFilter } }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      totalRecords: count,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count,
      savingsRate:
        totalIncome > 0
          ? parseFloat(((netBalance / totalIncome) * 100).toFixed(2))
          : 0,
    };
  },

  /**
   * Category-wise breakdown of income and expenses.
   */
  async getCategoryBreakdown(from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const rows = await prisma.record.groupBy({
      by: ["category", "type"],
      where: { isDeleted: false, ...dateFilter },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    });

    // Reshape into a clean structure per category
    const map: Record<
      string,
      { category: string; income: number; expense: number; total: number; count: number }
    > = {};

    for (const row of rows) {
      if (!map[row.category]) {
        map[row.category] = {
          category: row.category,
          income: 0,
          expense: 0,
          total: 0,
          count: 0,
        };
      }
      const amount = Number(row._sum.amount ?? 0);
      map[row.category].count += row._count;
      if (row.type === "INCOME") {
        map[row.category].income += amount;
      } else {
        map[row.category].expense += amount;
      }
      map[row.category].total += amount;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
  },

  /**
   * Monthly income vs expense trend.
   */
  async getMonthlyTrends(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const rows = await prisma.$queryRaw<
      Array<{ month: number; type: string; total: number }>
    >(
      Prisma.sql`
        SELECT
          EXTRACT(MONTH FROM date)::int AS month,
          type,
          SUM(amount)::float AS total
        FROM records
        WHERE is_deleted = false
          AND EXTRACT(YEAR FROM date) = ${targetYear}
        GROUP BY month, type
        ORDER BY month ASC
      `
    );

    // Build full 12-month structure
    const monthMap: Record<
      number,
      { month: number; monthName: string; income: number; expense: number; net: number }
    > = {};

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];

    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { month: m, monthName: monthNames[m - 1], income: 0, expense: 0, net: 0 };
    }

    for (const row of rows) {
      if (row.type === "INCOME") {
        monthMap[row.month].income = Number(row.total);
      } else {
        monthMap[row.month].expense = Number(row.total);
      }
    }

    for (const m of Object.values(monthMap)) {
      m.net = m.income - m.expense;
    }

    return Object.values(monthMap);
  },

  /**
   * Last N transactions for recent activity feed.
   */
  async getRecentTransactions(limit: number = 10) {
    return prisma.record.findMany({
      where: { isDeleted: false },
      take: limit,
      orderBy: { date: "desc" },
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        description: true,
        user: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Analyst-level insights: top category, highest expense, income-expense ratio.
   */
  async getInsights(from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const [topExpenseCategory, biggestExpense, biggestIncome, monthlyTrend] =
      await Promise.all([
        // Top spending category
        prisma.record.groupBy({
          by: ["category"],
          where: { isDeleted: false, type: "EXPENSE", ...dateFilter },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 1,
        }),
        // Single largest expense
        prisma.record.findFirst({
          where: { isDeleted: false, type: "EXPENSE", ...dateFilter },
          orderBy: { amount: "desc" },
          select: { id: true, amount: true, category: true, date: true, description: true },
        }),
        // Single largest income
        prisma.record.findFirst({
          where: { isDeleted: false, type: "INCOME", ...dateFilter },
          orderBy: { amount: "desc" },
          select: { id: true, amount: true, category: true, date: true, description: true },
        }),
        // Average monthly spending
        prisma.$queryRaw<Array<{ month: number; expense: number }>>(
          Prisma.sql`
            SELECT
              EXTRACT(MONTH FROM date)::int AS month,
              SUM(amount)::float AS expense
            FROM records
            WHERE is_deleted = false AND type = 'EXPENSE'
            GROUP BY month
          `
        ),
      ]);

    const avgMonthlyExpense =
      monthlyTrend.length > 0
        ? monthlyTrend.reduce((sum, r) => sum + Number(r.expense), 0) / monthlyTrend.length
        : 0;

    return {
      topExpenseCategory: topExpenseCategory[0]
        ? {
            category: topExpenseCategory[0].category,
            total: Number(topExpenseCategory[0]._sum.amount ?? 0),
          }
        : null,
      biggestExpense: biggestExpense
        ? { ...biggestExpense, amount: Number(biggestExpense.amount) }
        : null,
      biggestIncome: biggestIncome
        ? { ...biggestIncome, amount: Number(biggestIncome.amount) }
        : null,
      avgMonthlyExpense: parseFloat(avgMonthlyExpense.toFixed(2)),
    };
  },

  /**
   * Audit log listing for admin.
   */
  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      data: logs,
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
};
