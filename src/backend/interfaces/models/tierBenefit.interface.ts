/**
 * TierBenefit model interface
 *
 * Represents a benefit associated with a loyalty tier
 */

import { BaseModel } from "./base.interface";

export interface TierBenefit extends BaseModel {
  tier_id: string; // UUID reference to Tier
  name: string;
  description: string | null;
  benefit_type: BenefitType;
  benefit_value: any; // JSON/JSONB field with structure depending on benefit_type
  is_active: boolean;
}

// Enum for benefit types
export enum BenefitType {
  DISCOUNT_PERCENTAGE = "discount_percentage",
  DISCOUNT_FIXED = "discount_fixed",
  FREE_SHIPPING = "free_shipping",
  FREE_PRODUCT = "free_product",
  EARLY_ACCESS = "early_access",
  EXCLUSIVE_EVENT = "exclusive_event",
  CUSTOM = "custom",
}

// Type definitions for different benefit value structures
export interface DiscountPercentageBenefitValue {
  percentage: number;
  max_discount?: number;
  min_purchase?: number;
  product_categories?: string[];
}

export interface DiscountFixedBenefitValue {
  amount: number;
  min_purchase?: number;
  product_categories?: string[];
}

export interface FreeShippingBenefitValue {
  min_purchase?: number;
  max_weight?: number;
  shipping_methods?: string[];
}

export interface FreeProductBenefitValue {
  product_id: string;
  product_name: string;
  quantity: number;
  min_purchase?: number;
}

export interface EarlyAccessBenefitValue {
  days_early: number;
  product_categories?: string[];
}

export interface ExclusiveEventBenefitValue {
  event_name: string;
  event_date?: Date;
  location?: string;
  description?: string;
}

// DTO interfaces for API requests and responses

export interface CreateTierBenefitDto {
  tier_id: string;
  name: string;
  description?: string;
  benefit_type: BenefitType;
  benefit_value: any;
  is_active?: boolean;
}

export interface UpdateTierBenefitDto {
  name?: string;
  description?: string;
  benefit_type?: BenefitType;
  benefit_value?: any;
  is_active?: boolean;
}

export interface TierBenefitResponseDto extends TierBenefit {
  tier_name?: string;
}
