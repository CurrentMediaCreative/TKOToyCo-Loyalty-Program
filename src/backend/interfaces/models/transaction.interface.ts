/**
 * Transaction model interface
 *
 * Represents a customer purchase transaction
 */

import { BaseModel } from "./base.interface";

export interface Transaction extends BaseModel {
  customer_id: string; // UUID reference to Customer
  amount: number;
  source: TransactionSource;
  reference_id: string; // External reference ID from source system
  status: TransactionStatus;
  transaction_date: Date;
}

// Enum for transaction sources
export enum TransactionSource {
  SHOPIFY = "shopify",
  POS_BINDER = "pos_binder",
  MANUAL = "manual",
}

// Enum for transaction statuses
export enum TransactionStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

// DTO interfaces for API requests and responses

export interface CreateTransactionDto {
  customer_id: string;
  amount: number;
  source: TransactionSource;
  reference_id: string;
  status: TransactionStatus;
  transaction_date: Date;
  items?: TransactionItemDto[];
}

export interface UpdateTransactionDto {
  status?: TransactionStatus;
  amount?: number;
}

export interface TransactionResponseDto extends Transaction {
  customer_name?: string;
  items?: TransactionWithItemsResponseDto["items"];
}

// Related interfaces for transaction items
export interface TransactionItemDto {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface TransactionWithItemsResponseDto extends Transaction {
  customer_name?: string;
  items?: {
    id: string;
    transaction_id: string;
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
    created_at: Date;
    updated_at: Date;
  }[];
}
