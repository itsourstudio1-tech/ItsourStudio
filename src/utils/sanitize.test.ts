import { describe, it, expect } from 'vitest';
import {
    sanitizeString,
    sanitizeEmail,
    sanitizePhoneNumber,
    sanitizeName,
    sanitizeText
} from './sanitize';

describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
        const input = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
        expect(sanitizeString(input)).toBe(expected);
    });

    it('should return empty string for non-string input', () => {
        expect(sanitizeString(null as any)).toBe('');
        expect(sanitizeString(undefined as any)).toBe('');
        expect(sanitizeString(123 as any)).toBe('');
    });
});

describe('sanitizeEmail', () => {
    it('should return valid email', () => {
        expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
        expect(sanitizeEmail('  Test@Example.com  ')).toBe('test@example.com');
    });

    it('should return null for invalid email', () => {
        expect(sanitizeEmail('invalid-email')).toBeNull();
        expect(sanitizeEmail('test@')).toBeNull();
        expect(sanitizeEmail('@example.com')).toBeNull();
        expect(sanitizeEmail('test@example')).toBeNull(); // Missing top-level domain
    });
});

describe('sanitizePhoneNumber', () => {
    it('should normalize valid PH phone numbers', () => {
        expect(sanitizePhoneNumber('09123456789')).toBe('+639123456789');
        expect(sanitizePhoneNumber('639123456789')).toBe('+639123456789');
        expect(sanitizePhoneNumber('+639123456789')).toBe('+639123456789');
    });

    it('should return null for invalid phone numbers', () => {
        expect(sanitizePhoneNumber('123')).toBeNull(); // too short
        expect(sanitizePhoneNumber('08123456789')).toBeNull(); // doesn't start with 09
        expect(sanitizePhoneNumber('abcdefghijk')).toBeNull(); // non-digits
        expect(sanitizePhoneNumber('0912345678')).toBeNull(); // too short (10 digits)
    });
});

describe('sanitizeName', () => {
    it('should remove special characters and numbers', () => {
        expect(sanitizeName('John Doe 123!')).toBe('John Doe');
        expect(sanitizeName('<script>John</script>')).toBe('John');
    });

    it('should allow valid name characters', () => {
        expect(sanitizeName("O'Connor-Smith")).toBe("O'Connor-Smith");
        expect(sanitizeName('José Rizal')).toBe('José Rizal');
    });

    it('should trim and collapse spaces', () => {
        expect(sanitizeName('  John   Doe  ')).toBe('John Doe');
    });
});

describe('sanitizeText', () => {
    it('should strip HTML tags but preserve text', () => {
        expect(sanitizeText('<p>Hello world</p>')).toBe('Hello world');
        expect(sanitizeText('Hello <br> world')).toBe('Hello  world');
    });

    it('should escape remaining special chars', () => {
        expect(sanitizeText('Hello & World')).toBe('Hello &amp; World');
    });

    it('should truncate to max length', () => {
        expect(sanitizeText('Hello World', 5)).toBe('Hello');
    });
});
