/**
 * Value object for date ranges.
 * Ensures startDate is before endDate and provides duration calculations.
 * 
 * 
 * @example
 * ```typescript
 * const projectDuration = new DateRange(
 *   new Date('2024-01-01'),
 *   new Date('2024-12-31')
 * );
 * 
 * console.log(projectDuration.getDurationInMonths()); // 12
 * console.log(projectDuration.includes(new Date('2024-06-15'))); // true
 * ```
 */
export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Start date must be a valid Date object');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('End date must be a valid Date object');
    }
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // Create new Date objects to ensure immutability
    this._startDate = new Date(startDate);
    this._endDate = new Date(endDate);
  }

  /**
   * Gets the start date
   * 
   * @returns Copy of the start date
   */
  get startDate(): Date {
    return new Date(this._startDate);
  }

  /**
   * Gets the end date
   * 
   * @returns Copy of the end date
   */
  get endDate(): Date {
    return new Date(this._endDate);
  }

  /**
   * Gets the duration in days
   * 
   * @returns Number of days between start and end date
   */
  getDurationInDays(): number {
    const diffTime = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Gets the duration in months (approximate)
   * 
   * @returns Number of months between start and end date
   */
  getDurationInMonths(): number {
    const yearsDiff = this._endDate.getFullYear() - this._startDate.getFullYear();
    const monthsDiff = this._endDate.getMonth() - this._startDate.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Gets the duration in years (approximate)
   * 
   * @returns Number of years between start and end date
   */
  getDurationInYears(): number {
    return this.getDurationInMonths() / 12;
  }

  /**
   * Checks if a date is within this range (inclusive)
   * 
   * @param date - Date to check
   * @returns true if the date is within the range
   * 
   * @example
   * ```typescript
   * const range = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
   * range.includes(new Date('2024-06-15')); // true
   * range.includes(new Date('2025-01-01')); // false
   * ```
   */
  includes(date: Date): boolean {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Date must be a valid Date object');
    }
    return date >= this._startDate && date <= this._endDate;
  }

  /**
   * Checks if this range overlaps with another range
   * 
   * @param other - DateRange to check overlap with
   * @returns true if ranges overlap
   */
  overlaps(other: DateRange): boolean {
    return (
      this._startDate <= other._endDate && this._endDate >= other._startDate
    );
  }

  /**
   * Checks if this range contains another range entirely
   * 
   * @param other - DateRange to check
   * @returns true if this range contains the other range
   */
  contains(other: DateRange): boolean {
    return (
      this._startDate <= other._startDate && this._endDate >= other._endDate
    );
  }

  /**
   * Checks if two date ranges are equal
   * 
   * @param other - DateRange to compare
   * @returns true if both start and end dates are equal
   */
  equals(other: DateRange): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }

  /**
   * Extends the range by a number of days
   * 
   * @param days - Number of days to extend (positive or negative)
   * @returns New DateRange instance with extended end date
   */
  extendByDays(days: number): DateRange {
    if (!Number.isFinite(days)) {
      throw new Error('Days must be a finite number');
    }
    const newEndDate = new Date(this._endDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    return new DateRange(this._startDate, newEndDate);
  }

  /**
   * Extends the range by a number of months
   * 
   * @param months - Number of months to extend (positive or negative)
   * @returns New DateRange instance with extended end date
   */
  extendByMonths(months: number): DateRange {
    if (!Number.isFinite(months)) {
      throw new Error('Months must be a finite number');
    }
    const newEndDate = new Date(this._endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    return new DateRange(this._startDate, newEndDate);
  }

  /**
   * Formats the date range as a string
   * 
   * @param locale - Locale for date formatting (default: 'en-US')
   * @param options - Intl.DateTimeFormat options
   * @returns Formatted string representation
   * 
   * @example
   * ```typescript
   * const range = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
   * range.format(); // "1/1/2024 - 12/31/2024"
   * range.format('es-MX'); // "1/1/2024 - 31/12/2024"
   * ```
   */
  format(locale?: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultLocale = locale || 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      ...options,
    };

    const formatter = new Intl.DateTimeFormat(defaultLocale, defaultOptions);
    return `${formatter.format(this._startDate)} - ${formatter.format(this._endDate)}`;
  }

  /**
   * Returns a plain object representation
   */
  toObject(): { startDate: string; endDate: string } {
    return {
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
    };
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return this.format();
  }

  /**
   * Creates a DateRange from ISO date strings
   * 
   * @param startDate - ISO date string for start
   * @param endDate - ISO date string for end
   * @returns New DateRange instance
   */
  static fromISO(startDate: string, endDate: string): DateRange {
    return new DateRange(new Date(startDate), new Date(endDate));
  }

  /**
   * Creates a DateRange from the current date for a specified duration
   * 
   * @param durationMonths - Duration in months
   * @returns New DateRange instance starting from today
   */
  static fromNow(durationMonths: number): DateRange {
    if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
      throw new Error('Duration must be a positive finite number');
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return new DateRange(startDate, endDate);
  }
}
