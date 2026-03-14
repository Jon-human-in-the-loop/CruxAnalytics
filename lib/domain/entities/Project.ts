/**
 * Business model enumeration
 */
export enum BusinessModel {
  STANDARD = 'standard',
  SAAS = 'saas',
  ECOMMERCE = 'ecommerce',
  MANUFACTURING = 'manufacturing'
}

/**
 * Project status enumeration
 */
export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

/**
 * Core project properties
 */
export interface ProjectProperties {
  id: string;
  name: string;
  description?: string;
  businessModel: BusinessModel;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;

  // Financial inputs
  initialInvestment: number;
  discountRate: number;
  projectDuration: number; // in months

  // Revenue projections
  yearlyRevenue: number;
  revenueGrowth: number; // percentage

  // Costs
  operatingCosts: number;
  maintenanceCosts: number;

  // Scenario multipliers
  bestCaseMultiplier: number;
  worstCaseMultiplier: number;
}

/**
 * Domain entity for Project.
 * Encapsulates business rules and validation logic for project data.
 * 
 * 
 * @example
 * ```typescript
 * const project = new Project({
 *   id: 'proj-123',
 *   name: 'New Product Launch',
 *   businessModel: BusinessModel.STANDARD,
 *   status: ProjectStatus.ACTIVE,
 *   initialInvestment: 100000,
 *   discountRate: 10,
 *   projectDuration: 36,
 *   yearlyRevenue: 150000,
 *   revenueGrowth: 5,
 *   operatingCosts: 30000,
 *   maintenanceCosts: 10000,
 *   bestCaseMultiplier: 1.3,
 *   worstCaseMultiplier: 0.7,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * });
 * 
 * project.validate(); // Throws if validation fails
 * ```
 */
export class Project {
  private readonly properties: ProjectProperties;

  constructor(props: ProjectProperties) {
    this.properties = { ...props };
    this.validate();
  }

  validate(): void {
    const errors: string[] = [];

    // Name validation
    if (!this.properties.name || this.properties.name.trim().length === 0) {
      errors.push('Project name cannot be empty');
    }
    if (this.properties.name.length > 200) {
      errors.push('Project name cannot exceed 200 characters');
    }

    // Financial validation
    if (this.properties.initialInvestment < 0) {
      errors.push('Initial investment cannot be negative');
    }
    if (this.properties.discountRate < 0 || this.properties.discountRate > 100) {
      errors.push('Discount rate must be between 0 and 100');
    }
    if (this.properties.projectDuration < 1 || this.properties.projectDuration > 600) {
      errors.push('Project duration must be between 1 and 600 months');
    }
    if (this.properties.yearlyRevenue < 0) {
      errors.push('Yearly revenue cannot be negative');
    }
    if (this.properties.revenueGrowth < -100 || this.properties.revenueGrowth > 1000) {
      errors.push('Revenue growth must be between -100% and 1000%');
    }
    if (this.properties.operatingCosts < 0) {
      errors.push('Operating costs cannot be negative');
    }
    if (this.properties.maintenanceCosts < 0) {
      errors.push('Maintenance costs cannot be negative');
    }

    // Scenario multipliers validation
    if (this.properties.bestCaseMultiplier < 1) {
      errors.push('Best case multiplier must be >= 1.0');
    }
    if (this.properties.worstCaseMultiplier > 1) {
      errors.push('Worst case multiplier must be <= 1.0');
    }
    if (this.properties.worstCaseMultiplier < 0) {
      errors.push('Worst case multiplier cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Project validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Gets the project ID
   */
  get id(): string {
    return this.properties.id;
  }

  /**
   * Gets the project name
   */
  get name(): string {
    return this.properties.name;
  }

  /**
   * Gets the business model
   */
  get businessModel(): BusinessModel {
    return this.properties.businessModel;
  }

  /**
   * Gets the project status
   */
  get status(): ProjectStatus {
    return this.properties.status;
  }

  /**
   * Gets the initial investment amount
   */
  get initialInvestment(): number {
    return this.properties.initialInvestment;
  }

  /**
   * Gets the discount rate (percentage)
   */
  get discountRate(): number {
    return this.properties.discountRate;
  }

  /**
   * Gets the project duration in months
   */
  get projectDuration(): number {
    return this.properties.projectDuration;
  }

  /**
   * Gets the yearly revenue
   */
  get yearlyRevenue(): number {
    return this.properties.yearlyRevenue;
  }

  /**
   * Gets the revenue growth rate (percentage)
   */
  get revenueGrowth(): number {
    return this.properties.revenueGrowth;
  }

  /**
   * Gets the operating costs
   */
  get operatingCosts(): number {
    return this.properties.operatingCosts;
  }

  /**
   * Gets the maintenance costs
   */
  get maintenanceCosts(): number {
    return this.properties.maintenanceCosts;
  }

  /**
   * Gets all properties as a plain object
   * 
   * @returns Copy of all project properties
   */
  toObject(): ProjectProperties {
    return { ...this.properties };
  }

  update(updates: Partial<ProjectProperties>): Project {
    return new Project({
      ...this.properties,
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if the project is financially viable (positive expected NPV potential)
   * This is a business rule check, not an actual calculation.
   * 
   * @returns true if basic viability indicators are positive
   */
  isViable(): boolean {
    // Simple heuristic: yearly revenue should exceed yearly costs
    const yearlyCosts = this.properties.operatingCosts + this.properties.maintenanceCosts;
    return this.properties.yearlyRevenue > yearlyCosts;
  }

  getAnnualReturnRate(): number {
    const yearlyCosts = this.properties.operatingCosts + this.properties.maintenanceCosts;
    const yearlyProfit = this.properties.yearlyRevenue - yearlyCosts;
    return (yearlyProfit / this.properties.initialInvestment) * 100;
  }
}
