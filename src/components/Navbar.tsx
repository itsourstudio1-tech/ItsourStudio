import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const isServicesPage = location.pathname === '/services';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isServicesPage ? 'services-page-nav' : ''}`} id="navbar">
            <div className="nav-container">
                <Link to="/" className="logo">
                    <img src="/logo/LOGO_var1.png" alt="it's ouR Studio Logo" className="logo-image" />
                </Link>
                <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    {location.pathname === '/' ? (
                        <>
                            <a href="#gallery" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
                            <a href="#services" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Services</a>
                        </>
                    ) : (
                        <>
                            <Link to="/gallery" className={`nav-link ${location.pathname === '/gallery' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
                            <Link to="/services" className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Services</Link>
                        </>
                    )}
                    <a href="/#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</a>
                    <a href="/#booking" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Book Now</a>
                </div>
                <button className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`} id="mobileMenuBtn" onClick={toggleMobileMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
