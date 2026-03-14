/**
 * Supported currency codes
 */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  MXN = 'MXN',
  COP = 'COP',
  ARS = 'ARS',
  BRL = 'BRL',
  CLP = 'CLP',
}

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.JPY]: '¥',
  [Currency.MXN]: '$',
  [Currency.COP]: '$',
  [Currency.ARS]: '$',
  [Currency.BRL]: 'R$',
  [Currency.CLP]: '$',
};

/**
 * Value object for monetary values.
 * Immutable with operations that return new instances.
 * 
 * 
 * @example
 * ```typescript
 * const price = new Money(100, Currency.USD);
 * const tax = price.multiply(0.16); // $16
 * const total = price.add(tax); // $116
 * 
 * console.log(total.format()); // "$116.00"
 * console.log(total.format('es-MX')); // "$116.00"
 * ```
 */
export class Money {
  private readonly _amount: number;
  private readonly _currency: Currency;

  constructor(amount: number, currency: Currency = Currency.USD) {
    if (!Number.isFinite(amount)) {
      throw new Error('Money amount must be a finite number');
    }

    // Round to 2 decimal places to avoid floating point issues
    this._amount = Math.round(amount * 100) / 100;
    this._currency = currency;
  }

  /**
   * Gets the monetary amount
   */
  get amount(): number {
    return this._amount;
  }

  /**
   * Gets the currency code
   */
  get currency(): Currency {
    return this._currency;
  }

  /**
   * Formats the money value for display
   * 
   * @param locale - Optional locale for formatting (e.g., 'en-US', 'es-MX')
   * @param options - Additional Intl.NumberFormat options
   * @returns Formatted currency string
   * 
   * @example
   * ```typescript
   * const money = new Money(1234.56, Currency.USD);
   * money.format(); // "$1,234.56"
   * money.format('es-MX'); // "$1,234.56"
   * money.format('en-US', { minimumFractionDigits: 0 }); // "$1,235"
   * ```
   */
  format(locale?: string, options?: Intl.NumberFormatOptions): string {
    const defaultLocale = locale || 'en-US';

    return new Intl.NumberFormat(defaultLocale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(this._amount);
  }

  /**
   * Formats without currency symbol (just the number)
   * 
   * @param locale - Optional locale for formatting
   * @returns Formatted number string
   */
  formatAmount(locale?: string): string {
    const defaultLocale = locale || 'en-US';

    return new Intl.NumberFormat(defaultLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this._amount);
  }

  /**
   * Adds another Money value to this one
   * 
   * @param other - Money to add
   * @returns New Money instance with the sum
   * @throws {Error} If currencies don't match
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Subtracts another Money value from this one
   * 
   * @param other - Money to subtract
   * @returns New Money instance with the difference
   * @throws {Error} If currencies don't match
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Multiplies this Money value by a scalar
   * 
   * @param multiplier - Scalar value to multiply by
   * @returns New Money instance with the product
   * @throws {Error} If multiplier is not a finite number
   */
  multiply(multiplier: number): Money {
    if (!Number.isFinite(multiplier)) {
      throw new Error('Multiplier must be a finite number');
    }
    return new Money(this._amount * multiplier, this._currency);
  }

  /**
   * Divides this Money value by a scalar
   * 
   * @param divisor - Scalar value to divide by
   * @returns New Money instance with the quotient
   * @throws {Error} If divisor is not a finite number or is zero
   */
  divide(divisor: number): Money {
    if (!Number.isFinite(divisor)) {
      throw new Error('Divisor must be a finite number');
    }
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this._amount / divisor, this._currency);
  }

  /**
   * Checks if this Money is equal to another
   * 
   * @param other - Money to compare
   * @returns true if amounts and currencies are equal
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  /**
   * Checks if this Money is greater than another
   * 
   * @param other - Money to compare
   * @returns true if this amount is greater
   * @throws {Error} If currencies don't match
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount > other._amount;
  }

  /**
   * Checks if this Money is less than another
   * 
   * @param other - Money to compare
   * @returns true if this amount is less
   * @throws {Error} If currencies don't match
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount < other._amount;
  }

  /**
   * Checks if this Money is positive
   */
  isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * Checks if this Money is negative
   */
  isNegative(): boolean {
    return this._amount < 0;
  }

  /**
   * Checks if this Money is zero
   */
  isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * Returns absolute value
   * 
   * @returns New Money instance with absolute value
   */
  abs(): Money {
    return new Money(Math.abs(this._amount), this._currency);
  }

  /**
   * Returns negated value
   * 
   * @returns New Money instance with negated value
   */
  negate(): Money {
    return new Money(-this._amount, this._currency);
  }

  /**
   * Converts to a different currency (Note: This is a placeholder. 
   * In production, you'd use real exchange rates from an API)
   * 
   * @param targetCurrency - Target currency
   * @param exchangeRate - Exchange rate (target/source)
   * @returns New Money instance in target currency
   */
  convertTo(targetCurrency: Currency, exchangeRate: number): Money {
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new Error('Exchange rate must be a positive finite number');
    }
    return new Money(this._amount * exchangeRate, targetCurrency);
  }

  /**
   * Returns a plain object representation
   */
  toObject(): { amount: number; currency: Currency } {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return this.format();
  }

  /**
   * Asserts that two Money instances have the same currency
   * 
   * @private
   */
  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this._currency} and ${other._currency}`
      );
    }
  }

  /**
   * Creates a Money instance from a plain object
   * 
   * @param obj - Object with amount and currency
   * @returns New Money instance
   */
  static fromObject(obj: { amount: number; currency: Currency }): Money {
    return new Money(obj.amount, obj.currency);
  }

  /**
   * Creates a zero Money value
   * 
   * @param currency - Currency code (default: USD)
   * @returns New Money instance with zero amount
   */
  static zero(currency: Currency = Currency.USD): Money {
    return new Money(0, currency);
  }
}
