import { getPlaylistAnalyticsHandler, getPlaylistAnalyticsSchema } from "../getPlaylistAnalytics.js";
import { PlaylistService } from "../../../services/playlist.service.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("getPlaylistAnalytics", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      getPlaylistAnalytics: jest.fn(),
    } as any;
  });

  describe("getPlaylistAnalyticsSchema", () => {
    it("should validate valid analytics parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        metrics: ["views", "likes", "comments"],
      };

      const result = getPlaylistAnalyticsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate minimal parameters", () => {
      const minimalParams = {
        playlistId: "PL1234567890",
      };

      const result = getPlaylistAnalyticsSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
    });

    it("should accept valid date format", () => {
      const validParams = {
        playlistId: "PL1234567890",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = getPlaylistAnalyticsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });

  describe("getPlaylistAnalyticsHandler", () => {
    it("should return analytics data for a playlist", async () => {
      const mockAnalytics = {
        playlistId: "PL1234567890",
        totalViews: 10000,
        totalLikes: 500,
        totalComments: 200,
        totalShares: 50,
        averageWatchTime: 1000,
        engagementRate: 7.5,
        topPerformingVideos: [
          {
            videoId: "ABC123",
            title: "Top Video",
            channelTitle: "Test Channel",
            position: 0,
            publishedAt: "2024-01-01T00:00:00Z",
            duration: "PT10M30S",
          },
        ],
        dateRange: {
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        },
      };

      mockPlaylistService.getPlaylistAnalytics.mockResolvedValue(mockAnalytics);

    const params = {
      playlistId: "PL1234567890",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      metrics: ["views", "likes", "comments"],
    };

    const result = await getPlaylistAnalyticsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.getPlaylistAnalytics).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockAnalytics, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        playlistId: "PL1234567890",
      };

      const error = new Error("YouTube API call for getPlaylistAnalytics failed");
      mockPlaylistService.getPlaylistAnalytics.mockRejectedValue(error);

      const result = await getPlaylistAnalyticsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("YouTube API call for getPlaylistAnalytics failed");
    });

    it("should work with minimal parameters", async () => {
      const mockAnalytics = {
        playlistId: "PL1234567890",
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageWatchTime: 0,
        engagementRate: 0,
        topPerformingVideos: [],
        dateRange: {
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        },
      };

      mockPlaylistService.getPlaylistAnalytics.mockResolvedValue(mockAnalytics);

      const params = {
        playlistId: "PL1234567890",
      };

      const result = await getPlaylistAnalyticsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockAnalytics, null, 2),
        },
      ]);
    });
  });
});
