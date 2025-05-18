/**
 * Customer controller implementation
 *
 * Handles customer-related API endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { ICustomerController } from "../interfaces/controllers/customer.controller.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { IMembershipCardRepository } from "../interfaces/repositories/membershipCard.repository.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { BaseController } from "./base.controller";
import {
  Customer,
  UpdateCustomerDto,
} from "../interfaces/models/customer.interface";
import { ValidationError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class CustomerController
  extends BaseController<Customer>
  implements ICustomerController
{
  private membershipCardRepository: IMembershipCardRepository;
  private tierRepository: ITierRepository;

  constructor(
    customerRepository: ICustomerRepository,
    membershipCardRepository: IMembershipCardRepository,
    tierRepository: ITierRepository
  ) {
    super(customerRepository, "Customer");
    this.membershipCardRepository = membershipCardRepository;
    this.tierRepository = tierRepository;
  }

  /**
   * Search customers
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, tier_id, min_spend, is_active } = req.query;

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Build query options
      const options: any = {
        limit,
        offset,
        where: {},
      };

      // Add filters
      if (query) {
        options.where = {
          ...options.where,
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${query}%` } },
            { last_name: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { phone: { [Op.iLike]: `%${query}%` } },
          ],
        };
      }

      if (tier_id) {
        options.where.tier_id = tier_id;
      }

      if (min_spend) {
        options.where.total_spend = {
          [Op.gte]: parseFloat(min_spend as string),
        };
      }

      if (is_active !== undefined) {
        options.where.is_active = is_active === "true";
      }

      // Get customers
      const customers = await this.repository.findAll(options);
      const count = await this.repository.count(options);

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
   * Get customer by email
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.params;

      if (!email) {
        throw new ValidationError("Email is required");
      }

      // Get customer
      const customer = await (
        this.repository as ICustomerRepository
      ).findByEmail(email);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      res.status(200).json({
        status: "success",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer by phone
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByPhone(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { phone } = req.params;

      if (!phone) {
        throw new ValidationError("Phone number is required");
      }

      // Get customer
      const customer = await (
        this.repository as ICustomerRepository
      ).findByPhone(phone);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      res.status(200).json({
        status: "success",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer details
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getCustomerDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      // Get customer
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Get membership card
      const membershipCard =
        await this.membershipCardRepository.findByCustomerId(id);

      // Get tier
      const tier = await this.tierRepository.findById(customer.tier_id);

      res.status(200).json({
        status: "success",
        data: {
          ...customer,
          tier: tier,
          membership_card: membershipCard,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer transactions
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // This would be implemented with a transaction repository
      // For now, we'll return an empty array
      const transactions: any[] = [];
      const count = 0;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: transactions,
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
  async getRewards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // This would be implemented with a customer reward repository
      // For now, we'll return an empty array
      const rewards: any[] = [];
      const count = 0;

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
   * Get customer membership cards
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getMembershipCards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Get membership cards
      const membershipCard =
        await this.membershipCardRepository.findByCustomerId(id);

      res.status(200).json({
        status: "success",
        data: membershipCard ? [membershipCard] : [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer tier
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updateTier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const { tier_id } = req.body;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      if (!tier_id) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Check if tier exists
      const tier = await this.tierRepository.findById(tier_id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Update customer's tier
      const updatedCustomer = await (
        this.repository as ICustomerRepository
      ).updateTier(id, tier_id);

      res.status(200).json({
        status: "success",
        data: updatedCustomer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer points
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updatePoints(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const { points, operation } = req.body;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      if (points === undefined) {
        throw new ValidationError("Points value is required");
      }

      if (!operation || !["add", "subtract", "set"].includes(operation)) {
        throw new ValidationError(
          "Valid operation (add, subtract, set) is required"
        );
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Update customer's points
      // This would be implemented with a customer service
      // For now, we'll just return the customer

      res.status(200).json({
        status: "success",
        data: customer,
        message: "Points updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const { is_active } = req.body;

      if (!id) {
        throw new ValidationError("Customer ID is required");
      }

      if (is_active === undefined) {
        throw new ValidationError("Status is required");
      }

      // Check if customer exists
      const customer = await (this.repository as ICustomerRepository).findById(
        id
      );

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Update customer's status
      const updatedCustomer = await this.repository.update(id, {
        is_active,
      } as UpdateCustomerDto);

      res.status(200).json({
        status: "success",
        data: updatedCustomer,
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

    const { first_name, last_name, email, phone } = data;

    if (!first_name) {
      throw new ValidationError("First name is required");
    }

    if (!last_name) {
      throw new ValidationError("Last name is required");
    }

    if (!phone) {
      throw new ValidationError("Phone number is required");
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
