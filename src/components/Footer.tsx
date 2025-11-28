import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <img src="/logo/LOGO_var1.png" alt="it's ouR Studio Logo" className="logo-image" />
                        </div>
                        <p>Empowering you to capture your authentic self</p>
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
                            <a href="#">Gift Cards</a>
                            <a href="#">FAQ</a>
                        </div>
                        <div className="footer-column">
                            <h4>Connect</h4>
                            <a href="#">Instagram</a>
                            <a href="#">Facebook</a>
                            <a href="#">Pinterest</a>
                            <a href="mailto:hello@studiolens.com">Email Us</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {currentYear} it's ouR Studio. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
