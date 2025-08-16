import { managePlaylistCollaboratorsHandler, managePlaylistCollaboratorsSchema } from "../managePlaylistCollaborators.js";
import { PlaylistService } from "../../../services/playlist.service.js";

// Mock the PlaylistService
jest.mock("../../../services/playlist.service.js");

describe("managePlaylistCollaborators", () => {
  let mockPlaylistService: jest.Mocked<PlaylistService>;

  beforeEach(() => {
    mockPlaylistService = {
      managePlaylistCollaborators: jest.fn(),
    } as any;
  });

  describe("managePlaylistCollaboratorsSchema", () => {
    it("should validate valid add collaborator parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        action: "add" as const,
        collaboratorEmail: "john@example.com",
        role: "editor" as const,
      };

      const result = managePlaylistCollaboratorsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate valid remove collaborator parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        action: "remove" as const,
        collaboratorEmail: "john@example.com",
      };

      const result = managePlaylistCollaboratorsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should validate valid list collaborators parameters", () => {
      const validParams = {
        playlistId: "PL1234567890",
        action: "list" as const,
      };

      const result = managePlaylistCollaboratorsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        action: "add" as const,
        collaboratorEmail: "invalid-email",
        role: "editor" as const,
      };

      const result = managePlaylistCollaboratorsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("should reject invalid action", () => {
      const invalidParams = {
        playlistId: "PL1234567890",
        action: "invalid" as any,
      };

      const result = managePlaylistCollaboratorsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("managePlaylistCollaboratorsHandler", () => {
    it("should add a collaborator successfully", async () => {
      const mockResult = {
        collaborators: [
          {
            email: "john@example.com",
            role: "editor",
            addedAt: "2024-01-01T00:00:00Z",
          },
        ],
        message: "Collaborator john@example.com added with role editor. Note: This is a simulation as YouTube Data API v3 doesn't support direct collaborator management.",
      };

      mockPlaylistService.managePlaylistCollaborators.mockResolvedValue(mockResult);

    const params = {
      playlistId: "PL1234567890",
      action: "add" as const,
      collaboratorEmail: "john@example.com",
      role: "editor" as const,
    };

    const result = await managePlaylistCollaboratorsHandler(params, mockPlaylistService);

      expect(mockPlaylistService.managePlaylistCollaborators).toHaveBeenCalledWith(params);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResult, null, 2),
        },
      ]);
    });

    it("should remove a collaborator successfully", async () => {
      const mockResult = {
        collaborators: [],
        message: "Collaborator jane@example.com removed. Note: This is a simulation as YouTube Data API v3 doesn't support direct collaborator management.",
      };

      mockPlaylistService.managePlaylistCollaborators.mockResolvedValue(mockResult);

    const params = {
      playlistId: "PL1234567890",
      action: "remove" as const,
      collaboratorEmail: "jane@example.com",
    };

      const result = await managePlaylistCollaboratorsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResult, null, 2),
        },
      ]);
    });

    it("should list collaborators successfully", async () => {
      const mockResult = {
        collaborators: [],
        message: "Collaborator listing requires YouTube Analytics API or Content Owner API access",
      };

      mockPlaylistService.managePlaylistCollaborators.mockResolvedValue(mockResult);

    const params = {
      playlistId: "PL1234567890",
      action: "list" as const,
    };

      const result = await managePlaylistCollaboratorsHandler(params, mockPlaylistService);

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
        action: "add" as const,
        collaboratorEmail: "test@example.com",
        role: "viewer" as const,
      };

      const error = new Error("YouTube API call for managePlaylistCollaborators failed");
      mockPlaylistService.managePlaylistCollaborators.mockRejectedValue(error);

      const result = await managePlaylistCollaboratorsHandler(params, mockPlaylistService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("YouTube API call for managePlaylistCollaborators failed");
    });

    it("should work with minimal parameters for list action", async () => {
      const mockResult = {
        collaborators: [],
        message: "Collaborator listing requires YouTube Analytics API or Content Owner API access",
      };

      mockPlaylistService.managePlaylistCollaborators.mockResolvedValue(mockResult);

      const params = {
        playlistId: "PL1234567890",
        action: "list" as const,
      };

      const result = await managePlaylistCollaboratorsHandler(params, mockPlaylistService);

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResult, null, 2),
        },
      ]);
    });
  });
});
