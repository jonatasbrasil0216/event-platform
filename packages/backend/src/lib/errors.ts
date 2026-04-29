export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const validationError = (message: string, details?: unknown): AppError =>
  new AppError("VALIDATION_ERROR", message, 400, details);

export const unauthorizedError = (message = "Unauthorized"): AppError =>
  new AppError("UNAUTHORIZED", message, 401);

export const forbiddenError = (message = "Forbidden"): AppError => new AppError("FORBIDDEN", message, 403);
export const notFoundError = (message = "Not found"): AppError => new AppError("NOT_FOUND", message, 404);
export const conflictError = (message: string): AppError => new AppError("CONFLICT", message, 409);
