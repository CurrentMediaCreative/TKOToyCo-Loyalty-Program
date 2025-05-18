/**
 * TransactionItem model interface
 *
 * Represents a line item in a transaction
 */

import { BaseModel } from "./base.interface";

export interface TransactionItem extends BaseModel {
  transaction_id: string; // UUID reference to Transaction
  product_id: string; // External product identifier
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

// DTO interfaces for API requests and responses

export interface CreateTransactionItemDto {
  transaction_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface UpdateTransactionItemDto {
  product_name?: string;
  price?: number;
  quantity?: number;
  total?: number;
}

export interface TransactionItemResponseDto extends TransactionItem {
  transaction_reference?: string;
}

// Alias for compatibility with transaction.interface.ts
export type { CreateTransactionItemDto as TransactionItemCreateDto };
