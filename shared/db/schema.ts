import { mysqlTable, varchar, text, json, timestamp, int, decimal, index } from 'drizzle-orm/mysql-core';

/**
 * Financial results type for projects and scenarios
 */
export interface FinancialResults {
  roi: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  roiBest: number;
  npvBest: number;
  roiWorst: number;
  npvWorst: number;
  monthlyCashFlow: number[];
  cumulativeCashFlow: number[];
  vanguard?: {
    ofi: number;
    tfdi: number;
    ser: number;
  };
}

/**
 * Projects table - stores financial analysis projects
 */
export const projects = mysqlTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: int('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  initialInvestment: int('initial_investment').notNull(),
  yearlyRevenue: int('yearly_revenue').notNull(),
  operatingCosts: int('operating_costs').notNull(),
  maintenanceCosts: int('maintenance_costs').notNull(),
  projectDuration: int('project_duration').notNull(),
  discountRate: int('discount_rate').notNull(),
  revenueGrowth: int('revenue_growth').notNull(),
  bestCaseMultiplier: decimal('best_case_multiplier', { precision: 10, scale: 4 }).notNull(),
  worstCaseMultiplier: decimal('worst_case_multiplier', { precision: 10, scale: 4 }).notNull(),
  results: json('results').$type<FinancialResults>(),
  vanguardInput: json('vanguard_input'),
  saasInput: json('saas_input'),
  riskInput: json('risk_input'),
  businessModel: varchar('business_model', { length: 50 }).default('standard'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Scenarios table - stores scenario snapshots for projects
 */
export const scenarios = mysqlTable('scenarios', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  salesAdjustment: int('sales_adjustment').notNull().default(0),
  costsAdjustment: int('costs_adjustment').notNull().default(0),
  discountAdjustment: int('discount_adjustment').notNull().default(0),
  isBase: int('is_base').notNull().default(0), // tinyint as boolean
  results: json('results').$type<FinancialResults>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('project_id_idx').on(table.projectId),
}));

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
