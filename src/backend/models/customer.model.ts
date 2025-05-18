/**
 * Customer model
 *
 * Represents a loyalty program member
 */

import {
  Table,
  Column,
  DataType,
  AllowNull,
  Unique,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from "sequelize-typescript";
import { BaseModel } from "./base.model";
import { Tier } from "./tier.model";
import { Transaction } from "./transaction.model";
import { CustomerReward } from "./customerReward.model";
import { MembershipCard } from "./membershipCard.model";
import { Customer as CustomerInterface } from "../interfaces/models/customer.interface";

@Table({
  tableName: "customers",
  timestamps: true,
  underscored: true,
})
export class Customer extends BaseModel implements CustomerInterface {
  @AllowNull(false)
  @Column(DataType.STRING)
  first_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  last_name!: string;

  @Unique
  @Column(DataType.STRING)
  email!: string | null;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  phone!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  join_date!: Date;

  @ForeignKey(() => Tier)
  @AllowNull(false)
  @Column(DataType.UUID)
  tier_id!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  total_spend!: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  // Associations
  @BelongsTo(() => Tier)
  tier!: Tier;

  @HasMany(() => Transaction)
  transactions!: Transaction[];

  @HasMany(() => CustomerReward)
  rewards!: CustomerReward[];

  @HasOne(() => MembershipCard)
  membership_card!: MembershipCard;
}
