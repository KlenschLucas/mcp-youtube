import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const getPlaylistDetailsSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to get details for"),
});

export const getPlaylistDetailsConfig = {
  name: "getPlaylistDetails",
  description:
    "Get detailed information about a YouTube playlist. Returns comprehensive data including playlist metadata, channel information, and content statistics. Use this when you need complete information about a specific playlist.",
  inputSchema: getPlaylistDetailsSchema,
};

export const getPlaylistDetailsHandler = async (
  params: { playlistId: string },
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = getPlaylistDetailsSchema.parse(params);

    const playlistDetails = await playlistService.getPlaylistDetails(
      validatedParams.playlistId
    );

    return formatSuccess(playlistDetails);
  } catch (error: any) {
    return formatError(error);
  }
};
