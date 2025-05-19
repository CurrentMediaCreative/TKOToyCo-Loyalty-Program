/**
 * Customer model for the TKO Loyalty Program
 *
 * This file defines the core data structures used throughout the application
 * for representing customers, tiers, and related entities.
 */

/**
 * Represents a tier benefit in the loyalty program
 */
export interface TierBenefit {
  id: string;
  tierId: string;
  name: string;
  description?: string;
}

/**
 * Represents a loyalty tier in the program
 */
export interface Tier {
  id: string;
  name: string;
  spendThreshold: number;
  benefits?: TierBenefit[];
}

/**
 * Represents a transaction in the loyalty program
 */
export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  total: number;
  source: string;
  sourceId?: string;
}

/**
 * Represents a customer in the loyalty program
 */
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  currentTierId?: string;
  currentTier?: Tier;
  totalSpend: number;
  isActive: boolean;
  transactions?: Transaction[];
}

/**
 * Represents a membership card in the loyalty program
 */
export interface MembershipCard {
  id: string;
  customerId: string;
  cardNumber: string;
  issuedDate: string;
  isActive: boolean;
}

/**
 * Represents a reward in the loyalty program
 */
export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointCost?: number;
  isActive: boolean;
}

/**
 * Represents a customer's earned reward
 */
export interface CustomerReward {
  id: string;
  customerId: string;
  rewardId: string;
  dateEarned: string;
  dateRedeemed?: string;
  isRedeemed: boolean;
}

/**
 * Represents tier progress for a customer
 */
export interface TierProgress {
  currentTier: Tier;
  nextTier?: Tier;
  currentSpend: number;
  nextTierThreshold?: number;
  spendToNextTier?: number;
  percentToNextTier?: number;
}
