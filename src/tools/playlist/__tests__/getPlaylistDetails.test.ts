import { getPlaylistDetailsHandler, getPlaylistDetailsSchema } from "../getPlaylistDetails.js";
import { PlaylistService } from "../../../services/playlist.service.js";
import type { LeanPlaylistDetails } from "../../../types/youtube.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("getPlaylistDetails", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      getPlaylistDetails: jest.fn(),
    } as any;
  });

  describe("getPlaylistDetailsSchema", () => {
    it("should validate valid playlist ID", () => {
      const validParams = { playlistId: "PL1234567890" };
      const result = getPlaylistDetailsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject empty playlist ID", () => {
      const invalidParams = { playlistId: "" };
      const result = getPlaylistDetailsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("should reject missing playlist ID", () => {
      const invalidParams = {};
      const result = getPlaylistDetailsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("getPlaylistDetailsHandler", () => {
    it("should return playlist details successfully", async () => {
      const mockPlaylistDetails: LeanPlaylistDetails = {
        id: "PL1234567890",
        title: "Test Playlist",
        description: "A test playlist",
        channelId: "UC1234567890",
        channelTitle: "Test Channel",
        publishedAt: "2023-01-01T00:00:00Z",
        itemCount: 10,
        privacyStatus: "public",
      };

      mockPlaylistService.getPlaylistDetails.mockResolvedValue(mockPlaylistDetails);

      const params = { playlistId: "PL1234567890" };
      const result = await getPlaylistDetailsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockPlaylistDetails, null, 2),
        },
      ]);
      expect(mockPlaylistService.getPlaylistDetails).toHaveBeenCalledWith("PL1234567890");
    });

    it("should handle service errors gracefully", async () => {
      const error = new Error("Playlist not found");
      mockPlaylistService.getPlaylistDetails.mockRejectedValue(error);

      const params = { playlistId: "PL1234567890" };
      const result = await getPlaylistDetailsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Playlist not found");
    });

    it("should handle validation errors", async () => {
      const params = { playlistId: "" }; // Invalid params
      const result = await getPlaylistDetailsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Playlist ID cannot be empty");
      expect(mockPlaylistService.getPlaylistDetails).not.toHaveBeenCalled();
    });
  });
});
