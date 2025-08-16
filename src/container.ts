import "dotenv/config";
import { Db } from "mongodb";
import { getDb } from "./services/database.service.js";
import { ICacheService } from "./services/cache/cache.interface.js";
import { CacheFactory } from "./services/cache/cache.factory.js";
import { YoutubeService } from "./services/youtube.service.js";
import { TranscriptService } from "./services/transcript.service.js";
import { PlaylistService } from "./services/playlist.service.js";

export interface IServiceContainer {
  db?: Db;
  cacheService: ICacheService;
  youtubeService: YoutubeService;
  transcriptService: TranscriptService;
  playlistService: PlaylistService;
}

let container: IServiceContainer | null = null;

export async function initializeContainer(): Promise<IServiceContainer> {
  if (container) return container;

  // Use auto-detection to choose the best available cache service
  const cacheService = await CacheFactory.createAutoCacheService();
  
  // Get database reference if MongoDB is being used
  let db: Db | undefined;
  try {
    db = getDb();
  } catch (error) {
    // Database not available, using file cache
    db = undefined;
  }

  const youtubeService = new YoutubeService(cacheService);
  const transcriptService = new TranscriptService(cacheService);
  const playlistService = new PlaylistService(cacheService);

  container = { db, cacheService, youtubeService, transcriptService, playlistService };
  return container;
}
