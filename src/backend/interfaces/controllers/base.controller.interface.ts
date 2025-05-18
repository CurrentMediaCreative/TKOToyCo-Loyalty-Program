/**
 * Base controller interface
 *
 * Defines the common methods that all controllers should implement.
 */

import { Request, Response, NextFunction } from "express";

export interface IBaseController {
  /**
   * Get all resources
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getAll(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Get a resource by ID
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  getById(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Create a new resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  create(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Update a resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  update(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Delete a resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
