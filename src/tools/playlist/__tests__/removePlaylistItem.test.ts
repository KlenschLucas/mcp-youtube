import { removePlaylistItemHandler, removePlaylistItemSchema } from "../removePlaylistItem.js";
import { PlaylistService } from "../../../services/playlist.service.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("removePlaylistItem", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      removePlaylistItem: jest.fn(),
    } as any;
  });

  describe("removePlaylistItemSchema", () => {
    it("should validate valid parameters", () => {
      const validParams = {
        playlistItemId: "PLI1234567890",
      };

      const result = removePlaylistItemSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist item ID", () => {
      const invalidParams = {
        playlistItemId: "",
      };

      const result = removePlaylistItemSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Playlist item ID cannot be empty");
      }
    });
  });

  describe("removePlaylistItemHandler", () => {
    it("should successfully remove a playlist item", async () => {
      const params = {
        playlistItemId: "PLI1234567890",
      };

      const mockResponse = {
        message: "Playlist item removed successfully",
      };

      mockPlaylistService.removePlaylistItem.mockResolvedValue(mockResponse);

      const result = await removePlaylistItemHandler(params, mockPlaylistService);

      expect(mockPlaylistService.removePlaylistItem).toHaveBeenCalledWith(params.playlistItemId);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResponse, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        playlistItemId: "PLI1234567890",
      };

      const error = new Error("YouTube API call for removePlaylistItem failed");
      mockPlaylistService.removePlaylistItem.mockRejectedValue(error);

      const result = await removePlaylistItemHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("YouTube API call for removePlaylistItem failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        playlistItemId: "",
      };

      const result = await removePlaylistItemHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("Playlist item ID cannot be empty");
    });
  });
});
