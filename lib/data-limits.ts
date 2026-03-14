/**
 * Data Limits Module
 * Manages limits for projects and snapshots to prevent excessive storage usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProjectData } from '@/types/project';
import { getAllProjects, deleteProject } from './project-storage';

// Limits
export const LIMITS = {
  MAX_PROJECTS: 100,
  MAX_SNAPSHOTS_PER_PROJECT: 20,
  WARNING_THRESHOLD: 0.9, // Warn at 90% capacity
};

/**
 * Check if projects limit is reached
 */
export async function isProjectsLimitReached(): Promise<boolean> {
  const projects = await getAllProjects();
  return projects.length >= LIMITS.MAX_PROJECTS;
}

/**
 * Check if approaching projects limit
 */
export async function isApproachingProjectsLimit(): Promise<boolean> {
  const projects = await getAllProjects();
  return projects.length >= LIMITS.MAX_PROJECTS * LIMITS.WARNING_THRESHOLD;
}

/**
 * Check if snapshots limit is reached for a project
 */
export function isSnapshotsLimitReached(project: ProjectData): boolean {
  const projectWithSnapshots = project as any;
  return (projectWithSnapshots.snapshots?.length || 0) >= LIMITS.MAX_SNAPSHOTS_PER_PROJECT;
}

/**
 * Get oldest projects
 */
export async function getOldestProjects(count: number): Promise<ProjectData[]> {
  const projects = await getAllProjects();

  // Sort by updatedAt (oldest first)
  const sorted = projects.sort((a, b) => {
    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });

  return sorted.slice(0, count);
}

/**
 * Clean old projects to make space
 */
export async function cleanOldProjects(count: number = 10): Promise<number> {
  try {
    const oldestProjects = await getOldestProjects(count);

    for (const project of oldestProjects) {
      await deleteProject(project.id);
    }

    return oldestProjects.length;
  } catch (error) {
    console.error('Error cleaning old projects:', error);
    return 0;
  }
}

/**
 * Clean old snapshots from a project
 */
export function cleanOldSnapshots(project: ProjectData, keepCount: number = 10): ProjectData {
  const projectWithSnapshots = project as any;

  if (!projectWithSnapshots.snapshots || projectWithSnapshots.snapshots.length <= keepCount) {
    return project;
  }

  // Sort by timestamp (newest first) and keep only the most recent
  const sorted = [...projectWithSnapshots.snapshots].sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  projectWithSnapshots.snapshots = sorted.slice(0, keepCount);
  return project;
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  const projects = await getAllProjects();

  const totalSnapshots = projects.reduce((sum, p) => {
    const projectWithSnapshots = p as any;
    return sum + (projectWithSnapshots.snapshots?.length || 0);
  }, 0);

  return {
    projectCount: projects.length,
    projectLimit: LIMITS.MAX_PROJECTS,
    projectUsagePercent: (projects.length / LIMITS.MAX_PROJECTS) * 100,
    totalSnapshots,
    averageSnapshotsPerProject: projects.length > 0 ? totalSnapshots / projects.length : 0,
  };
}
