import { promises as fs } from "fs";
import { join } from "path";

/**
 * Utility functions for cache maintenance
 */
export class CacheCleanup {
  /**
   * Remove expired cache files from the specified directory
   */
  static async cleanExpiredFiles(cacheDir: string): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(cacheDir);
      const cacheFiles = files.filter(file => file.startsWith("yt_cache_"));
      
      for (const file of cacheFiles) {
        const filePath = join(cacheDir, file);
        
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const cacheEntry = JSON.parse(content);
          
          // Check if expired
          if (cacheEntry.expiresAt && cacheEntry.expiresAt < Date.now()) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // If we can't read/parse the file, it's probably corrupted, so delete it
          try {
            await fs.unlink(filePath);
            cleanedCount++;
          } catch (unlinkError) {
            // Ignore unlink errors
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      console.warn(`Failed to clean cache directory ${cacheDir}:`, error);
    }
    
    return cleanedCount;
  }

  /**
   * Get cache statistics for the specified directory
   */
  static async getCacheStats(cacheDir: string): Promise<{
    totalFiles: number;
    totalSize: number;
    expiredFiles: number;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    let expiredFiles = 0;
    
    try {
      const files = await fs.readdir(cacheDir);
      const cacheFiles = files.filter(file => file.startsWith("yt_cache_"));
      
      for (const file of cacheFiles) {
        const filePath = join(cacheDir, file);
        
        try {
          const stats = await fs.stat(filePath);
          totalFiles++;
          totalSize += stats.size;
          
          const content = await fs.readFile(filePath, "utf-8");
          const cacheEntry = JSON.parse(content);
          
          if (cacheEntry.expiresAt && cacheEntry.expiresAt < Date.now()) {
            expiredFiles++;
          }
        } catch (error) {
          // Count corrupted files as expired
          totalFiles++;
          expiredFiles++;
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return { totalFiles, totalSize, expiredFiles };
  }
}