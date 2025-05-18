/**
 * Customer model interface
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  currentTierId: string;
  currentTier: Tier;
  totalSpend: number;
  isActive: boolean;
}

/**
 * Tier model interface
 */
export interface Tier {
  id: string;
  name: string;
  spendThreshold: number | null;
  benefits: TierBenefit[];
  cardDesign?: string;
}

/**
 * Tier benefit model interface
 */
export interface TierBenefit {
  id: string;
  tierId: string;
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * Next tier progress interface
 */
export interface TierProgress {
  currentTier: Tier;
  nextTier: Tier | null;
  currentSpend: number;
  nextTierThreshold: number | null;
  progressPercentage: number;
  amountToNextTier: number | null;
  isCloseToNextTier: boolean;
}
