/**
 * Repositories index
 *
 * Exports all repository implementations
 */

// Import repositories
import { BaseRepository } from "./base.repository";
import { CustomerRepository } from "./customer.repository";
import { TierRepository } from "./tier.repository";
import { TierBenefitRepository } from "./tierBenefit.repository";
import { TransactionRepository } from "./transaction.repository";
import { TransactionItemRepository } from "./transactionItem.repository";
import { RewardRepository } from "./reward.repository";
import { CustomerRewardRepository } from "./customerReward.repository";
import { MembershipCardRepository } from "./membershipCard.repository";

// Create repository instances
const customerRepository = new CustomerRepository();
const tierRepository = new TierRepository();
const tierBenefitRepository = new TierBenefitRepository();
const transactionRepository = new TransactionRepository();
const transactionItemRepository = new TransactionItemRepository();
const rewardRepository = new RewardRepository();
const customerRewardRepository = new CustomerRewardRepository();
const membershipCardRepository = new MembershipCardRepository();

// Export repository instances
export {
  customerRepository,
  tierRepository,
  tierBenefitRepository,
  transactionRepository,
  transactionItemRepository,
  rewardRepository,
  customerRewardRepository,
  membershipCardRepository,
};

// Export repository classes
export {
  BaseRepository,
  CustomerRepository,
  TierRepository,
  TierBenefitRepository,
  TransactionRepository,
  TransactionItemRepository,
  RewardRepository,
  CustomerRewardRepository,
  MembershipCardRepository,
};
