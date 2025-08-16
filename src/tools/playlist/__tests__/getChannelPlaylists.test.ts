import { getChannelPlaylistsHandler, getChannelPlaylistsSchema } from "../getChannelPlaylists.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistDetails } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("getChannelPlaylists", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      getChannelPlaylists: jest.fn(),
    } as any;
  });

  describe("getChannelPlaylistsSchema", () => {
    it("should validate valid parameters", () => {
      const validParams = {
        channelId: "UC1234567890",
        maxResults: 25,
        pageToken: "nextPageToken",
      };
      const result = getChannelPlaylistsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should use default values for optional parameters", () => {
      const params = { channelId: "UC1234567890" };
      const result = getChannelPlaylistsSchema.parse(params);
      expect(result.maxResults).toBe(50);
    });

    it("should reject empty channel ID", () => {
      const invalidParams = { channelId: "" };
      const result = getChannelPlaylistsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("should reject invalid maxResults", () => {
      const invalidParams = {
        channelId: "UC1234567890",
        maxResults: 1000, // Too high
      };
      const result = getChannelPlaylistsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("getChannelPlaylistsHandler", () => {
    it("should return channel playlists successfully", async () => {
      const mockChannelPlaylists: LeanPlaylistDetails[] = [
        {
          id: "PL1234567890",
          title: "Tutorial Series",
          description: "A series of tutorials",
          channelId: "UC1234567890",
          channelTitle: "Tutorial Channel",
          publishedAt: "2023-01-01T00:00:00Z",
          itemCount: 20,
          privacyStatus: "public",
        },
        {
          id: "PL0987654321",
          title: "Quick Tips",
          description: "Quick tips and tricks",
          channelId: "UC1234567890",
          channelTitle: "Tutorial Channel",
          publishedAt: "2023-01-02T00:00:00Z",
          itemCount: 10,
          privacyStatus: "public",
        },
      ];

      mockPlaylistService.getChannelPlaylists.mockResolvedValue(mockChannelPlaylists);

      const params = {
        channelId: "UC1234567890",
        maxResults: 25,
      };
      const result = await getChannelPlaylistsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockChannelPlaylists, null, 2),
        },
      ]);
      expect(mockPlaylistService.getChannelPlaylists).toHaveBeenCalledWith("UC1234567890", {
        maxResults: 25,
      });
    });

    it("should handle pagination parameters", async () => {
      const mockChannelPlaylists: LeanPlaylistDetails[] = [];
      mockPlaylistService.getChannelPlaylists.mockResolvedValue(mockChannelPlaylists);

      const params = {
        channelId: "UC1234567890",
        pageToken: "nextPageToken",
        maxResults: 10,
      };
      await getChannelPlaylistsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.getChannelPlaylists).toHaveBeenCalledWith("UC1234567890", {
        maxResults: 10,
        pageToken: "nextPageToken",
      });
    });

    it("should handle empty playlist list", async () => {
      const mockChannelPlaylists: LeanPlaylistDetails[] = [];
      mockPlaylistService.getChannelPlaylists.mockResolvedValue(mockChannelPlaylists);

      const params = { channelId: "UC1234567890" };
      const result = await getChannelPlaylistsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify([], null, 2),
        },
      ]);
    });

    it("should handle service errors gracefully", async () => {
      const error = new Error("Channel not found");
      mockPlaylistService.getChannelPlaylists.mockRejectedValue(error);

      const params = { channelId: "UC1234567890" };
      const result = await getChannelPlaylistsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Channel not found");
    });

    it("should handle validation errors", async () => {
      const params = { channelId: "", maxResults: 1000 }; // Invalid params
      const result = await getChannelPlaylistsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Channel ID cannot be empty");
      expect(mockPlaylistService.getChannelPlaylists).not.toHaveBeenCalled();
    });
  });
});
