/**
 * CustomerReward model interface
 *
 * Represents a reward assigned to a specific customer
 */

import { BaseModel } from "./base.interface";

export interface CustomerReward extends BaseModel {
  customer_id: string; // UUID reference to Customer
  reward_id: string; // UUID reference to Reward
  issued_date: Date;
  expiry_date: Date | null;
  is_redeemed: boolean;
  redeemed_date: Date | null;
}

// DTO interfaces for API requests and responses

export interface CreateCustomerRewardDto {
  customer_id: string;
  reward_id: string;
  issued_date?: Date; // Default to current date if not provided
  expiry_date?: Date;
  is_redeemed?: boolean; // Default to false
}

export interface UpdateCustomerRewardDto {
  is_redeemed?: boolean;
  redeemed_date?: Date;
  expiry_date?: Date;
}

export interface CustomerRewardResponseDto extends CustomerReward {
  customer_name?: string;
  reward_name?: string;
  reward_type?: string;
  reward_description?: string;
  tier_name?: string;
}

// Additional interfaces for reward management

export interface RedeemRewardDto {
  customer_reward_id: string;
  transaction_id?: string; // Optional reference to a transaction
  notes?: string;
}

export interface RewardRedemptionResponseDto {
  id: string;
  customer_reward_id: string;
  customer_name: string;
  reward_name: string;
  redeemed_date: Date;
  transaction_id?: string;
  transaction_reference?: string;
  notes?: string;
}
