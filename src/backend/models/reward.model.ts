/**
 * Reward model
 *
 * Represents a reward that can be assigned to customers
 */

import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { BaseModel } from "./base.model";
import { Tier } from "./tier.model";
import { CustomerReward } from "./customerReward.model";
import {
  Reward as RewardInterface,
  RewardType,
} from "../interfaces/models/reward.interface";

@Table({
  tableName: "rewards",
  timestamps: true,
  underscored: true,
})
export class Reward extends BaseModel implements RewardInterface {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  reward_type!: RewardType;

  @AllowNull(false)
  @Column(DataType.JSONB)
  reward_value!: any;

  @ForeignKey(() => Tier)
  @AllowNull(false)
  @Column(DataType.UUID)
  tier_id!: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @Column(DataType.DATE)
  start_date!: Date | null;

  @Column(DataType.DATE)
  end_date!: Date | null;

  // Associations
  @BelongsTo(() => Tier)
  tier!: Tier;

  @HasMany(() => CustomerReward)
  customer_rewards!: CustomerReward[];
}
