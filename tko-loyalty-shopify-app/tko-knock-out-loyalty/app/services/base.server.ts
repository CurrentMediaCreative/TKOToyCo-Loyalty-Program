import { logger, createContextLogger, type LogConfig } from '../utils/logger.server.js';
import { 
  handleServiceError, 
  withErrorHandling, 
  withRetry,
  type ServiceResult, 
  type ErrorContext 
} from '../utils/errorHandler.server.js';
import { 
  measurePerformance, 
  type PerformanceThresholds,
  type BatchConfig,
  BatchProcessor 
} from '../utils/performance.server.js';

export interface ServiceConfig {
  serviceName: string;
  logging?: Partial<LogConfig>;
  performance?: Partial<PerformanceThresholds>;
  batch?: Partial<BatchConfig>;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService {
  protected readonly serviceName: string;
  protected readonly logger: typeof logger;
  protected readonly performanceThresholds: PerformanceThresholds;
  protected readonly batchProcessor: BatchProcessor<any, any>;
  protected readonly enableRetry: boolean;
  protected readonly maxRetries: number;
  protected readonly retryDelay: number;

  constructor(config: ServiceConfig) {
    this.serviceName = config.serviceName;
    this.logger = createContextLogger({ service: config.serviceName });
    
    this.performanceThresholds = {
      slow: 2000,
      critical: 5000,
      ...config.performance,
    };
    
    this.batchProcessor = new BatchProcessor(config.batch);
    this.enableRetry = config.enableRetry ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  /**
   * Executes an operation with comprehensive error handling and performance monitoring
   */
  protected async executeWithMetrics<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<ServiceResult<T>> {
    const fullContext: ErrorContext = {
      operation: `${this.serviceName}.${operationName}`,
      ...context,
    };

    try {
      const result = await measurePerformance(
        operation,
        `${this.serviceName}.${operationName}`,
        this.performanceThresholds
      );

      this.logger.info('Operation completed successfully', {
        operation: operationName,
        context: fullContext,
      });

      return { success: true, data: result };
    } catch (error) {
      return handleServiceError<T>(error, fullContext);
    }
  }

  /**
   * Executes an operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>,
    customRetries?: number
  ): Promise<ServiceResult<T>> {
    if (!this.enableRetry) {
      return this.executeWithMetrics(operation, operationName, context);
    }

    const fullContext: ErrorContext = {
      operation: `${this.serviceName}.${operationName}`,
      ...context,
    };

    const retries = customRetries ?? this.maxRetries;

    return withRetry(
      () => measurePerformance(
        operation,
        `${this.serviceName}.${operationName}`,
        this.performanceThresholds
      ),
      retries,
      this.retryDelay,
      fullContext
    );
  }

  /**
   * Processes items in batches with performance monitoring
   */
  protected async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<ServiceResult<R[]>> {
    const fullContext: ErrorContext = {
      operation: `${this.serviceName}.${operationName}`,
      ...context,
    };

    try {
      const result = await this.batchProcessor.processBatch(
        items,
        processor,
        `${this.serviceName}.${operationName}`
      );

      if (!result.success) {
        this.logger.error('Batch processing completed with errors', {
          operation: operationName,
          processed: result.processed,
          failed: result.failed,
          errors: result.errors.map(e => e.message),
          context: fullContext,
        });
      }

      return {
        success: result.success,
        data: result.results,
        error: result.success ? undefined : `Batch processing failed: ${result.failed} items failed`,
      };
    } catch (error) {
      return handleServiceError<R[]>(error, fullContext);
    }
  }

  /**
   * Validates input data before processing
   */
  protected validateInput<T>(
    data: any,
    validator: (data: any) => data is T,
    operationName: string
  ): ServiceResult<T> {
    try {
      if (!validator(data)) {
        return {
          success: false,
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR',
        };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error('Input validation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: 'Input validation failed',
        code: 'VALIDATION_ERROR',
      };
    }
  }

  /**
   * Logs operation start
   */
  protected logOperationStart(operationName: string, context?: any): void {
    this.logger.info('Operation started', {
      operation: operationName,
      service: this.serviceName,
      context,
    });
  }

  /**
   * Logs operation completion
   */
  protected logOperationComplete(
    operationName: string, 
    duration: number, 
    success: boolean,
    context?: any
  ): void {
    const logLevel = success ? 'info' : 'error';
    this.logger[logLevel]('Operation completed', {
      operation: operationName,
      service: this.serviceName,
      duration,
      success,
      context,
    });
  }

  /**
   * Creates a standardized error result
   */
  protected createErrorResult<T>(
    message: string,
    code: string = 'INTERNAL_ERROR',
    context?: any
  ): ServiceResult<T> {
    this.logger.error('Service error', {
      service: this.serviceName,
      message,
      code,
      context,
    });

    return {
      success: false,
      error: message,
      code,
    };
  }

  /**
   * Creates a standardized success result
   */
  protected createSuccessResult<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Handles database operations with proper error mapping
   */
  protected async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<ServiceResult<T>> {
    return this.executeWithMetrics(async () => {
      try {
        return await operation();
      } catch (error: any) {
        // Map Prisma errors to more user-friendly messages
        if (error?.code === 'P2002') {
          throw new Error('Record already exists');
        } else if (error?.code === 'P2025') {
          throw new Error('Record not found');
        } else if (error?.code === 'P2003') {
          throw new Error('Related record not found');
        } else if (error?.code === 'P2014') {
          throw new Error('Invalid data provided');
        }
        
        throw error;
      }
    }, operationName, context);
  }

  /**
   * Handles external API calls with proper error handling
   */
  protected async executeExternalApiCall<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<ServiceResult<T>> {
    return this.executeWithRetry(async () => {
      try {
        return await operation();
      } catch (error: any) {
        // Map common API errors
        if (error?.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (error?.response?.status >= 500) {
          throw new Error('External service unavailable');
        } else if (error?.response?.status === 404) {
          throw new Error('Resource not found');
        } else if (error?.response?.status === 401) {
          throw new Error('Authentication failed');
        }
        
        throw error;
      }
    }, operationName, context);
  }

  /**
   * Gets service performance metrics
   */
  public getPerformanceMetrics(): {
    serviceName: string;
    operationCount: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    // This would integrate with the performance monitoring system
    // For now, return basic info
    return {
      serviceName: this.serviceName,
      operationCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<ServiceResult<{ status: string; timestamp: string }>> {
    return this.executeWithMetrics(async () => {
      // Override in subclasses to add specific health checks
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    }, 'healthCheck');
  }
}

/**
 * Service factory for creating service instances with common configuration
 */
export class ServiceFactory {
  private static defaultConfig: Partial<ServiceConfig> = {
    logging: {
      level: 'info',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: true,
      sanitizeData: true,
    },
    performance: {
      slow: 2000,
      critical: 5000,
    },
    batch: {
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      timeoutMs: 30000,
    },
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
  };

  static setDefaultConfig(config: Partial<ServiceConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  static createConfig(serviceName: string, overrides?: Partial<ServiceConfig>): ServiceConfig {
    return {
      ...this.defaultConfig,
      ...overrides,
      serviceName,
    };
  }
}

export default BaseService;
