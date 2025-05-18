/**
 * Transaction service interface
 *
 * Defines methods for interacting with transaction data from external systems
 */

import {
  Transaction,
  TransactionStatus,
} from "../models/transaction.interface";

export interface ITransactionService {
  /**
   * Find transaction by ID
   * @param id Transaction ID
   * @returns Promise resolving to transaction or null if not found
   */
  findById(id: string): Promise<Transaction | null>;

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
  findByStatus(
    status: TransactionStatus,
    options?: any
  ): Promise<Transaction[]>;

  /**
   * Calculate total spend for a customer
   * @param customerId Customer ID
   * @returns Promise resolving to total spend amount
   */
  calculateTotalSpend(customerId: string): Promise<number>;
}
