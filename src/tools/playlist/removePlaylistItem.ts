import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const removePlaylistItemSchema = z.object({
  playlistItemId: z.string().min(1, "Playlist item ID cannot be empty").describe("YouTube playlist item ID to remove"),
});

export const removePlaylistItemConfig = {
  name: "removePlaylistItem",
  description: "Remove a specific item from a YouTube playlist using its playlist item ID.",
  inputSchema: removePlaylistItemSchema,
};

export const removePlaylistItemHandler = async (
  params: z.infer<typeof removePlaylistItemSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = removePlaylistItemSchema.parse(params);
    const result = await playlistService.removePlaylistItem(validatedParams.playlistItemId);
    return formatSuccess(result);
  } catch (error: any) {
    return formatError(error);
  }
};
