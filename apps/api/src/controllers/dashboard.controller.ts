import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const DashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await DashboardService.getSummary(from, to);
      sendSuccess(res, data, "Summary fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await DashboardService.getCategoryBreakdown(from, to);
      sendSuccess(res, data, "Category breakdown fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await DashboardService.getMonthlyTrends(year);
      sendSuccess(res, data, "Monthly trends fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const data = await DashboardService.getRecentTransactions(limit);
      sendSuccess(res, data, "Recent transactions fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await DashboardService.getInsights(from, to);
      sendSuccess(res, data, "Insights fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "50");
      const data = await DashboardService.getAuditLogs(page, limit);
      sendSuccess(res, data, "Audit logs fetched.");
    } catch (error) {
      next(error);
    }
  },
};
