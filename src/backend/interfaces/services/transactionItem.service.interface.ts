/**
 * Transaction Item service interface
 *
 * Defines methods for interacting with transaction item data from external systems
 */

import { TransactionItemDto } from "../models/transaction.interface";

export interface ITransactionItemService {
  /**
   * Find transaction items by transaction ID
   * @param transactionId Transaction ID
   * @returns Promise resolving to array of transaction items
   */
  findByTransactionId(transactionId: string): Promise<TransactionItemDto[]>;

  /**
   * Find transaction items by product ID
   * @param productId Product ID
   * @returns Promise resolving to array of transaction items
   */
  findByProductId(productId: string): Promise<TransactionItemDto[]>;

  /**
   * Get popular products based on transaction items
   * @param limit Number of products to return
   * @param startDate Optional start date for time period
   * @param endDate Optional end date for time period
   * @returns Promise resolving to array of products with quantity sold
   */
  getPopularProducts(
    limit: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{ product_id: string; product_name: string; quantity: number }>
  >;
}
