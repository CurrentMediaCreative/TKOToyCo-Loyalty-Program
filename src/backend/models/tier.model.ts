/**
 * Tier model
 *
 * Represents a loyalty tier (boxing weight class)
 */

import {
  Table,
  Column,
  DataType,
  AllowNull,
  Unique,
  HasMany,
} from "sequelize-typescript";
import { BaseModel } from "./base.model";
import { Customer } from "./customer.model";
import { TierBenefit } from "./tierBenefit.model";
import { Reward } from "./reward.model";
import { MembershipCard } from "./membershipCard.model";
import { Tier as TierInterface } from "../interfaces/models/tier.interface";

@Table({
  tableName: "tiers",
  timestamps: true,
  underscored: true,
})
export class Tier extends BaseModel implements TierInterface {
  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string | null;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  spend_threshold!: number;

  @Column(DataType.STRING)
  card_design!: string | null;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  sort_order!: number;

  // Associations
  @HasMany(() => Customer)
  customers!: Customer[];

  @HasMany(() => TierBenefit)
  benefits!: TierBenefit[];

  @HasMany(() => Reward)
  rewards!: Reward[];

  @HasMany(() => MembershipCard)
  membership_cards!: MembershipCard[];
}
