import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { projects, scenarios } from '../../shared/db/schema';
import { db } from '../../shared/db';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const projectInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  initialInvestment: z.number().nonnegative(),
  yearlyRevenue: z.number().nonnegative(),
  operatingCosts: z.number().nonnegative(),
  maintenanceCosts: z.number().nonnegative(),
  projectDuration: z.number().int().positive(),
  discountRate: z.number().nonnegative(),
  revenueGrowth: z.number(),
  bestCaseMultiplier: z.number().nonnegative(),
  worstCaseMultiplier: z.number().nonnegative(),
  results: z.any().optional(),
  vanguardInput: z.any().optional(),
  saasInput: z.any().optional(),
  riskInput: z.any().optional(),
  businessModel: z.enum(['standard', 'saas', 'ecommerce', 'manufacturing']).optional(),
});

export const projectsRouter = router({
  // List all projects for authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, ctx.user.id))
      .orderBy(desc(projects.createdAt));
  }),

  create: protectedProcedure
    .input(projectInputSchema)
    .mutation(async ({ input, ctx }) => {
      // 1. Ensure user exists in DB (CRITICAL for Guest Mode)
      if (ctx.user.id === 1) {
        const { users } = await import('../../drizzle/schema');
        await db.insert(users).values({
          id: 1,
          openId: 'guest-user-openid',
          name: 'Guest User',
          email: 'guest@crux.local',
          loginMethod: 'open-source',
          role: 'admin',
          subscriptionTier: 'premium',
        }).onDuplicateKeyUpdate({
          set: { lastSignedIn: new Date() }
        });
      }


      const id = randomUUID();
      await db.insert(projects).values({
        id,
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),

  // Get single project
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new Error('Project not found');
      }
      return project;
    }),

  // Update project
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: projectInputSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(projects)
        .set({ ...input.data, updatedAt: new Date() })
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
      return { success: true };
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Delete scenarios first (cascade)
      await db.delete(scenarios).where(eq(scenarios.projectId, input.id));

      // Delete project
      await db
        .delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));

      return { success: true };
    }),

  // Duplicate project
  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [original] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!original) {
        throw new Error('Project not found');
      }

      const newId = randomUUID();
      await db.insert(projects).values({
        ...original,
        id: newId,
        name: `${original.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { id: newId };
    }),

  // Scenarios sub-router
  scenarios: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        // Verify project ownership
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project) {
          throw new Error('Project not found');
        }

        return await db
          .select()
          .from(scenarios)
          .where(eq(scenarios.projectId, input.projectId))
          .orderBy(desc(scenarios.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.string().uuid(),
        name: z.string().min(1).max(255),
        salesAdjustment: z.number().default(0),
        costsAdjustment: z.number().default(0),
        discountAdjustment: z.number().default(0),
        isBase: z.boolean().default(false),
        results: z.any(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify project ownership
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project) {
          throw new Error('Project not found');
        }

        const id = randomUUID();
        await db.insert(scenarios).values({
          id,
          projectId: input.projectId,
          name: input.name,
          salesAdjustment: input.salesAdjustment,
          costsAdjustment: input.costsAdjustment,
          discountAdjustment: input.discountAdjustment,
          isBase: input.isBase ? 1 : 0,
          results: input.results,
        });

        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        // Verify ownership through project
        const [scenario] = await db
          .select()
          .from(scenarios)
          .where(eq(scenarios.id, input.id))
          .limit(1);

        if (!scenario) {
          throw new Error('Scenario not found');
        }

        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, scenario.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project) {
          throw new Error('Unauthorized');
        }

        await db.delete(scenarios).where(eq(scenarios.id, input.id));
        return { success: true };
      }),
  }),
});
