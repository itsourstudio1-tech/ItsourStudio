import nodemailer from 'nodemailer';

// --- Shared Styles & Components ---
const style = {
    body: 'margin: 0; padding: 0; background-color: #f8fafc; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;',
    container: 'width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);',
    header: 'padding: 40px 30px; text-align: center;',
    logo: 'font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; margin: 0;',
    hero: 'padding: 40px 30px; text-align: center;',
    heroTitle: 'margin: 0 0 10px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #1e293b;',
    heroText: 'margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;',
    section: 'padding: 0 40px 40px;',
    refBox: 'background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;',
    refLabel: 'margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;',
    refCode: 'margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; font-family: monospace; letter-spacing: 2px;',
    detailRow: 'padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;',
    detailLabel: 'font-size: 14px; color: #64748b; font-weight: 500;',
    detailValue: 'font-size: 14px; color: #1e293b; font-weight: 600;',
    footer: 'background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;',
    footerText: 'margin: 0; font-size: 12px; color: #94a3b8;',
};

// --- Helper to render Booking Reference ---
const renderReference = (ref) => ref ? `
    <div style="${style.refBox}">
        <p style="${style.refLabel}">Booking Reference</p>
        <p style="${style.refCode}">${ref}</p>
        <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">Keep this for your records</p>
    </div>
` : '';

// --- Templates ---

const getReceivedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Received</title></head>
<body style="${style.body}">
    <div style="${style.container}">
        <!-- Header -->
        <div style="background-color: #1e293b; padding: 30px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">It's ouR Studio</h1>
        </div>

        <!-- Hero -->
        <div style="${style.hero}">
            <div style="width: 60px; height: 60px; background-color: #fff7ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #ea580c; font-size: 30px;">⏳</div>
            <h2 style="${style.heroTitle}">Booking Received</h2>
            <p style="${style.heroText}">Thanks ${booking.name}! We've reserved your slot temporarily.<br>To confirm, please settle the <strong>50% downpayment</strong>.</p>
        </div>

        <div style="${style.section}">
            <!-- Reference -->
            ${renderReference(booking.referenceNumber)}

            <!-- Payment Card -->
            <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); border-radius: 16px; padding: 30px; text-align: center; color: white; margin-bottom: 30px; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.4);">
                <p style="margin: 0 0 5px; font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Total Downpayment</p>
                <h3 style="margin: 0 0 20px; font-size: 36px; font-weight: 800;">₱${booking.downpayment}</h3>
                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 12px; backdrop-filter: blur(5px);">
                    <p style="margin: 0; font-weight: 700; font-size: 16px;">GCash: Reggie L.</p>
                    <p style="margin: 5px 0 0; font-family: monospace; font-size: 18px;">0905 336 7103</p>
                </div>
                <p style="margin: 20px 0 0; font-size: 13px; opacity: 0.9;">⚠️ Please reply to this email with your payment screenshot.</p>
            </div>

            <!-- Details -->
            <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 15px;">Session Details</h3>
            <div style="border-top: 1px solid #f1f5f9;">
                <div style="${style.detailRow}"><span style="${style.detailLabel}">Package</span><span style="${style.detailValue}">${booking.package}</span></div>
                <div style="${style.detailRow}"><span style="${style.detailLabel}">Date</span><span style="${style.detailValue}">${booking.date}</span></div>
                <div style="${style.detailRow}"><span style="${style.detailLabel}">Time</span><span style="${style.detailValue}">${booking.time_start}</span></div>
                <div style="${style.detailRow}"><span style="${style.detailLabel}">Total Price</span><span style="${style.detailValue}">₱${booking.total_amount}</span></div>
            </div>
        </div>

        <div style="${style.footer}">
            <p style="${style.footerText}">Questions? Reply to this email.<br>© It's ouR Studio</p>
        </div>
    </div>
