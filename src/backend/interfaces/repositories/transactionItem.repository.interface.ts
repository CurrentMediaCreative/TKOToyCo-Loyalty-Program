/**
 * Transaction Item repository interface
 *
 * Defines operations specific to transaction item entities
 */

import { TransactionItem } from "../models/transactionItem.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ITransactionItemRepository
  extends IBaseRepository<TransactionItem> {
  /**
   * Find items by transaction ID
   * @param transactionId Transaction ID
   * @returns Promise resolving to array of transaction items
   */
  findByTransactionId(transactionId: string): Promise<TransactionItem[]>;

  /**
   * Find items by product ID
   * @param productId Product ID
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  findByProductId(productId: string, options?: any): Promise<TransactionItem[]>;

  /**
   * Find items by product name (partial match)
   * @param productName Product name or partial name
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  findByProductName(
    productName: string,
    options?: any
  ): Promise<TransactionItem[]>;

  /**
   * Calculate total quantity sold for a product
   * @param productId Product ID
   * @returns Promise resolving to total quantity
   */
  calculateTotalQuantitySold(productId: string): Promise<number>;

  /**
   * Calculate total revenue for a product
   * @param productId Product ID
   * @returns Promise resolving to total revenue
   */
  calculateTotalRevenue(productId: string): Promise<number>;

  /**
   * Find top selling products
   * @param limit Number of products to return
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items with product info
   */
  findTopSellingProducts(limit: number, options?: any): Promise<any[]>;
}
