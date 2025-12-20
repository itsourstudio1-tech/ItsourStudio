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
    const { type, booking } = req.body;

    if (!type || !booking || !booking.email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let subject = '';
    let html = '';
    let attachments = [];

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
        default:
            return res.status(400).json({ error: 'Invalid email type' });
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: booking.email,
            subject: subject,
            html: html,
            attachments: attachments
        });
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
