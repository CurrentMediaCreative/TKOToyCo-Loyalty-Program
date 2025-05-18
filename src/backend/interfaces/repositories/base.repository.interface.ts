/**
 * Base repository interface
 *
 * Defines common CRUD operations for all repositories
 */

export interface IBaseRepository<T> {
  /**
   * Find entity by ID
   * @param id Entity ID
   * @returns Promise resolving to entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities
   * @param options Optional query options (pagination, sorting, etc.)
   * @returns Promise resolving to array of entities
   */
  findAll(options?: any): Promise<T[]>;

  /**
   * Create a new entity
   * @param data Entity data
   * @returns Promise resolving to created entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Updated entity data
   * @returns Promise resolving to updated entity or null if not found
   */
  update(id: string, data: Partial<T>): Promise<T | null>;

  /**
   * Delete an entity
   * @param id Entity ID
   * @returns Promise resolving to boolean indicating success
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count entities matching criteria
   * @param options Optional query options
   * @returns Promise resolving to count
   */
  count(options?: any): Promise<number>;
}
