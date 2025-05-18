/**
 * Transaction repository interface
 *
 * Defines operations specific to transaction entities
 */

import { Transaction } from "../models/transaction.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  /**
   * Find transactions by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  findByCustomerId(customerId: string, options?: any): Promise<Transaction[]>;

  /**
   * Find transactions by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<Transaction[]>;

  /**
   * Find transactions by source
   * @param source Transaction source (e.g., 'shopify', 'pos_binder')
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  findBySource(source: string, options?: any): Promise<Transaction[]>;

  /**
   * Find transactions by reference ID
   * @param referenceId External reference ID
   * @returns Promise resolving to transaction or null if not found
   */
  findByReferenceId(referenceId: string): Promise<Transaction | null>;

  /**
   * Find transactions by status
   * @param status Transaction status
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  findByStatus(status: string, options?: any): Promise<Transaction[]>;

  /**
   * Calculate total spend for a customer
   * @param customerId Customer ID
   * @returns Promise resolving to total spend amount
   */
  calculateTotalSpend(customerId: string): Promise<number>;

  /**
   * Update transaction status
   * @param id Transaction ID
   * @param status New status
   * @returns Promise resolving to updated transaction or null if not found
   */
  updateStatus(id: string, status: string): Promise<Transaction | null>;
}
