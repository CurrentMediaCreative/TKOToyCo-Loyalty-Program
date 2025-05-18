/**
 * Transaction repository implementation
 *
 * Implements operations specific to transaction entities
 */

import { Op, fn, col } from "sequelize";
import { Transaction as TransactionModel } from "../models/transaction.model";
import {
  Transaction,
  TransactionStatus,
} from "../interfaces/models/transaction.interface";
import { ITransactionRepository } from "../interfaces/repositories/transaction.repository.interface";
import { BaseRepository } from "./base.repository";

export class TransactionRepository
  extends BaseRepository<TransactionModel, Transaction>
  implements ITransactionRepository
{
  constructor() {
    super(TransactionModel);
  }

  /**
   * Find transactions by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  async findByCustomerId(
    customerId: string,
    options?: any
  ): Promise<Transaction[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
      },
    };

    const transactions = await this.model.findAll(queryOptions);
    return transactions.map(
      (transaction) => transaction.toJSON() as Transaction
    );
  }

  /**
   * Find transactions by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<Transaction[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        transaction_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const transactions = await this.model.findAll(queryOptions);
    return transactions.map(
      (transaction) => transaction.toJSON() as Transaction
    );
  }

  /**
   * Find transactions by source
   * @param source Transaction source (e.g., 'shopify', 'pos_binder')
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  async findBySource(source: string, options?: any): Promise<Transaction[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        source,
      },
    };

    const transactions = await this.model.findAll(queryOptions);
    return transactions.map(
      (transaction) => transaction.toJSON() as Transaction
    );
  }

  /**
   * Find transactions by reference ID
   * @param referenceId External reference ID
   * @returns Promise resolving to transaction or null if not found
   */
  async findByReferenceId(referenceId: string): Promise<Transaction | null> {
    const transaction = await this.model.findOne({
      where: { reference_id: referenceId },
    });
    return transaction ? (transaction.toJSON() as Transaction) : null;
  }

  /**
   * Find transactions by status
   * @param status Transaction status
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  async findByStatus(
    status: TransactionStatus,
    options?: any
  ): Promise<Transaction[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        status,
      },
    };

    const transactions = await this.model.findAll(queryOptions);
    return transactions.map(
      (transaction) => transaction.toJSON() as Transaction
    );
  }

  /**
   * Calculate total spend for a customer
   * @param customerId Customer ID
   * @returns Promise resolving to total spend amount
   */
  async calculateTotalSpend(customerId: string): Promise<number> {
    const result = (await this.model.findOne({
      attributes: [[fn("SUM", col("amount")), "total_amount"]],
      where: {
        customer_id: customerId,
        status: TransactionStatus.COMPLETED, // Only count completed transactions
      },
      raw: true,
    })) as { total_amount: string } | null;

    // Calculate total spend amount from completed transactions
    return result ? Number(result.total_amount) || 0 : 0;
  }

  /**
   * Update transaction status
   * @param id Transaction ID
   * @param status New status
   * @returns Promise resolving to updated transaction or null if not found
   */
  async updateStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction | null> {
    const transaction = await this.model.findByPk(id);
    if (!transaction) {
      return null;
    }

    transaction.status = status;
    await transaction.save();

    return transaction.toJSON() as Transaction;
  }
}
