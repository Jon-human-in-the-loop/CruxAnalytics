import { describe, it, expect } from 'vitest';
import { calculateOFI, calculateTFDI, calculateSER } from '../lib/business-logic/business-intelligence';
import { calculateFinancialMetricsXAI, ROIStrategy, NPVStrategy } from '../lib/business-logic/financial-core';
import { businessIntelligence } from '../lib/business-logic/index';
import { validateNumber, validatePercentage, validatePositiveNumber } from '../lib/validation/input-validator';
import { Logger, LogLevel, MemoryLogOutput } from '../lib/data-access/logging';
import { InMemoryRepository } from '../lib/data-access/repository';

describe('CruxAnalytics Modular Architecture', () => {
  describe('Validation Layer', () => {
    it('should validate numbers within range', () => {
      expect(validateNumber(50, 0, 100)).toBe(50);
      expect(() => validateNumber(150, 0, 100)).toThrow();
    });

    it('should validate percentages', () => {
      expect(validatePercentage(75)).toBe(75);
      expect(() => validatePercentage(150)).toThrow();
    });

    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(10)).toBe(10);
      expect(() => validatePositiveNumber(-5)).toThrow();
    });
  });

  describe('Business Intelligence Layer', () => {
    it('should calculate OFI with XAI context', async () => {
      const result = await calculateOFI(40, 160, 1.5);

      expect(result.value.ofi).toBeGreaterThan(0);
      expect(result.context.interpretation).toBeDefined();
      expect(result.context.recommendations).toBeInstanceOf(Array);
      expect(result.context.confidence).toBeGreaterThanOrEqual(0);
      expect(result.context.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate TFDI with financial impact', async () => {
      const result = await calculateTFDI(100, 50, 10000, 12);

      expect(result.value.totalCost).toBe(60000);
      expect(result.value.netSavings).toBe(50000);
      expect(result.value.breakEvenPoint).toBeCloseTo(2, 1);
      expect(result.context.interpretation).toContain('Tech-debt');
    });

    it('should calculate SER sustainability metric', async () => {
      const result = await calculateSER(50, 24, 5000, 10000);

      expect(result.value.ser).toBeGreaterThan(0);
      expect(result.context.interpretation).toContain('Sustainability');
      expect(result.metadata.version).toBe('1.0.0');
    });
  });

  describe('Financial Core Layer', () => {
    it('should calculate ROI strategy', async () => {
      const strategy = new ROIStrategy();
      const result = await strategy.calculate({
        investment: 10000,
        savings: 3000,
        discountRate: 0.1,
        timeHorizon: 5,
      });

      expect(result.name).toBe('ROI');
      expect(result.value).toBeGreaterThan(0);
      expect(result.unit).toBe('%');
    });

    it('should calculate NPV strategy', async () => {
      const strategy = new NPVStrategy();
      const result = await strategy.calculate({
        investment: 10000,
        savings: 3000,
        discountRate: 0.1,
        timeHorizon: 5,
      });

      expect(result.name).toBe('NPV');
      expect(result.unit).toBe('$');
    });

    it('should calculate all financial metrics with XAI', async () => {
      const result = await calculateFinancialMetricsXAI({
        investment: 10000,
        savings: 3000,
        discountRate: 0.1,
        timeHorizon: 5,
      });

      expect(result.roi.value.name).toBe('ROI');
      expect(result.npv.value.name).toBe('NPV');
      expect(result.irr.value.name).toBe('IRR');
      expect(result.payback.value.name).toBe('Payback');

      expect(result.roi.context.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Business Intelligence Facade', () => {
    it('should provide unified API for financial calculations', async () => {
      const result = await businessIntelligence.calculateFinancials({
        investment: 10000,
        savings: 3000,
        discountRate: 0.1,
        timeHorizon: 5,
      });

      expect(result.roi).toBeDefined();
      expect(result.npv).toBeDefined();
      expect(result.irr).toBeDefined();
      expect(result.payback).toBeDefined();
    });

    it('should calculate comprehensive insights', async () => {
      const result = await businessIntelligence.getComprehensiveInsights(
        {
          investment: 10000,
          savings: 3000,
          discountRate: 0.1,
          timeHorizon: 5,
        },
        {
          repetitiveHours: 40,
          totalHours: 160,
          frictionMultiplier: 1.5,
          manualHoursPerMonth: 100,
          manualHourlyRate: 50,
          automationCost: 10000,
          timeHorizonMonths: 12,
          efficiencyGain: 50,
          lifetime: 24,
          frictionCost: 5000,
          investment: 10000,
        }
      );

      expect(result.financial).toBeDefined();
      expect(result.businessIntelligence).toBeDefined();
      expect(result.executiveSummary).toBeDefined();
      expect(result.executiveSummary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.executiveSummary.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Access Layer - Logging', () => {
    it('should create logger and log messages', async () => {
      const memoryOutput = new MemoryLogOutput();
      const logger = new Logger('test-logger', { outputs: [memoryOutput] });

      await logger.info('Test message', { key: 'value' });
      await logger.error('Error message', new Error('Test error'));

      const logs = memoryOutput.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].message).toBe('Test message');
      expect(logs[1].message).toBe('Error message');
    });

    it('should filter logs by level', async () => {
      const memoryOutput = new MemoryLogOutput();
      const logger = new Logger('test-logger', {
        outputs: [memoryOutput],
        minLevel: LogLevel.INFO,
      });

      await logger.debug('Debug message');
      await logger.info('Info message');
      await logger.warn('Warning message');

      const logs = memoryOutput.getLogs();
      expect(logs.length).toBe(2); // debug filtered out
    });

    it('should log audit entries', async () => {
      const memoryOutput = new MemoryLogOutput();
      const logger = new Logger('audit-logger', { outputs: [memoryOutput] });

      await logger.audit('user123', 'create', 'project', 'success', {
        projectId: 'proj-123',
      });

      const logs = memoryOutput.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Audit');
      expect(logs[0].message).toContain('user123');
    });
  });

  describe('Data Access Layer - Repository', () => {
    interface TestEntity {
      id: number;
      name: string;
      value: number;
      createdAt?: Date;
      updatedAt?: Date;
    }

    it('should create and retrieve entities', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      const entity = await repo.create({ name: 'Test', value: 100 });
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test');

      const found = await repo.findById(entity.id);
      expect(found).toEqual(entity);
    });

    it('should update entities', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      const entity = await repo.create({ name: 'Test', value: 100 });
      const updated = await repo.update(entity.id, { value: 200 });

      expect(updated.value).toBe(200);
      expect(updated.name).toBe('Test');
    });

    it('should delete entities', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      const entity = await repo.create({ name: 'Test', value: 100 });
      const deleted = await repo.delete(entity.id);
      expect(deleted).toBe(true);

      const found = await repo.findById(entity.id);
      expect(found).toBeNull();
    });

    it('should query entities with filters', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      await repo.create({ name: 'Test1', value: 100 });
      await repo.create({ name: 'Test2', value: 200 });
      await repo.create({ name: 'Test3', value: 150 });

      const results = await repo.find({
        where: { name: 'Test2' },
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Test2');
    });

    it('should support pagination', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      for (let i = 1; i <= 10; i++) {
        await repo.create({ name: `Test${i}`, value: i * 10 });
      }

      const page1 = await repo.find({ skip: 0, take: 3 });
      const page2 = await repo.find({ skip: 3, take: 3 });

      expect(page1.length).toBe(3);
      expect(page2.length).toBe(3);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should count entities', async () => {
      const repo = new InMemoryRepository<TestEntity>();

      await repo.create({ name: 'Test1', value: 100 });
      await repo.create({ name: 'Test2', value: 200 });
      await repo.create({ name: 'Test3', value: 150 });

      const count = await repo.count();
      expect(count).toBe(3);
    });
  });
});
