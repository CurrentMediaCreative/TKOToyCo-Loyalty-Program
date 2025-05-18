/**
 * Transaction service implementation
 *
 * Implements adapter for external transaction data sources
 */

import axios from "axios";
import { ITransactionService } from "../../interfaces/services/transaction.service.interface";
import {
  Transaction,
  TransactionSource,
  TransactionStatus,
} from "../../interfaces/models/transaction.interface";

export class TransactionService implements ITransactionService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor() {
    // These would typically come from environment variables
    this.apiBaseUrl =
      process.env.UNIFIED_API_BASE_URL || "https://api.tkotoyco.com";
    this.apiKey = process.env.UNIFIED_API_KEY || "";
  }

  /**
   * Find transaction by ID
   * @param id Transaction ID
   * @returns Promise resolving to transaction or null if not found
   */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/transactions/${id}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );

      return this.mapToTransaction(response.data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
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
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/customers/${customerId}/transactions`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          params: options,
        }
      );

      return response.data.map((item: any) => this.mapToTransaction(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
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
    try {
      const response = await axios.get(`${this.apiBaseUrl}/transactions`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          ...options,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      });

      return response.data.map((item: any) => this.mapToTransaction(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Find transactions by source
   * @param source Transaction source (e.g., 'shopify', 'pos_binder')
   * @param options Optional query options
   * @returns Promise resolving to array of transactions
   */
  async findBySource(source: string, options?: any): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/transactions`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          ...options,
          source,
        },
      });

      return response.data.map((item: any) => this.mapToTransaction(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Find transactions by reference ID
   * @param referenceId External reference ID
   * @returns Promise resolving to transaction or null if not found
   */
  async findByReferenceId(referenceId: string): Promise<Transaction | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/transactions`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          reference_id: referenceId,
        },
      });

      if (response.data.length === 0) {
        return null;
      }

      return this.mapToTransaction(response.data[0]);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
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
    try {
      const response = await axios.get(`${this.apiBaseUrl}/transactions`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          ...options,
          status,
        },
      });

      return response.data.map((item: any) => this.mapToTransaction(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Calculate total spend for a customer
   * @param customerId Customer ID
   * @returns Promise resolving to total spend amount
   */
  async calculateTotalSpend(customerId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/customers/${customerId}/total-spend`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );

      return response.data.total_spend || 0;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Map external API response to Transaction interface
   * @param data API response data
   * @returns Transaction object
   */
  private mapToTransaction(data: any): Transaction {
    return {
      id: data.id,
      customer_id: data.customer_id,
      amount: data.amount,
      source: this.mapSource(data.source),
      reference_id: data.reference_id,
      status: this.mapStatus(data.status),
      transaction_date: new Date(data.transaction_date),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Map external source string to TransactionSource enum
   * @param source Source string from API
   * @returns TransactionSource enum value
   */
  private mapSource(source: string): TransactionSource {
    switch (source.toLowerCase()) {
      case "shopify":
        return TransactionSource.SHOPIFY;
      case "pos_binder":
      case "pos":
      case "binder":
        return TransactionSource.POS_BINDER;
      default:
        return TransactionSource.MANUAL;
    }
  }

  /**
   * Map external status string to TransactionStatus enum
   * @param status Status string from API
   * @returns TransactionStatus enum value
   */
  private mapStatus(status: string): TransactionStatus {
    switch (status.toLowerCase()) {
      case "completed":
        return TransactionStatus.COMPLETED;
      case "pending":
        return TransactionStatus.PENDING;
      case "refunded":
        return TransactionStatus.REFUNDED;
      case "partially_refunded":
        return TransactionStatus.PARTIALLY_REFUNDED;
      case "cancelled":
        return TransactionStatus.CANCELLED;
      case "failed":
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PENDING;
    }
  }
}
