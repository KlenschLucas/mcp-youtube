# Product Overview

**@klucas007/mcp-youtube** is a Model Context Protocol (MCP) server that provides high-efficiency YouTube data access for AI language models. The server is designed with token optimization as a core principle, returning lean, structured data to minimize LLM token consumption while maximizing functionality.

## Core Purpose
- Enable AI models to seamlessly interact with YouTube through the YouTube Data API v3
- Provide token-optimized, structured responses to reduce costs and improve performance
- Offer comprehensive YouTube functionality including video search, channel analysis, transcript fetching, and trend discovery

## Key Features
- **Video Operations**: Search videos, get detailed metadata, fetch transcripts
- **Channel Analysis**: Retrieve channel statistics and top-performing videos
- **Trend Discovery**: Access trending videos by region and category
- **Smart Caching**: MongoDB-based caching system to reduce API quota usage and improve performance
- **Token Efficiency**: All responses are structured to minimize token footprint for LLM consumption

## Target Users
- AI developers building YouTube-integrated applications
- LLM applications requiring YouTube data access
- MCP-compatible clients (like Claude Desktop)

## Technical Approach
The server operates via stdio communication (not network ports) and is spawned as a child process by MCP clients. It emphasizes data transformation over raw API responses, providing exactly what LLMs need without unnecessary overhead.