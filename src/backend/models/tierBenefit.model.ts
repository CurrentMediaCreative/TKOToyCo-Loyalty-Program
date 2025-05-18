/**
 * TierBenefit model
 *
 * Represents a benefit associated with a loyalty tier
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
import { Tier } from "./tier.model";
import {
  TierBenefit as TierBenefitInterface,
  BenefitType,
} from "../interfaces/models/tierBenefit.interface";

@Table({
  tableName: "tier_benefits",
  timestamps: true,
  underscored: true,
})
export class TierBenefit extends BaseModel implements TierBenefitInterface {
  @ForeignKey(() => Tier)
  @AllowNull(false)
  @Column(DataType.UUID)
  tier_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  benefit_type!: BenefitType;

  @AllowNull(false)
  @Column(DataType.JSONB)
  benefit_value!: any;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  // Associations
  @BelongsTo(() => Tier)
  tier!: Tier;
}
