# YouTube Data MCP Server (@klucas007/mcp-youtube)

<!-- Badges Start -->
<p align="left">
  <!-- GitHub Actions CI -->
  <a href="https://github.com/klucas007/mcp-youtube/actions/workflows/ci.yml">
    <img src="https://github.com/klucas007/mcp-youtube/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <!-- Codecov -->
  <a href="https://codecov.io/gh/klucas007/mcp-youtube">
    <img src="https://codecov.io/gh/klucas007/mcp-youtube/branch/main/graph/badge.svg?token=Y6B2E0T82P" alt="Code Coverage"/>
  </a>
  <!-- NPM Version -->
  <a href="https://www.npmjs.com/package/@klucas007/mcp-youtube">
    <img src="https://img.shields.io/npm/v/@klucas007/mcp-youtube.svg" alt="NPM Version" />
  </a>
  <!-- NPM Downloads -->
  <a href="https://www.npmjs.com/package/@klucas007/mcp-youtube">
    <img src="https://img.shields.io/npm/dt/@klucas007/mcp-youtube.svg" alt="NPM Downloads" />
  </a>
  <!-- Node Version -->
  <a href="package.json">
    <img src="https://img.shields.io/node/v/@klucas007/mcp-youtube.svg" alt="Node.js Version Support" />
  </a>
</p>

<p align="left">
  <a href="https://smithery.ai/server/@klucas007/mcp-youtube">
    <img src="https://smithery.ai/badge/@klucas007/mcp-youtube" alt="View on Smithery" />
  </a>
</p>
<!-- Badges End -->

**High-efficiency YouTube MCP server: Get token-optimized, structured data for your LLMs using the YouTube Data API v3.**

This Model Context Protocol (MCP) server empowers AI language models to seamlessly interact with YouTube. It's engineered to return **lean, structured data**, significantly **reducing token consumption** and making it ideal for cost-effective and performant LLM applications. Access a comprehensive suite of tools for video search, detail retrieval, transcript fetching, channel analysis, and trend discovery—all optimized for AI.

## Quick Start: Adding to an MCP Client

The easiest way to use `@klucas007/mcp-youtube` is with an MCP-compatible client application (like Claude Desktop or a custom client).

1.  **Ensure you have a YouTube Data API v3 Key.**
    - If you don't have one, follow the [YouTube API Setup](#youtube-api-setup) instructions below.

2.  **Caching Options:** This server supports two caching modes to improve performance and reduce API quota usage:
    
    - **File Cache (Default):** Uses local file-based caching in `.cache/youtube/` directory. No additional setup required.
    - **MongoDB Cache (Optional):** Uses MongoDB for caching, which provides better performance for high-volume usage. Get a free MongoDB Atlas cluster to obtain a connection string.

    **Note:** If using MongoDB, the server uses the database name `youtube_niche_analysis`. Your connection string user must have read/write permissions for this database.

3.  **Configure your MCP client:**
    Add one of the following JSON configurations to your client, replacing `"YOUR_YOUTUBE_API_KEY_HERE"` with your actual API key.

    **Option A: File Cache (Recommended for most users):**
    ```json
    {
      "mcpServers": {
        "youtube": {
          "command": "npx",
          "args": ["-y", "@klucas007/mcp-youtube"],
          "env": {
            "YOUTUBE_API_KEY": "YOUR_YOUTUBE_API_KEY_HERE"
          }
        }
      }
    }
    ```

    **Option B: MongoDB Cache (For high-volume usage):**
    ```json
    {
      "mcpServers": {
        "youtube": {
          "command": "npx",
          "args": ["-y", "@klucas007/mcp-youtube"],
          "env": {
            "YOUTUBE_API_KEY": "YOUR_YOUTUBE_API_KEY_HERE",
            "MDB_MCP_CONNECTION_STRING": "mongodb+srv://user:pass@cluster0.abc.mongodb.net/youtube_niche_analysis"
          }
        }
      }
    }
    ```

    - **Windows PowerShell Users:** `npx` can sometimes cause issues directly. If you encounter problems, try modifying the command as follows:
      ```json
        "command": "cmd",
        "args": ["/k", "npx", "-y", "@klucas007/mcp-youtube"],
      ```

