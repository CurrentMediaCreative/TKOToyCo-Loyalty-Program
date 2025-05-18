/**
 * Transaction controller interface
 *
 * Defines the methods that the transaction controller should implement.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "./base.controller.interface";

export interface ITransactionController extends IBaseController {
  /**
   * Get transactions by customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByCustomer(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get transactions by date range
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByDateRange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Get transactions by status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get transaction items
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getItems(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Process transaction
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  processTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Cancel transaction
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  cancelTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Get transaction summary
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
}
