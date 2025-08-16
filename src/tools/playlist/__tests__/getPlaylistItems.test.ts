import { getPlaylistItemsHandler, getPlaylistItemsSchema } from "../getPlaylistItems.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistItem } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("getPlaylistItems", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      getPlaylistItems: jest.fn(),
    } as any;
  });

  describe("getPlaylistItemsSchema", () => {
    it("should validate valid parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        maxResults: 25,
        pageToken: "nextPageToken",
        videoDetails: true,
      };
      const result = getPlaylistItemsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should use default values for optional parameters", () => {
      const params = { playlistId: "PL1234567890" };
      const result = getPlaylistItemsSchema.parse(params);
      expect(result.maxResults).toBe(50);
      expect(result.videoDetails).toBe(false);
    });

    it("should reject invalid maxResults", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        maxResults: 1000, // Too high
      };
      const result = getPlaylistItemsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = { playlistId: "" };
      const result = getPlaylistItemsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("getPlaylistItemsHandler", () => {
    it("should return playlist items successfully", async () => {
      const mockPlaylistItems: LeanPlaylistItem[] = [
        {
          videoId: "video1",
          title: "Test Video 1",
          channelTitle: "Test Channel",
          position: 1,
          publishedAt: "2023-01-01T00:00:00Z",
          duration: "PT10M30S",
        },
        {
          videoId: "video2",
          title: "Test Video 2",
          channelTitle: "Test Channel",
          position: 2,
          publishedAt: "2023-01-02T00:00:00Z",
          duration: null,
        },
      ];

      mockPlaylistService.getPlaylistItems.mockResolvedValue(mockPlaylistItems);

      const params = {
        playlistId: "PL1234567890",
        maxResults: 25,
        videoDetails: true,
      };
      const result = await getPlaylistItemsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockPlaylistItems, null, 2),
        },
      ]);
      expect(mockPlaylistService.getPlaylistItems).toHaveBeenCalledWith("PL1234567890", {
        maxResults: 25,
        videoDetails: true,
      });
    });

    it("should handle pagination parameters", async () => {
      const mockPlaylistItems: LeanPlaylistItem[] = [];
      mockPlaylistService.getPlaylistItems.mockResolvedValue(mockPlaylistItems);

      const params = {
        playlistId: "PL1234567890",
        pageToken: "nextPageToken",
        maxResults: 10,
      };
      await getPlaylistItemsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.getPlaylistItems).toHaveBeenCalledWith("PL1234567890", {
        maxResults: 10,
        pageToken: "nextPageToken",
        videoDetails: false,
      });
    });

    it("should handle service errors gracefully", async () => {
      const error = new Error("Playlist not found");
      mockPlaylistService.getPlaylistItems.mockRejectedValue(error);

      const params = { playlistId: "PL1234567890" };
      const result = await getPlaylistItemsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Playlist not found");
    });

    it("should handle validation errors", async () => {
      const params = { playlistId: "", maxResults: 1000 }; // Invalid params
      const result = await getPlaylistItemsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Playlist ID cannot be empty");
      expect(mockPlaylistService.getPlaylistItems).not.toHaveBeenCalled();
    });
  });
});
