/**
 * Base model for all Sequelize models
 *
 * Provides common fields and configuration for all models
 */

import {
  Model,
  Column,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";

export class BaseModel extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}
