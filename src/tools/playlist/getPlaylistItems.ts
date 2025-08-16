import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema, playlistItemsOptionsSchema } from "../../utils/validation.js";
import type { PlaylistItemsOptions } from "../../types/tools.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const getPlaylistItemsSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to get items from"),
  maxResults: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .default(50)
    .describe("Maximum number of playlist items to return (1-500, default: 50)"),
  pageToken: z
    .string()
    .optional()
    .describe("Token for pagination to get the next page of results"),
  videoDetails: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include additional video details like duration (increases API cost)"),
});

export const getPlaylistItemsConfig = {
  name: "getPlaylistItems",
  description:
    "Get items from a YouTube playlist with pagination support. Returns video information including titles, channel details, and optional video metadata. Use this to explore playlist contents or analyze video collections.",
  inputSchema: getPlaylistItemsSchema,
};

export const getPlaylistItemsHandler = async (
  params: { playlistId: string } & PlaylistItemsOptions,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = getPlaylistItemsSchema.parse(params);

    const options: PlaylistItemsOptions = {
      maxResults: validatedParams.maxResults,
      pageToken: validatedParams.pageToken,
      videoDetails: validatedParams.videoDetails,
    };

    const playlistItems = await playlistService.getPlaylistItems(
      validatedParams.playlistId,
      options
    );

    return formatSuccess(playlistItems);
  } catch (error: any) {
    return formatError(error);
  }
};
