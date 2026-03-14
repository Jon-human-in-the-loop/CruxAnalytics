/**
 * Metric category enumeration
 */
export enum MetricCategory {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  STRATEGIC = 'strategic',
  RISK = 'risk'
}

/**
 * Metric interpretation enumeration
 */
export enum MetricInterpretation {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

/**
 * Benchmark values for a metric
 */
export interface Benchmark {
  industry: number;
  optimal: number;
  acceptable: number;
}

/**
 * XAI (Explainable AI) context for a metric.
 * Provides structured context that can be consumed by LLM for interpretation.
 */
export interface MetricContext {
  category: MetricCategory;
  formula: string;
  assumptions: string[];
  constraints: string[];
  interpretation: MetricInterpretation;
  benchmarks?: Benchmark;
  recommendations?: string[];
}

/**
 * Core domain entity for all metrics.
 * Encapsulates metric data with XAI context for transparency and interpretability.
 * 
 * 
 * @example
 * ```typescript
 * const roi = new Metric(
 *   'ROI',
 *   125.5,
 *   {
 *     category: MetricCategory.FINANCIAL,
 *     formula: '((Total Revenue - Initial Investment) / Initial Investment) × 100',
 *     assumptions: ['Linear revenue growth', 'No inflation adjustment'],
 *     constraints: ['Project duration: 36 months'],
 *     interpretation: MetricInterpretation.POSITIVE,
 *     benchmarks: { industry: 100, optimal: 150, acceptable: 80 },
 *     recommendations: ['Strong return on investment', 'Consider accelerating timeline']
 *   }
 * );
 * 
 * const xaiData = roi.toXAIFormat();
 * console.log(xaiData); // { name: 'ROI', value: 125.5, context: {...} }
 * ```
 */
export class Metric {
  private readonly _name: string;
  private readonly _value: number;
  private readonly _context: MetricContext;
  private readonly _timestamp: string;

  constructor(name: string, value: number, context: MetricContext) {
    if (!name || name.trim().length === 0) {
      throw new Error('Metric name cannot be empty');
    }

    if (!Number.isFinite(value)) {
      throw new Error('Metric value must be a finite number');
    }

    this._name = name.trim();
    this._value = value;
    this._context = context;
    this._timestamp = new Date().toISOString();
  }

  /**
   * Gets the metric name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the metric value
   */
  get value(): number {
    return this._value;
  }

  /**
   * Gets the XAI context
   */
  get context(): MetricContext {
    return { ...this._context };
  }

  get timestamp(): string {
    return this._timestamp;
  }

  /**
   * Converts the metric to XAI format for LLM consumption.
   * Returns a plain object with all metric data including context.
   * 
   * @returns Object with name, value, context, and timestamp
   * 
   * @example
   * ```typescript
   * const metric = new Metric('NPV', 50000, context);
   * const xaiFormat = metric.toXAIFormat();
   * // Send xaiFormat to LLM for interpretation
   * ```
   */
  toXAIFormat(): {
    name: string;
    value: number;
    context: MetricContext;
    timestamp: string;
  } {
    return {
      name: this._name,
      value: this._value,
      context: this.context,
      timestamp: this._timestamp,
    };
  }

  /**
   * Compares this metric's value against benchmarks if available.
   * 
   * @returns Comparison result: 'optimal', 'acceptable', 'below_acceptable', or 'no_benchmarks'
   */
  compareToBenchmark(): 'optimal' | 'acceptable' | 'below_acceptable' | 'no_benchmarks' {
    if (!this._context.benchmarks) {
      return 'no_benchmarks';
    }

    const { optimal, acceptable } = this._context.benchmarks;

    if (this._value >= optimal) {
      return 'optimal';
    } else if (this._value >= acceptable) {
      return 'acceptable';
    } else {
      return 'below_acceptable';
    }
  }

  /**
   * Returns a human-readable string representation of the metric
   */
  toString(): string {
    return `${this._name}: ${this._value}`;
  }
}
