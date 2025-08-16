import { Db } from "mongodb";
let initializeContainer: typeof import("../../src/container").initializeContainer;
let mockConnectToDatabaseFn: jest.Mock;
let mockGetDbFn: jest.Mock;
let mockCacheServiceConstructorFn: jest.Mock;
let mockYoutubeServiceConstructorFn: jest.Mock;
let mockTranscriptServiceConstructorFn: jest.Mock; // Added mock for TranscriptService
let mockPlaylistServiceConstructorFn: jest.Mock; // Added mock for PlaylistService
let mockDbInstanceActual: Partial<Db>; // To ensure instance consistency

describe("initializeContainer", () => {
  beforeEach(async () => {
    jest.resetModules(); // Reset modules before each test

    // Reset the container singleton
    const tempContainerModule = await import("../../src/container");
    if (tempContainerModule && typeof tempContainerModule === 'object') {
      // Reset the internal container variable
      (tempContainerModule as any).container = null;
    }

    // Set a temporary environment variable to prevent crashes if other modules
    // are re-initialized and call initializeContainer at module scope.
    process.env.MDB_MCP_CONNECTION_STRING = "temporary_dummy_string_for_reset";

    // Define mock implementations and assign them to the higher-scoped variables
    mockDbInstanceActual = { collection: jest.fn().mockReturnThis() };
    mockConnectToDatabaseFn = jest.fn().mockResolvedValue(undefined);
    mockGetDbFn = jest.fn().mockReturnValue(mockDbInstanceActual);

    // For constructor mocks, we mock the class behavior
    // The actual instances will be created by these mocked constructors
    const mockCacheServiceInstance =
      {} as import("../../src/services/cache.service").CacheService; // representative instance
    mockCacheServiceConstructorFn = jest
      .fn()
      .mockImplementation(() => mockCacheServiceInstance);

    const mockYoutubeServiceInstance =
      {} as import("../../src/services/youtube.service").YoutubeService; // representative instance
    mockYoutubeServiceConstructorFn = jest
      .fn()
      .mockImplementation(() => mockYoutubeServiceInstance);

    const mockTranscriptServiceInstance =
      {} as import("../../src/services/transcript.service").TranscriptService; // representative instance
    mockTranscriptServiceConstructorFn = jest
      .fn()
      .mockImplementation(() => mockTranscriptServiceInstance);

    const mockPlaylistServiceInstance =
      {} as import("../../src/services/playlist.service").PlaylistService; // representative instance
    mockPlaylistServiceConstructorFn = jest
      .fn()
      .mockImplementation(() => mockPlaylistServiceInstance);

    // Use jest.doMock to control the mocks for the dynamically imported module
    jest.doMock("../../src/services/database.service", () => ({
      connectToDatabase: mockConnectToDatabaseFn,
      getDb: mockGetDbFn,
    }));
    jest.doMock("../../src/services/cache.service", () => ({
      CacheService: mockCacheServiceConstructorFn,
    }));
    jest.doMock("../../src/services/youtube.service", () => ({
      YoutubeService: mockYoutubeServiceConstructorFn,
    }));
    jest.doMock("../../src/services/transcript.service", () => ({
      TranscriptService: mockTranscriptServiceConstructorFn,
    }));
    jest.doMock("../../src/services/playlist.service", () => ({
      PlaylistService: mockPlaylistServiceConstructorFn,
    }));

    // Dynamically import the module under test AFTER jest.doMock calls
    const containerModule = await import("../../src/container");
    initializeContainer = containerModule.initializeContainer;

    // This delete is for the tests within this suite.
    delete process.env.MDB_MCP_CONNECTION_STRING;
    // ClearAllMocks is not strictly necessary here because we are using freshly created jest.fn()s
    // and they haven't been called yet. But it doesn't hurt.
    jest.clearAllMocks();
  });

  it("should initialize services and return the container", async () => {
    process.env.MDB_MCP_CONNECTION_STRING = "test_connection_string";

    const container = await initializeContainer();

    expect(mockConnectToDatabaseFn).toHaveBeenCalledTimes(1);
    expect(mockGetDbFn).toHaveBeenCalledTimes(1);
    expect(mockCacheServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockCacheServiceConstructorFn).toHaveBeenCalledWith(
      mockDbInstanceActual
    );
    expect(mockYoutubeServiceConstructorFn).toHaveBeenCalledTimes(1);
    // Assert that YoutubeService constructor was called with the instance created by CacheService mock
    expect(mockYoutubeServiceConstructorFn).toHaveBeenCalledWith(
      mockCacheServiceConstructorFn.mock.results[0].value
    );
    expect(mockTranscriptServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockTranscriptServiceConstructorFn).toHaveBeenCalledWith(
      mockCacheServiceConstructorFn.mock.results[0].value
    );
    expect(mockPlaylistServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockPlaylistServiceConstructorFn).toHaveBeenCalledWith(
      mockCacheServiceConstructorFn.mock.results[0].value
    );

    expect(container).toEqual({
      db: mockDbInstanceActual,
      cacheService: mockCacheServiceConstructorFn.mock.results[0].value,
      youtubeService: mockYoutubeServiceConstructorFn.mock.results[0].value,
      transcriptService:
        mockTranscriptServiceConstructorFn.mock.results[0].value, // Added
      playlistService:
        mockPlaylistServiceConstructorFn.mock.results[0].value, // Added
    });

    // Call initializeContainer again
    const sameContainer = await initializeContainer();
    expect(sameContainer).toBe(container); // Should be the same instance

    // Initialization logic should not be called again (container is cached)
    expect(mockConnectToDatabaseFn).toHaveBeenCalledTimes(1);
    expect(mockGetDbFn).toHaveBeenCalledTimes(1);
    expect(mockCacheServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockYoutubeServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockTranscriptServiceConstructorFn).toHaveBeenCalledTimes(1);
    expect(mockPlaylistServiceConstructorFn).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if MDB_MCP_CONNECTION_STRING is not set", async () => {
    try {
      await initializeContainer();
      throw new Error(
        "initializeContainer should have thrown an error but did not."
      );
    } catch (error: unknown) {
      expect((error as Error).message).toBe(
        "MDB_MCP_CONNECTION_STRING is not set. Cannot connect to database."
      );
    }

    expect(mockConnectToDatabaseFn).not.toHaveBeenCalled();
    expect(mockGetDbFn).not.toHaveBeenCalled();
    expect(mockCacheServiceConstructorFn).not.toHaveBeenCalled();
    expect(mockYoutubeServiceConstructorFn).not.toHaveBeenCalled();
    expect(mockTranscriptServiceConstructorFn).not.toHaveBeenCalled(); // Added
    expect(mockPlaylistServiceConstructorFn).not.toHaveBeenCalled(); // Added
  });
});
