import { createPlaylistHandler, createPlaylistSchema } from "../createPlaylist.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistDetails } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("createPlaylist", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      createPlaylist: jest.fn(),
    } as any;
  });

  describe("createPlaylistSchema", () => {
    it("should validate valid playlist creation parameters", () => {
      const validParams = {
        title: "My Test Playlist",
        description: "A test playlist",
        privacyStatus: "private" as const,
        tags: ["test", "playlist"],
        defaultLanguage: "en",
      };

      const result = createPlaylistSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate minimal parameters", () => {
      const minimalParams = {
        title: "My Test Playlist",
      };

      const result = createPlaylistSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidParams = {
        title: "",
        description: "A test playlist",
      };

      const result = createPlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Title cannot be empty");
      }
    });

    it("should reject invalid privacy status", () => {
      const invalidParams = {
        title: "My Test Playlist",
        privacyStatus: "invalid" as any,
      };

      const result = createPlaylistSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("createPlaylistHandler", () => {
    it("should successfully create a playlist", async () => {
      const params = {
        title: "My Test Playlist",
        description: "A test playlist",
        privacyStatus: "private" as const,
        tags: ["test", "playlist"],
        defaultLanguage: "en",
      };

      const mockPlaylist: LeanPlaylistDetails = {
        id: "PL1234567890",
        title: "My Test Playlist",
        description: "A test playlist",
        channelId: "UC1234567890",
        channelTitle: "Test Channel",
        publishedAt: "2024-01-01T00:00:00Z",
        itemCount: 0,
        privacyStatus: "private",
      };

      mockPlaylistService.createPlaylist.mockResolvedValue(mockPlaylist);

      const result = await createPlaylistHandler(params, mockPlaylistService);

      expect(mockPlaylistService.createPlaylist).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockPlaylist, null, 2),
        },
      ]);
    });

    it("should handle service errors", async () => {
      const params = {
        title: "My Test Playlist",
      };

      const error = new Error("YouTube API call for createPlaylist failed");
      mockPlaylistService.createPlaylist.mockRejectedValue(error);

      const result = await createPlaylistHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("YouTube API call for createPlaylist failed");
    });

    it("should handle validation errors", async () => {
      const invalidParams = {
        title: "", // Invalid empty title
      };

      const result = await createPlaylistHandler(invalidParams as any, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Title cannot be empty");
    });
  });
});
