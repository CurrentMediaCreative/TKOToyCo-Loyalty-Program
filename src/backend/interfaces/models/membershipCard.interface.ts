/**
 * MembershipCard model interface
 *
 * Represents a physical membership card for a customer
 */

import { BaseModel } from "./base.interface";

export interface MembershipCard extends BaseModel {
  customer_id: string; // UUID reference to Customer
  card_number: string;
  nfc_id: string | null;
  activation_date: Date | null;
  is_active: boolean;
  tier_id: string; // UUID reference to Tier
}

// DTO interfaces for API requests and responses

export interface CreateMembershipCardDto {
  customer_id: string;
  card_number: string;
  nfc_id?: string;
  activation_date?: Date;
  is_active?: boolean; // Default to false
  tier_id: string;
}

export interface UpdateMembershipCardDto {
  nfc_id?: string;
  activation_date?: Date;
  is_active?: boolean;
  tier_id?: string;
}

export interface MembershipCardResponseDto extends MembershipCard {
  customer_name?: string;
  tier_name?: string;
}

// Additional interfaces for card management

export interface ActivateCardDto {
  card_number: string;
  customer_id: string;
}

export interface DeactivateCardDto {
  card_number: string;
  reason?: string;
}

export interface ReplaceCardDto {
  old_card_number: string;
  new_card_number: string;
  new_nfc_id?: string;
  reason?: string;
}

export interface CardActivityLogDto {
  card_id: string;
  activity_type: CardActivityType;
  timestamp: Date;
  details?: string;
  performed_by?: string;
}

export enum CardActivityType {
  CREATED = "created",
  ACTIVATED = "activated",
  DEACTIVATED = "deactivated",
  REPLACED = "replaced",
  TIER_CHANGED = "tier_changed",
  USED = "used",
}
