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
}