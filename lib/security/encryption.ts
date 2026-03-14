import * as crypto from 'crypto';

/**
 * Encryption algorithm used for all encryption operations.
 * AES-256-GCM provides authenticated encryption.
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Length of the initialization vector in bytes.
 */
const IV_LENGTH = 16;

/**
 * Length of the authentication tag in bytes.
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Salt length for key derivation.
 */
const SALT_LENGTH = 32;

/**
 * Interface for encrypted data structure
 */
export interface EncryptedData {
    /** Base64-encoded encrypted content */
    encrypted: string;
    /** Base64-encoded initialization vector */
    iv: string;
    /** Base64-encoded authentication tag */
    authTag: string;
    /** Encryption version for future compatibility */
    version: number;
}

/**
 * Generates a cryptographically secure encryption key.
 * 
 * @returns 32-byte (256-bit) key as hex string
 * 
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * // Returns something like: "a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
 * ```
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives an encryption key from a password using PBKDF2.
 * Useful for user-provided passwords.
 * 
 * @param password - User-provided password
 * @param salt - Optional salt (will be generated if not provided)
 * @returns Object containing derived key and salt
 * 
 * @example
 * ```typescript
 * const { key, salt } = deriveKeyFromPassword('user-password');
 * // Store salt alongside encrypted data for decryption
 * ```
 */
export function deriveKeyFromPassword(
    password: string,
    salt?: string
): { key: string; salt: string } {
    const useSalt = salt
        ? Buffer.from(salt, 'hex')
        : crypto.randomBytes(SALT_LENGTH);

    const derivedKey = crypto.pbkdf2Sync(
        password,
        useSalt,
        100000, // iterations
        32, // key length
        'sha512'
    );

    return {
        key: derivedKey.toString('hex'),
        salt: useSalt.toString('hex'),
    };
}

/**
 * Encrypts data using AES-256-GCM.
 * Provides confidentiality and authentication.
 * 
 * @param data - String or object to encrypt
 * @param key - 64-character hex encryption key
 * @returns Encrypted data object
 * @throws {Error} If key is invalid or encryption fails
 * 
 * @example
 * ```typescript
 * const encrypted = encrypt('sensitive data', key);
 * const objectEncrypted = encrypt({ ssn: '123-45-6789' }, key);
 * ```
 */
export function encrypt(
    data: string | object,
    key: string
): EncryptedData {
    if (!key || key.length !== 64) {
        throw new Error('Invalid encryption key: must be 64-character hex string');
    }

    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = Buffer.from(key, 'hex');

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(dataString, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        version: 1,
    };
}

/**
 * Decrypts data that was encrypted with the encrypt function.
 * 
 * @param encryptedData - Encrypted data object from encrypt()
 * @param key - 64-character hex encryption key (same key used for encryption)
 * @returns Decrypted string
 * @throws {Error} If key is invalid, data is tampered, or decryption fails
 * 
 * @example
 * ```typescript
 * const decrypted = decrypt(encryptedData, key);
 * ```
 */
export function decrypt(
    encryptedData: EncryptedData,
    key: string
): string {
    if (!key || key.length !== 64) {
        throw new Error('Invalid encryption key: must be 64-character hex string');
    }

    if (!isEncrypted(encryptedData)) {
        throw new Error('Invalid encrypted data structure');
    }

    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const keyBuffer = Buffer.from(key, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Decrypts data and parses it as JSON.
 * Useful for objects that were encrypted.
 * 
 * @param encryptedData - Encrypted data object
 * @param key - Encryption key
 * @returns Parsed object
 * 
 * @example
 * ```typescript
 * const obj = decryptObject<{ ssn: string }>(encryptedData, key);
 * console.log(obj.ssn);
 * ```
 */
export function decryptObject<T>(
    encryptedData: EncryptedData,
    key: string
): T {
    const decrypted = decrypt(encryptedData, key);
    return JSON.parse(decrypted) as T;
}

/**
 * Creates a SHA-256 hash of sensitive data.
 * Non-reversible, useful for comparison without storing actual values.
 * 
 * @param data - Data to hash
 * @param salt - Optional salt for additional security
 * @returns SHA-256 hash as hex string
 * 
 * @example
 * ```typescript
 * const hashedSSN = hashSensitiveData('123-45-6789');
 * // Store hash for lookup, not the actual SSN
 * ```
 */
export function hashSensitiveData(
    data: string,
    salt?: string
): string {
    const toHash = salt ? `${salt}:${data}` : data;
    return crypto.createHash('sha256').update(toHash).digest('hex');
}

/**
 * Checks if a data object is in the encrypted format.
 * 
 * @param data - Data to check
 * @returns True if data appears to be encrypted
 * 
 * @example
 * ```typescript
 * if (isEncrypted(data)) {
 *   const decrypted = decrypt(data, key);
 * }
 * ```
 */
export function isEncrypted(data: unknown): data is EncryptedData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const obj = data as Record<string, unknown>;
    return (
        typeof obj.encrypted === 'string' &&
        typeof obj.iv === 'string' &&
        typeof obj.authTag === 'string' &&
        typeof obj.version === 'number'
    );
}

/**
 * Masks sensitive data for display purposes.
 * Shows only first and last characters with asterisks in between.
 * 
 * @param data - Sensitive data to mask
 * @param visibleChars - Number of characters to show at start and end (default: 2)
 * @returns Masked string
 * 
 * @example
 * ```typescript
 * maskSensitiveData('1234567890'); // '12******90'
 * maskSensitiveData('secret', 1);   // 's****t'
 * ```
 */
export function maskSensitiveData(
    data: string,
    visibleChars: number = 2
): string {
    if (data.length <= visibleChars * 2) {
        return '*'.repeat(data.length);
    }

    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars * 2);

    return `${start}${masked}${end}`;
}

/**
 * Generates a secure random token for one-time use.
 * Useful for password reset tokens, API keys, etc.
 * 
 * @param length - Length of the token in bytes (default: 32)
 * @returns URL-safe base64 token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
}
