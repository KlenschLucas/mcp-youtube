import { z } from "zod";
import { PlaylistService } from "../../services/playlist.service.js";
import { formatError } from "../../utils/errorHandler.js";
import { formatSuccess } from "../../utils/responseFormatter.js";
import { playlistIdSchema } from "../../utils/validation.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const getPlaylistAnalyticsSchema = z.object({
  playlistId: playlistIdSchema.describe("YouTube playlist ID to get analytics for"),
  startDate: z.string().optional().describe("Start date for analytics (ISO 8601 format, e.g., 2024-01-01)"),
  endDate: z.string().optional().describe("End date for analytics (ISO 8601 format, e.g., 2024-12-31)"),
  metrics: z.array(z.enum(["views", "likes", "comments", "shares"])).optional().describe("Metrics to include in the analysis"),
});

export const getPlaylistAnalyticsConfig = {
  name: "getPlaylistAnalytics",
  description: "Get analytics data for a YouTube playlist including views, engagement metrics, and performance data. Returns total views, likes, comments, engagement rate, and top performing videos.",
  inputSchema: getPlaylistAnalyticsSchema,
};

export const getPlaylistAnalyticsHandler = async (
  params: z.infer<typeof getPlaylistAnalyticsSchema>,
  playlistService: PlaylistService
): Promise<CallToolResult> => {
  try {
    const validatedParams = getPlaylistAnalyticsSchema.parse(params);
    const analytics = await playlistService.getPlaylistAnalytics(validatedParams);
    return formatSuccess(analytics);
  } catch (error: any) {
    return formatError(error);
  }
};
