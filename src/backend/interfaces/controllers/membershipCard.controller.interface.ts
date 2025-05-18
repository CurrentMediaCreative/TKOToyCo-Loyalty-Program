/**
 * Membership Card controller interface
 *
 * Defines the methods that the membership card controller should implement.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "./base.controller.interface";

export interface IMembershipCardController extends IBaseController {
  /**
   * Get cards by customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByCustomer(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get card by number
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByNumber(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get card by status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Activate card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  activateCard(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Deactivate card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  deactivateCard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  /**
   * Replace card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  replaceCard(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Link card to customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  linkToCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
}
