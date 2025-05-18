/**
 * Transaction Item service implementation
 *
 * Implements adapter for external transaction item data sources
 */

import axios from "axios";
import { ITransactionItemService } from "../../interfaces/services/transactionItem.service.interface";
import { TransactionItemDto } from "../../interfaces/models/transaction.interface";

export class TransactionItemService implements ITransactionItemService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor() {
    // These would typically come from environment variables
    this.apiBaseUrl =
      process.env.UNIFIED_API_BASE_URL || "https://api.tkotoyco.com";
    this.apiKey = process.env.UNIFIED_API_KEY || "";
  }

  /**
   * Find transaction items by transaction ID
   * @param transactionId Transaction ID
   * @returns Promise resolving to array of transaction items
   */
  async findByTransactionId(
    transactionId: string
  ): Promise<TransactionItemDto[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/transactions/${transactionId}/items`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );

      return response.data.map((item: any) => this.mapToTransactionItem(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Find transaction items by product ID
   * @param productId Product ID
   * @returns Promise resolving to array of transaction items
   */
  async findByProductId(productId: string): Promise<TransactionItemDto[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/products/${productId}/transaction-items`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );

      return response.data.map((item: any) => this.mapToTransactionItem(item));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get popular products based on transaction items
   * @param limit Number of products to return
   * @param startDate Optional start date for time period
   * @param endDate Optional end date for time period
   * @returns Promise resolving to array of products with quantity sold
   */
  async getPopularProducts(
    limit: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{ product_id: string; product_name: string; quantity: number }>
  > {
    try {
      const params: any = { limit };

      if (startDate) {
        params.start_date = startDate.toISOString();
      }

      if (endDate) {
        params.end_date = endDate.toISOString();
      }

      const response = await axios.get(
        `${this.apiBaseUrl}/analytics/popular-products`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Map external API response to TransactionItemDto
   * @param data API response data
   * @returns TransactionItemDto object
   */
  private mapToTransactionItem(data: any): TransactionItemDto {
    return {
      product_id: data.product_id,
      product_name: data.product_name,
      price: data.price,
      quantity: data.quantity,
      total: data.total,
    };
  }
}
