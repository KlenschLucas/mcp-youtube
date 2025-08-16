import { ICacheService } from "./cache.interface.js";
import { CacheService } from "../cache.service.js";
import { FileCacheService } from "./file-cache.service.js";
import { connectToDatabase, getDb } from "../database.service.js";

export type CacheType = "mongodb" | "file";

export class CacheFactory {
  /**
   * Create a cache service based on the specified type and configuration
   */
  static async createCacheService(
    type: CacheType = "file",
    options?: {
      cacheDir?: string;
      mongoConnectionString?: string;
    }
  ): Promise<ICacheService> {
    switch (type) {
      case "mongodb":
        if (!options?.mongoConnectionString) {
          throw new Error(
            "MongoDB connection string is required for MongoDB cache"
          );
        }
        
        // Set the connection string in environment for the database service
        process.env.MDB_MCP_CONNECTION_STRING = options.mongoConnectionString;
        
        await connectToDatabase();
        const db = getDb();
        return new CacheService(db);

      case "file":
        const fileCache = new FileCacheService(options?.cacheDir);
        await fileCache.initialize?.();
        return fileCache;

      default:
        throw new Error(`Unsupported cache type: ${type}`);
    }
  }

  /**
   * Auto-detect the best cache service based on environment variables
   */
  static async createAutoCacheService(): Promise<ICacheService> {
    // If MongoDB connection string is available, use MongoDB
    if (process.env.MDB_MCP_CONNECTION_STRING) {
      try {
        return await this.createCacheService("mongodb", {
          mongoConnectionString: process.env.MDB_MCP_CONNECTION_STRING,
        });
      } catch (error) {
        console.warn("Failed to connect to MongoDB, falling back to file cache:", error);
      }
    }

    // Fall back to file cache
    return await this.createCacheService("file");
  }
}