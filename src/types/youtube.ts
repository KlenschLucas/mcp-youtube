export interface LeanVideoDetails {
  id: string | null | undefined;
  title: string | null | undefined;
  description?: string | null | undefined;
  channelId: string | null | undefined;
  channelTitle: string | null | undefined;
  publishedAt: string | null | undefined;
  duration: string | null | undefined;
  viewCount: number | null | undefined;
  likeCount: number | null | undefined;
  commentCount: number | null | undefined;
  likeToViewRatio: number | null | undefined;
  commentToViewRatio: number | null | undefined;
  tags?: string[] | null | undefined;
  categoryId: string | null | undefined;
  defaultLanguage: string | null | undefined;
}

export interface LeanChannelTopVideo {
  id: string | null | undefined;
  title: string | null | undefined;
  description?: string | null | undefined;
  publishedAt: string | null | undefined;
  duration: string | null | undefined;
  viewCount: number | null | undefined;
  likeCount: number | null | undefined;
  commentCount: number | null | undefined;
  likeToViewRatio: number | null | undefined;
  commentToViewRatio: number | null | undefined;
  tags?: string[] | null | undefined;
  categoryId: string | null | undefined;
  defaultLanguage: string | null | undefined;
}

export interface LeanTrendingVideo {
  id: string | null | undefined;
  title: string | null | undefined;
  channelId: string | null | undefined;
  channelTitle: string | null | undefined;
  publishedAt: string | null | undefined;
  duration: string | null | undefined;
  viewCount: number | null | undefined;
  likeCount: number | null | undefined;
  commentCount: number | null | undefined;
  likeToViewRatio: number | null | undefined;
  commentToViewRatio: number | null | undefined;
}

export interface LeanVideoSearchResult {
  videoId: string | null | undefined;
  title: string | null | undefined;
  descriptionSnippet: string | null | undefined;
  channelId: string | null | undefined;
  channelTitle: string | null | undefined;
  publishedAt: string | null | undefined;
}

export interface LeanChannelStatistics {
  channelId: string | null | undefined;
  title: string | null | undefined;
  subscriberCount: number | null | undefined;
  viewCount: number | null | undefined;
  videoCount: number | null | undefined;
  createdAt: string | null | undefined;
}

export interface VideoInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface ChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    customUrl: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
}

export interface SearchResult {
  id: {
    kind: string;
    videoId: string | null;
    channelId: string | null;
    playlistId: string | null;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export interface CommentInfo {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        likeCount: number;
        publishedAt: string;
      };
    };
    totalReplyCount: number;
  };
}

// Playlist-related lean response interfaces
export interface LeanPlaylistDetails {
  id: string | null | undefined;
  title: string | null | undefined;
  description?: string | null | undefined;
  channelId: string | null | undefined;
  channelTitle: string | null | undefined;
  publishedAt: string | null | undefined;
  itemCount: number | null | undefined;
  privacyStatus: string | null | undefined;
}

export interface LeanPlaylistItem {
  videoId: string | null | undefined;
  title: string | null | undefined;
  channelTitle: string | null | undefined;
  position: number | null | undefined;
  publishedAt: string | null | undefined;
  duration: string | null | undefined;
}

export interface LeanPlaylistSearchResult {
  playlistId: string | null | undefined;
  title: string | null | undefined;
  description?: string | null | undefined;
  channelId: string | null | undefined;
  channelTitle: string | null | undefined;
  publishedAt: string | null | undefined;
  itemCount: number | null | undefined;
}

// Playlist management operation interfaces
export interface CreatePlaylistOptions {
  title: string;
  description?: string;
  privacyStatus?: "private" | "unlisted" | "public";
  tags?: string[];
  defaultLanguage?: string;
}

export interface UpdatePlaylistOptions {
  playlistId: string;
  title?: string;
  description?: string;
  privacyStatus?: "private" | "unlisted" | "public";
  tags?: string[];
  defaultLanguage?: string;
}

// Phase 2: Playlist item management interfaces
export interface AddPlaylistItemOptions {
  playlistId: string;
  videoId: string;
  position?: number;
  note?: string;
}

export interface ReorderPlaylistItemsOptions {
  playlistId: string;
  playlistItemId: string;
  moveAfterId?: string;
  moveBeforeId?: string;
}

// Phase 3: Advanced features interfaces
export interface PlaylistAnalyticsOptions {
  playlistId: string;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
}

export interface PlaylistAnalytics {
  playlistId: string;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageWatchTime: number;
  engagementRate: number;
  topPerformingVideos: LeanPlaylistItem[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ManageCollaboratorsOptions {
  playlistId: string;
  action: "add" | "remove" | "list";
  collaboratorEmail?: string;
  role?: "owner" | "editor" | "viewer";
}

export interface CollaboratorResult {
  collaborators: Collaborator[];
  message: string;
}

export interface Collaborator {
  email: string;
  role: string;
  addedAt: string;
}
