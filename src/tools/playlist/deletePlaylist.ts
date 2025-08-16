import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const deletePlaylistSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to delete"),
});

export const deletePlaylistConfig = {
  name: "deletePlaylist",
  description: "Delete a YouTube playlist. This action cannot be undone.",
  inputSchema: deletePlaylistSchema,
};

export const deletePlaylistHandler = async (
  params: z.infer<typeof deletePlaylistSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = deletePlaylistSchema.parse(params);
    const result = await playlistService.deletePlaylist(validatedParams.playlistId);
    return formatSuccess(result);
  } catch (error: any) {
    return formatError(error);
  }
};
