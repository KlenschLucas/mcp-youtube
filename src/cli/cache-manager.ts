#!/usr/bin/env node

import "dotenv/config";
import { CacheFactory } from "../services/cache/cache.factory.js";
import { CacheCleanup } from "../utils/cacheCleanup.js";

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case "stats":
      await showCacheStats();
      break;
    case "clean":
      await cleanCache();
      break;
    case "test":
      await testCache();
      break;
    default:
      showHelp();
  }
}

async function showCacheStats() {
  console.log("Cache Statistics:");
  console.log("================");
  
  // File cache stats
  const fileStats = await CacheCleanup.getCacheStats(".cache/youtube");
  console.log(`File Cache (.cache/youtube):`);
  console.log(`  Total files: ${fileStats.totalFiles}`);
  console.log(`  Total size: ${(fileStats.totalSize / 1024).toFixed(2)} KB`);
  console.log(`  Expired files: ${fileStats.expiredFiles}`);
  
  // MongoDB stats (if available)
  if (process.env.MDB_MCP_CONNECTION_STRING) {
    console.log(`\nMongoDB Cache: Available (connection configured)`);
  } else {
    console.log(`\nMongoDB Cache: Not configured`);
  }
}

async function cleanCache() {
  console.log("Cleaning expired cache files...");
  
  const cleanedCount = await CacheCleanup.cleanExpiredFiles(".cache/youtube");
  console.log(`Cleaned up ${cleanedCount} expired cache files.`);
}

async function testCache() {
  console.log("Testing cache services...");
  
  try {
    // Test auto-detection
    const cacheService = await CacheFactory.createAutoCacheService();
    console.log("✓ Cache service created successfully");
    
    // Test basic operations
    const testKey = "test-key";
    const testData = { message: "Hello, cache!", timestamp: Date.now() };
    
    const result = await cacheService.getOrSet(
      testKey,
      async () => testData,
      60, // 1 minute TTL
      "test"
    );
    
    console.log("✓ Cache write/read test passed");
    console.log(`  Cached data: ${JSON.stringify(result)}`);
    
    // Test operation key generation
    const opKey = cacheService.createOperationKey("testOp", { param1: "value1", param2: 123 });
    console.log(`✓ Operation key generated: ${opKey.substring(0, 16)}...`);
    
    // Cleanup
    if (cacheService.cleanup) {
      await cacheService.cleanup();
    }
    
    console.log("✓ All cache tests passed!");
    
  } catch (error) {
    console.error("✗ Cache test failed:", error);
    process.exit(1);
  }
}

function showHelp() {
  console.log("YouTube MCP Cache Manager");
  console.log("========================");
  console.log("");
  console.log("Usage: tsx src/cli/cache-manager.ts <command>");
  console.log("");
  console.log("Commands:");
  console.log("  stats  - Show cache statistics");
  console.log("  clean  - Clean expired cache files");
  console.log("  test   - Test cache functionality");
  console.log("  help   - Show this help message");
  console.log("");
  console.log("Environment Variables:");
  console.log("  YOUTUBE_API_KEY              - Required for YouTube API access");
  console.log("  MDB_MCP_CONNECTION_STRING    - Optional MongoDB connection string");
  console.log("                                 If not set, file cache will be used");
}

void main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});