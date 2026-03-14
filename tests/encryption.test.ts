import { describe, it, expect } from 'vitest';
import {
    encrypt,
    decrypt,
    decryptObject,
    generateEncryptionKey,
    deriveKeyFromPassword,
    hashSensitiveData,
    isEncrypted,
    maskSensitiveData,
    generateSecureToken,
} from '../lib/security/encryption';

describe('Encryption Module', () => {
    describe('generateEncryptionKey()', () => {
        it('should generate a 64-character hex key', () => {
            const key = generateEncryptionKey();

            expect(key).toHaveLength(64);
            expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
        });

        it('should generate unique keys', () => {
            const key1 = generateEncryptionKey();
            const key2 = generateEncryptionKey();

            expect(key1).not.toBe(key2);
        });
    });

    describe('encrypt() and decrypt()', () => {
        const key = generateEncryptionKey();

        it('should encrypt and decrypt string data', () => {
            const originalData = 'sensitive information';

            const encrypted = encrypt(originalData, key);
            const decrypted = decrypt(encrypted, key);

            expect(decrypted).toBe(originalData);
        });

        it('should encrypt and decrypt object data', () => {
            const originalData = { ssn: '123-45-6789', name: 'John Doe' };

            const encrypted = encrypt(originalData, key);
            const decrypted = decryptObject<typeof originalData>(encrypted, key);

            expect(decrypted).toEqual(originalData);
        });

        it('should produce different ciphertext for same plaintext', () => {
            const data = 'same data';

            const encrypted1 = encrypt(data, key);
            const encrypted2 = encrypt(data, key);

            expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
        });

        it('should fail decryption with wrong key', () => {
            const data = 'secret data';
            const wrongKey = generateEncryptionKey();

            const encrypted = encrypt(data, key);

            expect(() => decrypt(encrypted, wrongKey)).toThrow();
        });

        it('should throw error for invalid key length', () => {
            expect(() => encrypt('data', 'shortkey')).toThrow('Invalid encryption key');
        });
    });

    describe('deriveKeyFromPassword()', () => {
        it('should derive consistent key from password and salt', () => {
            const password = 'user-password';

            const { key, salt } = deriveKeyFromPassword(password);
            const { key: key2 } = deriveKeyFromPassword(password, salt);

            expect(key).toBe(key2);
            expect(key).toHaveLength(64);
        });

        it('should derive different keys for different passwords', () => {
            const { key: key1 } = deriveKeyFromPassword('password1');
            const { key: key2 } = deriveKeyFromPassword('password2');

            expect(key1).not.toBe(key2);
        });
    });

    describe('hashSensitiveData()', () => {
        it('should produce consistent hash for same input', () => {
            const data = '123-45-6789';

            const hash1 = hashSensitiveData(data);
            const hash2 = hashSensitiveData(data);

            expect(hash1).toBe(hash2);
        });

        it('should produce different hash with salt', () => {
            const data = '123-45-6789';

            const hash1 = hashSensitiveData(data);
            const hash2 = hashSensitiveData(data, 'salt123');

            expect(hash1).not.toBe(hash2);
        });

        it('should produce 64-character hex hash', () => {
            const hash = hashSensitiveData('any data');

            expect(hash).toHaveLength(64);
            expect(/^[0-9a-f]+$/i.test(hash)).toBe(true);
        });
    });

    describe('isEncrypted()', () => {
        const key = generateEncryptionKey();

        it('should return true for encrypted data', () => {
            const encrypted = encrypt('data', key);

            expect(isEncrypted(encrypted)).toBe(true);
        });

        it('should return false for plain objects', () => {
            expect(isEncrypted({ name: 'test' })).toBe(false);
            expect(isEncrypted(null)).toBe(false);
            expect(isEncrypted('string')).toBe(false);
        });
    });

    describe('maskSensitiveData()', () => {
        it('should mask middle characters', () => {
            const masked = maskSensitiveData('1234567890');

            expect(masked).toBe('12******90');
        });

        it('should use custom visible character count', () => {
            const masked = maskSensitiveData('secret', 1);

            expect(masked).toBe('s****t');
        });

        it('should fully mask short strings', () => {
            const masked = maskSensitiveData('abc');

            expect(masked).toBe('***');
        });
    });

    describe('generateSecureToken()', () => {
        it('should generate URL-safe token', () => {
            const token = generateSecureToken();

            // Base64url uses only alphanumeric plus - and _
            expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
        });

        it('should generate unique tokens', () => {
            const token1 = generateSecureToken();
            const token2 = generateSecureToken();

            expect(token1).not.toBe(token2);
        });
    });
});
