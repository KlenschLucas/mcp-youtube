import { addPlaylistItemHandler, addPlaylistItemSchema } from "../addPlaylistItem.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistItem } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("addPlaylistItem", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      addPlaylistItem: jest.fn(),
    } as any;
  });

  describe("addPlaylistItemSchema", () => {
    it("should validate valid parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        videoId: "ABC123DEF45",
        position: 0,
        note: "Great video!",
      };

      const result = addPlaylistItemSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = {
        playlistId: "",
        videoId: "ABC123DEF45",
      };

      const result = addPlaylistItemSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Playlist ID cannot be empty");
      }
    });

    it("should reject empty video ID", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        videoId: "",
      };

      const result = addPlaylistItemSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Video ID cannot be empty");
      }
    });

    it("should reject negative position", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        videoId: "ABC123DEF45",
        position: -1,
      };

      const result = addPlaylistItemSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("addPlaylistItemHandler", () => {
    it("should successfully add a playlist item", async () => {
      const params = {
        playlistId: "PL1234567890",
        videoId: "ABC123DEF45",
        position: 0,
        note: "Great video!",
      };

      const mockResponse: LeanPlaylistItem = {
        videoId: "ABC123DEF45",
        title: "Test Video",
        channelTitle: "Test Channel",
        position: 0,
        publishedAt: "2024-01-01T00:00:00Z",
        duration: null,
      };

      mockPlaylistService.addPlaylistItem.mockResolvedValue(mockResponse);

      const result = await addPlaylistItemHandler(params, mockPlaylistService);

      expect(mockPlaylistService.addPlaylistItem).toHaveBeenCalledWith(params);
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
        videoId: "ABC123DEF45",
      };

      const error = new Error("YouTube API call for addPlaylistItem failed");
      mockPlaylistService.addPlaylistItem.mockRejectedValue(error);

      const result = await addPlaylistItemHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("YouTube API call for addPlaylistItem failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        playlistId: "",
        videoId: "ABC123DEF45",
      };

      const result = await addPlaylistItemHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("Playlist ID cannot be empty");
    });
  });
});
