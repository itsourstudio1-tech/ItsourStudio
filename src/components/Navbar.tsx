import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useBooking } from '../context/BookingContext';
import PromoBanner from './PromoBanner';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const location = useLocation();
    const { openBooking } = useBooking();

    useEffect(() => {
        // Check session storage for banner state
        const bannerClosed = sessionStorage.getItem('promoBannerClosed');
        if (!bannerClosed) {
            setShowBanner(true);
        }

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

    const handleCloseBanner = () => {
        setShowBanner(false);
        sessionStorage.setItem('promoBannerClosed', 'true');
    };

    const isServicesPage = location.pathname === '/services';
    const isHomePage = location.pathname === '/';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isServicesPage ? 'services-page-nav' : ''}`} id="navbar">
            {showBanner && isHomePage && <PromoBanner onClose={handleCloseBanner} />}
            <div className="nav-container">
                <Link to="/" className="logo">
                    <img src="/logo/LOGO_var1.png" alt="it's ouR Studio Logo" className="logo-image" />
                </Link>
                <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                    <a href="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</a>

                    {/* Gallery Link */}
                    {location.pathname === '/' ? (
                        <button
                            className="nav-link-btn"
                            onClick={() => {
                                const element = document.getElementById('gallery');
                                element?.scrollIntoView({ behavior: 'smooth' });
                                setMobileMenuOpen(false);
                            }}
                        >
                            Gallery
                        </button>
                    ) : (
                        <Link to="/gallery" className={`nav-link ${location.pathname === '/gallery' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
                    )}

                    {/* Services Link */}
                    {location.pathname === '/' ? (
                        <button
                            className="nav-link-btn"
                            onClick={() => {
                                const element = document.getElementById('services');
                                element?.scrollIntoView({ behavior: 'smooth' });
                                setMobileMenuOpen(false);
                            }}
                        >
                            Services
                        </button>
                    ) : (
                        <Link to="/services" className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Services</Link>
                    )}

                    {/* About Link - Always scrolls to section on Home */}
                    {location.pathname === '/' ? (
                        <button
                            className="nav-link-btn"
                            onClick={() => {
                                const element = document.getElementById('about');
                                element?.scrollIntoView({ behavior: 'smooth' });
                                setMobileMenuOpen(false);
                            }}
                        >
                            About
                        </button>
                    ) : (
                        <Link
                            to="/"
                            state={{ scrollTo: 'about' }}
                            className="nav-link"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            About
                        </Link>
                    )}

                    {/* Contact Link */}
                    {location.pathname === '/' ? (
                        <button
                            className="nav-link-btn"
                            onClick={() => {
                                const element = document.getElementById('contact');
                                element?.scrollIntoView({ behavior: 'smooth' });
                                setMobileMenuOpen(false);
                            }}
                        >
                            Contact
                        </button>
                    ) : (
                        <Link
                            to="/"
                            state={{ scrollTo: 'contact' }}
                            className="nav-link"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>
                    )}

                    <button className="btn btn-primary" onClick={() => { openBooking(); setMobileMenuOpen(false); }}>Book Now</button>
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
