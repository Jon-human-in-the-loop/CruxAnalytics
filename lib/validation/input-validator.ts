import { z } from 'zod';
import {
  sanitizeString as sanitizeStringRaw,
  sanitizeNumber as sanitizeNumberRaw,
  sanitizeProjectName as sanitizeProjectNameRaw,
} from './input-sanitizer';

export function validateNumber(
  value: number,
  min: number,
  max: number,
  fieldName = 'value'
): number {
  const schema = z.number().min(min).max(max);

  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
}

export function validatePercentage(value: number, fieldName = 'percentage'): number {
  return validateNumber(value, 0, 100, fieldName);
}

export function validatePositiveNumber(value: number, fieldName = 'value'): number {
  const schema = z.number().positive();

  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(`${fieldName} must be positive, got ${value}`);
  }
}

export function validateNonNegativeNumber(
  value: number,
  fieldName = 'value'
): number {
  const schema = z.number().nonnegative();

  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(`${fieldName} must be non-negative, got ${value}`);
  }
}

/**
 * Schema for financial calculation inputs
 */
export const financialInputSchema = z.object({
  investment: z.number().nonnegative().describe('Initial investment amount'),
  savings: z.number().nonnegative().describe('Annual savings or revenue'),
  discountRate: z.number().min(0).max(100).describe('Discount rate as percentage'),
  timeHorizon: z.number().int().positive().describe('Time horizon in periods'),
  cashFlows: z.array(z.number()).optional().describe('Array of cash flows per period'),
});

export type FinancialInput = z.infer<typeof financialInputSchema>;

/**
 * Schema for business intelligence metric inputs
 */
export const businessIntelligenceInputSchema = z.object({
  repetitiveHours: z.number().nonnegative().describe('Hours spent on repetitive tasks'),
  totalHours: z.number().positive().describe('Total available hours'),
  frictionMultiplier: z.number().positive().describe('Friction multiplier (typically 1-3)'),
  manualHourlyRate: z.number().nonnegative().describe('Cost per hour of manual work'),
  automationCost: z.number().nonnegative().describe('One-time cost of automation'),
  timeHorizonMonths: z.number().int().positive().describe('Evaluation period in months'),
  efficiencyGain: z.number().min(0).max(100).describe('Expected efficiency gain percentage'),
  lifetime: z.number().positive().describe('Expected lifetime of solution in months'),
  investment: z.number().nonnegative().describe('Total investment amount'),
});

export type BusinessIntelligenceInput = z.infer<typeof businessIntelligenceInputSchema>;

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  try {
    return sanitizeStringRaw(input, maxLength);
  } catch {
    // Fallback to basic sanitization if DOMPurify fails
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .substring(0, maxLength);
  }
}

/**
 * Sanitizes a project name
 * @param name - Project name to sanitize
 * @returns Sanitized project name
 */
export function sanitizeProjectName(name: string): string {
  return sanitizeProjectNameRaw(name);
}

/**
 * Sanitizes a number input with validation
 * @param input - Number input (string or number)
 * @param options - Validation options
 * @returns Sanitized and validated number
 */
export function sanitizeNumber(
  input: string | number,
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    allowNegative?: boolean;
  }
): number {
  return sanitizeNumberRaw(input, options);
}

/**
 * Asserts that a value is within a custom range
 * @param value - Value to check
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param errorMessage - Custom error message
 * @throws {Error} If value is outside range
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  errorMessage?: string
): void {
  if (value < min || value > max) {
    throw new Error(
      errorMessage ||
        `Value ${value} is outside allowed range [${min}, ${max}]`
    );
  }
}

export function validateSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

export function validateFinancialInputs(data: unknown): FinancialInput {
  return validateSchema(financialInputSchema, data);
}

export function validateBusinessIntelligenceInputs(
  data: unknown
): Partial<BusinessIntelligenceInput> {
  const partialSchema = businessIntelligenceInputSchema.partial();
  return validateSchema(partialSchema, data);
}
