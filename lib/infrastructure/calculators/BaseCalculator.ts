import { Metric } from '@/lib/domain/entities/Metric';

export abstract class BaseCalculator {
  protected calculatorName: string;

  constructor(calculatorName: string) {
    this.calculatorName = calculatorName;
  }

  protected validate(input: any): void {
    if (!input) {
      throw new Error(`${this.calculatorName}: Input cannot be null or undefined`);
    }
  }

  protected formatCurrency(
    value: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  protected formatMonths(months: number): string {
    if (months < 12) {
      return `${months.toFixed(1)} months`;
    }
    const years = months / 12;
    return `${years.toFixed(1)} years`;
  }

  protected logCalculation(
    metricName: string,
    value: number,
    details?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      calculator: this.calculatorName,
      metric: metricName,
      value,
      ...details,
    };
    if (process.env.NODE_ENV === 'development') {
      console.log('[Calculation]', logEntry);
    }
  }

  protected assertFinite(value: number, fieldName: string): void {
    if (!Number.isFinite(value)) {
      throw new Error(
        `${this.calculatorName}: ${fieldName} must be a finite number`
      );
    }
  }

  protected assertPositive(value: number, fieldName: string): void {
    this.assertFinite(value, fieldName);
    if (value < 0) {
      throw new Error(`${this.calculatorName}: ${fieldName} must be positive`);
    }
  }

  protected assertRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): void {
    this.assertFinite(value, fieldName);
    if (value < min || value > max) {
      throw new Error(
        `${this.calculatorName}: ${fieldName} must be between ${min} and ${max}`
      );
    }
  }

  protected round(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  protected safeDivide(
    numerator: number,
    denominator: number,
    defaultValue: number = 0
  ): number {
    if (denominator === 0) {
      return defaultValue;
    }
    return numerator / denominator;
  }
}
