/**
 * MembershipCard model
 *
 * Represents a physical membership card for a customer
 */

import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Unique,
} from "sequelize-typescript";
import { BaseModel } from "./base.model";
import { Customer } from "./customer.model";
import { Tier } from "./tier.model";
import { MembershipCard as MembershipCardInterface } from "../interfaces/models/membershipCard.interface";

@Table({
  tableName: "membership_cards",
  timestamps: true,
  underscored: true,
})
export class MembershipCard
  extends BaseModel
  implements MembershipCardInterface
{
  @ForeignKey(() => Customer)
  @AllowNull(false)
  @Column(DataType.UUID)
  customer_id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  card_number!: string;

  @Unique
  @Column(DataType.STRING)
  nfc_id!: string | null;

  @Column(DataType.DATE)
  activation_date!: Date | null;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @ForeignKey(() => Tier)
  @AllowNull(false)
  @Column(DataType.UUID)
  tier_id!: string;

  // Associations
  @BelongsTo(() => Customer)
  customer!: Customer;

  @BelongsTo(() => Tier)
  tier!: Tier;
}
