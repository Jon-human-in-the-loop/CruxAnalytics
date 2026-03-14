import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProjectData, ScenarioSnapshot } from '@/types/project';
import { compressData, decompressData } from './data-compression';

const PROJECTS_KEY = '@business_case_analyzer:projects';
const PROJECT_PREFIX = '@business_case_analyzer:project:';

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<ProjectData[]> {
  try {
    const projectsJson = await AsyncStorage.getItem(PROJECTS_KEY);
    if (!projectsJson) {
      return [];
    }
    return JSON.parse(projectsJson);
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const projectData = await AsyncStorage.getItem(`${PROJECT_PREFIX}${id}`);
    if (!projectData) {
      return null;
    }
    // Try to decompress, fallback to JSON.parse if not compressed
    const project = decompressData<ProjectData>(projectData);
    return project || JSON.parse(projectData);
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

/**
 * Save a project
 */
export async function saveProject(project: ProjectData): Promise<void> {
  try {
    // Update timestamp
    project.updatedAt = new Date().toISOString();

    // Compress and save the project data
    const compressed = compressData(project);
    await AsyncStorage.setItem(
      `${PROJECT_PREFIX}${project.id}`,
      compressed
    );

    // Update the projects index
    const projects = await getAllProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<ProjectData, 'id' | 'createdAt'>>
): Promise<ProjectData | null> {
  try {
    const project = await getProject(id);
    if (!project) {
      return null;
    }

    // Merge updates
    const updatedProject: ProjectData = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save updated project
    await saveProject(updatedProject);

    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    // Remove the project data
    await AsyncStorage.removeItem(`${PROJECT_PREFIX}${id}`);

    // Update the projects index
    const projects = await getAllProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filteredProjects));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Duplicate a project
 */
export async function duplicateProject(id: string): Promise<ProjectData | null> {
  try {
    const original = await getProject(id);
    if (!original) {
      return null;
    }

    const duplicate: ProjectData = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenarios: [], // Don't copy scenarios
    };

    await saveProject(duplicate);
    return duplicate;
  } catch (error) {
    console.error('Error duplicating project:', error);
    return null;
  }
}

/**
 * Create a new empty project
 */
export function createNewProject(): ProjectData {
  return {
    id: generateId(),
    name: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    initialInvestment: 0,
    discountRate: 10,
    projectDuration: 24,
    yearlyRevenue: 0,
    revenueGrowth: 5,
    operatingCosts: 0,
    maintenanceCosts: 0,
    bestCaseMultiplier: 1.3,
    worstCaseMultiplier: 0.7,
    scenarios: [],
  };
}

/**
 * Save a scenario snapshot
 */
export async function saveScenarioSnapshot(
  projectId: string,
  scenario: Omit<ScenarioSnapshot, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const newScenario: ScenarioSnapshot = {
      ...scenario,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    // If this is marked as base, unmark all other scenarios
    if (newScenario.isBase && project.scenarios) {
      project.scenarios = project.scenarios.map(s => ({
        ...s,
        isBase: false,
      }));
    }

    project.scenarios = project.scenarios || [];
    project.scenarios.push(newScenario);

    await saveProject(project);
  } catch (error) {
    console.error('Error saving scenario:', error);
    throw error;
  }
}

/**
 * Get the base scenario for a project
 */
export async function getBaseScenario(
  projectId: string
): Promise<ScenarioSnapshot | null> {
  try {
    const project = await getProject(projectId);
    if (!project || !project.scenarios) {
      return null;
    }

    return project.scenarios.find(s => s.isBase) || null;
  } catch (error) {
    console.error('Error getting base scenario:', error);
    return null;
  }
}

/**
 * Delete a scenario
 */
export async function deleteScenario(
  projectId: string,
  scenarioId: string
): Promise<void> {
  try {
    const project = await getProject(projectId);
    if (!project || !project.scenarios) {
      return;
    }

    project.scenarios = project.scenarios.filter(s => s.id !== scenarioId);
    await saveProject(project);
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export all projects as JSON
 */
export async function exportAllProjects(): Promise<string> {
  try {
    const projects = await getAllProjects();
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projectCount: projects.length,
      projects: projects,
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting projects:', error);
    throw error;
  }
}

/**
 * Import projects from JSON
 */
export async function importProjects(jsonData: string): Promise<{ imported: number; skipped: number }> {
  try {
    const data = JSON.parse(jsonData);

    // Validate structure
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid import format: missing projects array');
    }

    let imported = 0;
    let skipped = 0;

    for (const project of data.projects) {
      try {
        // Validate required fields
        if (!project.name || typeof project.initialInvestment !== 'number') {
          skipped++;
          continue;
        }

        // Generate new ID to avoid conflicts
        const newProject: ProjectData = {
          ...project,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveProject(newProject);
        imported++;
      } catch (error) {
        console.error('Error importing project:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  } catch (error) {
    console.error('Error importing projects:', error);
    throw error;
  }
}

/**
 * Search projects by name
 */
export async function searchProjects(query: string): Promise<ProjectData[]> {
  try {
    const allProjects = await getAllProjects();
    const lowerQuery = query.toLowerCase();

    return allProjects.filter(project =>
      project.name.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching projects:', error);
    return [];
  }
}

/**
 * Filter projects by viability
 */
export async function filterProjectsByViability(
  filter: 'all' | 'viable' | 'risky'
): Promise<ProjectData[]> {
  try {
    const allProjects = await getAllProjects();

    if (filter === 'all') {
      return allProjects;
    }

    return allProjects.filter(project => {
      if (!project.results) {
        return false;
      }

      const isViable = project.results.roi > 0 && project.results.npv > 0;

      if (filter === 'viable') {
        return isViable;
      } else {
        return !isViable;
      }
    });
  } catch (error) {
    console.error('Error filtering projects:', error);
    return [];
  }
}

// Draft management
const DRAFT_PREFIX = '@business_case_analyzer:draft:';

/**
 * Save a draft
 */
export async function saveDraft(key: string, data: any): Promise<void> {
  try {
    const draft = {
      data,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(draft));
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Load a draft
 */
export async function loadDraft(key: string): Promise<any | null> {
  try {
    const draftJson = await AsyncStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!draftJson) return null;

    const draft = JSON.parse(draftJson);
    return draft.data;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Clear a draft
 */
export async function clearDraft(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${DRAFT_PREFIX}${key}`);
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
}

/**
 * Check if a draft exists
 */
export async function hasDraft(key: string): Promise<boolean> {
  try {
    const draftJson = await AsyncStorage.getItem(`${DRAFT_PREFIX}${key}`);
    return draftJson !== null;
  } catch (error) {
    console.error('Error checking draft:', error);
    return false;
  }
}

/**
 * Get all scenarios for a project
 */
export async function getAllScenarios(projectId: string): Promise<ScenarioSnapshot[]> {
  try {
    const project = await getProject(projectId);
    if (!project || !project.scenarios) {
      return [];
    }
    return project.scenarios.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting scenarios:', error);
    return [];
  }
}

/**
 * Restore a scenario as the base scenario
 */
export async function restoreScenarioAsBase(
  projectId: string,
  scenarioId: string
): Promise<void> {
  try {
    const project = await getProject(projectId);
    if (!project || !project.scenarios) {
      throw new Error('Project or scenarios not found');
    }

    // Unmark all scenarios as base
    project.scenarios = project.scenarios.map(s => ({
      ...s,
      isBase: s.id === scenarioId,
    }));

    await saveProject(project);
  } catch (error) {
    console.error('Error restoring scenario as base:', error);
    throw error;
  }
}

/**
 * Get recent projects (sorted by updatedAt)
 */
export async function getRecentProjects(limit: number = 5): Promise<ProjectData[]> {
  try {
    const allProjects = await getAllProjects();

    return allProjects
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent projects:', error);
    return [];
  }
}
