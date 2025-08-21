import { logger, logPerformance, type PerformanceMetrics } from './logger.server.js';

export interface BatchConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
}

export interface PerformanceThresholds {
  slow: number;      // Operations slower than this are logged as warnings
  critical: number;  // Operations slower than this are logged as errors
}

export interface BatchResult<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: T[];
  errors: Error[];
  totalDuration: number;
}

// Default performance thresholds (in milliseconds)
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slow: 2000,     // 2 seconds
  critical: 5000, // 5 seconds
};

// Default batch configuration
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 50,
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000,
};

// Performance metrics storage
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 1000;

/**
 * Measures the performance of an async operation
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: Error | undefined;
  
  try {
    const result = await operation();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err : new Error(String(err));
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    
    const metrics: PerformanceMetrics = {
      operationName,
      duration,
      success,
      errorCount: success ? 0 : 1,
      timestamp: new Date(),
    };
    
    // Store metrics
    storeMetrics(metrics);
    
    // Log performance based on thresholds
    if (duration > thresholds.critical) {
      logger.error('Critical Performance Issue', {
        operationName,
        duration,
        success,
        error: error?.message,
      });
    } else if (duration > thresholds.slow) {
      logger.warn('Slow Operation Detected', {
        operationName,
        duration,
        success,
        error: error?.message,
      });
    } else {
      logPerformance(metrics);
    }
  }
}

/**
 * Stores performance metrics with rotation
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  performanceMetrics.push(metrics);
  
  // Rotate metrics if we exceed the maximum
  if (performanceMetrics.length > MAX_METRICS_HISTORY) {
    performanceMetrics.splice(0, performanceMetrics.length - MAX_METRICS_HISTORY);
  }
}

/**
 * Gets performance metrics for analysis
 */
export function getPerformanceMetrics(
  operationName?: string,
  since?: Date
): PerformanceMetrics[] {
  let filtered = performanceMetrics;
  
  if (operationName) {
    filtered = filtered.filter(m => m.operationName === operationName);
  }
  
  if (since) {
    filtered = filtered.filter(m => m.timestamp >= since);
  }
  
  return filtered;
}

/**
 * Gets performance statistics for an operation
 */
export function getPerformanceStats(operationName: string): {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorCount: number;
} {
  const metrics = getPerformanceMetrics(operationName);
  
  if (metrics.length === 0) {
    return {
      count: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      successRate: 0,
      errorCount: 0,
    };
  }
  
  const durations = metrics.map(m => m.duration);
  const successCount = metrics.filter(m => m.success).length;
  const errorCount = metrics.reduce((sum, m) => sum + m.errorCount, 0);
  
  return {
    count: metrics.length,
    averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    successRate: successCount / metrics.length,
    errorCount,
  };
}

/**
 * Tracks batch processing performance
 */
export function trackBatchPerformance(
  batchSize: number,
  duration: number,
  processed: number,
  failed: number
): void {
  const throughput = processed / (duration / 1000); // items per second
  
  logger.info('Batch Processing Performance', {
    batchSize,
    duration,
    processed,
    failed,
    throughput: Math.round(throughput * 100) / 100,
    successRate: processed / (processed + failed),
  });
}

/**
 * Batch processor with performance monitoring
 */