</body>
</html>`;

const getConfirmedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Confirmed</title></head>
<body style="${style.body}">
    <div style="${style.container}">
        <!-- Header -->
        <div style="background-color: #1e293b; padding: 30px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">It's ouR Studio</h1>
        </div>

        <!-- Hero -->
        <div style="${style.hero}">
            <div style="width: 60px; height: 60px; background-color: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #16a34a; font-size: 30px;">✅</div>
            <h2 style="${style.heroTitle}">You're Booked!</h2>
            <p style="${style.heroText}">Get ready, ${booking.name}! Your session is officially confirmed.</p>
        </div>

        <div style="${style.section}">
             <!-- Reference -->
             ${renderReference(booking.referenceNumber)}

             <!-- Ticket Style Details -->
             <div style="border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Session Pass</span>
                </div>
                <div style="padding: 25px;">
                     <div style="text-align: center; margin-bottom: 25px;">
                        <h3 style="margin: 0; color: #ea580c; font-size: 20px;">${booking.package}</h3>
                        <p style="margin: 5px 0 0; color: #64748b;">${booking.date} @ ${booking.time_start}</p>
                     </div>
                     <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 13px; color: #c2410c;">📍 <strong>The Studio:</strong> FJ Center 15 Tongco Maysan, Valenzuela City</span>
                     </div>
                </div>
             </div>

             <!-- Reminders -->
             <div style="margin-top: 30px;">
                <h4 style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 10px;">Things to Remember</h4>
                <ul style="padding-left: 20px; margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    <li>Please arrive 10-15 minutes early.</li>
                    <li>Bring any props or outfits you need.</li>
                    <li>Late arrival may deduct from your shooting time.</li>
                </ul>
             </div>
        </div>

        <div style="${style.footer}">
             <p style="${style.footerText}">Can't make it? Let us know ASAP.<br>© It's ouR Studio</p>
        </div>
    </div>
</body>
</html>`;

const getRejectedEmail = (booking) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Status</title></head>
<body style="${style.body}">
    <div style="${style.container}">
         <div style="background-color: #ef4444; padding: 10px;"></div>
         
         <div style="${style.hero}">
            <h2 style="${style.heroTitle}">Booking Status Update</h2>
            <p style="${style.heroText}">Regarding your request for <strong>${booking.package}</strong>.</p>
        </div>

        <div style="${style.section}">
            ${renderReference(booking.referenceNumber)}

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 25px;">
                <h3 style="margin: 0 0 10px; color: #991b1b; font-size: 16px;">Message from Admin</h3>
                <p style="margin: 0; color: #7f1d1d; line-height: 1.5;">${booking.reason || 'We are unable to accommodate this booking at the requested time.'}</p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <p style="color: #64748b; font-size: 14px;">We apologize for the inconvenience. Please try booking another slot.</p>
            </div>
        </div>

        <div style="${style.footer}">
             <p style="${style.footerText}">© It's ouR Studio</p>
        </div>
    </div>
</body>
</html>`;

const getContactEmail = (contact) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Inquiry</title></head>
<body style="${style.body}">
    <div style="${style.container}">
        <div style="background-color: #1e293b; padding: 20px; text-align: center;">
             <span style="color: #ffffff; font-weight: 700;">Website Inquiry</span>
        </div>

        <div style="padding: 40px;">
            <div style="margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0 0 5px;">From</p>
                <h2 style="margin: 0; color: #1e293b; font-size: 20px;">${contact.name}</h2>
                <a href="mailto:${contact.email}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${contact.email}</a>
            </div>

            <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #ea580c;">
                <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${contact.message}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

// --- Main Handler ---

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Validate Env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ error: 'Server configuration error: Missing credentials' });
    }

    const { type, booking, contact } = req.body;

    // Transporter
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

    try {
        switch (type) {
            case 'confirmed':
                subject = `Booking Confirmed [${booking.referenceNumber || 'IOS'}]`;
                html = getConfirmedEmail(booking);
                break;
            case 'received':
                subject = `Booking Received - Action Required [${booking.referenceNumber || 'IOS'}]`;
                html = getReceivedEmail(booking);
                break;
            case 'rejected':
                subject = `Booking Status Update [${booking.referenceNumber || 'IOS'}]`;
                html = getRejectedEmail(booking);
                break;
            case 'contact':
                subject = `Inquiry: ${contact.name}`;
                html = getContactEmail(contact);
                toEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;
                break;
            default:
                throw new Error('Invalid email type');
        }

        await transporter.sendMail({
            from: `"It's ouR Studio" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            replyTo: type === 'contact' ? contact.email : undefined,
            subject,
            html
        });

        res.status(200).json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
