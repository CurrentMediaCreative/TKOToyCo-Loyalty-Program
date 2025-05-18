/**
 * Customer controller interface
 *
 * Defines the methods that the customer controller should implement.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "./base.controller.interface";

export interface ICustomerController extends IBaseController {
  /**
   * Search customers
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  search(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get customer by email
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByEmail(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get customer by phone
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByPhone(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get customer transactions
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Get customer rewards
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getRewards(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get customer membership cards
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getMembershipCards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Update customer tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  updateTier(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Update customer points
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  updatePoints(req: Request, res: Response, next: NextFunction): Promise<void>;
}
