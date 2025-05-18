/**
 * Reward controller interface
 *
 * Defines the methods that the reward controller should implement.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "./base.controller.interface";

export interface IRewardController extends IBaseController {
  /**
   * Get rewards by tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByTier(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get rewards by category
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get rewards by status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get customer rewards
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getCustomerRewards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Issue reward to customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  issueReward(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Redeem reward
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  redeemReward(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Cancel reward
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  cancelReward(req: Request, res: Response, next: NextFunction): Promise<void>;
}
