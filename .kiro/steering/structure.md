# Project Structure & Organization

## Root Directory Structure
```
├── src/                    # Source code
├── dist/                   # Compiled output (generated)
├── coverage/               # Test coverage reports (generated)
├── test-results/           # Jest test results (generated)
├── .env.example            # Environment variable template
├── package.json            # Project configuration and dependencies
├── tsconfig.json           # TypeScript configuration for source
├── tsconfig.test.json      # TypeScript configuration for tests
├── jest.config.js          # Jest testing configuration
├── eslint.config.js        # ESLint configuration
└── .prettierrc.json        # Prettier formatting configuration
```

## Source Code Organization (`src/`)

### Core Application Files
- `index.ts` - Main entry point with MCP server setup and tool registration
- `container.ts` - Dependency injection container for services

### Services (`src/services/`)
Business logic and external API integration:
- `youtube.service.ts` - YouTube Data API wrapper with caching
- `transcript.service.ts` - Video transcript extraction
- `cache.service.ts` - MongoDB caching abstraction
- `database.service.ts` - Database connection management
- `nicheAnalyzer.service.ts` - Advanced analysis features

### Tools (`src/tools/`)
MCP tool implementations organized by domain:
- `video/` - Video-related tools (details, search, transcripts)
- `channel/` - Channel-related tools (statistics, top videos)
- `general/` - General tools (trending, categories, outlier analysis)
- `index.ts` - Tool registration and dependency injection

### Types (`src/types/`)
TypeScript type definitions:
- `tools.ts` - Tool parameter interfaces
- `youtube.ts` - YouTube API response types
- `analyzer.types.ts` - Analysis-specific types
- `niche.types.ts` - Niche analysis types

### Utilities (`src/utils/`)
Shared utility functions:
- `errorHandler.ts` - Standardized error formatting
- `responseFormatter.ts` - MCP response formatting
- `validation.ts` - Zod validation schemas
- `engagementCalculator.ts` - Engagement ratio calculations
- `numberParser.ts` - YouTube number format parsing
- `textUtils.ts` - Text processing utilities
- `featureFlags.ts` - Feature flag management

### Configuration (`src/config/`)
- `cache.config.ts` - Cache TTL and collection definitions

## Testing Structure
Tests are co-located with source files using `__tests__/` directories:
- Each module has corresponding `.test.ts` files
- Test files mirror the source structure
- Jest configuration supports both unit and integration tests

## Architecture Patterns

### Dependency Injection
- Services are instantiated in `container.ts`
- Tools receive dependencies via function parameters
- No global state or singletons (except container)

### Tool Pattern
Each tool follows a consistent structure:
```typescript
// Configuration object with Zod schema
export const toolConfig = {
  name: "toolName",
  description: "Tool description",
  inputSchema: zodSchema
};

// Handler function with injected dependencies
export const toolHandler = async (
  params: ParamsType,
  service: ServiceType
): Promise<CallToolResult> => {
  // Implementation
};
```

### Service Layer
- Services handle external API calls and caching
- Business logic is encapsulated in service methods
- Error handling is consistent across services

### Type Safety
- Zod schemas for runtime validation
- TypeScript interfaces for compile-time safety
- Strict TypeScript configuration with type checking

## File Naming Conventions
- Use kebab-case for directories and files
- Service files end with `.service.ts`
- Test files end with `.test.ts`
- Type definition files use descriptive names
- Configuration files end with `.config.ts`

## Import/Export Patterns
- Use ES modules with `.js` extensions in imports
- Barrel exports in `index.ts` files for clean imports
- Type-only imports where appropriate
- Consistent relative path usage