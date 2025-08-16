// Video tools
import {
  getVideoDetailsConfig,
  getVideoDetailsHandler,
} from "./video/getVideoDetails.js";
import {
  searchVideosConfig,
  searchVideosHandler,
} from "./video/searchVideos.js";
import {
  getTranscriptsConfig,
  getTranscriptsHandler,
} from "./video/getTranscripts.js";

// Channel tools
import {
  getChannelStatisticsConfig,
  getChannelStatisticsHandler,
} from "./channel/getChannelStatistics.js";
import {
  getChannelTopVideosConfig,
  getChannelTopVideosHandler,
} from "./channel/getChannelTopVideos.js";

// General tools
import {
  getTrendingVideosConfig,
  getTrendingVideosHandler,
} from "./general/getTrendingVideos.js";
import {
  getVideoCategoriesConfig,
  getVideoCategoriesHandler,
} from "./general/getVideoCategories.js";
import {
  findConsistentOutlierChannelsConfig,
  findConsistentOutlierChannelsHandler,
} from "./general/findConsistentOutlierChannels.js";

// Playlist tools
import {
  getPlaylistDetailsConfig,
  getPlaylistDetailsHandler,
} from "./playlist/getPlaylistDetails.js";
import {
  getPlaylistItemsConfig,
  getPlaylistItemsHandler,
} from "./playlist/getPlaylistItems.js";
import {
  searchPlaylistsConfig,
  searchPlaylistsHandler,
} from "./playlist/searchPlaylists.js";
import {
  getChannelPlaylistsConfig,
  getChannelPlaylistsHandler,
} from "./playlist/getChannelPlaylists.js";
import {
  createPlaylistConfig,
  createPlaylistHandler,
} from "./playlist/createPlaylist.js";
import {
  updatePlaylistConfig,
  updatePlaylistHandler,
} from "./playlist/updatePlaylist.js";
import {
  deletePlaylistConfig,
  deletePlaylistHandler,
} from "./playlist/deletePlaylist.js";
import {
  addPlaylistItemConfig,
  addPlaylistItemHandler,
} from "./playlist/addPlaylistItem.js";
import {
  removePlaylistItemConfig,
  removePlaylistItemHandler,
} from "./playlist/removePlaylistItem.js";
import {
  reorderPlaylistItemsConfig,
  reorderPlaylistItemsHandler,
} from "./playlist/reorderPlaylistItems.js";

import { isEnabled } from "../utils/featureFlags.js";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { IServiceContainer } from "../container.js";
import type {
  VideoDetailsParams,
  SearchParams,
  TranscriptsParams,
  ChannelStatisticsParams,
  ChannelParams,
  TrendingParams,
  VideoCategoriesParams,
  FindConsistentOutlierChannelsParams,
  PlaylistItemsOptions,
  PlaylistSearchOptions,
  ChannelPlaylistsOptions,
} from "../types/tools.js";
import { z } from "zod";

export interface ToolDefinition<TParams = unknown> {
  config: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>;
  };
  handler: (params: TParams) => Promise<CallToolResult>;
}

export function allTools(container: IServiceContainer): ToolDefinition[] {
  // 1. Get all services from the container ONCE.
  const { youtubeService, db, transcriptService, playlistService } = container;

  // 2. Define all tools, wrapping the original handlers with the dependencies they need.
  const toolDefinitions: ToolDefinition<any>[] = [
    // Video tools
    {
      config: getVideoDetailsConfig,
      handler: (params: VideoDetailsParams) =>
        getVideoDetailsHandler(params, youtubeService),
    },
    {
      config: searchVideosConfig,
      handler: (params: SearchParams) =>
        searchVideosHandler(params, youtubeService),
    },
    {
      config: getTranscriptsConfig,
      // This handler is now simple: (params) => ..., because transcriptService is "baked in".
      handler: (params: TranscriptsParams) =>
        getTranscriptsHandler(params, transcriptService),
    },
    // Channel tools
    {
      config: getChannelStatisticsConfig,
      handler: (params: ChannelStatisticsParams) =>
        getChannelStatisticsHandler(params, youtubeService),
    },
    {
      config: getChannelTopVideosConfig,
      handler: (params: ChannelParams) =>
        getChannelTopVideosHandler(params, youtubeService),
    },
    // General tools
    {
      config: getTrendingVideosConfig,
      handler: (params: TrendingParams) =>
        getTrendingVideosHandler(params, youtubeService),
    },
    {
      config: getVideoCategoriesConfig,
      handler: (params: VideoCategoriesParams) =>
        getVideoCategoriesHandler(params, youtubeService),
    },
    // Playlist tools
    {
      config: getPlaylistDetailsConfig,
      handler: (params: { playlistId: string }) =>
        getPlaylistDetailsHandler(params, playlistService),
    },
    {
      config: getPlaylistItemsConfig,
      handler: (params: { playlistId: string } & PlaylistItemsOptions) =>
        getPlaylistItemsHandler(params, playlistService),
    },
    {
      config: searchPlaylistsConfig,
      handler: (params: PlaylistSearchOptions) =>
        searchPlaylistsHandler(params, playlistService),
    },
    {
      config: getChannelPlaylistsConfig,
      handler: (params: { channelId: string } & ChannelPlaylistsOptions) =>
        getChannelPlaylistsHandler(params, playlistService),
    },
    // New playlist management tools
    {
      config: createPlaylistConfig,
      handler: (params: any) =>
        createPlaylistHandler(params, playlistService),
    },
    {
      config: updatePlaylistConfig,
      handler: (params: any) =>
        updatePlaylistHandler(params, playlistService),
    },
    {
      config: deletePlaylistConfig,
      handler: (params: any) =>
        deletePlaylistHandler(params, playlistService),
    },
    // Phase 2: Playlist item management tools
    {
      config: addPlaylistItemConfig,
      handler: (params: any) =>
        addPlaylistItemHandler(params, playlistService),
    },
    {
      config: removePlaylistItemConfig,
      handler: (params: any) =>
        removePlaylistItemHandler(params, playlistService),
    },
    {
      config: reorderPlaylistItemsConfig,
      handler: (params: any) =>
        reorderPlaylistItemsHandler(params, playlistService),
    },
  ];

  // Add feature-flagged tools conditionally (only if MongoDB is available)
  if (isEnabled("toolFindConsistentOutlierChannels") && db) {
    toolDefinitions.push({
      config: findConsistentOutlierChannelsConfig,
      // This handler needs both services, and we provide them here.
      handler: (params: FindConsistentOutlierChannelsParams) =>
        findConsistentOutlierChannelsHandler(params, youtubeService, db),
    });
  }

  return toolDefinitions;
}
