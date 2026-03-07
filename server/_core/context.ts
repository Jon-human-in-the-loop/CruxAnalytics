import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  // Development mode: Use mock user for local testing
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true') {
    console.log('[Auth] Using mock user for development');
    user = {
      id: 1,
      openId: 'mock-dev-openid-123',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'admin',
      loginMethod: 'mock',
      subscriptionTier: 'premium',
      subscriptionExpiry: null,
      revenueCatUserId: null,
      aiAnalysisCount: 0,
      aiAnalysisResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User;
  } else {
    // Production/Default mode: Try real auth, fallback to Guest User
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      console.log('[Auth] Real auth failed, providing Open Source Guest User');
    }

    // Default Guest User for Open Source / Local testing
    if (!user) {
      const guestId = opts.req.headers['x-guest-id'] as string || 'guest-user-openid';

      const { users } = await import('../../drizzle/schema');
      const { db } = await import('../../shared/db');
      const { eq } = await import('drizzle-orm');

      let existingUser = await db.query.users.findFirst({
        where: eq(users.openId, guestId),
      });

      if (!existingUser) {
        await db.insert(users).values({
          openId: guestId,
          name: 'Guest User',
          email: `${guestId.substring(0, 15)}@crux.local`,
          loginMethod: 'open-source',
          role: 'admin',
          subscriptionTier: 'premium',
        });
        existingUser = await db.query.users.findFirst({
          where: eq(users.openId, guestId),
        });
      }

      if (existingUser) {
        user = existingUser;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
