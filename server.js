import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// CORS Configuration - Restrict to allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json()); // Enable JSON body parsing

// Rate Limiting Configuration
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per window per IP
    message: { error: 'Too many uploads. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 emails per window per IP
    message: { error: 'Too many email requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});


// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'POP');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original name but prepend timestamp to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize filename to remove spaces/special chars
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can configure this based on the user's provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
            
            <!-- Hero Section with Pattern -->
            <div style="background: #bf6a39; background-image: radial-gradient(#d98c5f 15%, transparent 16%); background-size: 20px 20px; padding: 50px 0; text-align: center; position: relative;">
                <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; line-height: 80px; font-size: 40px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                    📸
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">You're Booked!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Get ready for your close-up.</p>
            </div>

            <div style="padding: 40px 30px;">
                <!-- Personal Note -->
                <p style="color: #4b5563; font-size: 18px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                    Hi <strong>${booking.name}</strong>! <br>
                    Your session at <span style="color: #bf6a39; font-weight: 700;">It's ouR Studio</span> is officially confirmed. We can't wait to see what we create together!
                </p>

                <!-- Ticket Stub Design -->
                <div style="background-color: #fff; border: 2px dashed #fed7aa; border-radius: 16px; position: relative; overflow: hidden;">
                    <div style="background-color: #fff7ed; padding: 15px; text-align: center; border-bottom: 2px dashed #fed7aa;">
                        <span style="font-size: 12px; font-weight: 700; color: #9a3412; letter-spacing: 2px; text-transform: uppercase;">— SESSION PASS —</span>
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
                                    ${booking.extensionText ? `<p style="margin: 5px 0 0; font-size: 14px; color: #4b5563;">+ ${booking.extensionText}</p>` : ''}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Map/Location Pin Style -->
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

                <!-- Sticky Note Reminder -->
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

            <!-- Stylish Footer -->
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
            
            <!-- Modern Header -->
            <div style="background-color: #111827; padding: 40px 30px; text-align: center; background-image: linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937), linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937); background-size: 20px 20px; background-position: 0 0, 10px 10px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">One Step Left</h1>
                <div style="display: inline-block; background-color: #bf6a39; color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Action Required</div>
            </div>

            <div style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                    Thanks for choosing It's ouR Studio! Your slot is <strong>reserved temporarily</strong>. <br>To lock it in, please complete the 50% downpayment below.
                </p>

                <!-- Payment Card -->
                <div style="background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%); border: 1px solid #fed7aa; border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                    <div style="padding: 30px 20px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Total Downpayment Due</p>
                        <h2 style="margin: 5px 0 20px; color: #bf6a39; font-size: 42px; font-weight: 800;">₱${booking.downpayment}</h2>
                        
                        <div style="display: inline-block; padding: 20px; background: #ffffff; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                             <img src='cid:gcash-qr' alt='GCash QR Code' style='width: 160px; height: 160px; display: block; border-radius: 4px;'>
                        </div>
                        
                        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1f2937;">GCash: Reggie L.</p>
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-family: monospace;">${process.env.GCASH_NUMBER || '0917 123 4567'}</p>
                    </div>
                    
                    <!-- Action Instruction -->
                    <div style="background-color: #bf6a39; padding: 15px; text-align: center;">
                        <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">Please scan & reply with screenshot 📸</p>
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
                    <p style="margin: 0 0 5px; font-size: 12px; color: #9ca3af; text-transform: uppercase;">Regarding Request For</p>
                    <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">${booking.package} on ${booking.date}</p>
                </div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                <p style="font-size: 14px; color: #6b7280;">Have questions? <a href="mailto:${process.env.BUSINESS_EMAIL || 'contact@itsourstudio.com'}" style="color: #bf6a39; text-decoration: none; font-weight: 600;">Contact Support</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;

// Contact Form Email Template
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


const getReportEmail = (report) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Issue Report</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
         <div style="background-color: #ef4444; padding: 10px;"></div>
         
         <div style="padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #dc2626; font-size: 30px;">🛠️</div>
            <h2 style="margin: 0 0 10px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #1e293b;">New Issue Reported</h2>
            <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">An admin has reported a system issue.</p>
        </div>

        <div style="padding: 0 40px 40px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <p style="margin: 0 0 5px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700;">Subject:</p>
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 20px;">${report.subject}</h3>
                
                <p style="margin: 0 0 5px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700;">Message:</p>
                <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${report.message}</p>
            </div>

            <div style="text-align: center;">
                 <p style="color: #64748b; font-size: 14px; margin: 0;">Reported by: ${report.reporterEmail}</p>
                 <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">${new Date().toLocaleString()}</p>
                 
                 ${report.screenshotUrl ? `
                 <div style="margin-top: 20px;">
                    <a href="${report.screenshotUrl}" style="display: inline-block; background-color: #1e293b; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View Screenshot</a>
                 </div>` : ''}
            </div>
        </div>

        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
             <p style="margin: 0; font-size: 12px; color: #94a3b8;">System Notification<br>© It's ouR Studio</p>
        </div>
    </div>
</body>
</html>`;

// Upload Endpoint (Rate Limited)
app.post('/upload', uploadLimiter, upload.single('paymentProof'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const publicPath = `/POP/${req.file.filename}`;

    res.json({
        message: 'File uploaded successfully',
        path: publicPath
    });
});

// Gallery Upload Configuration
const galleryDir = path.join(__dirname, 'public', 'gallery-uploads');
if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true });
}

const galleryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, galleryDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const galleryUpload = multer({
    storage: galleryStorage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit for higher quality
});

// Gallery Upload Endpoint (Rate Limited)
app.post('/upload/gallery', uploadLimiter, galleryUpload.single('galleryImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the path relative to the public directory
    // Note: Frontend should serve 'public' as root or alias /gallery-uploads
    const publicPath = `/gallery-uploads/${req.file.filename}`;

    res.json({
        message: 'Gallery image uploaded successfully',
        path: publicPath
    });
});

// Email Endpoint (Rate Limited)
app.post('/send-email', emailLimiter, async (req, res) => {
    const { type, booking, contact, report } = req.body;

    // Allow contact type with different validation
    if (type === 'contact') {
        if (!contact || !contact.name || !contact.email || !contact.message) {
            return res.status(400).json({ error: 'Missing required fields for contact form' });
        }
    } else if (type === 'report_issue') {
        if (!report || !report.subject || !report.message || !report.toEmail) {
            return res.status(400).json({ error: 'Missing required fields for issue report' });
        }
    } else if (!type || !booking || !booking.email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let subject = '';
    let html = '';
    let attachments = [];
    let toEmail = booking?.email; // Default recipient

    if (type === 'report_issue') {
        toEmail = report.toEmail;
    }

    switch (type) {
        case 'confirmed':
            subject = "Booking Confirmed - It's ouR Studio";
            html = getConfirmedEmail(booking);
            break;
        case 'received':
            subject = "Booking Received - It's ouR Studio";
            html = getReceivedEmail(booking);
            // Attach QR Code
            attachments.push({
                filename: 'payment_qr.png',
                path: path.join(__dirname, 'src', 'assets', 'payment_qr.png'),
                cid: 'gcash-qr'
            });
            break;
        case 'rejected':
            subject = "Booking Update - It's ouR Studio";
            html = getRejectedEmail(booking);
            break;
        case 'contact':
            subject = `New Inquiry from ${contact.name} - It's ouR Studio`;
            html = getContactEmail(contact);
            toEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER; // Send to business
            break;
        case 'report_issue':
            subject = `🛠️ Issue Report: ${report.subject}`;
            html = getReportEmail(report);
            toEmail = report.toEmail;
            break;
        default:
            return res.status(400).json({ error: 'Invalid email type' });
    }

    try {
        console.log(`📨 Sending email [${type}] to: ${toEmail}`);
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            replyTo: type === 'contact' ? contact.email : undefined, // Allow easy reply
            subject: subject,
            html: html,
            attachments: attachments
        });
        console.log(`✅ Email sent successfully [MessageID: ${info.messageId}]`);
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

