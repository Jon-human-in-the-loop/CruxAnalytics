import { describe, it, expect } from 'vitest';
import { projects, scenarios } from '@/shared/db/schema';
import type { FinancialResults } from '@/shared/db/schema';

describe('Projects API Schema', () => {
  describe('Projects Table Schema', () => {
    it('should have correct column structure', () => {
      // Test that the schema is properly defined
      expect(projects).toBeDefined();
      expect(projects.id).toBeDefined();
      expect(projects.userId).toBeDefined();
      expect(projects.name).toBeDefined();
      expect(projects.description).toBeDefined();
      expect(projects.initialInvestment).toBeDefined();
      expect(projects.yearlyRevenue).toBeDefined();
      expect(projects.operatingCosts).toBeDefined();
      expect(projects.maintenanceCosts).toBeDefined();
      expect(projects.projectDuration).toBeDefined();
      expect(projects.discountRate).toBeDefined();
      expect(projects.revenueGrowth).toBeDefined();
      expect(projects.bestCaseMultiplier).toBeDefined();
      expect(projects.worstCaseMultiplier).toBeDefined();
      expect(projects.results).toBeDefined();
      expect(projects.createdAt).toBeDefined();
      expect(projects.updatedAt).toBeDefined();
    });
  });

  describe('Scenarios Table Schema', () => {
    it('should have correct column structure', () => {
      // Test that the schema is properly defined
      expect(scenarios).toBeDefined();
      expect(scenarios.id).toBeDefined();
      expect(scenarios.projectId).toBeDefined();
      expect(scenarios.name).toBeDefined();
      expect(scenarios.salesAdjustment).toBeDefined();
      expect(scenarios.costsAdjustment).toBeDefined();
      expect(scenarios.discountAdjustment).toBeDefined();
      expect(scenarios.isBase).toBeDefined();
      expect(scenarios.results).toBeDefined();
      expect(scenarios.createdAt).toBeDefined();
    });
  });

  describe('FinancialResults Type', () => {
    it('should validate FinancialResults structure', () => {
      const mockResults: FinancialResults = {
        roi: 25.5,
        npv: 150000,
        irr: 18.5,
        paybackPeriod: 12,
        roiBest: 35.0,
        npvBest: 200000,
        roiWorst: 15.0,
        npvWorst: 100000,
        monthlyCashFlow: [1000, 2000, 3000],
        cumulativeCashFlow: [1000, 3000, 6000],
      };

      // Type checking - if this compiles, the structure is correct
      expect(mockResults.roi).toBe(25.5);
      expect(mockResults.npv).toBe(150000);
      expect(mockResults.monthlyCashFlow).toHaveLength(3);
      expect(mockResults.cumulativeCashFlow).toHaveLength(3);
    });
  });

  describe('Router Type Safety', () => {
    it('should export router from server/routers/projects.ts', async () => {
      // Dynamic import to check if the router exports correctly
      const { projectsRouter } = await import('@/server/routers/projects');

      expect(projectsRouter).toBeDefined();
      expect(typeof projectsRouter).toBe('object');
    });
  });
});

describe('API Client Layer', () => {
  describe('Project Storage Compatibility', () => {
    it('should export all required functions from lib/project-storage.ts', async () => {
      const projectStorage = await import('@/lib/project-storage');

      // Check that all required functions are exported
      expect(projectStorage.getAllProjects).toBeDefined();
      expect(projectStorage.getProject).toBeDefined();
      expect(projectStorage.saveProject).toBeDefined();
      expect(projectStorage.updateProject).toBeDefined();
      expect(projectStorage.deleteProject).toBeDefined();
      expect(projectStorage.duplicateProject).toBeDefined();
      expect(projectStorage.getAllScenarios).toBeDefined();
      expect(projectStorage.saveScenarioSnapshot).toBeDefined();
      expect(projectStorage.deleteScenario).toBeDefined();
      expect(projectStorage.getBaseScenario).toBeDefined();

      // Legacy functions
      expect(projectStorage.exportAllProjects).toBeDefined();
      expect(projectStorage.importProjects).toBeDefined();
      expect(projectStorage.searchProjects).toBeDefined();
      expect(projectStorage.createNewProject).toBeDefined();
    });
  });

  describe('API Projects Module', () => {
    it('should export all API functions from lib/api/projects.ts', async () => {
      const apiProjects = await import('@/lib/api/projects');

      // Check that all API functions are exported
      expect(apiProjects.getAllProjects).toBeDefined();
      expect(apiProjects.getProject).toBeDefined();
      expect(apiProjects.saveProject).toBeDefined();
      expect(apiProjects.updateProject).toBeDefined();
      expect(apiProjects.deleteProject).toBeDefined();
      expect(apiProjects.duplicateProject).toBeDefined();
      expect(apiProjects.getAllScenarios).toBeDefined();
      expect(apiProjects.saveScenarioSnapshot).toBeDefined();
      expect(apiProjects.deleteScenario).toBeDefined();
      expect(apiProjects.getBaseScenario).toBeDefined();
    });
  });
});

describe('Type Mappings', () => {
  it('should correctly define mapping functions', async () => {
    // Just verify that the module can be imported and has the structure
    const apiProjects = await import('@/lib/api/projects');

    // The mapping functions are internal, but we can test the exported functions exist
    expect(typeof apiProjects.getAllProjects).toBe('function');
    expect(typeof apiProjects.getProject).toBe('function');
    expect(typeof apiProjects.saveProject).toBe('function');
  });
});
