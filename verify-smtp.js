import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function verify() {
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful');
        console.log('User:', process.env.EMAIL_USER);
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error);
    }
}

verify();
