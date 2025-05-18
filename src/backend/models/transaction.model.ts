/**
 * Transaction model
 *
 * Represents a customer purchase transaction
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
import { Customer } from "./customer.model";
import { TransactionItem } from "./transactionItem.model";
import {
  Transaction as TransactionInterface,
  TransactionSource,
  TransactionStatus,
} from "../interfaces/models/transaction.interface";

@Table({
  tableName: "transactions",
  timestamps: true,
  underscored: true,
})
export class Transaction extends BaseModel implements TransactionInterface {
  @ForeignKey(() => Customer)
  @AllowNull(false)
  @Column(DataType.UUID)
  customer_id!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  source!: TransactionSource;

  @AllowNull(false)
  @Column(DataType.STRING)
  reference_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: TransactionStatus;

  @AllowNull(false)
  @Column(DataType.DATE)
  transaction_date!: Date;

  // Associations
  @BelongsTo(() => Customer)
  customer!: Customer;

  @HasMany(() => TransactionItem)
  items!: TransactionItem[];
}
