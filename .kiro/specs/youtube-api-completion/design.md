# Design Document

## Overview

This design extends the existing MCP YouTube server to implement the remaining essential YouTube Data API v3 endpoints. The implementation follows the established patterns of token-optimized responses, MongoDB caching, and structured error handling while adding comprehensive playlist, comment, live streaming, and content management capabilities.

The design maintains backward compatibility with existing tools and services while introducing new functionality through additional tool endpoints and service methods. All new APIs will follow the existing lean response format to minimize token consumption for LLM applications.

## Architecture

### High-Level Architecture

The implementation extends the existing three-layer architecture:

1. **Tool Layer** (`src/tools/`) - MCP tool implementations with Zod validation
2. **Service Layer** (`src/services/`) - Business logic and API integration with caching
3. **Utility Layer** (`src/utils/`) - Shared utilities for validation, formatting, and error handling

### New Components

#### Tool Categories
- **Playlist Tools** (`src/tools/playlist/`) - Playlist management and discovery
- **Comment Tools** (`src/tools/comment/`) - Comment retrieval and analysis
- **Live Tools** (`src/tools/live/`) - Live streaming and events
- **Subscription Tools** (`src/tools/subscription/`) - Channel relationships
- **Analytics Tools** (`src/tools/analytics/`) - Performance metrics
- **Management Tools** (`src/tools/management/`) - Content management operations

#### Service Extensions
- **PlaylistService** - Playlist operations and caching
- **CommentService** - Comment retrieval with threading support
- **LiveService** - Live streaming data access
- **AnalyticsService** - YouTube Analytics API integration
- **ManagementService** - Content management operations

## Components and Interfaces

### Playlist Management Components

#### PlaylistService Interface
```typescript
interface PlaylistService {
  getPlaylistDetails(playlistId: string): Promise<LeanPlaylistDetails>;
  getPlaylistItems(playlistId: string, options: PlaylistItemsOptions): Promise<LeanPlaylistItem[]>;
  searchPlaylists(options: PlaylistSearchOptions): Promise<LeanPlaylistSearchResult[]>;
  getChannelPlaylists(channelId: string, options: ChannelPlaylistsOptions): Promise<LeanPlaylistDetails[]>;
}
```

#### Playlist Tools
- `getPlaylistDetails` - Retrieve playlist metadata and statistics
- `getPlaylistItems` - Get videos in a playlist with position data
- `searchPlaylists` - Search for playlists by query
- `getChannelPlaylists` - Get all playlists from a channel

### Comment System Components

#### CommentService Interface
```typescript
interface CommentService {
  getVideoComments(videoId: string, options: CommentOptions): Promise<LeanComment[]>;
  getCommentReplies(commentId: string, options: ReplyOptions): Promise<LeanCommentReply[]>;
  getCommentThreads(videoId: string, options: ThreadOptions): Promise<LeanCommentThread[]>;
}
```

#### Comment Tools
- `getVideoComments` - Retrieve top-level comments for a video
- `getCommentReplies` - Get replies to a specific comment
- `getCommentThreads` - Get structured comment conversations

### Live Streaming Components

#### LiveService Interface
```typescript
interface LiveService {
  getLiveBroadcasts(options: LiveBroadcastOptions): Promise<LeanLiveBroadcast[]>;
  getUpcomingEvents(channelId?: string, options?: EventOptions): Promise<LeanUpcomingEvent[]>;
  getLiveChat(liveChatId: string, options: LiveChatOptions): Promise<LeanLiveChatMessage[]>;
}
```

#### Live Tools
- `getLiveBroadcasts` - Get active live streams
- `getUpcomingEvents` - Get scheduled live events
- `getLiveChat` - Retrieve live chat messages

### Enhanced Search Components

#### Extended SearchService Methods
```typescript
interface SearchServiceExtensions {
  searchChannels(options: ChannelSearchOptions): Promise<LeanChannelSearchResult[]>;
  searchWithLocation(options: LocationSearchOptions): Promise<LeanLocationSearchResult[]>;
  searchByDateRange(options: DateRangeSearchOptions): Promise<LeanSearchResult[]>;
}
```

