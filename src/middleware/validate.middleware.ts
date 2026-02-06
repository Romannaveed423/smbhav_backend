import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Middleware factory that validates request data using express-validator
 * @param validations Array of validation chains from express-validator
 * @returns Express middleware function
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return first error message
      const firstError = errors.array()[0];
      next(new ValidationError(firstError.msg || 'Validation failed'));
      return;
    }

    next();
  };
};

/**
 * Middleware to handle validation errors from express-validator
 * Should be used after validation chains
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    next(new ValidationError(firstError.msg || 'Validation failed'));
    return;
  }
  next();
};

