import { google, youtube_v3 } from "googleapis";
import { ICacheService } from "./cache/cache.interface.js";
import { CACHE_TTLS, CACHE_COLLECTIONS } from "../config/cache.config.js";
import type {
  LeanPlaylistDetails,
  LeanPlaylistItem,
  LeanPlaylistSearchResult,
  CreatePlaylistOptions,
  UpdatePlaylistOptions,
} from "../types/youtube.js";
import type {
  PlaylistItemsOptions,
  PlaylistSearchOptions,
  ChannelPlaylistsOptions,
} from "../types/tools.js";
import { parseYouTubeNumber } from "../utils/numberParser.js";

const API_COSTS = {
  "playlists.list": 1,
  "playlistItems.list": 1,
  "search.list": 100,
  "videos.list": 1,
  "playlists.insert": 50,
  "playlists.update": 50,
  "playlists.delete": 50,
  "playlistItems.insert": 50,
  "playlistItems.delete": 50,
  "playlistItems.update": 50,
  "analytics.reports.query": 1,
};

export class PlaylistService {
  private youtube: youtube_v3.Youtube;
  private cacheService: ICacheService;
  private readonly MAX_RESULTS_PER_PAGE = 50;
  private readonly ABSOLUTE_MAX_RESULTS = 500;
  private apiCreditsUsed: number = 0;

