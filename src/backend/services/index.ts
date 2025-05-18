/**
 * Services index
 *
 * Exports all service implementations
 */

// Adapter services
import { TransactionService } from "./adapters/transaction.service";
import { TransactionItemService } from "./adapters/transactionItem.service";
import { RewardService } from "./adapters/reward.service";
import { CustomerRewardService } from "./adapters/customerReward.service";
import { MembershipCardService } from "./adapters/membershipCard.service";

// Export service instances
export const transactionService = new TransactionService();
export const transactionItemService = new TransactionItemService();
export const rewardService = new RewardService();
export const customerRewardService = new CustomerRewardService();
export const membershipCardService = new MembershipCardService();

// Export service classes
export {
  TransactionService,
  TransactionItemService,
  RewardService,
  CustomerRewardService,
  MembershipCardService,
};
