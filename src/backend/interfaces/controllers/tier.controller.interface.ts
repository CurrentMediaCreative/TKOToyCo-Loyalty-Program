/**
 * Tier controller interface
 *
 * Defines the methods that the tier controller should implement.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "./base.controller.interface";

export interface ITierController extends IBaseController {
  /**
   * Get tier benefits
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getBenefits(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get tier customers
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getCustomers(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Add benefit to tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  addBenefit(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Remove benefit from tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  removeBenefit(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Update tier requirements
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  updateRequirements(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
}
