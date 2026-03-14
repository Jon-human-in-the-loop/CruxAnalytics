import type { FinancialCalculationInput, FinancialCalculationResult } from '@/types/project';

/**
 * Check if Web Workers are supported
 * FORZADO A FALSE HASTA RESOLVER import.meta.url
 */
export function areWorkersSupported(): boolean {
  return false;
}

/**
 * Calculate financial projections using a Web Worker
 * DESHABILITADO - Siempre rechaza
 */
export function calculateProjectionsInWorker(
  inputs: FinancialCalculationInput,
  months: number
): Promise<FinancialCalculationResult> {
  return Promise.reject(new Error('Workers temporarily disabled'));
}

/**
 * Determine if worker should be used
 * FORZADO A FALSE
 */
export function shouldUseWorker(months: number): boolean {
  return false;
}

/**
 * Calculate with automatic fallback to sync
 * SIEMPRE USA MODO SÍNCRONO
 */
export async function calculateWithWorker(
  inputs: FinancialCalculationInput,
  syncCalculator: (input: FinancialCalculationInput) => FinancialCalculationResult
): Promise<FinancialCalculationResult> {
  console.log('[Worker] Using synchronous calculations (workers disabled)');
  return syncCalculator(inputs);
}