That's it! Your MCP client should now be able to leverage the YouTube tools provided by this server.

## 🚀 Quick Install for Cursor

**Cursor users can quickly set up this YouTube MCP server with just a few clicks!**

### Method 1: One-click Install (Recommended)
Click the button below to automatically configure this MCP server in Cursor:

[![Install in Cursor](https://img.shields.io/badge/Install_in_Cursor-0.2.1-blue?style=for-the-badge&logo=cursor)](cursor://install-mcp?name=youtube&command=npx&args=-y,@klucas007/mcp-youtube&env.YOUTUBE_API_KEY=YOUR_API_KEY_HERE)

### Method 2: Manual Configuration
1. **Get your YouTube API key** (if you don't have one, follow the [YouTube API Setup](#youtube-api-setup) instructions below)
2. Open Cursor
3. Go to **Settings** → **Extensions** → **MCP Servers**
4. Click **Add Server** and use this configuration:

```json
{
  "name": "youtube",
  "command": "npx",
  "args": ["-y", "@klucas007/mcp-youtube"],
  "env": {
    "YOUTUBE_API_KEY": "YOUR_YOUTUBE_API_KEY_HERE"
  }
}
```

5. Replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual YouTube API key
6. Click **Save** and restart Cursor
7. Start using YouTube tools in your AI conversations! 🎉

### What you can do with YouTube MCP in Cursor:
- 🔍 **Search videos** with advanced filters
- 📊 **Get video details** and statistics
- 📝 **Extract transcripts** for content analysis
- 📈 **Analyze channels** and their performance
- 🔥 **Discover trending content** by region
- 🎥 **Manage playlists** and content organization

### Troubleshooting
- **"Command not found"**: Make sure you have Node.js installed (version 20+)
- **"API key invalid"**: Verify your YouTube Data API v3 key is correct and has proper permissions
- **"Server not responding"**: Try restarting Cursor after configuration

## Why `@klucas007/mcp-youtube`?

In the world of Large Language Models, every token counts. `@klucas007/mcp-youtube` is designed from the ground up with this principle in mind:

- � ***Token Efficiency:** Get just the data you need, precisely structured to minimize overhead for your LLM prompts and responses.
- 🧠 **LLM-Centric Design:** Tools and data formats are tailored for easy integration and consumption by AI models.
- 📊 **Comprehensive YouTube Toolkit:** Access a wide array of YouTube functionalities, from video details and transcripts to channel statistics and trending content.
- 🛡️ **Robust & Reliable:** Built with strong input validation (Zod) and clear error handling.

## Key Features

- **Optimized Video Information:** Search videos with advanced filters. Retrieve detailed metadata, statistics (views, likes, etc.), and content details, all structured for minimal token footprint.
- **Efficient Transcript Management:** Fetch video captions/subtitles with multi-language support, perfect for content analysis by LLMs.
- **Insightful Channel Analysis:** Get concise channel statistics (subscribers, views, video count) and discover a channel's top-performing videos without data bloat.
- **Lean Trend Discovery:** Find trending videos by region and category, and get lists of available video categories, optimized for quick AI processing.
- **Structured for AI:** All responses are designed to be easily parsable and immediately useful for language models.

## Available Tools

The server provides the following MCP tools, each designed to return token-optimized data:

### Video Tools

| Tool Name              | Description                                                                                                                                  | Parameters (see details in tool schema)                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `getVideoDetails`      | Retrieves detailed, **lean** information for multiple YouTube videos including metadata, statistics, engagement ratios, and content details. | `videoIds` (array of strings), `includeTags` (optional boolean), `descriptionDetail` (optional: "NONE", "SNIPPET", "LONG") |
| `searchVideos`         | Searches for videos or channels based on a query string with various filtering options, returning **concise** results.                       | `query` (string), `maxResults` (optional number), `order` (optional), `type` (optional), `channelId` (optional), `videoDuration` (optional), `recency` (optional), `regionCode` (optional) |
| `getTranscripts`       | Retrieves **token-efficient** transcripts (captions) for multiple videos.                                                                    | `videoIds` (array of strings), `lang` (optional string for language code), `format` (optional: "full_text", "key_segments") |

### Channel Tools

| Tool Name              | Description                                                                                                                                  | Parameters (see details in tool schema)                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `getChannelStatistics` | Retrieves **lean** statistics for multiple channels (subscriber count, view count, video count, creation date).                              | `channelIds` (array of strings)                                                                                       |
| `getChannelTopVideos`  | Retrieves a list of a channel's top-performing videos with **lean** details and engagement ratios.                                           | `channelId` (string), `maxResults` (optional number), `includeTags` (optional boolean), `descriptionDetail` (optional: "NONE", "SNIPPET", "LONG") |

### General Tools

| Tool Name              | Description                                                                                                                                  | Parameters (see details in tool schema)                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `getTrendingVideos`    | Retrieves a list of trending videos for a given region and optional category, with **lean** details and engagement ratios.                   | `regionCode` (optional string), `categoryId` (optional string), `maxResults` (optional number)                        |
| `getVideoCategories`   | Retrieves available YouTube video categories (ID and title) for a specific region, providing **essential data only**.                        | `regionCode` (optional string)                                                                                        |
| `findConsistentOutlierChannels` | A powerful, high-cost discovery tool that finds emerging channels showing consistent, high-performance relative to their size within a specific topic and timeframe. | `query` (string), `channelAge` (optional: "NEW", "ESTABLISHED"), `consistencyLevel` (optional: "MODERATE", "HIGH"), `outlierMagnitude` (optional: "STANDARD", "STRONG"), `videoCategoryId` (optional string), `regionCode` (optional string), `maxResults` (optional number) |

### Playlist Discovery Tools

| Tool Name              | Description                                                                                                                                  | Parameters (see details in tool schema)                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `getPlaylistDetails`   | Get detailed information about a YouTube playlist including metadata, channel information, and content statistics.                           | `playlistId` (string)                                                                                                |
| `getPlaylistItems`     | Get items from a YouTube playlist with pagination support, including video information and optional metadata.                                | `playlistId` (string), `maxResults` (optional number), `pageToken` (optional string), `videoDetails` (optional boolean) |
| `searchPlaylists`      | Search for YouTube playlists using keywords and filters, returning playlist metadata and channel information.                                | `query` (string), `maxResults` (optional number), `channelId` (optional string), `regionCode` (optional string) |
| `getChannelPlaylists`  | Get all playlists from a specific YouTube channel, including titles, descriptions, and content statistics.                                   | `channelId` (string), `maxResults` (optional number), `pageToken` (optional string) |

### Playlist Management Tools

| Tool Name              | Description                                                                                                                                  | Parameters (see details in tool schema)                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `createPlaylist`       | Create a new YouTube playlist with customizable title, description, privacy status, and metadata.                                           | `title` (string), `description` (optional string), `privacyStatus` (optional: "private", "unlisted", "public"), `tags` (optional array of strings), `defaultLanguage` (optional string) |
| `updatePlaylist`       | Update an existing YouTube playlist's metadata including title, description, privacy status, and tags.                                      | `playlistId` (string), `title` (optional string), `description` (optional string), `privacyStatus` (optional: "private", "unlisted", "public"), `tags` (optional array of strings), `defaultLanguage` (optional string) |
| `deletePlaylist`       | Delete a YouTube playlist permanently. This action cannot be undone.                                                                        | `playlistId` (string)                                                                                                |
| `addPlaylistItem`      | Add a video to a YouTube playlist with optional position and note.                                                                          | `playlistId` (string), `videoId` (string), `position` (optional number), `note` (optional string) |
| `removePlaylistItem`   | Remove a specific item from a YouTube playlist using its playlist item ID.                                                                  | `playlistItemId` (string)                                                                                            |
| `reorderPlaylistItems` | Reorder items within a YouTube playlist by moving an item to a specific position.                                                          | `playlistId` (string), `playlistItemId` (string), `moveAfterId` (optional string), `moveBeforeId` (optional string) |

_For detailed input parameters and their descriptions, please refer to the `inputSchema` within each tool's configuration file in the `src/tools/` directory (e.g., `src/tools/video/getVideoDetails.ts`)._

> _**Note on API Quota Costs:** Most tools are highly efficient, costing only **1 unit** per call. The exceptions are the search-based tools: `searchVideos` costs **100 units** and `getChannelTopVideos` costs **101 units**. The `getTranscripts` tool has **0** API cost. The `findConsistentOutlierChannels` tool is a high-cost discovery tool that performs multiple API calls for comprehensive analysis._

## Advanced Usage & Local Development

If you wish to contribute, modify the server, or run it locally outside of an MCP client's managed environment:

### Prerequisites

- Node.js (version specified in `package.json` engines field - currently `>=20.0.0`)
- npm (usually comes with Node.js)
- A YouTube Data API v3 Key (see [YouTube API Setup](#youtube-api-setup))

### Local Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/klucas007/mcp-youtube.git
    cd mcp-youtube
    ```

2.  **Install dependencies:**

    ```bash
    npm ci
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Then, edit `.env` to add your `YOUTUBE_API_KEY` (required):
    ```
    YOUTUBE_API_KEY=your_youtube_api_key_here
    # MDB_MCP_CONNECTION_STRING=your_mongodb_connection_string_here  # Optional
    ```
    
    **Note:** MongoDB connection string is optional. If not provided, the server will use local file-based caching.

### Development Scripts

```bash
# Run in development mode with live reloading
npm run dev

# Build for production
npm run build

# Run the production build (after npm run build)
npm start

# Lint files
npm run lint

# Run tests
npm run test
npm run test -- --coverage # To generate coverage reports

# Inspect MCP server using the Model Context Protocol Inspector
npm run inspector

# Cache management utilities
npm run cache stats  # Show cache statistics
npm run cache clean  # Clean expired cache files
npm run cache test   # Test cache functionality
```

### Local Development with an MCP Client

To have an MCP client run your _local development version_ (instead of the published NPM package):

1.  Ensure you have a script in `package.json` for a non-watching start, e.g.:

    ```json
    "scripts": {
      "start:client": "tsx ./src/index.ts"
    }
    ```

2.  Configure your MCP client to spawn this local script:
    ```json
    {
      "mcpServers": {
        "youtube_local_dev": {
          "command": "npm",
          "args": ["run", "start:client"],
          "working_directory": "/absolute/path/to/your/cloned/mcp-youtube",
          "env": {
            "YOUTUBE_API_KEY": "YOUR_LOCAL_DEV_API_KEY_HERE"
          }
        }
      }
    }
    ```
    _Note on the env block above: Setting YOUTUBE_API_KEY directly in the env block for the client configuration is one way to provide the API key. Alternatively, if your server correctly loads its .env file based on the working_directory, you might not need to specify it in the client's env block, as long as your local .env file in the project root contains the YOUTUBE_API_KEY. The working_directory path must be absolute and correct for the server to find its .env file._

## YouTube API Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  In the navigation menu, go to "APIs & Services" > "Library".
4.  Search for "YouTube Data API v3" and **Enable** it for your project.
5.  Go to "APIs & Services" > "Credentials".
6.  Click "+ CREATE CREDENTIALS" and choose "API key".
7.  Copy the generated API key. This is your `YOUTUBE_API_KEY`.
8.  **Important Security Step:** Restrict your API key to prevent unauthorized use. Click on the API key name, and under "API restrictions," select "Restrict key" and choose "YouTube Data API v3." You can also add "Application restrictions" (e.g., IP addresses) if applicable.

## How it Works (MCP stdio)

This server is an MCP server that communicates via **Standard Input/Output (stdio)**. It does not listen on network ports. An MCP client application will typically spawn this server script as a child process and communicate by writing requests to its stdin and reading responses from its stdout.

## System Requirements

- Node.js: `>=20.0.0` (as specified in `package.json`)
- npm (for managing dependencies and running scripts)

## Security Considerations

- **API Key Security:** Your `YOUTUBE_API_KEY` is sensitive. Never commit it directly to your repository. Use environment variables (e.g., via a `.env` file which should be listed in `.gitignore`).
- **API Quotas:** The YouTube Data API has a daily usage quota (default is 10,000 units). All tool calls deduct from this quota. Monitor your usage in the Google Cloud Console and be mindful of the cost of each tool. For a detailed breakdown of costs per API method, see the [official documentation](https://developers.google.com/youtube/v3/determine_quota_cost).
- **Input Validation:** The server uses Zod for robust input validation for all tool parameters, enhancing security and reliability.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
