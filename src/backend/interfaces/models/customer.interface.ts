/**
 * Customer model interface
 *
 * Represents a loyalty program member
 */

import { BaseModel } from "./base.interface";

export interface Customer extends BaseModel {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  join_date: Date;
  tier_id: string; // UUID reference to Tier
  total_spend: number;
  is_active: boolean;
}

// DTO interfaces for API requests and responses

export interface CreateCustomerDto {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  tier_id?: string;
}

export interface UpdateCustomerDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  tier_id?: string;
  total_spend?: number;
  is_active?: boolean;
}

export interface CustomerResponseDto extends Customer {
  tier_name?: string;
  membership_card?: {
    card_number: string;
    is_active: boolean;
  };
}
