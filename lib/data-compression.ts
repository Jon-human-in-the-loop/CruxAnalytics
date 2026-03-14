/**
 * Data Compression Module
 * Compresses data before saving to AsyncStorage to reduce space usage
 */

import LZString from 'lz-string';

/**
 * Compress data to base64 string
 */
export function compressData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = LZString.compressToBase64(jsonString);
    return compressed;
  } catch (error) {
    console.error('Error compressing data:', error);
    // Return uncompressed as fallback
    return JSON.stringify(data);
  }
}

/**
 * Decompress base64 string to data
 */
export function decompressData<T>(compressed: string): T | null {
  try {
    // Try to decompress
    const decompressed = LZString.decompressFromBase64(compressed);

    if (decompressed) {
      return JSON.parse(decompressed) as T;
    }

    // Fallback: try to parse as uncompressed JSON
    try {
      return JSON.parse(compressed) as T;
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error decompressing data:', error);
    return null;
  }
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: any, compressed: string): number {
  const originalSize = JSON.stringify(original).length;
  const compressedSize = compressed.length;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Get size in KB
 */
export function getSizeInKB(data: string): number {
  return data.length / 1024;
}
