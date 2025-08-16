import { updatePlaylistHandler, updatePlaylistSchema } from "../updatePlaylist.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistDetails } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("updatePlaylist", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      updatePlaylist: jest.fn(),
    } as any;
  });

  describe("updatePlaylistSchema", () => {
    it("should validate valid playlist update parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        title: "Updated Playlist Title",
        description: "Updated description",
        privacyStatus: "public" as const,
        tags: ["updated", "tags"],
        defaultLanguage: "en",
      };

      const result = updatePlaylistSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate minimal parameters", () => {
      const minimalParams = {
        playlistId: "PL1234567890",
        title: "Updated Title",
      };

      const result = updatePlaylistSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = {
        playlistId: "",
        title: "Updated Title",
      };

      const result = updatePlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Playlist ID cannot be empty");
      }
    });

    it("should reject empty title when provided", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        title: "",
      };

      const result = updatePlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("String must contain at least 1 character(s)");
      }
    });

    it("should reject invalid privacy status", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        privacyStatus: "invalid" as any,
      };

      const result = updatePlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePlaylistHandler", () => {
    it("should successfully update a playlist", async () => {
      const params = {
        playlistId: "PL1234567890",
        title: "Updated Playlist Title",
        description: "Updated description",
        privacyStatus: "public" as const,
        tags: ["updated", "tags"],
        defaultLanguage: "en",
      };

      const mockPlaylist: LeanPlaylistDetails = {
        id: "PL1234567890",
        title: "Updated Playlist Title",
        description: "Updated description",
        channelId: "UC1234567890",
        channelTitle: "Test Channel",
        publishedAt: "2024-01-01T00:00:00Z",
        itemCount: 0,
        privacyStatus: "public",
      };

      mockPlaylistService.updatePlaylist.mockResolvedValue(mockPlaylist);

      const result = await updatePlaylistHandler(params, mockPlaylistService);

      expect(mockPlaylistService.updatePlaylist).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockPlaylist, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        playlistId: "PL1234567890",
        title: "Updated Title",
      };

      const error = new Error("YouTube API call for updatePlaylist failed");
      mockPlaylistService.updatePlaylist.mockRejectedValue(error);

      const result = await updatePlaylistHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("YouTube API call for updatePlaylist failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        playlistId: "", // Invalid empty playlist ID
        title: "Updated Title",
      };

      const result = await updatePlaylistHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Playlist ID cannot be empty");
    });
  });
});
