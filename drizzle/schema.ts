import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Export projects and scenarios from shared schema
export { projects, scenarios } from "../shared/db/schema";
export type { Project, InsertProject, Scenario, InsertScenario, FinancialResults } from "../shared/db/schema";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  // Subscription & Monetization fields
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium"]).default("free").notNull(),
  subscriptionExpiry: timestamp("subscriptionExpiry"),
  revenueCatUserId: varchar("revenueCatUserId", { length: 128 }),

  // Usage tracking for FREE tier limits
  aiAnalysisCount: int("aiAnalysisCount").default(0).notNull(),
  aiAnalysisResetDate: timestamp("aiAnalysisResetDate").defaultNow().notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Device usage tracking table for preventing abuse.
 * Tracks AI analysis usage per device (hardware fingerprint) to prevent
 * users from bypassing FREE tier limits by creating multiple accounts.
 */
export const deviceUsage = mysqlTable("device_usage", {
  /** Unique device identifier (iOS: identifierForVendor, Android: androidId) */
  deviceId: varchar("deviceId", { length: 128 }).primaryKey(),
  /** Number of AI analyses performed from this device */
  usageCount: int("usageCount").default(0).notNull(),
  /** Last time this device used AI analysis */
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  /** First time this device was seen */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Last update timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeviceUsage = typeof deviceUsage.$inferSelect;
export type InsertDeviceUsage = typeof deviceUsage.$inferInsert;
