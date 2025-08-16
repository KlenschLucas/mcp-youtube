import { searchPlaylistsHandler, searchPlaylistsSchema } from "../searchPlaylists.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistSearchResult } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("searchPlaylists", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      searchPlaylists: jest.fn(),
    } as any;
  });

  describe("searchPlaylistsSchema", () => {
    it("should validate valid search parameters", () => {
      const validParams = {
        query: "cooking recipes",
        maxResults: 20,
        channelId: "UC1234567890",
        regionCode: "US",
      };
      const result = searchPlaylistsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should use default values for optional parameters", () => {
      const params = { query: "test query" };
      const result = searchPlaylistsSchema.parse(params);
      expect(result.maxResults).toBe(10);
    });

    it("should reject empty query", () => {
      const invalidParams = { query: "" };
      const result = searchPlaylistsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("should reject invalid region code", () => {
      const invalidParams = {
        query: "test",
        regionCode: "USA", // Should be 2 characters
      };
      const result = searchPlaylistsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("should reject invalid maxResults", () => {
      const invalidParams = {
        query: "test",
        maxResults: 1000, // Too high
      };
      const result = searchPlaylistsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("searchPlaylistsHandler", () => {
    it("should return search results successfully", async () => {
      const mockSearchResults: LeanPlaylistSearchResult[] = [
        {
          playlistId: "PL1234567890",
          title: "Cooking Recipes",
          description: "A collection of cooking recipes",
          channelId: "UC1234567890",
          channelTitle: "Cooking Channel",
          publishedAt: "2023-01-01T00:00:00Z",
          itemCount: 25,
        },
        {
          playlistId: "PL0987654321",
          title: "Quick Recipes",
          description: "Quick and easy recipes",
          channelId: "UC0987654321",
          channelTitle: "Quick Cooking",
          publishedAt: "2023-01-02T00:00:00Z",
          itemCount: 15,
        },
      ];

      mockPlaylistService.searchPlaylists.mockResolvedValue(mockSearchResults);

      const params = {
        query: "cooking recipes",
        maxResults: 20,
        regionCode: "US",
      };
      const result = await searchPlaylistsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockSearchResults, null, 2),
        },
      ]);
      expect(mockPlaylistService.searchPlaylists).toHaveBeenCalledWith({
        query: "cooking recipes",
        maxResults: 20,
        regionCode: "US",
      });
    });

    it("should handle channel filtering", async () => {
      const mockSearchResults: LeanPlaylistSearchResult[] = [];
      mockPlaylistService.searchPlaylists.mockResolvedValue(mockSearchResults);

      const params = {
        query: "tutorials",
        channelId: "UC1234567890",
        maxResults: 5,
      };
      await searchPlaylistsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.searchPlaylists).toHaveBeenCalledWith({
        query: "tutorials",
        channelId: "UC1234567890",
        maxResults: 5,
      });
    });

    it("should handle service errors gracefully", async () => {
      const error = new Error("Search failed");
      mockPlaylistService.searchPlaylists.mockRejectedValue(error);

      const params = { query: "test query" };
      const result = await searchPlaylistsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Search failed");
    });

    it("should handle validation errors", async () => {
      const params = { query: "", maxResults: 1000 }; // Invalid params
      const result = await searchPlaylistsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Query cannot be empty");
      expect(mockPlaylistService.searchPlaylists).not.toHaveBeenCalled();
    });
  });
});