#### Enhanced Search Tools
- `searchChannels` - Dedicated channel search with metadata
- `searchWithLocation` - Location-based content discovery
- `searchByDateRange` - Precise date range filtering

### Subscription and Analytics Components

#### SubscriptionService Interface
```typescript
interface SubscriptionService {
  getChannelSubscriptions(channelId: string, options: SubscriptionOptions): Promise<LeanSubscription[]>;
  checkSubscriptionStatus(subscriberChannelId: string, channelId: string): Promise<SubscriptionStatus>;
}
```

#### AnalyticsService Interface
```typescript
interface AnalyticsService {
  getVideoAnalytics(videoId: string, metrics: string[], options: AnalyticsOptions): Promise<LeanVideoAnalytics>;
  getChannelAnalytics(channelId: string, metrics: string[], options: AnalyticsOptions): Promise<LeanChannelAnalytics>;
}
```

## Data Models

### Lean Response Types

#### Playlist Types
```typescript
interface LeanPlaylistDetails {
  id: string | null;
  title: string | null;
  description?: string | null;
  channelId: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
  itemCount: number | null;
  privacyStatus: string | null;
}

interface LeanPlaylistItem {
  videoId: string | null;
  title: string | null;
  channelTitle: string | null;
  position: number | null;
  publishedAt: string | null;
  duration: string | null;
}
```

#### Comment Types
```typescript
interface LeanComment {
  id: string | null;
  authorName: string | null;
  authorChannelId: string | null;
  textDisplay: string | null;
  likeCount: number | null;
  publishedAt: string | null;
  replyCount: number | null;
}

interface LeanCommentThread {
  topLevelComment: LeanComment;
  replies?: LeanComment[];
  totalReplyCount: number | null;
}
```

#### Live Streaming Types
```typescript
interface LeanLiveBroadcast {
  id: string | null;
  title: string | null;
  channelId: string | null;
  channelTitle: string | null;
  scheduledStartTime: string | null;
  actualStartTime: string | null;
  concurrentViewers: number | null;
  lifeCycleStatus: string | null;
}

interface LeanLiveChatMessage {
  id: string | null;
  authorName: string | null;
  authorChannelId: string | null;
  messageText: string | null;
  publishedAt: string | null;
  type: string | null;
}
```

### Parameter Types

#### Playlist Parameters
```typescript
interface PlaylistItemsOptions {
  maxResults?: number;
  pageToken?: string;
  videoDetails?: boolean;
}

interface PlaylistSearchOptions {
  query: string;
  maxResults?: number;
  channelId?: string;
  regionCode?: string;
}
```

#### Comment Parameters
```typescript
interface CommentOptions {
  maxResults?: number;
  order?: 'time' | 'relevance';
  pageToken?: string;
  textFormat?: 'html' | 'plainText';
}

interface ThreadOptions extends CommentOptions {
  includeReplies?: boolean;
  maxReplies?: number;
}
```

## Error Handling

### Error Categories

1. **API Quota Errors** - Handle quota exceeded gracefully with informative messages
2. **Permission Errors** - Handle private content and restricted access
3. **Not Found Errors** - Handle deleted or unavailable content
4. **Rate Limiting** - Implement exponential backoff for rate limits
5. **Authentication Errors** - Handle OAuth requirements for management operations

### Error Response Format

All errors follow the existing pattern:
```typescript
interface ErrorResponse {
  isError: true;
  error: string;
  details?: string;
  code?: string;
}
```

### Graceful Degradation

- Return partial results when some items fail
- Provide fallback data when primary sources are unavailable
- Cache error states to prevent repeated failed requests
- Log errors for monitoring while returning user-friendly messages

## Testing Strategy

### Unit Testing

#### Service Layer Tests
- Mock YouTube API responses for all new service methods
- Test caching behavior with various TTL scenarios
- Verify error handling for different API failure modes
- Test data transformation and lean response formatting

#### Tool Layer Tests
- Validate Zod schema parsing for all parameter types
- Test tool handler integration with service dependencies
- Verify response formatting consistency
- Test error propagation from services to tools

### Integration Testing

#### API Integration Tests
- Test against live YouTube API with test data
- Verify quota tracking and cost calculation
- Test caching integration with MongoDB
- Validate response times and performance

