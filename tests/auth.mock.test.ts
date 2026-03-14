import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createContext } from "../server/_core/context";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

describe("Mock Authentication", () => {
  // Store original env values
  let originalNodeEnv: string | undefined;
  let originalUseMockAuth: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalUseMockAuth = process.env.USE_MOCK_AUTH;
  });

  afterEach(() => {
    // Restore original env values
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (originalUseMockAuth !== undefined) {
      process.env.USE_MOCK_AUTH = originalUseMockAuth;
    } else {
      delete process.env.USE_MOCK_AUTH;
    }
  });

  it("should use mock user when NODE_ENV=development and USE_MOCK_AUTH=true", async () => {
    // Set environment variables for mock authentication
    process.env.NODE_ENV = "development";
    process.env.USE_MOCK_AUTH = "true";

    // Create mock Express context
    const opts: CreateExpressContextOptions = {
      req: {
        headers: {},
      } as any,
      res: {} as any,
    };

    const context = await createContext(opts);

    // Verify mock user is created
    expect(context.user).toBeTruthy();
    expect(context.user?.email).toBe("dev@example.com");
    expect(context.user?.name).toBe("Development User");
    expect(context.user?.role).toBe("admin");
    expect(context.user?.loginMethod).toBe("mock");
    expect(context.user?.subscriptionTier).toBe("premium");
    expect(context.user?.openId).toBe("mock-dev-openid-123");
  });

  it("should not use mock user when NODE_ENV=production even if USE_MOCK_AUTH=true", async () => {
    // Set production environment
    process.env.NODE_ENV = "production";
    process.env.USE_MOCK_AUTH = "true";

    const opts: CreateExpressContextOptions = {
      req: {
        headers: {},
      } as any,
      res: {} as any,
    };

    const context = await createContext(opts);

    // Should not create mock user in production
    // (will be null because no real auth cookie is present)
    expect(context.user).toBeNull();
  });

  it("should not use mock user when USE_MOCK_AUTH is not set", async () => {
    // Set development but don't enable mock auth
    process.env.NODE_ENV = "development";
    delete process.env.USE_MOCK_AUTH;

    const opts: CreateExpressContextOptions = {
      req: {
        headers: {},
      } as any,
      res: {} as any,
    };

    const context = await createContext(opts);

    // Should not create mock user without flag
    expect(context.user).toBeNull();
  });

  it("should not use mock user when USE_MOCK_AUTH=false", async () => {
    // Explicitly disable mock auth
    process.env.NODE_ENV = "development";
    process.env.USE_MOCK_AUTH = "false";

    const opts: CreateExpressContextOptions = {
      req: {
        headers: {},
      } as any,
      res: {} as any,
    };

    const context = await createContext(opts);

    // Should not create mock user when explicitly disabled
    expect(context.user).toBeNull();
  });

  it("should provide request and response in context", async () => {
    process.env.NODE_ENV = "development";
    process.env.USE_MOCK_AUTH = "true";

    const mockReq = { headers: {} } as any;
    const mockRes = {} as any;

    const opts: CreateExpressContextOptions = {
      req: mockReq,
      res: mockRes,
    };

    const context = await createContext(opts);

    // Verify req and res are passed through
    expect(context.req).toBe(mockReq);
    expect(context.res).toBe(mockRes);
  });
});
