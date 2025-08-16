import { deletePlaylistHandler, deletePlaylistSchema } from "../deletePlaylist.js";
import { PlaylistService } from "../../../services/playlist.service.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("deletePlaylist", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      deletePlaylist: jest.fn(),
    } as any;
  });

  describe("deletePlaylistSchema", () => {
    it("should validate valid playlist deletion parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
      };

      const result = deletePlaylistSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = {
        playlistId: "",
      };

      const result = deletePlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Playlist ID cannot be empty");
      }
    });

    it("should reject missing playlist ID", () => {
      const invalidParams = {};

      const result = deletePlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("deletePlaylistHandler", () => {
    it("should successfully delete a playlist", async () => {
      const params = {
        playlistId: "PL1234567890",
      };

      const mockResult = { message: "Playlist deleted successfully" };
      mockPlaylistService.deletePlaylist.mockResolvedValue(mockResult);

      const result = await deletePlaylistHandler(params, mockPlaylistService);

      expect(mockPlaylistService.deletePlaylist).toHaveBeenCalledWith(params.playlistId);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResult, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        playlistId: "PL1234567890",
      };

      const error = new Error("YouTube API call for deletePlaylist failed");
      mockPlaylistService.deletePlaylist.mockRejectedValue(error);

      const result = await deletePlaylistHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("YouTube API call for deletePlaylist failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        playlistId: "", // Invalid empty playlist ID
      };

      const result = await deletePlaylistHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect((result.error as any)?.message).toContain("Playlist ID cannot be empty");
    });
  });
});
