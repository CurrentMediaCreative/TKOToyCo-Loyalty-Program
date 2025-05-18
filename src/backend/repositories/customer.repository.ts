/**
 * Customer repository implementation
 *
 * Implements operations specific to customer entities
 */

import { Op } from "sequelize";
import { Customer as CustomerModel } from "../models/customer.model";
import { Customer } from "../interfaces/models/customer.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { BaseRepository } from "./base.repository";

export class CustomerRepository
  extends BaseRepository<CustomerModel, Customer>
  implements ICustomerRepository
{
  constructor() {
    super(CustomerModel);
  }

  /**
   * Find customer by email
   * @param email Customer email
   * @returns Promise resolving to customer or null if not found
   */
  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.model.findOne({
      where: { email },
    });
    return customer ? (customer.toJSON() as Customer) : null;
  }

  /**
   * Find customer by phone number
   * @param phone Customer phone number
   * @returns Promise resolving to customer or null if not found
   */
  async findByPhone(phone: string): Promise<Customer | null> {
    const customer = await this.model.findOne({
      where: { phone },
    });
    return customer ? (customer.toJSON() as Customer) : null;
  }

  /**
   * Update customer's total spend
   * @param id Customer ID
   * @param amount Amount to add to total spend
   * @returns Promise resolving to updated customer or null if not found
   */
  async updateTotalSpend(id: string, amount: number): Promise<Customer | null> {
    const customer = await this.model.findByPk(id);
    if (!customer) {
      return null;
    }

    const currentSpend = customer.total_spend || 0;
    const newSpend = currentSpend + amount;

    customer.total_spend = newSpend;
    await customer.save();

    return customer.toJSON() as Customer;
  }

  /**
   * Update customer's tier
   * @param id Customer ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated customer or null if not found
   */
  async updateTier(id: string, tierId: string): Promise<Customer | null> {
    const customer = await this.model.findByPk(id);
    if (!customer) {
      return null;
    }

    customer.tier_id = tierId;
    await customer.save();

    return customer.toJSON() as Customer;
  }

  /**
   * Find customers by tier
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of customers
   */
  async findByTier(tierId: string, options?: any): Promise<Customer[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        tier_id: tierId,
      },
    };

    const customers = await this.model.findAll(queryOptions);
    return customers.map((customer) => customer.toJSON() as Customer);
  }

  /**
   * Find customers with total spend greater than specified amount
   * @param amount Minimum total spend
   * @param options Optional query options
   * @returns Promise resolving to array of customers
   */
  async findByMinSpend(amount: number, options?: any): Promise<Customer[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        total_spend: {
          [Op.gte]: amount,
        },
      },
    };

    const customers = await this.model.findAll(queryOptions);
    return customers.map((customer) => customer.toJSON() as Customer);
  }
}
