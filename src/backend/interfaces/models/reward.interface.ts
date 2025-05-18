/**
 * Reward model interface
 *
 * Represents a reward that can be assigned to customers
 */

import { BaseModel } from "./base.interface";

export interface Reward extends BaseModel {
  name: string;
  description: string | null;
  reward_type: RewardType;
  reward_value: any; // JSON/JSONB field with structure depending on reward_type
  tier_id: string; // UUID reference to Tier (minimum tier required)
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
}

// Enum for reward types
export enum RewardType {
  DISCOUNT_CODE = "discount_code",
  FREE_PRODUCT = "free_product",
  STORE_CREDIT = "store_credit",
  GIFT_CARD = "gift_card",
  EXCLUSIVE_ITEM = "exclusive_item",
  CUSTOM = "custom",
}

// Type definitions for different reward value structures
export interface DiscountCodeRewardValue {
  code: string;
  percentage?: number;
  fixed_amount?: number;
  min_purchase?: number;
  max_uses?: number;
  product_categories?: string[];
}

export interface FreeProductRewardValue {
  product_id: string;
  product_name: string;
  quantity: number;
  min_purchase?: number;
}

export interface StoreCreditRewardValue {
  amount: number;
  expiry_days?: number;
}

export interface GiftCardRewardValue {
  amount: number;
  expiry_days?: number;
  is_physical: boolean;
}

export interface ExclusiveItemRewardValue {
  product_id: string;
  product_name: string;
  description: string;
  retail_value: number;
}

// DTO interfaces for API requests and responses

export interface CreateRewardDto {
  name: string;
  description?: string;
  reward_type: RewardType;
  reward_value: any;
  tier_id: string;
  is_active?: boolean;
  start_date?: Date;
  end_date?: Date;
}

export interface UpdateRewardDto {
  name?: string;
  description?: string;
  reward_type?: RewardType;
  reward_value?: any;
  tier_id?: string;
  is_active?: boolean;
  start_date?: Date;
  end_date?: Date;
}

export interface RewardResponseDto extends Reward {
  tier_name?: string;
  customer_count?: number;
  redemption_count?: number;
}
