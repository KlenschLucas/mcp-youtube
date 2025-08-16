import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const addPlaylistItemSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to add item to"),
  videoId: z.string().min(1, "Video ID cannot be empty").describe("YouTube video ID to add"),
  position: z.number().min(0).optional().describe("Position in playlist (0-based, optional)"),
  note: z.string().optional().describe("Note to add with the playlist item"),
});

export const addPlaylistItemConfig = {
  name: "addPlaylistItem",
  description: "Add a video to a YouTube playlist. Specify position and optional note.",
  inputSchema: addPlaylistItemSchema,
};

export const addPlaylistItemHandler = async (
  params: z.infer<typeof addPlaylistItemSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = addPlaylistItemSchema.parse(params);
    const playlistItem = await playlistService.addPlaylistItem(validatedParams);
    return formatSuccess(playlistItem);
  } catch (error: any) {
    return formatError(error);
  }
};
