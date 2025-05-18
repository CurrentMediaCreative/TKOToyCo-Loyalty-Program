/**
 * Models index file
 *
 * Exports all Sequelize models for the application
 */

import { BaseModel } from "./base.model";
import { Customer } from "./customer.model";
import { Tier } from "./tier.model";
import { TierBenefit } from "./tierBenefit.model";
import { Transaction } from "./transaction.model";
import { TransactionItem } from "./transactionItem.model";
import { Reward } from "./reward.model";
import { CustomerReward } from "./customerReward.model";
import { MembershipCard } from "./membershipCard.model";

// Initialize models with database connection
import sequelize from "../config/database";

// Register models with Sequelize
const models = [
  BaseModel,
  Customer,
  Tier,
  TierBenefit,
  Transaction,
  TransactionItem,
  Reward,
  CustomerReward,
  MembershipCard,
];

sequelize.addModels(models);

// Export models
export {
  BaseModel,
  Customer,
  Tier,
  TierBenefit,
  Transaction,
  TransactionItem,
  Reward,
  CustomerReward,
  MembershipCard,
};

export default sequelize;