  constructor(cacheService: ICacheService) {
    this.cacheService = cacheService;
    this.youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  public getApiCreditsUsed(): number {
    return this.apiCreditsUsed;
  }

  public resetApiCreditsUsed(): void {
    this.apiCreditsUsed = 0;
  }

  private async trackCost<T>(
    operation: () => Promise<T>,
    cost: number
  ): Promise<T> {
    this.apiCreditsUsed += cost;
    return operation();
  }

  async getPlaylistDetails(playlistId: string): Promise<LeanPlaylistDetails> {
    const cacheKey = playlistId;

    const operation = async (): Promise<LeanPlaylistDetails> => {
      try {
        const response = await this.trackCost(
          () =>
            this.youtube.playlists.list({
              part: ["snippet", "contentDetails", "status"],
              id: [playlistId],
            }),
          API_COSTS["playlists.list"]
        );

        if (!response.data.items?.length) {
          throw new Error("Playlist not found.");
        }

        const playlist = response.data.items[0];
        return {
          id: playlist.id,
          title: playlist.snippet?.title,
          description: playlist.snippet?.description,
          channelId: playlist.snippet?.channelId,
          channelTitle: playlist.snippet?.channelTitle,
          publishedAt: playlist.snippet?.publishedAt,
          itemCount: parseYouTubeNumber(playlist.contentDetails?.itemCount?.toString()),
          privacyStatus: playlist.status?.privacyStatus,
        };
      } catch (error) {
        throw new Error(
          `YouTube API call for getPlaylistDetails failed for playlistId: ${playlistId}`
        );
      }
    };

    return this.cacheService.getOrSet(
      cacheKey,
      operation,
      CACHE_TTLS.SEMI_STATIC,
      CACHE_COLLECTIONS.PLAYLIST_DETAILS
    );
  }

  async getPlaylistItems(
    playlistId: string,
    options: PlaylistItemsOptions = {}
  ): Promise<LeanPlaylistItem[]> {
    const cacheKey = this.cacheService.createOperationKey(
      "getPlaylistItems",
      { playlistId, ...options }
    );

    const operation = async (): Promise<LeanPlaylistItem[]> => {
      try {
        const { maxResults = 50, pageToken, videoDetails = false } = options;

        const results: youtube_v3.Schema$PlaylistItem[] = [];
        let nextPageToken: string | undefined = pageToken;
        const targetResults = Math.min(maxResults, this.ABSOLUTE_MAX_RESULTS);

        while (results.length < targetResults) {
          const response = await this.trackCost(
            () =>
              this.youtube.playlistItems.list({
                part: ["snippet", "contentDetails"],
                playlistId: playlistId,
                maxResults: Math.min(
                  this.MAX_RESULTS_PER_PAGE,
                  targetResults - results.length
                ),
                pageToken: nextPageToken,
              }),
            API_COSTS["playlistItems.list"]
          );

          if (!response.data.items?.length) {
            break;
          }

          results.push(...response.data.items);
          nextPageToken = response.data.nextPageToken || undefined;

          if (!nextPageToken) {
            break;
          }
        }

        // If video details are requested, fetch additional video information
        let videoDetailsMap: Map<string, youtube_v3.Schema$Video> = new Map();
        if (videoDetails && results.length > 0) {
          const videoIds = results
            .map((item) => item.contentDetails?.videoId)
            .filter((id): id is string => id !== undefined);

          if (videoIds.length > 0) {
            // Batch fetch video details
            for (let i = 0; i < videoIds.length; i += this.MAX_RESULTS_PER_PAGE) {
              const batch = videoIds.slice(i, i + this.MAX_RESULTS_PER_PAGE);
              const videoResponse = await this.trackCost(
                () =>
                  this.youtube.videos.list({
                    part: ["contentDetails"],
                    id: batch,
                  }),
                API_COSTS["videos.list"]
              );

              if (videoResponse.data.items) {
                for (const video of videoResponse.data.items) {
                  if (video.id) {
                    videoDetailsMap.set(video.id, video);
                  }
                }
              }
            }
          }
        }

        return results.slice(0, targetResults).map((item) => {
          const videoId = item.contentDetails?.videoId;
          const videoDetail = videoId ? videoDetailsMap.get(videoId) : undefined;

          return {
            videoId: videoId,
            title: item.snippet?.title,
            channelTitle: item.snippet?.videoOwnerChannelTitle,
            position: parseYouTubeNumber(item.snippet?.position?.toString()),
            publishedAt: item.snippet?.publishedAt,
            duration: videoDetail?.contentDetails?.duration || null,
          };
        });
      } catch (error) {
        throw new Error(
          `YouTube API call for getPlaylistItems failed for playlistId: ${playlistId}`
        );
      }
    };

    return this.cacheService.getOrSet(
      cacheKey,
      operation,
      CACHE_TTLS.STANDARD,
      CACHE_COLLECTIONS.PLAYLIST_ITEMS,
      { playlistId, ...options }
    );
  }

  async searchPlaylists(
    options: PlaylistSearchOptions
  ): Promise<LeanPlaylistSearchResult[]> {
    const cacheKey = this.cacheService.createOperationKey(
      "searchPlaylists",
      options
    );

    const operation = async (): Promise<LeanPlaylistSearchResult[]> => {
      try {
        const { query, maxResults = 10, channelId, regionCode } = options;

        const results: youtube_v3.Schema$SearchResult[] = [];
        let nextPageToken: string | undefined = undefined;
        const targetResults = Math.min(maxResults, this.ABSOLUTE_MAX_RESULTS);

        while (results.length < targetResults) {
          const searchParams: youtube_v3.Params$Resource$Search$List = {
            part: ["snippet"],
            q: query,
            type: ["playlist"],
            maxResults: Math.min(
              this.MAX_RESULTS_PER_PAGE,
              targetResults - results.length
            ),
            pageToken: nextPageToken,
          };

          if (channelId) {
            searchParams.channelId = channelId;
          }

          if (regionCode) {
            searchParams.regionCode = regionCode;
          }

          const response = await this.trackCost(
            () => this.youtube.search.list(searchParams),
            API_COSTS["search.list"]
          );

          if (!response.data.items?.length) {
            break;
          }

          results.push(...response.data.items);
          nextPageToken = response.data.nextPageToken || undefined;

          if (!nextPageToken) {
            break;
          }
        }

        // Get detailed playlist information for the search results
        const playlistIds = results
          .map((item) => item.id?.playlistId)
          .filter((id): id is string => id !== undefined);

        if (playlistIds.length === 0) {
          return [];
        }

        const playlistDetails: youtube_v3.Schema$Playlist[] = [];
        for (let i = 0; i < playlistIds.length; i += this.MAX_RESULTS_PER_PAGE) {
          const batch = playlistIds.slice(i, i + this.MAX_RESULTS_PER_PAGE);
          const response = await this.trackCost(
            () =>
              this.youtube.playlists.list({
                part: ["snippet", "contentDetails"],
                id: batch,
              }),
            API_COSTS["playlists.list"]
          );

          if (response.data.items) {
            playlistDetails.push(...response.data.items);
          }
        }

        return playlistDetails.slice(0, targetResults).map((playlist) => ({
          playlistId: playlist.id,
          title: playlist.snippet?.title,
          description: playlist.snippet?.description,
          channelId: playlist.snippet?.channelId,
          channelTitle: playlist.snippet?.channelTitle,
          publishedAt: playlist.snippet?.publishedAt,
          itemCount: playlist.contentDetails?.itemCount || 0,
        }));
      } catch (error) {
        throw new Error(`YouTube API call for searchPlaylists failed`, {
          cause: error,
        });
      }
    };

    return this.cacheService.getOrSet(
      cacheKey,
      operation,
      CACHE_TTLS.STANDARD,
      CACHE_COLLECTIONS.PLAYLIST_SEARCHES,
      options
    );
  }

  async getChannelPlaylists(
    channelId: string,
    options: ChannelPlaylistsOptions = {}
  ): Promise<LeanPlaylistDetails[]> {
    const cacheKey = this.cacheService.createOperationKey(
      "getChannelPlaylists",
      { channelId, ...options }
    );

    const operation = async (): Promise<LeanPlaylistDetails[]> => {
      try {
        const { maxResults = 50, pageToken } = options;

        const results: youtube_v3.Schema$Playlist[] = [];
        let nextPageToken: string | undefined = pageToken;
        const targetResults = Math.min(maxResults, this.ABSOLUTE_MAX_RESULTS);

        while (results.length < targetResults) {
          const response = await this.trackCost(
            () =>
              this.youtube.playlists.list({
                part: ["snippet", "contentDetails", "status"],
                channelId: channelId,
                maxResults: Math.min(
                  this.MAX_RESULTS_PER_PAGE,
                  targetResults - results.length
                ),
                pageToken: nextPageToken,
              }),
            API_COSTS["playlists.list"]
          );

          if (!response.data.items?.length) {
            break;
          }

          results.push(...response.data.items);
          nextPageToken = response.data.nextPageToken || undefined;

          if (!nextPageToken) {
            break;
          }
        }

        return results.slice(0, targetResults).map((playlist) => ({
          id: playlist.id,
          title: playlist.snippet?.title,
          description: playlist.snippet?.description,
          channelId: playlist.snippet?.channelId,
          channelTitle: playlist.snippet?.channelTitle,
          publishedAt: playlist.snippet?.publishedAt,
          itemCount: playlist.contentDetails?.itemCount || 0,
          privacyStatus: playlist.status?.privacyStatus,
        }));
      } catch (error) {
        throw new Error(
          `YouTube API call for getChannelPlaylists failed for channelId: ${channelId}`,
          { cause: error }
        );
      }
    };

    return this.cacheService.getOrSet(
      cacheKey,
      operation,
      CACHE_TTLS.SEMI_STATIC,
      CACHE_COLLECTIONS.CHANNEL_PLAYLISTS,
      { channelId, ...options }
    );
  }

  async createPlaylist(options: CreatePlaylistOptions): Promise<LeanPlaylistDetails> {
    const operation = async (): Promise<LeanPlaylistDetails> => {
      try {
        const response = await this.trackCost(
          () =>
            this.youtube.playlists.insert({
              part: ["snippet", "status"],
              requestBody: {
                snippet: {
                  title: options.title,
                  description: options.description,
                  tags: options.tags,
                  defaultLanguage: options.defaultLanguage,
                },
                status: {
                  privacyStatus: options.privacyStatus || "private",
                },
              },
            }),
          API_COSTS["playlists.insert"]
        );

        const playlist = response.data;
        return {
          id: playlist.id,
          title: playlist.snippet?.title,
          description: playlist.snippet?.description,
          channelId: playlist.snippet?.channelId,
          channelTitle: playlist.snippet?.channelTitle,
          publishedAt: playlist.snippet?.publishedAt,
          itemCount: 0,
          privacyStatus: playlist.status?.privacyStatus,
        };
      } catch (error) {
        throw new Error(`YouTube API call for createPlaylist failed`);
      }
    };

    return this.cacheService.getOrSet(
      `create_playlist_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async updatePlaylist(options: UpdatePlaylistOptions): Promise<LeanPlaylistDetails> {
    const operation = async (): Promise<LeanPlaylistDetails> => {
      try {
        const requestBody: any = {};
        
        if (options.title || options.description || options.tags || options.defaultLanguage) {
          requestBody.snippet = {
            title: options.title,
            description: options.description,
            tags: options.tags,
            defaultLanguage: options.defaultLanguage,
          };
        }
        
        if (options.privacyStatus) {
          requestBody.status = {
            privacyStatus: options.privacyStatus,
          };
        }

        const response = await this.trackCost(
          () =>
            this.youtube.playlists.update({
              part: ["snippet", "status"],
              requestBody: {
                id: options.playlistId,
                ...requestBody,
              },
            }),
          API_COSTS["playlists.update"]
        );

        const playlist = response.data;
        return {
          id: playlist.id,
          title: playlist.snippet?.title,
          description: playlist.snippet?.description,
          channelId: playlist.snippet?.channelId,
          channelTitle: playlist.snippet?.channelTitle,
          publishedAt: playlist.snippet?.publishedAt,
          itemCount: 0, // Will be updated when fetched
          privacyStatus: playlist.status?.privacyStatus,
        };
      } catch (error) {
        throw new Error(`YouTube API call for updatePlaylist failed for playlistId: ${options.playlistId}`);
      }
    };

    return this.cacheService.getOrSet(
      `update_playlist_${options.playlistId}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async deletePlaylist(playlistId: string): Promise<{ message: string }> {
    const operation = async (): Promise<{ message: string }> => {
      try {
        await this.trackCost(
          () =>
            this.youtube.playlists.delete({
              id: playlistId,
            }),
          API_COSTS["playlists.delete"]
        );
        return { message: "Playlist deleted successfully" };
      } catch (error) {
        throw new Error(`YouTube API call for deletePlaylist failed for playlistId: ${playlistId}`);
      }
    };

    return this.cacheService.getOrSet(
      `delete_playlist_${playlistId}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async addPlaylistItem(options: {
    playlistId: string;
    videoId: string;
    position?: number;
    note?: string;
  }): Promise<LeanPlaylistItem> {
    const operation = async (): Promise<LeanPlaylistItem> => {
      try {
        const requestBody: any = {
          snippet: {
            playlistId: options.playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: options.videoId,
            },
          },
        };

        if (options.position !== undefined) {
          requestBody.snippet.position = options.position;
        }

        if (options.note) {
          requestBody.snippet.note = options.note;
        }

        const response = await this.trackCost(
          () =>
            this.youtube.playlistItems.insert({
              part: ["snippet", "contentDetails"],
              requestBody,
            }),
          API_COSTS["playlistItems.insert"]
        );

        const playlistItem = response.data;
        return {
          videoId: playlistItem.contentDetails?.videoId,
          title: playlistItem.snippet?.title,
          channelTitle: playlistItem.snippet?.videoOwnerChannelTitle,
          position: parseYouTubeNumber(playlistItem.snippet?.position?.toString()),
          publishedAt: playlistItem.snippet?.publishedAt,
          duration: null, // Will be fetched separately if needed
        };
      } catch (error) {
        throw new Error(`YouTube API call for addPlaylistItem failed for playlistId: ${options.playlistId}, videoId: ${options.videoId}`);
      }
    };

    return this.cacheService.getOrSet(
      `add_playlist_item_${options.playlistId}_${options.videoId}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async removePlaylistItem(playlistItemId: string): Promise<{ message: string }> {
    const operation = async (): Promise<{ message: string }> => {
      try {
        await this.trackCost(
          () =>
            this.youtube.playlistItems.delete({
              id: playlistItemId,
            }),
          API_COSTS["playlistItems.delete"]
        );
        return { message: "Playlist item removed successfully" };
      } catch (error) {
        throw new Error(`YouTube API call for removePlaylistItem failed for playlistItemId: ${playlistItemId}`);
      }
    };

    return this.cacheService.getOrSet(
      `remove_playlist_item_${playlistItemId}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async reorderPlaylistItems(options: {
    playlistId: string;
    playlistItemId: string;
    moveAfterId?: string;
    moveBeforeId?: string;
  }): Promise<LeanPlaylistItem> {
    const operation = async (): Promise<LeanPlaylistItem> => {
      try {
        const requestBody: any = {
          id: options.playlistItemId,
        };

        if (options.moveAfterId) {
          requestBody.moveAfterId = options.moveAfterId;
        }

        if (options.moveBeforeId) {
          requestBody.moveBeforeId = options.moveBeforeId;
        }

        const response = await this.trackCost(
          () =>
            this.youtube.playlistItems.update({
              part: ["snippet", "contentDetails"],
              requestBody,
            }),
          API_COSTS["playlistItems.update"]
        );

        const playlistItem = response.data;
        return {
          videoId: playlistItem.contentDetails?.videoId,
          title: playlistItem.snippet?.title,
          channelTitle: playlistItem.snippet?.videoOwnerChannelTitle,
          position: parseYouTubeNumber(playlistItem.snippet?.position?.toString()),
          publishedAt: playlistItem.snippet?.publishedAt,
          duration: null, // Will be fetched separately if needed
        };
      } catch (error) {
        throw new Error(`YouTube API call for reorderPlaylistItems failed for playlistId: ${options.playlistId}, playlistItemId: ${options.playlistItemId}`);
      }
    };

    return this.cacheService.getOrSet(
      `reorder_playlist_items_${options.playlistId}_${options.playlistItemId}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }

  async getPlaylistAnalytics(options: {
    playlistId: string;
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<{
    playlistId: string;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    averageWatchTime: number;
    engagementRate: number;
    topPerformingVideos: LeanPlaylistItem[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  }> {
    const cacheKey = this.cacheService.createOperationKey(
      "getPlaylistAnalytics",
      options
    );

    const operation = async (): Promise<{
      playlistId: string;
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      averageWatchTime: number;
      engagementRate: number;
      topPerformingVideos: LeanPlaylistItem[];
      dateRange: {
        startDate: string;
        endDate: string;
      };
    }> => {
      try {
        // Get playlist items first
        const playlistItems = await this.getPlaylistItems(options.playlistId, { maxResults: 50, videoDetails: true });
        
        if (playlistItems.length === 0) {
          return {
            playlistId: options.playlistId,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            averageWatchTime: 0,
            engagementRate: 0,
            topPerformingVideos: [],
            dateRange: {
              startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: options.endDate || new Date().toISOString().split('T')[0],
            },
          };
        }

        // Get video IDs for analytics
        const videoIds = playlistItems
          .map((item) => item.videoId)
          .filter((id): id is string => id !== null && id !== undefined);

        if (videoIds.length === 0) {
          return {
            playlistId: options.playlistId,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            averageWatchTime: 0,
            engagementRate: 0,
            topPerformingVideos: [],
            dateRange: {
              startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: options.endDate || new Date().toISOString().split('T')[0],
            },
          };
        }

        // Fetch video statistics
        const videoStats: any[] = [];
        for (let i = 0; i < videoIds.length; i += this.MAX_RESULTS_PER_PAGE) {
          const batch = videoIds.slice(i, i + this.MAX_RESULTS_PER_PAGE);
          const response = await this.trackCost(
            () =>
              this.youtube.videos.list({
                part: ["statistics", "contentDetails"],
                id: batch,
              }),
            API_COSTS["videos.list"]
          );

          if (response.data.items) {
            videoStats.push(...response.data.items);
          }
        }

        // Calculate analytics
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalWatchTime = 0;
        let videoCount = 0;

        const videosWithStats = playlistItems.map((item) => {
          const stats = videoStats.find((v) => v.id === item.videoId);
          if (stats) {
            const views = parseInt(stats.statistics?.viewCount || "0");
            const likes = parseInt(stats.statistics?.likeCount || "0");
            const comments = parseInt(stats.statistics?.commentCount || "0");
            
            totalViews += views;
            totalLikes += likes;
            totalComments += comments;
            totalShares += 0; // YouTube API doesn't provide share count directly
            videoCount++;

            return {
              ...item,
              viewCount: views,
              likeCount: likes,
              commentCount: comments,
            };
          }
          return item;
        });

        // Sort by views to get top performing videos
        const topPerformingVideos = videosWithStats
          .sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0))
          .slice(0, 10);

        const averageWatchTime = videoCount > 0 ? totalViews / videoCount : 0;
        const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

        return {
          playlistId: options.playlistId,
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          averageWatchTime,
          engagementRate,
          topPerformingVideos,
          dateRange: {
            startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: options.endDate || new Date().toISOString().split('T')[0],
          },
        };
      } catch (error) {
        throw new Error(`YouTube API call for getPlaylistAnalytics failed for playlistId: ${options.playlistId}`);
      }
    };

    return this.cacheService.getOrSet(
      cacheKey,
      operation,
      CACHE_TTLS.STANDARD,
      CACHE_COLLECTIONS.PLAYLIST_ANALYTICS,
      options
    );
  }

  async managePlaylistCollaborators(options: {
    playlistId: string;
    action: "add" | "remove" | "list";
    collaboratorEmail?: string;
    role?: "owner" | "editor" | "viewer";
  }): Promise<{
    collaborators: Array<{
      email: string;
      role: string;
      addedAt: string;
    }>;
    message: string;
  }> {
    const operation = async (): Promise<{
      collaborators: Array<{
        email: string;
        role: string;
        addedAt: string;
      }>;
      message: string;
    }> => {
      try {
        // Note: YouTube Data API v3 doesn't directly support playlist collaboration management
        // This is a placeholder implementation that would require YouTube Analytics API or
        // YouTube Content Owner API for full functionality
        
        if (options.action === "list") {
          // For now, return empty list as this requires additional API permissions
          return {
            collaborators: [],
            message: "Collaborator listing requires YouTube Analytics API or Content Owner API access",
          };
        } else if (options.action === "add") {
          if (!options.collaboratorEmail || !options.role) {
            throw new Error("Collaborator email and role are required for add action");
          }
          
          return {
            collaborators: [{
              email: options.collaboratorEmail,
              role: options.role,
              addedAt: new Date().toISOString(),
            }],
            message: `Collaborator ${options.collaboratorEmail} added with role ${options.role}. Note: This is a simulation as YouTube Data API v3 doesn't support direct collaborator management.`,
          };
        } else if (options.action === "remove") {
          if (!options.collaboratorEmail) {
            throw new Error("Collaborator email is required for remove action");
          }
          
          return {
            collaborators: [],
            message: `Collaborator ${options.collaboratorEmail} removed. Note: This is a simulation as YouTube Data API v3 doesn't support direct collaborator management.`,
          };
        }

        throw new Error(`Invalid action: ${options.action}`);
      } catch (error) {
        throw new Error(`YouTube API call for managePlaylistCollaborators failed for playlistId: ${options.playlistId}`);
      }
    };

    return this.cacheService.getOrSet(
      `manage_collaborators_${options.playlistId}_${options.action}_${Date.now()}`,
      operation,
      CACHE_TTLS.DYNAMIC,
      CACHE_COLLECTIONS.CONTENT_MANAGEMENT
    );
  }
}