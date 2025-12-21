import { describe, it, expect } from 'vitest';
import { generateBookingReference, isValidReference } from './generateReference';

describe('generateBookingReference', () => {
    it('should generate a reference ID in the correct format', () => {
        const ref = generateBookingReference();
        expect(ref).toMatch(/^IOS-\d{6}-[A-Z0-9]{4}$/);
    });

    it('should include the current date in YYMMDD format', () => {
        const ref = generateBookingReference();
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePart = `${year}${month}${day}`;

        expect(ref).toContain(`IOS-${datePart}-`);
    });

    it('should generate unique suffixes', () => {
        const ref1 = generateBookingReference();
        const ref2 = generateBookingReference();
        expect(ref1).not.toBe(ref2);
    });
});

describe('isValidReference', () => {
    it('should return true for valid references', () => {
        expect(isValidReference('IOS-251220-A3F7')).toBe(true);
        expect(isValidReference('IOS-240101-ABCD')).toBe(true);
    });

    it('should return false for invalid formats', () => {
        expect(isValidReference('INVALID')).toBe(false);
        expect(isValidReference('IOS-251220-abcde')).toBe(false); // suffix too long
        expect(isValidReference('IOS-251220-abc')).toBe(false); // suffix too short
        expect(isValidReference('IOS-25122-ABCD')).toBe(false); // date too short
        expect(isValidReference('ABC-251220-ABCD')).toBe(false); // wrong prefix
    });
});