// --- Reminder System (Cron Job) ---

// Firebase Config (Matches client config for simplicity in this hybrid setup)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD6BBWMs6yuWrkwxFkTXui44gdymo1VDa8",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "it-s-our-studio.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "it-s-our-studio",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "it-s-our-studio.firebasestorage.app",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1040611577378",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:1040611577378:web:7e0510d41cfbafe63a847b"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

// Authenticate Server for Database Access
const signInAdmin = async () => {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        try {
            await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
            console.log('✅ Reminder System: Service Authenticated');
        } catch (error) {
            console.error('❌ Reminder System: Auth Failed:', error.message);
        }
    } else {
        console.warn('⚠️ Reminder System: Missing ADMIN_EMAIL/ADMIN_PASSWORD in .env. Reminders may fail if rules require auth.');
    }
};
signInAdmin();

// Schedule: Check every minute
cron.schedule('* * * * *', async () => {
    // 1. Calculate Target Time (Now + 30 mins) in Manila Time
    const now = new Date();
    const targetTime = new Date(now.getTime() + 30 * 60000); // + 30 minutes

    const formatterDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const formatterTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const targetDateStr = formatterDate.format(targetTime); // YYYY-MM-DD
    const targetTimeStr = formatterTime.format(targetTime); // HH:mm

    // We only care if the formatted time matches a slot (e.g., "14:00" or "14:30")
    // Since bookings are usually on :00 or :30, running every minute catches it exactly when it hits.
    // e.g. at 13:30, target is 14:00. Match!
    // at 13:31, target is 14:01. No match (likely).

    try {
        const q = query(
            collection(db, 'bookings'),
            where('date', '==', targetDateStr),
            where('time', '==', targetTimeStr),
            where('status', '==', 'confirmed')
        );

        const snapshot = await getDocs(q);

        snapshot.docs.forEach(async (doc) => {
            const booking = doc.data();
            console.log(`🔔 Sending reminder for ${booking.fullName} (${booking.time})`);

            // Email to Customer
            const customerHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                <h2>⏰ Your Session in 30 Minutes!</h2>
                <p>Hi ${booking.fullName}, just a friendly reminder that your photoshoot starts soon.</p>
                <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong style="color: #c2410c;">Time: ${booking.time}</strong><br>
                    <span>Package: ${booking.package}</span>
                </div>
                <p>Please arrive 10-15 minutes early!</p>
                <p>📍 FJ Center 15 Tongco Maysan, Valenzuela City</p>
            </div>
            `;

            // Email to Admin
            const adminHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #c2410c;">🔔 Upcoming Session Alert</h2>
                <p><strong>30 Minutes to go!</strong></p>
                <ul>
                    <li><strong>Client:</strong> ${booking.fullName}</li>
                    <li><strong>Time:</strong> ${booking.time}</li>
                    <li><strong>Package:</strong> ${booking.package}</li>
                    <li><strong>Ref:</strong> ${booking.referenceNumber}</li>
                </ul>
            </div>
            `;

            // Send Customer Email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: booking.email,
                subject: `Reminder: Your Session is in 30 Minutes!`,
                html: customerHtml
            });

            // Send Admin Email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
                subject: `🔔 30m Reminder: ${booking.fullName} @ ${booking.time}`,
                html: adminHtml
            });
        });

    } catch (error) {
        console.error('Error in reminder cron:', error);
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
