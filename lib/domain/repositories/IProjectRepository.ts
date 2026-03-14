import type { ProjectData } from '@/types/project';

/**
 * Repository interface for Project persistence.
 * Follows Repository pattern to abstract data access layer.
 * 
 * @interface IProjectRepository
 * 
 * @example
 * ```typescript
 * class LocalStorageProjectRepository implements IProjectRepository {
 *   async save(project: ProjectData): Promise<void> {
 *     // Implementation using AsyncStorage
 *   }
 *   
 *   async findById(id: string): Promise<ProjectData | null> {
 *     // Implementation using AsyncStorage
 *   }
 *   
 *   // ... other methods
 * }
 * ```
 */
export interface IProjectRepository {
  /**
   * Saves a project to the repository.
   * Creates new project if it doesn't exist, updates if it does.
   * 
   * @param project - The project data to save
   * @returns Promise that resolves when save is complete
   * @throws {Error} If save operation fails
   */
  save(project: ProjectData): Promise<void>;

  /**
   * Finds a project by its ID
   * 
   * @param id - The project ID to find
   * @returns Promise that resolves to the project or null if not found
   * @throws {Error} If query operation fails
   */
  findById(id: string): Promise<ProjectData | null>;

  /**
   * Finds all projects in the repository
   * 
   * @returns Promise that resolves to array of all projects
   * @throws {Error} If query operation fails
   */
  findAll(): Promise<ProjectData[]>;

  /**
   * Deletes a project by its ID
   * 
   * @param id - The project ID to delete
   * @returns Promise that resolves to true if deleted, false if not found
   * @throws {Error} If delete operation fails
   */
  delete(id: string): Promise<boolean>;

  /**
   * Checks if a project exists by its ID
   * 
   * @param id - The project ID to check
   * @returns Promise that resolves to true if exists, false otherwise
   * @throws {Error} If query operation fails
   */
  exists(id: string): Promise<boolean>;

  /**
   * Finds projects by business model
   * 
   * @param businessModel - The business model to filter by
   * @returns Promise that resolves to array of matching projects
   * @throws {Error} If query operation fails
   */
  findByBusinessModel(businessModel: string): Promise<ProjectData[]>;

  /**
   * Counts total number of projects
   * 
   * @returns Promise that resolves to the count
   * @throws {Error} If query operation fails
   */
  count(): Promise<number>;
}
