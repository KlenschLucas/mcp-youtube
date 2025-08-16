import { reorderPlaylistItemsHandler, reorderPlaylistItemsSchema } from "../reorderPlaylistItems.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistItem } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("reorderPlaylistItems", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      reorderPlaylistItems: jest.fn(),
    } as any;
  });

  describe("reorderPlaylistItemsSchema", () => {
    it("should validate valid parameters with moveAfterId", () => {
      const validParams = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveAfterId: "PLI0987654321",
      };

      const result = reorderPlaylistItemsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate valid parameters with moveBeforeId", () => {
      const validParams = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveBeforeId: "PLI0987654321",
      };

      const result = reorderPlaylistItemsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate valid parameters with both moveAfterId and moveBeforeId", () => {
      const validParams = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveAfterId: "PLI0987654321",
        moveBeforeId: "PLI1111111111",
      };

      const result = reorderPlaylistItemsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = {
        playlistId: "",
        playlistItemId: "PLI1234567890",
      };

      const result = reorderPlaylistItemsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Playlist ID cannot be empty");
      }
    });

    it("should reject empty playlist item ID", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        playlistItemId: "",
      };

      const result = reorderPlaylistItemsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("String must contain at least 1 character(s)");
      }
    });
  });

  describe("reorderPlaylistItemsHandler", () => {
    it("should successfully reorder playlist items with moveAfterId", async () => {
      const params = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveAfterId: "PLI0987654321",
      };

      const mockResponse: LeanPlaylistItem = {
        videoId: "ABC123DEF45",
        title: "Test Video",
        channelTitle: "Test Channel",
        position: 1,
        publishedAt: "2024-01-01T00:00:00Z",
        duration: null,
      };

      mockPlaylistService.reorderPlaylistItems.mockResolvedValue(mockResponse);

      const result = await reorderPlaylistItemsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.reorderPlaylistItems).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResponse, null, 2),
        },
      ]);
    });

    it("should successfully reorder playlist items with moveBeforeId", async () => {
      const params = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveBeforeId: "PLI0987654321",
      };

      const mockResponse: LeanPlaylistItem = {
        videoId: "ABC123DEF45",
        title: "Test Video",
        channelTitle: "Test Channel",
        position: 0,
        publishedAt: "2024-01-01T00:00:00Z",
        duration: null,
      };

      mockPlaylistService.reorderPlaylistItems.mockResolvedValue(mockResponse);

      const result = await reorderPlaylistItemsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.reorderPlaylistItems).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResponse, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        playlistId: "PL1234567890",
        playlistItemId: "PLI1234567890",
        moveAfterId: "PLI0987654321",
      };

      const error = new Error("YouTube API call for reorderPlaylistItems failed");
      mockPlaylistService.reorderPlaylistItems.mockRejectedValue(error);

      const result = await reorderPlaylistItemsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("YouTube API call for reorderPlaylistItems failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        playlistId: "",
        playlistItemId: "PLI1234567890",
      };

      const result = await reorderPlaylistItemsHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("Playlist ID cannot be empty");
    });
  });
});
