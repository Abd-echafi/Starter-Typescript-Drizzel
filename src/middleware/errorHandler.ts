import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
  });
};
