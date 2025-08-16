import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { channelIdSchema, channelPlaylistsOptionsSchema } from "../../utils/validation.js";
import type { ChannelPlaylistsOptions } from "../../types/tools.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const getChannelPlaylistsSchema = z.object({
  channelId: channelIdSchema.describe("YouTube channel ID to get playlists from"),
  maxResults: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .default(50)
    .describe("Maximum number of playlists to return (1-500, default: 50)"),
  pageToken: z
    .string()
    .optional()
    .describe("Token for pagination to get the next page of results"),
});

export const getChannelPlaylistsConfig = {
  name: "getChannelPlaylists",
  description:
    "Get all playlists from a specific YouTube channel. Returns playlist metadata including titles, descriptions, and content statistics. Use this to explore a channel's playlist collection or analyze their content organization.",
  inputSchema: getChannelPlaylistsSchema,
};

export const getChannelPlaylistsHandler = async (
  params: { channelId: string } & ChannelPlaylistsOptions,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = getChannelPlaylistsSchema.parse(params);

    const options: ChannelPlaylistsOptions = {
      maxResults: validatedParams.maxResults,
      pageToken: validatedParams.pageToken,
    };

    const channelPlaylists = await playlistService.getChannelPlaylists(
      validatedParams.channelId,
      options
    );

    return formatSuccess(channelPlaylists);
  } catch (error: any) {
    return formatError(error);
  }
};
