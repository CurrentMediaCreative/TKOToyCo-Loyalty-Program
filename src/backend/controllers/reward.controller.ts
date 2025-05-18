/**
 * Reward controller implementation
 *
 * Handles reward-related API endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { IRewardController } from "../interfaces/controllers/reward.controller.interface";
import { IRewardRepository } from "../interfaces/repositories/reward.repository.interface";
import { ICustomerRewardRepository } from "../interfaces/repositories/customerReward.repository.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { BaseController } from "./base.controller";
import { Reward, RewardType } from "../interfaces/models/reward.interface";
import { CreateCustomerRewardDto } from "../interfaces/models/customerReward.interface";
import { ValidationError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class RewardController
  extends BaseController<Reward>
  implements IRewardController
{
  private customerRewardRepository: ICustomerRewardRepository;
  private customerRepository: ICustomerRepository;
  private tierRepository: ITierRepository;

  constructor(
    rewardRepository: IRewardRepository,
    customerRewardRepository: ICustomerRewardRepository,
    customerRepository: ICustomerRepository,
    tierRepository: ITierRepository
  ) {
    super(rewardRepository, "Reward");
    this.customerRewardRepository = customerRewardRepository;
    this.customerRepository = customerRepository;
    this.tierRepository = tierRepository;
  }

  /**
   * Get rewards by tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByTier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tierId = req.params.tierId;

      if (!tierId) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if tier exists
      const tier = await this.tierRepository.findById(tierId);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get rewards by tier
      const rewards = await (this.repository as IRewardRepository).findByTierId(
        tierId,
        {
          limit,
          offset,
        }
      );

      // Get total count
      const allRewards = await (
        this.repository as IRewardRepository
      ).findByTierId(tierId);
      const count = allRewards.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: rewards,
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
   * Get rewards by category
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const category = req.params.category;

      if (!category) {
        throw new ValidationError("Category is required");
      }

      // Validate category is a valid reward type
      if (!Object.values(RewardType).includes(category as RewardType)) {
        throw new ValidationError("Invalid reward category");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get rewards by type
      const rewards = await (
        this.repository as IRewardRepository
      ).findByRewardType(category, {
        limit,
        offset,
      });

      // Get total count
      const allRewards = await (
        this.repository as IRewardRepository
      ).findByRewardType(category);
      const count = allRewards.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: rewards,
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
   * Get rewards by status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = req.params.status;

      if (!status) {
        throw new ValidationError("Status is required");
      }

      // Validate status
      if (!["active", "inactive"].includes(status)) {
        throw new ValidationError("Invalid status. Use 'active' or 'inactive'");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get rewards by status
      let rewards: Reward[] = [];
      let count = 0;

      if (status === "active") {
        rewards = await (this.repository as IRewardRepository).findAllActive({
          limit,
          offset,
        });
        const allRewards = await (
          this.repository as IRewardRepository
        ).findAllActive();
        count = allRewards.length;
      } else {
        // For inactive, we need to get all and filter
        const allRewards = await this.repository.findAll();
        const inactiveRewards = allRewards.filter(
          (reward) => !reward.is_active
        );
        count = inactiveRewards.length;
        rewards = inactiveRewards.slice(offset, offset + limit);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: rewards,
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
   * Get customer rewards
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getCustomerRewards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.params.customerId;

      if (!customerId) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customerId);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get customer rewards
      const customerRewards =
        await this.customerRewardRepository.findByCustomerId(customerId, {
          limit,
          offset,
        });

      // Get total count
      const allCustomerRewards =
        await this.customerRewardRepository.findByCustomerId(customerId);
      const count = allCustomerRewards.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: customerRewards,
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
   * Issue reward to customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async issueReward(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customer_id, reward_id, expiry_date } = req.body;

      if (!customer_id) {
        throw new ValidationError("Customer ID is required");
      }

      if (!reward_id) {
        throw new ValidationError("Reward ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customer_id);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Check if reward exists
      const reward = await this.repository.findById(reward_id);

      if (!reward) {
        throw new NotFoundError("Reward not found");
      }

      // Check if reward is active
      if (!reward.is_active) {
        throw new ValidationError("Cannot issue inactive reward");
      }

      // Create customer reward
      const customerReward = await this.customerRewardRepository.create({
        customer_id,
        reward_id,
        issued_date: new Date(),
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        is_redeemed: false,
      } as CreateCustomerRewardDto);

      res.status(201).json({
        status: "success",
        data: customerReward,
        message: "Reward issued successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redeem reward
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async redeemReward(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer reward ID is required");
      }

      // Check if customer reward exists
      const customerReward = await this.customerRewardRepository.findById(id);

      if (!customerReward) {
        throw new NotFoundError("Customer reward not found");
      }

      // Check if already redeemed
      if (customerReward.is_redeemed) {
        throw new ValidationError("Reward has already been redeemed");
      }

      // Check if expired
      if (
        customerReward.expiry_date &&
        new Date(customerReward.expiry_date) < new Date()
      ) {
        throw new ValidationError("Reward has expired");
      }

      // Mark as redeemed
      const updatedCustomerReward =
        await this.customerRewardRepository.markAsRedeemed(id);

      res.status(200).json({
        status: "success",
        data: updatedCustomerReward,
        message: "Reward redeemed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel reward
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async cancelReward(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer reward ID is required");
      }

      // Check if customer reward exists
      const customerReward = await this.customerRewardRepository.findById(id);

      if (!customerReward) {
        throw new NotFoundError("Customer reward not found");
      }

      // Check if already redeemed
      if (customerReward.is_redeemed) {
        throw new ValidationError("Cannot cancel a redeemed reward");
      }

      // Delete the customer reward
      await this.customerRewardRepository.delete(id);

      res.status(200).json({
        status: "success",
        message: "Reward cancelled successfully",
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

    const { name, reward_type, reward_value, tier_id } = data;

    if (!name) {
      throw new ValidationError("Name is required");
    }

    if (!reward_type) {
      throw new ValidationError("Reward type is required");
    }

    if (!Object.values(RewardType).includes(reward_type)) {
      throw new ValidationError("Invalid reward type");
    }

    if (!reward_value) {
      throw new ValidationError("Reward value is required");
    }

    if (!tier_id) {
      throw new ValidationError("Tier ID is required");
    }
  }

  /**
   * Validate update data
   * @param data Data to validate
   */
  protected validateUpdate(data: any): void {
    super.validateUpdate(data);

    const { reward_type } = data;

    if (reward_type && !Object.values(RewardType).includes(reward_type)) {
      throw new ValidationError("Invalid reward type");
    }
  }
}
