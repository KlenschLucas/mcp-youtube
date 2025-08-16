import { promises as fs } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { omitPaths } from "../../utils/objectUtils.js";
import { ICacheService } from "./cache.interface.js";

interface FileCacheEntry<T> {
  data: T;
  expiresAt: number;
  params?: object;
}

export class FileCacheService implements ICacheService {
  private readonly cacheDir: string;
  private readonly CACHE_FILE_PREFIX = "yt_cache_";

  constructor(cacheDir: string = ".cache/youtube") {
    this.cacheDir = cacheDir;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create cache directory: ${this.cacheDir}`, {
        cause: error,
      });
    }
  }

  async cleanup(): Promise<void> {
    // Clean up expired cache files
    const { CacheCleanup } = await import("../../utils/cacheCleanup.js");
    const cleanedCount = await CacheCleanup.cleanExpiredFiles(this.cacheDir);
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache files`);
    }
  }

  public async getOrSet<T extends object | null | undefined>(
    key: string,
    operation: () => Promise<T>,
    ttlSeconds: number,
    collectionName: string,
    params?: object,
    pathsToExclude?: string[]
  ): Promise<T> {
    const filePath = this.getFilePath(collectionName, key);

    try {
      // Try to read from cache
      const cachedData = await this.readCacheFile<T>(filePath);
      if (cachedData && cachedData.expiresAt > Date.now()) {
        return cachedData.data;
      }
    } catch (error) {
      // Cache miss or read error, continue to fetch fresh data
    }

    // Execute operation to get fresh data
    const freshData = await operation();

    if (freshData === null || freshData === undefined) {
      return freshData;
    }

    // Process data to cache (exclude paths if specified)
    const dataToCache =
      pathsToExclude && pathsToExclude.length > 0
        ? omitPaths(freshData, pathsToExclude)
        : freshData;

    // Save to cache
    const cacheEntry: FileCacheEntry<T> = {
      data: dataToCache,
      expiresAt: Date.now() + ttlSeconds * 1000,
      ...(params && { params }),
    };

    await this.writeCacheFile(filePath, cacheEntry);

    return dataToCache;
  }

  public createOperationKey(operationName: string, args: object): string {
    // Sort keys to ensure consistent hashing
    const sortedArgs = Object.keys(args)
      .sort()
      .reduce(
        (obj, key) => {
          const value = args[key as keyof typeof args];
          if (value !== undefined) {
            obj[key as keyof typeof args] = value;
          }
          return obj;
        },
        {} as typeof args
      );

    const keyString = `${operationName}:${JSON.stringify(sortedArgs)}`;
    return createHash("sha256").update(keyString).digest("hex");
  }

  private getFilePath(collectionName: string, key: string): string {
    // Create a safe filename from the key
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${this.CACHE_FILE_PREFIX}${collectionName}_${safeKey}.json`;
    return join(this.cacheDir, filename);
  }

  private async readCacheFile<T>(filePath: string): Promise<FileCacheEntry<T> | null> {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as FileCacheEntry<T>;
    } catch (error) {
      return null;
    }
  }

  private async writeCacheFile<T>(
    filePath: string,
    data: FileCacheEntry<T>
  ): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      // Silently fail cache writes to avoid breaking the main operation
      console.warn(`Failed to write cache file ${filePath}:`, error);
    }
  }
}