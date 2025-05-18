/**
 * Base repository implementation
 *
 * Provides common CRUD operations for all repositories
 */

import { Model, ModelCtor } from "sequelize-typescript";
import { IBaseRepository } from "../interfaces/repositories/base.repository.interface";

export abstract class BaseRepository<T extends Model, I>
  implements IBaseRepository<I>
{
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  /**
   * Find entity by ID
   * @param id Entity ID
   * @returns Promise resolving to entity or null if not found
   */
  async findById(id: string): Promise<I | null> {
    const entity = await this.model.findByPk(id);
    return entity ? (entity.toJSON() as unknown as I) : null;
  }

  /**
   * Find all entities
   * @param options Optional query options (pagination, sorting, etc.)
   * @returns Promise resolving to array of entities
   */
  async findAll(options?: any): Promise<I[]> {
    const entities = await this.model.findAll(options);
    return entities.map((entity) => entity.toJSON() as unknown as I);
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @returns Promise resolving to created entity
   */
  async create(data: Partial<I>): Promise<I> {
    const entity = await this.model.create(data as any);
    return entity.toJSON() as unknown as I;
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Updated entity data
   * @returns Promise resolving to updated entity or null if not found
   */
  async update(id: string, data: Partial<I>): Promise<I | null> {
    const [affectedCount] = await this.model.update(data as any, {
      where: { id: id as any },
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @returns Promise resolving to boolean indicating success
   */
  async delete(id: string): Promise<boolean> {
    const affectedCount = await this.model.destroy({
      where: { id: id as any },
    });

    return affectedCount > 0;
  }

  /**
   * Count entities matching criteria
   * @param options Optional query options
   * @returns Promise resolving to count
   */
  async count(options?: any): Promise<number> {
    const result = await this.model.count(options);
    return typeof result === "number" ? result : (result as any).length;
  }
}