#### End-to-End Tests
- Test complete workflows through MCP protocol
- Verify tool registration and discovery
- Test error scenarios with real API constraints
- Validate token optimization in responses

### Performance Testing

#### Caching Performance
- Measure cache hit rates for different data types
- Test cache invalidation strategies
- Verify memory usage with large datasets
- Test concurrent access patterns

#### API Efficiency
- Monitor API quota consumption
- Test batch operation efficiency
- Measure response time improvements from caching
- Validate token count optimization

## Implementation Phases

### Phase 1: Playlist Management (Priority: High)
- Implement PlaylistService with core operations
- Create playlist tools (getPlaylistDetails, getPlaylistItems, searchPlaylists)
- Add playlist-related types and validation schemas
- Implement caching strategy for playlist data

### Phase 2: Comment System (Priority: High)
- Implement CommentService with threading support
- Create comment tools (getVideoComments, getCommentReplies, getCommentThreads)
- Add comment-related types and validation
- Implement pagination for large comment sets

### Phase 3: Enhanced Search (Priority: Medium)
- Extend existing search functionality
- Add location-based and date range search tools
- Implement channel search with comprehensive metadata
- Add advanced filtering options

### Phase 4: Live Streaming (Priority: Medium)
- Implement LiveService for broadcast and event data
- Create live streaming tools
- Add live chat functionality
- Handle real-time data considerations

### Phase 5: Subscription and Analytics (Priority: Low)
- Implement SubscriptionService for relationship data
- Add basic analytics capabilities
- Create subscription management tools
- Handle privacy and permission requirements

### Phase 6: Content Management (Priority: Low)
- Implement ManagementService for content operations
- Add OAuth authentication flow
- Create content management tools
- Handle write operations and permissions

## Caching Strategy

### Cache TTL Assignment

- **Playlist Details**: SEMI_STATIC (1 month) - playlists change infrequently
- **Playlist Items**: STANDARD (1 week) - items may be added/removed
- **Comments**: STANDARD (1 week) - comments are relatively stable
- **Live Broadcasts**: DYNAMIC (1 day) - live data changes frequently
- **Search Results**: STANDARD (1 week) - search results have moderate volatility
- **Analytics Data**: DYNAMIC (1 day) - metrics update frequently

### Cache Collections

New cache collections will be added to `CACHE_COLLECTIONS`:
```typescript
PLAYLIST_DETAILS: "playlist_details",
PLAYLIST_ITEMS: "playlist_items", 
COMMENTS: "comments",
COMMENT_THREADS: "comment_threads",
LIVE_BROADCASTS: "live_broadcasts",
SEARCH_CHANNELS: "search_channels",
SUBSCRIPTIONS: "subscriptions",
ANALYTICS: "analytics"
```

### Cache Key Strategies

- **Playlist Operations**: `playlist:${playlistId}:${operation}:${optionsHash}`
- **Comment Operations**: `comments:${videoId}:${operation}:${optionsHash}`
- **Live Operations**: `live:${operation}:${optionsHash}`
- **Search Operations**: `search:${type}:${queryHash}:${optionsHash}`

## Security Considerations

### API Key Management
- Maintain existing API key security practices
- Implement quota monitoring and alerting
- Add rate limiting for expensive operations

### OAuth Integration
- Implement secure OAuth flow for management operations
- Store tokens securely with appropriate encryption
- Handle token refresh and expiration gracefully

### Data Privacy
- Respect YouTube's privacy settings and restrictions
- Handle private content access appropriately
- Implement data retention policies for cached content

### Input Validation
- Extend existing Zod validation for all new parameters
- Sanitize user inputs to prevent injection attacks
- Validate API responses before processing

## Performance Optimization

### Batch Operations
- Implement batch fetching for multiple playlists/comments
- Optimize API calls to minimize quota usage
- Use parallel processing where appropriate

### Response Optimization
- Maintain token-optimized response format
- Implement configurable detail levels
- Remove unnecessary data fields consistently

### Memory Management
- Implement streaming for large datasets
- Use pagination to limit memory usage
- Clean up temporary data structures

### Monitoring and Metrics
- Track API quota usage per operation
- Monitor cache hit rates and performance
- Log performance metrics for optimization