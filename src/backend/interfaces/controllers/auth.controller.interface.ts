/**
 * Auth controller interface
 *
 * Defines the methods that the auth controller should implement.
 */

import { Request, Response, NextFunction } from "express";

export interface IAuthController {
  /**
   * Register a new user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  register(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Login user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  login(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Logout user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Refresh token
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get current user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Change password
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Request password reset
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Reset password
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