export class BatchProcessor<T, R> {
  private config: BatchConfig;
  
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }
  
  async processBatch(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    operationName: string = 'batch-processing'
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const results: R[] = [];
    const errors: Error[] = [];
    let processed = 0;
    let failed = 0;
    
    logger.info('Starting batch processing', {
      totalItems: items.length,
      batchSize: this.config.batchSize,
      operationName,
    });
    
    // Process items in batches
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      const batch = items.slice(i, i + this.config.batchSize);
      const batchNumber = Math.floor(i / this.config.batchSize) + 1;
      const totalBatches = Math.ceil(items.length / this.config.batchSize);
      
      try {
        const batchResults = await this.processBatchWithRetry(
          batch,
          processor,
          `${operationName}-batch-${batchNumber}`
        );
        
        results.push(...batchResults);
        processed += batchResults.length;
        
        logger.info('Batch completed', {
          batchNumber,
          totalBatches,
          batchSize: batch.length,
          processed: batchResults.length,
          operationName,
        });
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        failed += batch.length;
        
        logger.error('Batch failed', {
          batchNumber,
          totalBatches,
          batchSize: batch.length,
          error: err.message,
          operationName,
        });
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Track overall performance
    trackBatchPerformance(this.config.batchSize, totalDuration, processed, failed);
    
    logger.info('Batch processing completed', {
      totalItems: items.length,
      processed,
      failed,
      totalDuration,
      successRate: processed / items.length,
      operationName,
    });
    
    return {
      success: failed === 0,
      processed,
      failed,
      results,
      errors,
      totalDuration,
    };
  }
  
  private async processBatchWithRetry<T, R>(
    batch: T[],
    processor: (batch: T[]) => Promise<R[]>,
    operationName: string
  ): Promise<R[]> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.withTimeout(
          () => processor(batch),
          this.config.timeoutMs,
          operationName
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt;
          logger.warn('Batch processing failed, retrying', {
            attempt,
            maxRetries: this.config.maxRetries,
            delay,
            error: lastError.message,
            operationName,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
  
  private async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms: ${operationName}`));
      }, timeoutMs);
      
      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
} {
  const memUsage = process.memoryUsage();
  
  return {
    used: memUsage.rss,
    total: memUsage.rss + memUsage.heapTotal,
    percentage: (memUsage.rss / (memUsage.rss + memUsage.heapTotal)) * 100,
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
  };
}

/**
 * Monitors memory usage and logs warnings if high
 */
export function monitorMemoryUsage(threshold: number = 80): void {
  const usage = getMemoryUsage();
  
  if (usage.percentage > threshold) {
    logger.warn('High memory usage detected', {
      percentage: Math.round(usage.percentage * 100) / 100,
      used: Math.round(usage.used / 1024 / 1024) + 'MB',
      total: Math.round(usage.total / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    });
  }
}

/**
 * Performance monitoring decorator for functions
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  thresholds?: PerformanceThresholds
): T {
  return (async (...args: any[]) => {
    return measurePerformance(
      () => fn(...args),
      operationName,
      thresholds
    );
  }) as T;
}

/**
 * Clears performance metrics (useful for testing)
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * Gets system performance summary
 */
export function getSystemPerformanceSummary(): {
  totalOperations: number;
  averageResponseTime: number;
  errorRate: number;
  slowOperations: number;
  criticalOperations: number;
  memoryUsage: ReturnType<typeof getMemoryUsage>;
} {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentMetrics = getPerformanceMetrics(undefined, oneHourAgo);
  
  const totalOperations = recentMetrics.length;
  const averageResponseTime = totalOperations > 0 
    ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
    : 0;
  
  const errorCount = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
  const errorRate = totalOperations > 0 ? errorCount / totalOperations : 0;
  
  const slowOperations = recentMetrics.filter(m => 
    m.duration > DEFAULT_THRESHOLDS.slow && m.duration <= DEFAULT_THRESHOLDS.critical
  ).length;
  
  const criticalOperations = recentMetrics.filter(m => 
    m.duration > DEFAULT_THRESHOLDS.critical
  ).length;
  
  return {
    totalOperations,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    errorRate: Math.round(errorRate * 10000) / 100, // percentage with 2 decimal places
    slowOperations,
    criticalOperations,
    memoryUsage: getMemoryUsage(),
  };
}

export default {
  measurePerformance,
  getPerformanceMetrics,
  getPerformanceStats,
  trackBatchPerformance,
  BatchProcessor,
  getMemoryUsage,
  monitorMemoryUsage,
  withPerformanceMonitoring,
  clearPerformanceMetrics,
  getSystemPerformanceSummary,
};
