/**
 * CustomerReward model
 *
 * Represents a reward assigned to a specific customer
 */

import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BaseModel } from "./base.model";
import { Customer } from "./customer.model";
import { Reward } from "./reward.model";
import { CustomerReward as CustomerRewardInterface } from "../interfaces/models/customerReward.interface";

@Table({
  tableName: "customer_rewards",
  timestamps: true,
  underscored: true,
})
export class CustomerReward
  extends BaseModel
  implements CustomerRewardInterface
{
  @ForeignKey(() => Customer)
  @AllowNull(false)
  @Column(DataType.UUID)
  customer_id!: string;

  @ForeignKey(() => Reward)
  @AllowNull(false)
  @Column(DataType.UUID)
  reward_id!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  issued_date!: Date;

  @Column(DataType.DATE)
  expiry_date!: Date | null;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_redeemed!: boolean;

  @Column(DataType.DATE)
  redeemed_date!: Date | null;

  // Associations
  @BelongsTo(() => Customer)
  customer!: Customer;

  @BelongsTo(() => Reward)
  reward!: Reward;
}
