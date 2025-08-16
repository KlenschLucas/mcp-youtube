import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistSearchOptionsSchema } from "../../utils/validation.js";
import type { PlaylistSearchOptions } from "../../types/tools.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const searchPlaylistsSchema = z.object({
  query: z
    .string()
    .min(1, "Query cannot be empty")
    .describe("Search query to find playlists"),
  maxResults: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .default(10)
    .describe("Maximum number of playlists to return (1-500, default: 10)"),
  channelId: z
    .string()
    .min(1)
    .optional()
    .describe("Filter results to playlists from a specific channel"),
  regionCode: z
    .string()
    .length(2, "Region code must be 2 characters")
    .optional()
    .describe("ISO 3166-1 alpha-2 country code for region-specific results"),
});

export const searchPlaylistsConfig = {
  name: "searchPlaylists",
  description:
    "Search for YouTube playlists using keywords and filters. Returns playlist metadata including titles, descriptions, and channel information. Use this to discover playlists related to specific topics or channels.",
  inputSchema: searchPlaylistsSchema,
};

export const searchPlaylistsHandler = async (
  params: PlaylistSearchOptions,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = searchPlaylistsSchema.parse(params);

    const searchResults = await playlistService.searchPlaylists(validatedParams);

    return formatSuccess(searchResults);
  } catch (error: any) {
    return formatError(error);
  }
};
