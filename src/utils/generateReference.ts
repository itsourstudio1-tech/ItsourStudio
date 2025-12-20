/**
 * Generates a unique booking reference number
 * Format: IOS-YYMMDD-XXXX (e.g., IOS-251220-A3F7)
 */
export const generateBookingReference = (): string => {
    const now = new Date();

    // Get date parts
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Generate random 4-character alphanumeric suffix
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, 1, I)
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `IOS-${year}${month}${day}-${suffix}`;
};

/**
 * Validates a booking reference format
 */
export const isValidReference = (ref: string): boolean => {
    const pattern = /^IOS-\d{6}-[A-Z0-9]{4}$/;
    return pattern.test(ref);
};
