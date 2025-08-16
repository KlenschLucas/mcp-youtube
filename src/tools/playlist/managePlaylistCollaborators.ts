import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const managePlaylistCollaboratorsSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID"),
  action: z.enum(["add", "remove", "list"]).describe("Action to perform: add, remove, or list collaborators"),
  collaboratorEmail: z.string().email().optional().describe("Email of collaborator (required for add/remove actions)"),
  role: z.enum(["owner", "editor", "viewer"]).optional().describe("Role for the collaborator (required for add action)"),
});

export const managePlaylistCollaboratorsConfig = {
  name: "managePlaylistCollaborators",
  description: "Manage collaborators for a YouTube playlist. Add, remove, or list collaborators with different roles. Note: This is a simulation as YouTube Data API v3 doesn't support direct collaborator management.",
  inputSchema: managePlaylistCollaboratorsSchema,
};

export const managePlaylistCollaboratorsHandler = async (
  params: z.infer<typeof managePlaylistCollaboratorsSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = managePlaylistCollaboratorsSchema.parse(params);
    const result = await playlistService.managePlaylistCollaborators(validatedParams);
    return formatSuccess(result);
  } catch (error: any) {
    return formatError(error);
  }
};
