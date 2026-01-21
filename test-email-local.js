import dotenv from 'dotenv';
import handler from './api/send-email.js';

dotenv.config();

// Mock Response Object
const createMockRes = (label) => ({
    setHeader: () => { },
    status: (code) => ({
        json: (data) => console.log(`[${label}] Status ${code}:`, data),
        end: () => console.log(`[${label}] Status ${code}: Ended`)
    })
});

// Test Data
const targetEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;

if (!targetEmail) {
    console.error("❌ No target email found. Please set EMAIL_USER or BUSINESS_EMAIL in .env");
    process.exit(1);
}

console.log(`📧 Sending test emails to: ${targetEmail}\n`);

const tests = [
    {
        type: 'received',
        label: 'Booking Received',
        payload: {
            type: 'received',
            booking: {
                name: 'Test User',
                email: targetEmail, // Send to self
                package: 'Premium Package',
                downpayment: '1,500',
                total_amount: '3,000',
                date: '2026-01-25',
                time_start: '14:00',
                referenceNumber: 'REF-TEST-001'
            }
        }
    },
    {
        type: 'confirmed',
        label: 'Booking Confirmed',
        payload: {
            type: 'confirmed',
            booking: {
                name: 'Test User',
                email: targetEmail,
                package: 'Premium Package',
                date: '2026-01-25',
                time_start: '14:00',
                referenceNumber: 'REF-TEST-001'
            }
        }
    },
    {
        type: 'rejected',
        label: 'Booking Rejected',
        payload: {
            type: 'rejected',
            booking: {
                package: 'Premium Package',
                email: targetEmail,
                date: '2026-01-25',
                reason: 'Time slot unavailable due to maintenance.',
                referenceNumber: 'REF-TEST-001'
            }
        }
    },
    {
        type: 'reminder',
        label: 'Client Reminder',
        payload: {
            type: 'reminder',
            booking: {
                name: 'Test User',
                email: targetEmail,
                package: 'Premium Package',
                time_start: '14:30',
                referenceNumber: 'REF-TEST-REMINDER'
            }
        }
    },
    {
        type: 'new_booking_admin',
        label: 'Admin Alert',
        payload: {
            type: 'new_booking_admin',
            booking: {
                name: 'Test User',
                email: 'customer@example.com', // Details inside the email body
                phone: '09123456789',
                package: 'Basic Package',
                date: '2026-02-01',
                time_start: '10:00',
                totalPrice: '2,500',
                referenceNumber: 'REF-NEW-002'
            }
        }
    },
    {
        type: 'report_issue',
        label: 'IT Report',
        payload: {
            type: 'report_issue',
            report: {
                subject: 'Login Page Error',
                message: 'Users are unable to log in when using Safari. See attached screenshot.',
                reporterEmail: 'admin@studio.com',
                toEmail: targetEmail,
                screenshotUrl: 'https://placehold.co/600x400/png' // Mock URL
            }
        }
    },
    {
        type: 'contact',
        label: 'Contact Form',
        payload: {
            type: 'contact',
            contact: {
                name: 'Inquiry sender',
                email: targetEmail, // Reply-to will be this
                message: 'Hello, I would like to inquire about your studio availability.'
            }
        }
    }
];

const runTests = async () => {
    for (const test of tests) {
        console.log(`👉 Testing: ${test.label}...`);

        // Mock Request
        const req = {
            method: 'POST',
            body: test.payload
        };

        const recipient = test.payload.report?.toEmail || test.payload.booking?.email || test.payload.contact?.email || targetEmail;
        console.log(`   📨 Address: ${recipient}`);

        try {
            await handler(req, createMockRes(test.label));
        } catch (e) {
            console.error(`❌ Unexpected error in ${test.label}:`, e);
        }

        console.log('---');
        // Small delay to avoid rate limits if any
        await new Promise(r => setTimeout(r, 1000));
    }
};

runTests();
