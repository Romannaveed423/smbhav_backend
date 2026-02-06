export class AppError extends Error {
  statusCode: number;
  code?: string;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  errors?: Array<{ field: string; message: string }>
): AppError => {
  return new AppError(message, statusCode, code, errors);
};

