/**
 * TransactionItem model
 *
 * Represents a line item in a transaction
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
import { Transaction } from "./transaction.model";
import { TransactionItem as TransactionItemInterface } from "../interfaces/models/transactionItem.interface";

@Table({
  tableName: "transaction_items",
  timestamps: true,
  underscored: true,
})
export class TransactionItem
  extends BaseModel
  implements TransactionItemInterface
{
  @ForeignKey(() => Transaction)
  @AllowNull(false)
  @Column(DataType.UUID)
  transaction_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  product_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  product_name!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  total!: number;

  // Associations
  @BelongsTo(() => Transaction)
  transaction!: Transaction;
}
