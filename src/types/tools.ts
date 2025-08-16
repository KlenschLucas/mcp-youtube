export interface VideoDetailsParams {
  videoIds: string[];
  includeTags?: boolean;
  descriptionDetail?: "NONE" | "SNIPPET" | "LONG";
}

export interface SearchParams {
  query: string;
  maxResults?: number;
  order?: "relevance" | "date" | "viewCount";
  type?: "video" | "channel";
  channelId?: string;
  videoDuration?: "any" | "short" | "medium" | "long";
  recency?:
    | "any"
    | "pastHour"
    | "pastDay"
    | "pastWeek"
    | "pastMonth"
    | "pastQuarter"
    | "pastYear";
  regionCode?: string;
}

export interface TranscriptsParams {
  videoIds: string[];
  lang?: string;
}

export interface ChannelParams {
  channelId: string;
  maxResults?: number;
  includeTags?: boolean;
  descriptionDetail?: "NONE" | "SNIPPET" | "LONG";
}

export interface ChannelStatisticsParams {
  channelIds: string[];
}

export interface TrendingParams {
  regionCode?: string;
  categoryId?: string;
  maxResults?: number;
}

export interface VideoCategoriesParams {
  regionCode?: string;
}

export interface FindConsistentOutlierChannelsParams {
  query: string;
  channelAge?: "NEW" | "ESTABLISHED";
  consistencyLevel?: "MODERATE" | "HIGH";
  outlierMagnitude?: "STANDARD" | "STRONG";
  videoCategoryId?: string;
  regionCode?: string;
  maxResults?: number;
}

// Playlist-related parameter interfaces
export interface PlaylistItemsOptions {
  maxResults?: number;
  pageToken?: string;
  videoDetails?: boolean;
}

export interface PlaylistSearchOptions {
  query: string;
  maxResults?: number;
  channelId?: string;
  regionCode?: string;
}

export interface ChannelPlaylistsOptions {
  maxResults?: number;
  pageToken?: string;
}
