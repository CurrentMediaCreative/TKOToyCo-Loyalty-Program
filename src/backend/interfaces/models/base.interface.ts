/**
 * Base model interface
 *
 * Provides common fields for all model interfaces
 */

export interface BaseModel {
  id: string;
  created_at: Date;
  updated_at: Date;
}
