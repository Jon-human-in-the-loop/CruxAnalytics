/**
 * Value object for percentage values.
 * Immutable with validation and formatting capabilities.
 * 
 * 
 * @example
 * ```typescript
 * const growth = new Percentage(15.5);
 * console.log(growth.format()); // "15.50%"
 * console.log(growth.toDecimal()); // 0.155
 * 
 * const discountRate = Percentage.fromDecimal(0.10);
 * console.log(discountRate.value); // 10
 * ```
 */
export class Percentage {
  private readonly _value: number;

  constructor(value: number, allowNegative: boolean = true, max: number = 1000) {
    if (!Number.isFinite(value)) {
      throw new Error('Percentage value must be a finite number');
    }

    const min = allowNegative ? -100 : 0;

    if (value < min || value > max) {
      throw new Error(`Percentage value must be between ${min} and ${max}`);
    }

    // Round to 2 decimal places
    this._value = Math.round(value * 100) / 100;
  }

  /**
   * Gets the percentage value
   */
  get value(): number {
    return this._value;
  }

  /**
   * Formats the percentage for display
   * 
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted percentage string with % symbol
   * 
   * @example
   * ```typescript
   * const pct = new Percentage(15.567);
   * pct.format(); // "15.57%"
   * pct.format(0); // "16%"
   * pct.format(3); // "15.567%"
   * ```
   */
  format(decimals: number = 2): string {
    return `${this._value.toFixed(decimals)}%`;
  }

  /**
   * Converts percentage to decimal (e.g., 15% -> 0.15)
   * 
   * @returns Decimal representation
   */
  toDecimal(): number {
    return this._value / 100;
  }

  /**
   * Adds another Percentage to this one
   * 
   * @param other - Percentage to add
   * @returns New Percentage instance with the sum
   */
  add(other: Percentage): Percentage {
    return new Percentage(this._value + other._value, true);
  }

  /**
   * Subtracts another Percentage from this one
   * 
   * @param other - Percentage to subtract
   * @returns New Percentage instance with the difference
   */
  subtract(other: Percentage): Percentage {
    return new Percentage(this._value - other._value, true);
  }

  /**
   * Multiplies this Percentage by a scalar
   * 
   * @param multiplier - Scalar to multiply by
   * @returns New Percentage instance with the product
   */
  multiply(multiplier: number): Percentage {
    if (!Number.isFinite(multiplier)) {
      throw new Error('Multiplier must be a finite number');
    }
    return new Percentage(this._value * multiplier, true);
  }

  /**
   * Checks if this Percentage is equal to another
   * 
   * @param other - Percentage to compare
   * @returns true if values are equal (within 0.01% tolerance)
   */
  equals(other: Percentage): boolean {
    return Math.abs(this._value - other._value) < 0.01;
  }

  /**
   * Checks if this Percentage is greater than another
   * 
   * @param other - Percentage to compare
   * @returns true if this value is greater
   */
  greaterThan(other: Percentage): boolean {
    return this._value > other._value;
  }

  /**
   * Checks if this Percentage is less than another
   * 
   * @param other - Percentage to compare
   * @returns true if this value is less
   */
  lessThan(other: Percentage): boolean {
    return this._value < other._value;
  }

  /**
   * Checks if this Percentage is positive
   */
  isPositive(): boolean {
    return this._value > 0;
  }

  /**
   * Checks if this Percentage is negative
   */
  isNegative(): boolean {
    return this._value < 0;
  }

  /**
   * Checks if this Percentage is zero
   */
  isZero(): boolean {
    return Math.abs(this._value) < 0.01;
  }

  /**
   * Returns absolute value
   * 
   * @returns New Percentage instance with absolute value
   */
  abs(): Percentage {
    return new Percentage(Math.abs(this._value), false);
  }

  applyTo(base: number): number {
    if (!Number.isFinite(base)) {
      throw new Error('Base value must be a finite number');
    }
    return base * this.toDecimal();
  }

  /**
   * Returns a plain object representation
   */
  toObject(): { value: number } {
    return { value: this._value };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return this.format();
  }

  /**
   * Creates a Percentage from a decimal value
   * 
   * @param decimal - Decimal value (e.g., 0.15 for 15%)
   * @returns New Percentage instance
   * 
   * @example
   * ```typescript
   * const pct = Percentage.fromDecimal(0.15);
   * console.log(pct.value); // 15
   * ```
   */
  static fromDecimal(decimal: number): Percentage {
    if (!Number.isFinite(decimal)) {
      throw new Error('Decimal value must be a finite number');
    }
    return new Percentage(decimal * 100);
  }

  /**
   * Creates a Percentage from a fraction
   * 
   * @param numerator - Numerator
   * @param denominator - Denominator
   * @returns New Percentage instance
   * 
   * @example
   * ```typescript
   * const pct = Percentage.fromFraction(3, 4);
   * console.log(pct.value); // 75
   * ```
   */
  static fromFraction(numerator: number, denominator: number): Percentage {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      throw new Error('Numerator and denominator must be finite numbers');
    }
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }
    return new Percentage((numerator / denominator) * 100);
  }

  /**
   * Creates a zero Percentage
   * 
   * @returns New Percentage instance with zero value
   */
  static zero(): Percentage {
    return new Percentage(0);
  }
}
