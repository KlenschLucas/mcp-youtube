import { z } from "zod";

export const validateParams = <T>(params: T, schema: z.ZodSchema<T>): T => {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.issues.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

// Common validation schemas
export const videoIdSchema = z.string().min(1, "Video ID cannot be empty");
export const channelIdSchema = z.string().min(1, "Channel ID cannot be empty");
export const maxResultsSchema = z.number().min(1).max(500).optional();
export const querySchema = z.string().min(1, "Query cannot be empty");
export const languageSchema = z.string().optional();
export const regionCodeSchema = z
  .string()
  .length(2, "Region code must be 2 characters")
  .optional();
export const categoryIdSchema = z.string().optional();

// Playlist validation schemas
export const playlistIdSchema = z.string().min(1, "Playlist ID cannot be empty");
export const playlistSearchOptionsSchema = z.object({
  query: querySchema,
  maxResults: maxResultsSchema,
  channelId: channelIdSchema.optional(),
  regionCode: regionCodeSchema,
});
export const playlistItemsOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
  videoDetails: z.boolean().optional(),
});
export const channelPlaylistsOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
});

// Comment validation schemas
export const commentIdSchema = z.string().min(1, "Comment ID cannot be empty");
export const commentOrderSchema = z.enum(["time", "relevance"]).optional();
export const textFormatSchema = z.enum(["html", "plainText"]).optional();
export const commentOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  order: commentOrderSchema,
  pageToken: z.string().optional(),
  textFormat: textFormatSchema,
});
export const threadOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  order: commentOrderSchema,
  pageToken: z.string().optional(),
  textFormat: textFormatSchema,
  includeReplies: z.boolean().optional(),
  maxReplies: z.number().min(1).max(100).optional(),
});

// Live streaming validation schemas
export const liveChatIdSchema = z.string().min(1, "Live chat ID cannot be empty");
export const liveBroadcastOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
  broadcastStatus: z.enum(["active", "completed", "upcoming"]).optional(),
});
export const eventOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
  eventType: z.enum(["live", "upcoming"]).optional(),
});
export const liveChatOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
});

// Enhanced search validation schemas
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.string().optional(), // e.g., "10km", "5mi"
});
export const dateRangeSchema = z.object({
  publishedAfter: z.string().datetime().optional(),
  publishedBefore: z.string().datetime().optional(),
});
export const channelSearchOptionsSchema = z.object({
  query: querySchema,
  maxResults: maxResultsSchema,
  regionCode: regionCodeSchema,
  relevanceLanguage: languageSchema,
});
export const locationSearchOptionsSchema = z.object({
  query: querySchema,
  location: locationSchema,
  maxResults: maxResultsSchema,
  regionCode: regionCodeSchema,
});
export const dateRangeSearchOptionsSchema = z.object({
  query: querySchema,
  dateRange: dateRangeSchema,
  maxResults: maxResultsSchema,
  regionCode: regionCodeSchema,
  eventType: z.enum(["completed", "live", "upcoming"]).optional(),
});

// Subscription validation schemas
export const subscriptionOptionsSchema = z.object({
  maxResults: maxResultsSchema,
  pageToken: z.string().optional(),
  order: z.enum(["alphabetical", "relevance", "unread"]).optional(),
});

// Analytics validation schemas
export const metricsSchema = z.array(z.string()).min(1, "At least one metric is required");
export const analyticsOptionsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.string()).optional(),
  maxResults: maxResultsSchema,
});

// Content management validation schemas
export const playlistMetadataSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  description: z.string().optional(),
  privacyStatus: z.enum(["private", "public", "unlisted"]).optional(),
  tags: z.array(z.string()).optional(),
});
export const videoMetadataSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: categoryIdSchema,
});
export const playlistItemManagementSchema = z.object({
  videoId: videoIdSchema,
  position: z.number().min(0).optional(),
});

// Playlist management validation schemas
export const playlistPrivacySchema = z
  .enum(["private", "unlisted", "public"])
  .describe("Playlist privacy status");

export const playlistTagsSchema = z
  .array(z.string())
  .optional()
  .describe("Tags for the playlist");

// Phase 2: Playlist item management validation schemas
export const playlistItemIdSchema = z
  .string()
  .min(1, "Playlist item ID cannot be empty")
  .describe("YouTube playlist item ID");

export const addPlaylistItemSchema = z.object({
  playlistId: playlistIdSchema,
  videoId: videoIdSchema,
  position: z.number().min(0).optional().describe("Position in playlist (0-based, optional)"),
  note: z.string().optional().describe("Note to add with the playlist item"),
});

export const removePlaylistItemSchema = z.object({
  playlistItemId: playlistItemIdSchema,
});

export const reorderPlaylistItemsSchema = z.object({
  playlistId: playlistIdSchema,
  playlistItemId: playlistItemIdSchema,
  moveAfterId: z.string().optional().describe("Move item after this playlist item ID (optional)"),
  moveBeforeId: z.string().optional().describe("Move item before this playlist item ID (optional)"),
});
