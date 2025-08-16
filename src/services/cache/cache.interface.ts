/**
 * Generic cache interface that can be implemented by different storage backends
 */
export interface ICacheService {
  /**
   * Get data from cache or execute operation if not found/expired
   */
  getOrSet<T extends object | null | undefined>(
    key: string,
    operation: () => Promise<T>,
    ttlSeconds: number,
    collectionName: string,
    params?: object,
    pathsToExclude?: string[]
  ): Promise<T>;

  /**
   * Create a consistent hash key from operation name and arguments
   */
  createOperationKey(operationName: string, args: object): string;

  /**
   * Initialize the cache service (connect to database, create directories, etc.)
   */
  initialize?(): Promise<void>;

  /**
   * Clean up resources (close connections, etc.)
   */
  cleanup?(): Promise<void>;
}