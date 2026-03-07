import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers';
import type { ProjectData, ScenarioSnapshot } from '@/types/project';
import { eventEmitter, Events } from '@/lib/event-emitter';
import { getApiBaseUrl } from '@/constants/oauth';
import * as Auth from '@/lib/_core/auth';

// Lazy initialization of vanilla tRPC client
let _vanillaClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getVanillaClient() {
  if (!_vanillaClient) {
    _vanillaClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getApiBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = await Auth.getSessionToken();
            const guestId = await Auth.getGuestId();

            const headers: Record<string, string> = {
              'x-guest-id': guestId,
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      ],
    });
  }
  return _vanillaClient;
}

export async function getAllProjects(): Promise<ProjectData[]> {
  try {
    const client = getVanillaClient();
    const projects = await client.projects.list.query();
    return projects.map(mapDbProjectToProjectData);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const client = getVanillaClient();
    const project = await client.projects.get.query({ id });
    return mapDbProjectToProjectData(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function saveProject(project: ProjectData): Promise<string> {
  try {
    const client = getVanillaClient();
    if (project.id && !project.id.startsWith('project-') && isValidUUID(project.id)) {
      // Update existing
      await client.projects.update.mutate({
        id: project.id,
        data: mapProjectDataToDbProject(project),
      });
      eventEmitter.emit(Events.PROJECT_UPDATED, project);
      return project.id;
    } else {
      // Create new
      const { id } = await client.projects.create.mutate(mapProjectDataToDbProject(project));
      eventEmitter.emit(Events.PROJECT_CREATED, { ...project, id });
      return id;
    }
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<ProjectData, 'id' | 'createdAt'>>
): Promise<ProjectData | null> {
  try {
    const client = getVanillaClient();
    await client.projects.update.mutate({
      id,
      data: mapProjectDataToDbProject(updates as ProjectData),
    });

    // Fetch updated project
    const updatedProject = await getProject(id);
    if (updatedProject) {
      eventEmitter.emit(Events.PROJECT_UPDATED, updatedProject);
    }
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const client = getVanillaClient();
    await client.projects.delete.mutate({ id });
    eventEmitter.emit(Events.PROJECT_DELETED, id);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function duplicateProject(id: string): Promise<ProjectData | null> {
  try {
    const client = getVanillaClient();
    const { id: newId } = await client.projects.duplicate.mutate({ id });
    eventEmitter.emit(Events.PROJECT_DUPLICATED, newId);

    // Fetch the duplicated project
    return await getProject(newId);
  } catch (error) {
    console.error('Error duplicating project:', error);
    return null;
  }
}

export async function getAllScenarios(projectId: string): Promise<ScenarioSnapshot[]> {
  try {
    const client = getVanillaClient();
    const scenarios = await client.projects.scenarios.list.query({ projectId });
    return scenarios.map(mapDbScenarioToSnapshot);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

export async function saveScenarioSnapshot(
  projectId: string,
  snapshot: Omit<ScenarioSnapshot, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const client = getVanillaClient();
    await client.projects.scenarios.create.mutate({
      projectId,
      name: snapshot.name,
      salesAdjustment: snapshot.salesAdjustment,
      costsAdjustment: snapshot.costsAdjustment,
      discountAdjustment: snapshot.discountAdjustment,
      isBase: snapshot.isBase,
      results: snapshot.results,
    });
    eventEmitter.emit(Events.SNAPSHOT_CREATED, projectId);
  } catch (error) {
    console.error('Error saving scenario:', error);
    throw error;
  }
}

export async function deleteScenario(
  projectId: string,
  scenarioId: string
): Promise<void> {
  try {
    const client = getVanillaClient();
    await client.projects.scenarios.delete.mutate({ id: scenarioId });
    eventEmitter.emit(Events.SNAPSHOT_DELETED, scenarioId);
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
}

export async function getBaseScenario(
  projectId: string
): Promise<ScenarioSnapshot | null> {
  try {
    const scenarios = await getAllScenarios(projectId);
    return scenarios.find(s => s.isBase) || null;
  } catch (error) {
    console.error('Error getting base scenario:', error);
    return null;
  }
}

export async function restoreScenarioAsBase(
  projectId: string,
  scenarioId: string
): Promise<void> {
  // This functionality would need backend support to unmark other scenarios
  // For now, we can just log a warning
  console.warn('restoreScenarioAsBase not yet implemented in API');
  throw new Error('Not implemented');
}

// Helper mapping functions
function mapDbProjectToProjectData(dbProject: any): ProjectData {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    initialInvestment: dbProject.initialInvestment,
    yearlyRevenue: dbProject.yearlyRevenue,
    operatingCosts: dbProject.operatingCosts,
    maintenanceCosts: dbProject.maintenanceCosts,
    projectDuration: dbProject.projectDuration,
    discountRate: dbProject.discountRate,
    revenueGrowth: dbProject.revenueGrowth,
    bestCaseMultiplier: dbProject.bestCaseMultiplier,
    worstCaseMultiplier: dbProject.worstCaseMultiplier,
    results: dbProject.results,
    createdAt: dbProject.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: dbProject.updatedAt?.toISOString() || new Date().toISOString(),
    scenarios: [], // Scenarios are fetched separately
    vanguardInput: dbProject.vanguardInput,
    saasInput: dbProject.saasInput,
    riskInput: dbProject.riskInput,
    businessModel: dbProject.businessModel,
  };
}

function mapProjectDataToDbProject(project: Partial<ProjectData>) {
  const data: any = {};

  if (project.name !== undefined) data.name = project.name;
  if (project.description !== undefined) data.description = project.description;
  if (project.initialInvestment !== undefined) data.initialInvestment = project.initialInvestment;
  if (project.yearlyRevenue !== undefined) data.yearlyRevenue = project.yearlyRevenue;
  if (project.operatingCosts !== undefined) data.operatingCosts = project.operatingCosts;
  if (project.maintenanceCosts !== undefined) data.maintenanceCosts = project.maintenanceCosts;
  if (project.projectDuration !== undefined) data.projectDuration = project.projectDuration;
  if (project.discountRate !== undefined) data.discountRate = project.discountRate;
  if (project.revenueGrowth !== undefined) data.revenueGrowth = project.revenueGrowth;
  if (project.bestCaseMultiplier !== undefined) data.bestCaseMultiplier = project.bestCaseMultiplier;
  if (project.worstCaseMultiplier !== undefined) data.worstCaseMultiplier = project.worstCaseMultiplier;
  if (project.results !== undefined) data.results = project.results;
  if (project.vanguardInput !== undefined) data.vanguardInput = project.vanguardInput;
  if (project.saasInput !== undefined) data.saasInput = project.saasInput;
  if (project.riskInput !== undefined) data.riskInput = project.riskInput;
  if (project.businessModel !== undefined) data.businessModel = project.businessModel;

  return data;
}

function mapDbScenarioToSnapshot(dbScenario: any): ScenarioSnapshot {
  return {
    id: dbScenario.id,
    name: dbScenario.name,
    salesAdjustment: dbScenario.salesAdjustment,
    costsAdjustment: dbScenario.costsAdjustment,
    discountAdjustment: dbScenario.discountAdjustment,
    isBase: dbScenario.isBase === 1,
    results: dbScenario.results,
    createdAt: dbScenario.createdAt?.toISOString() || new Date().toISOString(),
  };
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Re-export functions that are still needed from legacy storage
// These will be implemented later or kept as legacy
export {
  exportAllProjects,
  importProjects,
  searchProjects,
  filterProjectsByViability,
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
  getRecentProjects,
  createNewProject,
} from '../project-storage-legacy';
