import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes a string to prevent XSS attacks using DOMPurify
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  // Use DOMPurify for robust HTML sanitization
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });

  // Trim and limit length
  return sanitized.trim().substring(0, maxLength);
}

/**
 * Sanitizes a project name
 * @param name - Project name to sanitize
 * @returns Sanitized project name
 * @throws {Error} If name is empty after sanitization
 */
export function sanitizeProjectName(name: string): string {
  const sanitized = sanitizeString(name, 200);

  // Allow alphanumeric, spaces, and common punctuation
  const safe = sanitized.replace(/[^a-zA-Z0-9\sáéíóúñÁÉÍÓÚÑ\-_(),.]/g, '');

  if (safe.length === 0) {
    throw new Error('Project name contains only invalid characters');
  }

  return safe;
}

export function sanitizeNumber(
  input: string | number,
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    allowNegative?: boolean;
  }
): number {
  const {
    min = -Infinity,
    max = Infinity,
    decimals = 2,
    allowNegative = false,
  } = options || {};

  // Convert to string and clean
  const cleaned = String(input)
    .trim()
    .replace(/[^\d.-]/g, ''); // Keep only digits, dot, and minus

  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }

  if (!allowNegative && num < 0) {
    throw new Error('Negative numbers not allowed');
  }

  if (num < min || num > max) {
    throw new Error(`Number must be between ${min} and ${max}`);
  }

  // Round to specified decimals
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Sanitizes a percentage value
 * @param input - Percentage input
 * @returns Sanitized percentage (0-100)
 */
export function sanitizePercentage(input: string | number): number {
  return sanitizeNumber(input, {
    min: 0,
    max: 100,
    decimals: 2,
    allowNegative: false,
  });
}

/**
 * Sanitizes a currency value
 * @param input - Currency input
 * @returns Sanitized currency value
 */
export function sanitizeCurrency(input: string | number): number {
  return sanitizeNumber(input, {
    min: 0,
    max: 999999999999, // ~1 trillion
    decimals: 2,
    allowNegative: false,
  });
}

/**
 * Sanitizes an integer value
 * @param input - Integer input
 * @param options - Validation options
 * @returns Sanitized integer
 */
export function sanitizeInteger(
  input: string | number,
  options?: { min?: number; max?: number }
): number {
  const num = sanitizeNumber(input, {
    ...options,
    decimals: 0,
  });

  return Math.floor(num);
}

/**
 * Sanitizes all financial inputs for a project
 * @param inputs - Raw financial inputs
 * @returns Sanitized and validated inputs
 */
export function sanitizeFinancialInputs(inputs: {
  name: string;
  initialInvestment: string | number;
  yearlyRevenue: string | number;
  operatingCosts: string | number;
  maintenanceCosts?: string | number;
  projectDuration: string | number;
  discountRate: string | number;
  revenueGrowth: string | number;
}): {
  name: string;
  initialInvestment: number;
  yearlyRevenue: number;
  operatingCosts: number;
  maintenanceCosts: number;
  projectDuration: number;
  discountRate: number;
  revenueGrowth: number;
} {
  return {
    name: sanitizeProjectName(inputs.name),
    initialInvestment: sanitizeCurrency(inputs.initialInvestment),
    yearlyRevenue: sanitizeCurrency(inputs.yearlyRevenue),
    operatingCosts: sanitizeCurrency(inputs.operatingCosts),
    maintenanceCosts: sanitizeCurrency(inputs.maintenanceCosts || 0),
    projectDuration: sanitizeInteger(inputs.projectDuration, { min: 1, max: 600 }),
    discountRate: sanitizePercentage(inputs.discountRate),
    revenueGrowth: sanitizeNumber(inputs.revenueGrowth, {
      min: -100,
      max: 1000,
      decimals: 2,
      allowNegative: true,
    }),
  };
}

/**
 * Batch sanitize multiple strings
 * @param strings - Array of strings to sanitize
 * @param maxLength - Maximum length for each string
 * @returns Array of sanitized strings
 */
export function sanitizeStrings(strings: string[], maxLength: number = 1000): string[] {
  return strings.map((str) => sanitizeString(str, maxLength));
}
