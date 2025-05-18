/**
 * Tier controller implementation
 *
 * Handles tier-related API endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { ITierController } from "../interfaces/controllers/tier.controller.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { ITierBenefitRepository } from "../interfaces/repositories/tierBenefit.repository.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { BaseController } from "./base.controller";
import { Tier, UpdateTierDto } from "../interfaces/models/tier.interface";
import {
  CreateTierBenefitDto,
  TierBenefit,
} from "../interfaces/models/tierBenefit.interface";
import { ValidationError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class TierController
  extends BaseController<Tier>
  implements ITierController
{
  private tierBenefitRepository: ITierBenefitRepository;
  private customerRepository: ICustomerRepository;

  constructor(
    tierRepository: ITierRepository,
    tierBenefitRepository: ITierBenefitRepository,
    customerRepository: ICustomerRepository
  ) {
    super(tierRepository, "Tier");
    this.tierBenefitRepository = tierBenefitRepository;
    this.customerRepository = customerRepository;
  }

  /**
   * Get tier benefits
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getBenefits(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if tier exists
      const tier = await this.repository.findById(id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Get tier benefits
      const benefits = await this.tierBenefitRepository.findByTierId(id);

      res.status(200).json({
        status: "success",
        data: benefits,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tier customers
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getCustomers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if tier exists
      const tier = await this.repository.findById(id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get customers by tier
      const customers = await this.customerRepository.findByTier(id, {
        limit,
        offset,
      });

      // Get total count
      // Since there's no direct count method, we'll get all customers and count them
      const allCustomers = await this.customerRepository.findByTier(id);
      const count = allCustomers.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: customers,
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
   * Add benefit to tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async addBenefit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const benefitData = req.body;

      if (!id) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if tier exists
      const tier = await this.repository.findById(id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Validate benefit data
      if (!benefitData.name) {
        throw new ValidationError("Benefit name is required");
      }

      if (!benefitData.benefit_type) {
        throw new ValidationError("Benefit type is required");
      }

      if (!benefitData.benefit_value) {
        throw new ValidationError("Benefit value is required");
      }

      // Create benefit
      const benefit = await this.tierBenefitRepository.create({
        ...benefitData,
        tier_id: id,
        is_active:
          benefitData.is_active !== undefined ? benefitData.is_active : true,
      } as CreateTierBenefitDto);

      res.status(201).json({
        status: "success",
        data: benefit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove benefit from tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async removeBenefit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tierId = req.params.id;
      const benefitId = req.params.benefitId;

      if (!tierId) {
        throw new ValidationError("Tier ID is required");
      }

      if (!benefitId) {
        throw new ValidationError("Benefit ID is required");
      }

      // Check if tier exists
      const tier = await this.repository.findById(tierId);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Check if benefit exists
      const benefit = await this.tierBenefitRepository.findById(benefitId);

      if (!benefit) {
        throw new NotFoundError("Benefit not found");
      }

      // Check if benefit belongs to tier
      if (benefit.tier_id !== tierId) {
        throw new ValidationError("Benefit does not belong to this tier");
      }

      // Delete benefit
      await this.tierBenefitRepository.delete(benefitId);

      res.status(200).json({
        status: "success",
        message: "Benefit removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tier requirements
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updateRequirements(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const { spend_threshold } = req.body;

      if (!id) {
        throw new ValidationError("Tier ID is required");
      }

      if (spend_threshold === undefined) {
        throw new ValidationError("Spend threshold is required");
      }

      // Check if tier exists
      const tier = await this.repository.findById(id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Update tier
      const updatedTier = await this.repository.update(id, {
        spend_threshold,
      } as UpdateTierDto);

      res.status(200).json({
        status: "success",
        data: updatedTier,
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
    super.validateCreate(data);

    const { name, spend_threshold, sort_order } = data;

    if (!name) {
      throw new ValidationError("Name is required");
    }

    if (spend_threshold === undefined) {
      throw new ValidationError("Spend threshold is required");
    }

    if (sort_order === undefined) {
      throw new ValidationError("Sort order is required");
    }
  }

  /**
   * Validate update data
   * @param data Data to validate
   */
  protected validateUpdate(data: any): void {
    super.validateUpdate(data);

    // No additional validation needed for updates
  }
}
