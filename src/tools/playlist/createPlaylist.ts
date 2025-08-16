import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const createPlaylistSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").describe("Playlist title"),
  description: z.string().optional().describe("Playlist description"),
  privacyStatus: z.enum(["private", "unlisted", "public"]).default("private").describe("Playlist privacy status"),
  tags: z.array(z.string()).optional().describe("Tags for the playlist"),
  defaultLanguage: z.string().optional().describe("Default language for the playlist"),
});

export const createPlaylistConfig = {
  name: "createPlaylist",
  description: "Create a new YouTube playlist. Returns the created playlist details including ID and metadata.",
  inputSchema: createPlaylistSchema,
};

export const createPlaylistHandler = async (
  params: z.infer<typeof createPlaylistSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = createPlaylistSchema.parse(params);
    const playlist = await playlistService.createPlaylist(validatedParams);
    return formatSuccess(playlist);
  } catch (error: any) {
    return formatError(error);
  }
};
