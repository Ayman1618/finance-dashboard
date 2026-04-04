import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { sendSuccess, sendCreated } from "../utils/response";

export const UserController = {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await UserService.listUsers(page, limit);
      sendSuccess(res, result, "Users fetched.");
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);
      sendSuccess(res, user, "User fetched.");
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.createUser(req.body, req.user!.id);
      sendCreated(res, user, "User created successfully.");
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.updateUser(req.params.id, req.body, req.user!.id);
      sendSuccess(res, user, "User updated.");
    } catch (error) {
      next(error);
    }
  },

  async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.deactivateUser(req.params.id, req.user!.id);
      sendSuccess(res, user, "User deactivated.");
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await UserService.getProfile(req.user!.id);
      sendSuccess(res, profile, "Profile fetched.");
    } catch (error) {
      next(error);
    }
  },
};
