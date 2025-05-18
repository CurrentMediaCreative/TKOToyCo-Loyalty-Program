/**
 * Tier model interface
 *
 * Represents a loyalty tier (boxing weight class)
 */

import { BaseModel } from "./base.interface";

export interface Tier extends BaseModel {
  name: string;
  description: string | null;
  spend_threshold: number;
  card_design: string | null;
  is_active: boolean;
  sort_order: number;
}

// DTO interfaces for API requests and responses

export interface CreateTierDto {
  name: string;
  description?: string;
  spend_threshold: number;
  card_design?: string;
  is_active?: boolean;
  sort_order: number;
}

export interface UpdateTierDto {
  name?: string;
  description?: string;
  spend_threshold?: number;
  card_design?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface TierResponseDto extends Tier {
  benefits?: TierBenefitSummary[];
  customer_count?: number;
}

export interface TierBenefitSummary {
  id: string;
  name: string;
  benefit_type: string;
}
