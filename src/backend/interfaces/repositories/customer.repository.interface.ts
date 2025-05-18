/**
 * Customer repository interface
 *
 * Defines operations specific to customer entities
 */

import { Customer } from "../models/customer.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ICustomerRepository extends IBaseRepository<Customer> {
  /**
   * Find customer by email
   * @param email Customer email
   * @returns Promise resolving to customer or null if not found
   */
  findByEmail(email: string): Promise<Customer | null>;

  /**
   * Find customer by phone number
   * @param phone Customer phone number
   * @returns Promise resolving to customer or null if not found
   */
  findByPhone(phone: string): Promise<Customer | null>;

  /**
   * Update customer's total spend
   * @param id Customer ID
   * @param amount Amount to add to total spend
   * @returns Promise resolving to updated customer or null if not found
   */
  updateTotalSpend(id: string, amount: number): Promise<Customer | null>;

  /**
   * Update customer's tier
   * @param id Customer ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated customer or null if not found
   */
  updateTier(id: string, tierId: string): Promise<Customer | null>;

  /**
   * Find customers by tier
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of customers
   */
  findByTier(tierId: string, options?: any): Promise<Customer[]>;

  /**
   * Find customers with total spend greater than specified amount
   * @param amount Minimum total spend
   * @param options Optional query options
   * @returns Promise resolving to array of customers
   */
  findByMinSpend(amount: number, options?: any): Promise<Customer[]>;
}
