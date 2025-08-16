# Technology Stack & Build System

## Core Technologies
- **Runtime**: Node.js >=20.0.0
- **Language**: TypeScript with ES2022 target and NodeNext modules
- **Package Manager**: npm
- **Module System**: ES Modules (type: "module" in package.json)

## Key Dependencies
- **MCP SDK**: `@modelcontextprotocol/sdk` - Model Context Protocol implementation
- **YouTube API**: `googleapis` - Official Google APIs client library
- **Database**: `mongodb` - MongoDB driver for caching
- **Validation**: `zod` - Runtime type validation and schema definition
- **Transcripts**: `youtube-caption-extractor` - Video transcript extraction
- **Environment**: `dotenv` - Environment variable management
- **Runtime**: `tsx` - TypeScript execution and development

## Development Tools
- **Testing**: Jest with ts-jest preset, jest-junit reporter
- **Linting**: ESLint with TypeScript support and Prettier integration
- **Type Checking**: TypeScript with strict mode enabled
- **Code Formatting**: Prettier
- **Build**: TypeScript compiler (tsc)

## Common Commands

### Development
```bash
npm run dev              # Development with live reloading
npm run start:client     # Run TypeScript directly (development)
npm run inspector        # MCP inspector for debugging tools
```

### Build & Production
```bash
npm run build           # Compile TypeScript to dist/
npm run clean           # Remove dist/ directory
npm start               # Run production build
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run format:check    # Check formatting without changes
npm test                # Run Jest tests
npm test -- --coverage # Run tests with coverage report
```

## Build Configuration
- **Output**: `dist/` directory
- **Entry Point**: `dist/index.js` (executable with shebang)
- **Declarations**: TypeScript declaration files generated
- **Module Resolution**: NodeNext for proper ES module support

## Environment Variables
- `YOUTUBE_API_KEY` - Required YouTube Data API v3 key
- `MDB_MCP_CONNECTION_STRING` - Required MongoDB connection string
- Database name is hardcoded to `youtube_niche_analysis`

## Package Distribution
- Published to npm as `@klucas007/mcp-youtube`
- Executable via `npx` or direct installation
- Binary entry point: `mcp-youtube` command