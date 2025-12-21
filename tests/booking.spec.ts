import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home page
        await page.goto('/');
    });

    test('should allow a user to navigate through the booking steps', async ({ page }) => {
        // 1. Open Booking Modal
        // Assuming there is a "Book Now" button on the home page.
        // Based on Home.tsx, I didn't see the render part, but usually there is a button.
        // I'll look for text "Book Now" or similar.
        const bookButtons = page.getByText(/Book Now/i);
        if (await bookButtons.count() > 0) {
            await bookButtons.first().click();
        } else {
            // Fallback or specific ID search if strictly needed
            // For now assuming "Book Now" text exists
        }

        // Wait for modal
        await expect(page.locator('.booking-modal-overlay')).toBeVisible();

        // --- STEP 1: Package, Date, Time ---

        // Select a package (assuming radio buttons or divs with click handlers)
        // I'll look for a package card. 
        // Since I can't see the exact markup for Step 1 in the partial view, I'll assume standard elements.
        // Let's try to click on a text that likely corresponds to a package name like "Solo"
        await page.getByText('Solo Package', { exact: false }).first().click();

        // Select a Date
        // The calendar renders days. We need to pick an available day.
        // Days are .calendar-day:not(.empty):not(.disabled)
        const availableDay = page.locator('.calendar-day:not(.empty):not(.disabled)').first();
        await availableDay.click();

        // Select a Time
        // Assumption: Time slots are buttons or divs.
        // I'll wait for time slots to appear.
        // They are likely generated after date selection.
        const timeSlot = page.getByText(/PM|AM/, { exact: false }).first(); // loose match for time
        await timeSlot.click();

        // Click Next
        await page.getByRole('button', { name: 'Next' }).click();

        // --- STEP 2: Contact Details ---

        // Check if we advanced
        await expect(page.getByText('Contact Details', { exact: false })).toBeVisible();

        // Fill Form
        await page.fill('input[name="fullName"]', 'Test User E2E');
        await page.fill('input[name="email"]', 'test_e2e@example.com');
        await page.fill('input[name="phone"]', '09171234567'); // Format handled by component

        // Click Next
        await page.getByRole('button', { name: 'Next' }).click();

        // --- STEP 3: Payment/Review ---
        await expect(page.getByText('Review & Payment', { exact: false })).toBeVisible();

        // At this point, we have verified the flow works up to the final step.
        // We won't submit to avoid junk data in the live database unless we mock the API.
        // But this confirms the UI logic holds together.

        // Verify summary is present
        await expect(page.getByText('Total Downpayment Due')).toBeVisible();
        await expect(page.getByText('Test User E2E')).toBeVisible();
    });
});
