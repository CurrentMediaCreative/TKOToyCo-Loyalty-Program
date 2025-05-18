/**
 * Transaction Item repository implementation
 *
 * Implements operations specific to transaction item entities
 */

import { Op } from "sequelize";
import { TransactionItem as TransactionItemModel } from "../models/transactionItem.model";
import { TransactionItem } from "../interfaces/models/transactionItem.interface";
import { ITransactionItemRepository } from "../interfaces/repositories/transactionItem.repository.interface";
import { BaseRepository } from "./base.repository";

export class TransactionItemRepository
  extends BaseRepository<TransactionItemModel, TransactionItem>
  implements ITransactionItemRepository
{
  constructor() {
    super(TransactionItemModel);
  }

  /**
   * Find transaction items by transaction ID
   * @param transactionId Transaction ID
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByTransactionId(
    transactionId: string,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        transaction_id: transactionId,
      },
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Find transaction items by product ID
   * @param productId Product ID
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByProductId(
    productId: string,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        product_id: productId,
      },
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Find transaction items by product category
   * @param category Product category
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByCategory(
    category: string,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        product_category: category,
      },
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Find transaction items by price range
   * @param minPrice Minimum price
   * @param maxPrice Maximum price
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        price: {
          [Op.between]: [minPrice, maxPrice],
        },
      },
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Calculate total amount for a transaction
   * @param transactionId Transaction ID
   * @returns Promise resolving to total amount
   */
  async calculateTransactionTotal(transactionId: string): Promise<number> {
    const transactionItems = await this.findByTransactionId(transactionId);
    return transactionItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  /**
   * Find transaction items by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      include: [
        {
          model: this.model.sequelize?.models.Transaction,
          where: {
            transaction_date: {
              [Op.between]: [startDate, endDate],
            },
          },
        },
      ],
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Find transaction items by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByCustomerId(
    customerId: string,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      include: [
        {
          model: this.model.sequelize?.models.Transaction,
          where: {
            customer_id: customerId,
          },
        },
      ],
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Find items by product name (partial match)
   * @param productName Product name or partial name
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items
   */
  async findByProductName(
    productName: string,
    options?: any
  ): Promise<TransactionItem[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        product_name: {
          [Op.iLike]: `%${productName}%`,
        },
      },
    };

    const transactionItems = await this.model.findAll(queryOptions);
    return transactionItems.map(
      (transactionItem) => transactionItem.toJSON() as TransactionItem
    );
  }

  /**
   * Calculate total quantity sold for a product
   * @param productId Product ID
   * @returns Promise resolving to total quantity
   */
  async calculateTotalQuantitySold(productId: string): Promise<number> {
    const result = await this.model.findOne({
      attributes: [
        [
          this.model.sequelize!.fn(
            "SUM",
            this.model.sequelize!.col("quantity")
          ),
          "total_quantity",
        ],
      ],
      where: {
        product_id: productId,
      },
    });

    return result
      ? parseInt(result.getDataValue("total_quantity") || "0", 10)
      : 0;
  }

  /**
   * Calculate total revenue for a product
   * @param productId Product ID
   * @returns Promise resolving to total revenue
   */
  async calculateTotalRevenue(productId: string): Promise<number> {
    const transactionItems = await this.findByProductId(productId);
    return transactionItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  /**
   * Find top selling products
   * @param limit Number of products to return
   * @param options Optional query options
   * @returns Promise resolving to array of transaction items with product info
   */
  async findTopSellingProducts(limit: number, options?: any): Promise<any[]> {
    const whereClause: any = options?.where || {};

    const result = await this.model.findAll({
      attributes: [
        "product_id",
        [
          this.model.sequelize!.fn(
            "SUM",
            this.model.sequelize!.col("quantity")
          ),
          "total_quantity",
        ],
      ],
      where: whereClause,
      group: ["product_id"],
      order: [[this.model.sequelize!.literal("total_quantity"), "DESC"]],
      limit,
    });

    return result.map((item: any) => ({
      productId: item.product_id,
      totalQuantity: parseInt(item.getDataValue("total_quantity"), 10),
    }));
  }
}
