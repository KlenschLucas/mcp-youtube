import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const reorderPlaylistItemsSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID"),
  playlistItemId: z.string().min(1).describe("Playlist item ID to move"),
  moveAfterId: z.string().optional().describe("Move item after this playlist item ID (optional)"),
  moveBeforeId: z.string().optional().describe("Move item before this playlist item ID (optional)"),
});

export const reorderPlaylistItemsConfig = {
  name: "reorderPlaylistItems",
  description: "Reorder items within a YouTube playlist. Move an item to a specific position.",
  inputSchema: reorderPlaylistItemsSchema,
};

export const reorderPlaylistItemsHandler = async (
  params: z.infer<typeof reorderPlaylistItemsSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = reorderPlaylistItemsSchema.parse(params);
    const result = await playlistService.reorderPlaylistItems(validatedParams);
    return formatSuccess(result);
  } catch (error: any) {
    return formatError(error);
  }
};
