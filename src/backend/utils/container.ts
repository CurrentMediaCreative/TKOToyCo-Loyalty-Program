/**
 * Dependency Injection Container
 *
 * Provides a simple dependency injection container for managing service instances.
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = (...args: any[]) => T;

/**
 * Service lifetime options
 */
export enum ServiceLifetime {
  /**
   * A new instance is created each time the service is requested
   */
  TRANSIENT = "transient",

  /**
   * A single instance is created and reused for the lifetime of the application
   */
  SINGLETON = "singleton",

  /**
   * A single instance is created and reused for the duration of a request
   */
  SCOPED = "scoped",
}

/**
 * Service registration options
 */
interface ServiceRegistration<T = any> {
  /**
   * Service identifier
   */
  id: string;

  /**
   * Service implementation
   */
  implementation: Constructor<T> | Factory<T>;

  /**
   * Service lifetime
   */
  lifetime: ServiceLifetime;

  /**
   * Service instance (for singletons)
   */
  instance?: T;

  /**
   * Service dependencies
   */
  dependencies?: string[];
}

/**
 * Simple dependency injection container
 */
class Container {
  private services: Map<string, ServiceRegistration> = new Map();

  /**
   * Register a service with the container
   * @param id Service identifier
   * @param implementation Service implementation
   * @param lifetime Service lifetime
   * @param dependencies Service dependencies
   */
  register<T>(
    id: string,
    implementation: Constructor<T> | Factory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON,
    dependencies: string[] = []
  ): void {
    this.services.set(id, {
      id,
      implementation,
      lifetime,
      dependencies,
    });
  }

  /**
   * Register a singleton service with the container
   * @param id Service identifier
   * @param implementation Service implementation
   * @param dependencies Service dependencies
   */
  registerSingleton<T>(
    id: string,
    implementation: Constructor<T> | Factory<T>,
    dependencies: string[] = []
  ): void {
    this.register(id, implementation, ServiceLifetime.SINGLETON, dependencies);
  }

  /**
   * Register a transient service with the container
   * @param id Service identifier
   * @param implementation Service implementation
   * @param dependencies Service dependencies
   */
  registerTransient<T>(
    id: string,
    implementation: Constructor<T> | Factory<T>,
    dependencies: string[] = []
  ): void {
    this.register(id, implementation, ServiceLifetime.TRANSIENT, dependencies);
  }

  /**
   * Register a scoped service with the container
   * @param id Service identifier
   * @param implementation Service implementation
   * @param dependencies Service dependencies
   */
  registerScoped<T>(
    id: string,
    implementation: Constructor<T> | Factory<T>,
    dependencies: string[] = []
  ): void {
    this.register(id, implementation, ServiceLifetime.SCOPED, dependencies);
  }

  /**
   * Get a service from the container
   * @param id Service identifier
   * @returns Service instance
   */
  resolve<T>(id: string): T {
    const registration = this.services.get(id);

    if (!registration) {
      throw new Error(`Service '${id}' not registered`);
    }

    // Return existing instance for singletons
    if (
      registration.lifetime === ServiceLifetime.SINGLETON &&
      registration.instance
    ) {
      return registration.instance as T;
    }

    // Resolve dependencies
    const dependencies = registration.dependencies?.map((depId) =>
      this.resolve(depId)
    );

    // Create instance
    let instance: T;

    if (typeof registration.implementation === "function") {
      if (
        registration.implementation.prototype &&
        registration.implementation.prototype.constructor
      ) {
        // Constructor function
        instance = new (registration.implementation as Constructor<T>)(
          ...(dependencies || [])
        );
      } else {
        // Factory function
        instance = (registration.implementation as Factory<T>)(
          ...(dependencies || [])
        );
      }
    } else {
      throw new Error(
        `Invalid implementation for service '${id}': ${registration.implementation}`
      );
    }

    // Store instance for singletons
    if (registration.lifetime === ServiceLifetime.SINGLETON) {
      registration.instance = instance;
    }

    return instance;
  }

  /**
   * Check if a service is registered
   * @param id Service identifier
   * @returns True if the service is registered
   */
  has(id: string): boolean {
    return this.services.has(id);
  }

  /**
   * Remove a service from the container
   * @param id Service identifier
   */
  remove(id: string): void {
    this.services.delete(id);
  }

  /**
   * Clear all services from the container
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get all registered service IDs
   * @returns Array of service IDs
   */
  getServiceIds(): string[] {
    return Array.from(this.services.keys());
  }
}

// Create and export a singleton container instance
const container = new Container();
export default container;
