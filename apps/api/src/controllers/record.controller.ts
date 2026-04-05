import { Request, Response, NextFunction } from "express";
import { RecordService } from "../services/record.service";
import { sendSuccess, sendCreated } from "../utils/response";

export const RecordController = {
  async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await RecordService.createRecord(req.body, req.user!.id);
      sendCreated(res, record, "Record created successfully.");
    } catch (error) {
      next(error);
    }
  },

  async listRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RecordService.listRecords(req.query as any);
      sendSuccess(res, result, "Records fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await RecordService.getRecordById(req.params.id);
      sendSuccess(res, record, "Record fetched.");
    } catch (error) {
      next(error);
    }
  },

  async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await RecordService.updateRecord(req.params.id, req.body, req.user!.id);
      sendSuccess(res, record, "Record updated.");
    } catch (error) {
      next(error);
    }
  },

  async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await RecordService.softDeleteRecord(req.params.id, req.user!.id);
      sendSuccess(res, record, "Record deleted.");
    } catch (error) {
      next(error);
    }
  },
};
