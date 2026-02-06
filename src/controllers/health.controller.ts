import { Request, Response } from 'express';

/**
 * Health check controller
 * Returns simple "ok" status
 */
export const healthCheck = (_moduleName: string) => {
  return (_req: Request, res: Response): void => {
    res.json({

      status: 'ok',
      module: _moduleName,
      timestamp: new Date().toISOString(),
    });
  };
};

