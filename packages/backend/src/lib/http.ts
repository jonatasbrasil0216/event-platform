import type { Response } from "express";
import { AppError } from "./errors";

export const sendJson = <T>(res: Response, status: number, body: T): void => {
  res.status(status).json(body);
};

export const sendError = (res: Response, error: unknown): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Internal server error"
    }
  });
};
