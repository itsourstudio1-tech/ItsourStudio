import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Email Templates
const getConfirmedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcece4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="width: 100%; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(191, 106, 57, 0.15); border: 1px solid rgba(191, 106, 57, 0.1);">
            <div style="background: #bf6a39; background-image: radial-gradient(#d98c5f 15%, transparent 16%); background-size: 20px 20px; padding: 50px 0; text-align: center; position: relative;">
                <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; line-height: 80px; font-size: 40px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">📸</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">You're Booked!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Get ready for your close-up.</p>
            </div>
            <div style="padding: 40px 30px;">
                <p style="color: #4b5563; font-size: 18px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                    Hi <strong>${booking.name}</strong>! <br>
                    Your session at <span style="color: #bf6a39; font-weight: 700;">It's ouR Studio</span> is officially confirmed. We can't wait to see what we create together!
                </p>
                <div style="background-color: #fff; border: 2px dashed #fed7aa; border-radius: 16px; position: relative; overflow: hidden;">
                    <div style="background-color: #fff7ed; padding: 15px; text-align: center; border-bottom: 2px dashed #fed7aa;">
                        <span style="font-size: 12px; font-weight: 700; color: #9a3412; letter-spacing: 2px; text-transform: uppercase;">— SESSION PASS —</span>
                        ${booking.referenceNumber ? `<div style="margin-top: 8px; font-size: 18px; font-weight: 800; color: #bf6a39; font-family: monospace; letter-spacing: 1px;">${booking.referenceNumber}</div>` : ''}
                    </div>
                    <div style="padding: 25px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 50%; padding-bottom: 20px;">
                                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Date</p>
                                    <p style="margin: 5px 0 0; font-size: 20px; color: #1f2937; font-weight: 700;">${booking.date}</p>
                                </td>
                                <td style="width: 50%; padding-bottom: 20px;">
                                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Time</p>
                                    <p style="margin: 5px 0 0; font-size: 20px; color: #1f2937; font-weight: 700;">${booking.time_start}</p>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding-top: 10px; border-top: 1px solid #f3f4f6;">
                                    <p style="margin: 15px 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Package</p>
                                    <p style="margin: 0; font-size: 16px; color: #bf6a39; font-weight: 700;">${booking.package} ✨</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div style="margin-top: 30px; display: flex; align-items: flex-start; gap: 15px;">
                    <div style="font-size: 24px;">📍</div>
                    <div>
                        <h4 style="margin: 0 0 5px; color: #111827; font-size: 16px; font-weight: 700;">The Studio</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            FJ Center 15 Tongco Maysan, Valenzuela City<br>
                            <span style="color: #9ca3af; font-size: 12px;">(Landmarks: PLV, Cebuana, Mr. DIY, and Ever)</span>
                        </p>
                    </div>
                </div>
                <div style="margin-top: 30px; background-color: #fffaeb; padding: 20px; border-radius: 0 0 16px 0; border-left: 4px solid #f59e0b; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <h4 style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 700; text-transform: uppercase;">📝 Things to Remember</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
                        <li style="margin-bottom: 5px;">Arrive <strong>15 mins early</strong> to prep!</li>
                        <li style="margin-bottom: 5px;">Late arrival = less shooting time.</li>
                        <li style="margin-bottom: 5px;">Pets are welcome! (Diapers required 🐾)</li>
                        <li style="margin-bottom: 5px;">Bring your creative props!</li>
                    </ul>
                </div>
            </div>
            <div style="background-color: #1f2937; color: #ffffff; padding: 30px; text-align: center;">
                <p style="font-size: 18px; font-weight: 300; margin: 0 0 10px;">Let's make magic.</p>
                <div style="width: 50px; height: 2px; background-color: #bf6a39; margin: 0 auto 20px;"></div>
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">© It's ouR Studio. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

const getReceivedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Request Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="width: 100%; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
            <div style="background-color: #111827; padding: 40px 30px; text-align: center; background-image: linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937), linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937); background-size: 20px 20px; background-position: 0 0, 10px 10px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">One Step Left</h1>
                <div style="display: inline-block; background-color: #bf6a39; color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Action Required</div>
            </div>
            <div style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 20px;">
                    Thanks for choosing It's ouR Studio! Your slot is <strong>reserved temporarily</strong>. <br>To lock it in, please complete the 50% downpayment below.
                </p>
                ${booking.referenceNumber ? `
                <div style="text-align: center; margin-bottom: 25px;">
                    <p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Your Booking Reference</p>
                    <div style="display: inline-block; background-color: #f3f4f6; padding: 10px 25px; border-radius: 8px; font-size: 20px; font-weight: 800; color: #1f2937; font-family: monospace; letter-spacing: 2px;">${booking.referenceNumber}</div>
                    <p style="margin: 8px 0 0; font-size: 11px; color: #9ca3af;">Include this in your GCash payment notes</p>
                </div>
                ` : ''}
                <div style="background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%); border: 1px solid #fed7aa; border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                    <div style="padding: 30px 20px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Total Downpayment Due</p>
                        <h2 style="margin: 5px 0 20px; color: #bf6a39; font-size: 42px; font-weight: 800;">₱${booking.downpayment}</h2>
                        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1f2937;">GCash: Reggie L.</p>
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-family: monospace;">0905 336 7103</p>
                    </div>
                    <div style="background-color: #bf6a39; padding: 15px; text-align: center;">
                        <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">Please send payment & reply with screenshot 📸</p>
                    </div>
                </div>
                <div style="margin-top: 30px; text-align: center;">
                    <div style="background-color: #fef2f2; display: inline-block; padding: 10px 20px; border-radius: 8px; border: 1px solid #fee2e2;">
                        <span style="color: #ef4444; font-size: 13px; font-weight: 600;">⚠️ Deadline: 11:59 PM Tonight</span>
                    </div>
                </div>
            </div>
             <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Need help? Just reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

const getRejectedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="width: 100%; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid #ef4444;">
            <div style="padding: 50px 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🗓️</div>
                <h1 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 700;">Booking Status</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">We have an update regarding your request.</p>
            </div>
            <div style="padding: 0 40px 40px;">
                <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; text-align: left; border: 1px solid #fee2e2;">
                    <p style="margin: 0 0 10px; color: #991b1b; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message from Admin</p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 16px; line-height: 1.5;">${booking.reason}</p>
                </div>
                <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                    ${booking.referenceNumber ? `<p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase;">Reference: <strong style="color: #374151;">${booking.referenceNumber}</strong></p>` : ''}
                    <p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase;">Regarding Request For</p>
                    <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">${booking.package} on ${booking.date}</p>
                </div>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                <p style="font-size: 14px; color: #6b7280;">Have questions? <a href="mailto:itsourstudio1@gmail.com" style="color: #bf6a39; text-decoration: none; font-weight: 600;">Contact Support</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;

const getContactEmail = (contact) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="width: 100%; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid #bf6a39;">
            <div style="padding: 40px 30px; text-align: center; background-color: #fff7ed;">
                <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
                <h1 style="color: #1f2937; margin: 0 0 5px; font-size: 24px; font-weight: 700;">New Website Inquiry</h1>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Someone reached out via the contact form</p>
            </div>
            <div style="padding: 30px 40px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 15px 0; border-bottom: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">From</p>
                            <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600;">${contact.name}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 0; border-bottom: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Email</p>
                            <p style="margin: 0; font-size: 16px; color: #bf6a39;"><a href="mailto:${contact.email}" style="color: #bf6a39; text-decoration: none;">${contact.email}</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 0;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Message</p>
                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border-left: 4px solid #bf6a39;">
                                <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${contact.message}</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">This message was sent from the It's ouR Studio website contact form.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, booking, contact } = req.body;

    // Validate based on type
    if (type === 'contact') {
        if (!contact || !contact.name || !contact.email || !contact.message) {
            return res.status(400).json({ error: 'Missing required fields for contact form' });
        }
    } else if (!type || !booking || !booking.email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate Environment Variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Missing EMAIL_USER or EMAIL_PASS in environment variables.'
        });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let subject = '';
    let html = '';
    let toEmail = booking?.email;

    switch (type) {
        case 'confirmed':
            subject = "Booking Confirmed - It's ouR Studio";
            html = getConfirmedEmail(booking);
            break;
        case 'received':
            subject = "Booking Received - It's ouR Studio";
            html = getReceivedEmail(booking);
            break;
        case 'rejected':
            subject = "Booking Update - It's ouR Studio";
            html = getRejectedEmail(booking);
            break;
        case 'contact':
            subject = `New Inquiry from ${contact.name} - It's ouR Studio`;
            html = getContactEmail(contact);
            toEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;
            break;
        default:
            return res.status(400).json({ error: 'Invalid email type' });
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            replyTo: type === 'contact' ? contact.email : undefined,
            subject: subject,
            html: html
        });

        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: 'Failed to send email',
            message: error.message,
            code: error.code // This helps identify Gmail auth issues
        });
    }
}

