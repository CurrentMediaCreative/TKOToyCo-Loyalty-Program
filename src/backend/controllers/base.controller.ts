/**
 * Base controller implementation
 *
 * Provides common functionality for all controllers.
 */

import { Request, Response, NextFunction } from "express";
import { IBaseController } from "../interfaces/controllers/base.controller.interface";
import { IBaseRepository } from "../interfaces/repositories/base.repository.interface";
import { NotFoundError, ValidationError } from "../utils/errors";
import logger from "../utils/logger";

export abstract class BaseController<T> implements IBaseController {
  protected repository: IBaseRepository<T>;
  protected entityName: string;

  constructor(repository: IBaseRepository<T>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  /**
   * Get all resources
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get data with pagination
      const entities = await this.repository.findAll({
        limit,
        offset,
      });

      // Get total count
      const count = await this.repository.count();

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: entities,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a resource by ID
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("ID is required");
      }

      const entity = await this.repository.findById(id);

      if (!entity) {
        throw new NotFoundError(`${this.entityName} not found`);
      }

      res.status(200).json({
        status: "success",
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      // Validate data (specific validation should be implemented in child classes)
      this.validateCreate(data);

      const entity = await this.repository.create(data);

      res.status(201).json({
        status: "success",
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const data = req.body;

      if (!id) {
        throw new ValidationError("ID is required");
      }

      // Validate data (specific validation should be implemented in child classes)
      this.validateUpdate(data);

      // Check if entity exists
      const existingEntity = await this.repository.findById(id);

      if (!existingEntity) {
        throw new NotFoundError(`${this.entityName} not found`);
      }

      // Update entity
      const updatedEntity = await this.repository.update(id, data);

      res.status(200).json({
        status: "success",
        data: updatedEntity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a resource
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("ID is required");
      }

      // Check if entity exists
      const existingEntity = await this.repository.findById(id);

      if (!existingEntity) {
        throw new NotFoundError(`${this.entityName} not found`);
      }

      // Delete entity
      await this.repository.delete(id);

      res.status(200).json({
        status: "success",
        message: `${this.entityName} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate create data
   * @param data Data to validate
   */
  protected validateCreate(data: any): void {
    // Base validation - to be overridden by child classes
    if (!data) {
      throw new ValidationError("Request body is required");
    }
  }

  /**
   * Validate update data
   * @param data Data to validate
   */
  protected validateUpdate(data: any): void {
    // Base validation - to be overridden by child classes
    if (!data) {
      throw new ValidationError("Request body is required");
    }
  }
}
