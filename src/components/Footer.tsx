import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReportModal from './ReportModal';

interface FooterContent {
    brandText: string;
    email: string;
    facebook: string;
    instagram: string;
    tiktok: string;
}

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [footerContent, setFooterContent] = useState<FooterContent>({
        brandText: "Empowering you to capture your authentic self",
        email: "itsourstudio1@gmail.com",
        facebook: "https://www.facebook.com/itsouRstudioo/",
        instagram: "https://www.instagram.com/its_our_studio/",
        tiktok: "https://www.tiktok.com/@itsourstudio"
    });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const docRef = doc(db, 'siteContent', 'footer');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFooterContent(docSnap.data() as FooterContent);
                }
            } catch (err) {
                console.error("Error fetching footer content:", err);
            }
        };
        fetchFooter();
    }, []);

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <img src="/logo/LOGO_var1.png" alt="it's ouR Studio Logo" className="logo-image" />
                        </div>
                        <p>{footerContent.brandText}</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Quick Links</h4>
                            <Link to="/">Home</Link>
                            <Link to="/gallery">Gallery</Link>
                            <Link to="/services">Services</Link>
                            <a href="/#about">About</a>
                        </div>
                        <div className="footer-column">
                            <h4>Services</h4>
                            <a href="/#booking">Book Session</a>
                            <Link to="/services">Pricing</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>
                        <div className="footer-column">
                            <h4>Connect</h4>
                            <a href={footerContent.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                            <a href={footerContent.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                            <a href={footerContent.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
                            <a href={`mailto:${footerContent.email}`}>Email Us</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {currentYear} it's ouR Studio. All rights reserved.</p>
                    <Link to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}>Privacy Policy</Link>
                    <span style={{ margin: '0 0.5rem', color: 'rgba(255,255,255,0.3)' }}>|</span>
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Report an Issue
                    </button>
                </div>
            </div>
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        </footer>
    );
};

export default Footer;
