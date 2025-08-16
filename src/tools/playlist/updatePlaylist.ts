import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const updatePlaylistSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to update"),
  title: z.string().min(1).optional().describe("New playlist title"),
  description: z.string().optional().describe("New playlist description"),
  privacyStatus: z.enum(["private", "unlisted", "public"]).optional().describe("New privacy status"),
  tags: z.array(z.string()).optional().describe("New tags for the playlist"),
  defaultLanguage: z.string().optional().describe("New default language"),
});

export const updatePlaylistConfig = {
  name: "updatePlaylist",
  description: "Update an existing YouTube playlist. Modify title, description, privacy status, and other metadata.",
  inputSchema: updatePlaylistSchema,
};

export const updatePlaylistHandler = async (
  params: z.infer<typeof updatePlaylistSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = updatePlaylistSchema.parse(params);
    const playlist = await playlistService.updatePlaylist(validatedParams);
    return formatSuccess(playlist);
  } catch (error: any) {
    return formatError(error);
  }
};
