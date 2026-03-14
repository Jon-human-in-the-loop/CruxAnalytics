/**
 * Base entity interface
 */
export interface Entity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Query options for repository operations
 */
export interface QueryOptions<T> {
  /** Fields to filter by */
  where?: Partial<T>;
  /** Fields to sort by */
  orderBy?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
  /** Pagination: number of records to skip */
  skip?: number;
  /** Pagination: number of records to take */
  take?: number;
  /** Fields to include in result */
  select?: Array<keyof T>;
}

/**
 * Repository interface for data access operations
 * @template T Entity type
 */
export interface Repository<T extends Entity> {
  /** Find entity by ID */
  findById(id: string | number): Promise<T | null>;

  /** Find entities matching criteria */
  find(options?: QueryOptions<T>): Promise<T[]>;

  /** Find first entity matching criteria */
  findOne(options?: QueryOptions<T>): Promise<T | null>;

  /** Create a new entity */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;

  /** Update an existing entity */
  update(id: string | number, data: Partial<Omit<T, 'id'>>): Promise<T>;

  /** Delete an entity */
  delete(id: string | number): Promise<boolean>;

  /** Count entities matching criteria */
  count(options?: QueryOptions<T>): Promise<number>;

  /** Check if entity exists */
  exists(id: string | number): Promise<boolean>;
}

/**
 * Abstract base repository implementation
 * @template T Entity type
 */
export abstract class BaseRepository<T extends Entity> implements Repository<T> {
  protected entities: Map<string | number, T> = new Map();

  async findById(id: string | number): Promise<T | null> {
    return this.entities.get(id) || null;
  }

  async find(options?: QueryOptions<T>): Promise<T[]> {
    let results = Array.from(this.entities.values());

    if (options?.where) {
      results = results.filter((entity) =>
        this.matchesWhere(entity, options.where!)
      );
    }

    if (options?.orderBy) {
      results = this.applyOrderBy(results, options.orderBy);
    }

    if (options?.skip !== undefined) {
      results = results.slice(options.skip);
    }

    if (options?.take !== undefined) {
      results = results.slice(0, options.take);
    }

    if (options?.select) {
      results = results.map((entity) => this.selectFields(entity, options.select!));
    }

    return results;
  }

  async findOne(options?: QueryOptions<T>): Promise<T | null> {
    const results = await this.find({ ...options, take: 1 });
    return results[0] || null;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    const entity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    this.entities.set(id, entity);
    return entity;
  }

  async update(
    id: string | number,
    data: Partial<Omit<T, 'id'>>
  ): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date(),
    } as T;

    this.entities.set(id, updated);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    return this.entities.delete(id);
  }

  async count(options?: QueryOptions<T>): Promise<number> {
    const results = await this.find(options);
    return results.length;
  }

  async exists(id: string | number): Promise<boolean> {
    return this.entities.has(id);
  }

  protected abstract generateId(): string | number;

  private matchesWhere(entity: T, where: Partial<T>): boolean {
    return Object.entries(where).every(([key, value]) => {
      const entityValue = entity[key as keyof T];
      return entityValue === value;
    });
  }

  private applyOrderBy(
    entities: T[],
    orderBy: Array<{ field: keyof T; direction: 'asc' | 'desc' }>
  ): T[] {
    return entities.sort((a, b) => {
      for (const { field, direction } of orderBy) {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private selectFields(entity: T, fields: Array<keyof T>): T {
    const selected: Partial<T> = {};
    for (const field of fields) {
      selected[field] = entity[field];
    }
    return selected as T;
  }
}

/**
 * Unit of Work pattern for managing transactions
 */
export class UnitOfWork {
  private repositories: Map<string, Repository<any>> = new Map();
  private operations: Array<() => Promise<void>> = [];
  private inTransaction = false;

  /**
   * Register a repository with the unit of work
   */
  registerRepository<T extends Entity>(
    name: string,
    repository: Repository<T>
  ): void {
    this.repositories.set(name, repository);
  }

  /**
   * Get a registered repository
   */
  getRepository<T extends Entity>(name: string): Repository<T> {
    const repo = this.repositories.get(name);
    if (!repo) {
      throw new Error(`Repository ${name} not registered`);
    }
    return repo;
  }

  /**
   * Add an operation to the transaction
   */
  addOperation(operation: () => Promise<void>): void {
    if (!this.inTransaction) {
      throw new Error('Cannot add operation outside of transaction');
    }
    this.operations.push(operation);
  }

  /**
   * Begin a transaction
   */
  beginTransaction(): void {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    this.inTransaction = true;
    this.operations = [];
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }

    try {
      for (const operation of this.operations) {
        await operation();
      }
      this.operations = [];
      this.inTransaction = false;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    this.operations = [];
    this.inTransaction = false;
  }
}

/**
 * Factory for creating and managing repositories
 */
export class RepositoryFactory {
  private static repositories: Map<string, Repository<any>> = new Map();

  /**
   * Register a repository
   */
  static register<T extends Entity>(
    name: string,
    repository: Repository<T>
  ): void {
    this.repositories.set(name, repository);
  }

  /**
   * Get a repository by name
   */
  static get<T extends Entity>(name: string): Repository<T> {
    const repo = this.repositories.get(name);
    if (!repo) {
      throw new Error(`Repository ${name} not found`);
    }
    return repo;
  }

  /**
   * Check if repository exists
   */
  static has(name: string): boolean {
    return this.repositories.has(name);
  }

  /**
   * Clear all repositories
   */
  static clear(): void {
    this.repositories.clear();
  }
}

/**
 * Example implementation: In-memory repository with auto-incrementing IDs
 */
export class InMemoryRepository<T extends Entity> extends BaseRepository<T> {
  private nextId = 1;

  protected generateId(): number {
    return this.nextId++;
  }

  /**
   * Clear all data (useful for testing)
   */
  async clear(): Promise<void> {
    this.entities.clear();
    this.nextId = 1;
  }
}
