import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import FeedbackModal from '../components/FeedbackModal';
import PromoSection from '../components/PromoSection';
import BackdropVisualizer from '../components/BackdropVisualizer';


interface Feedback {
    id: string;
    name: string;
    rating: number;
    message: string;
    showInTestimonials: boolean;
}

interface AboutContent {
    title: string;
    description1: string;
    description2: string;
    imageUrl: string;
}

const galleryItems = [
    { src: '/gallery/solo1.webp', category: 'Portrait', title: 'Solo Session' },
    { src: '/gallery/duo1.webp', category: 'Couple', title: 'Duo Shoot' },
    { src: '/gallery/group1.webp', category: 'Group', title: 'Barkada' },
    { src: '/gallery/solo2.webp', category: 'Portrait', title: 'Creative Solo' },
    { src: '/gallery/duo2.webp', category: 'Couple', title: 'Partner in Crime' },
    { src: '/gallery/group2.webp', category: 'Group', title: 'Squad Goals' },
    { src: '/gallery/solo3.webp', category: 'Portrait', title: 'Profile Update' },
    { src: '/gallery/duo3.webp', category: 'Couple', title: 'Anniversary' },
    { src: '/gallery/group3.webp', category: 'Group', title: 'Family Love' },
    { src: '/gallery/solo4.webp', category: 'Portrait', title: 'Self Love' },
    { src: '/gallery/duo4.webp', category: 'Couple', title: 'Besties' },
    { src: '/gallery/group4.webp', category: 'Group', title: 'Team Bonding' },
];

const Home = () => {
    const { openBooking } = useBooking();
    const location = useLocation();

    useEffect(() => {
        // Scroll to top on mount if no specific scroll intent
        if (!location.state?.scrollTo && !window.location.hash) {
            window.scrollTo(0, 0);
        }

        // Handle state-based scrolling (from other pages)
        if (location.state?.scrollTo) {
            const targetSection = location.state.scrollTo;

            const scrollToSection = () => {
                const element = document.getElementById(targetSection);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    console.log(`Scrolled to section: ${targetSection}`);
                } else {
                    console.warn(`Section not found: ${targetSection}`);
                }
            };

            // Increased delay to account for loading screen (600ms) + fade out (400ms) + buffer
            setTimeout(scrollToSection, 1200);

            // Fallback: try again after a bit more time in case content is still loading
            setTimeout(scrollToSection, 1500);
        }
    }, [location]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [aboutContent, setAboutContent] = useState<AboutContent>({
        title: "About it's ouR Studio",
        description1: "Welcome to it's ouR Studio, where you're in complete control of your photography experience. Our state-of-the-art self-photography studio is designed to empower you to capture your authentic self in a comfortable, private environment.",
        description2: "Equipped with professional lighting, multiple backdrops, and an intuitive remote control system, our studio makes it easy for anyone to create stunning, professional-quality photos. Whether you need headshots for your career, content for social media, or simply want to celebrate yourself, we provide the perfect space and tools.",
        imageUrl: "/about-studio.jpg"
    });




    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const docRef = doc(db, 'siteContent', 'about');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAboutContent(docSnap.data() as AboutContent);
                }
            } catch (err) {
                console.error("Error fetching about content:", err);
            }
        };
        fetchAbout();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, 'feedbacks'),
            where('showInTestimonials', '==', true),
            orderBy('createdAt', 'desc'),
            limit(3)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Feedback[];
            setFeedbacks(feedbacksData);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Dynamic Gallery Items
    const [dynamicGalleryItems, setDynamicGalleryItems] = useState(galleryItems);

    useEffect(() => {
        const fetchGallery = async () => {
            const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(12));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        src: data.src,
                        category: data.category === 'solo' ? 'Portrait' : data.category === 'duo' ? 'Couple' : 'Group', // map to display names
                        title: data.alt || 'Studio Session'
                    };
                });
                // If we have dynamic items, use them. Otherwise fallback or merge.
                // Strategy: Put dynamic items first, then static items if needed to fill space, or just use dynamic if enough.
                // For now, let's prepend them to static items.
                if (fetchedItems.length > 0) {
                    setDynamicGalleryItems([...fetchedItems, ...galleryItems]);
                }
            });
            return () => unsubscribe();
        };
        fetchGallery();
    }, []);

    // Hero Interaction Logic
    const heroRef = useRef<HTMLElement>(null);
    const rafRef = useRef<number | null>(null);

    const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
        // Disable parallax on mobile (640px or less)
        if (window.innerWidth <= 640) return;

        if (!heroRef.current || rafRef.current) return;

        const { clientX, clientY } = e;
        const element = heroRef.current;

        rafRef.current = requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width;
            const y = (clientY - rect.top) / rect.height;

            element.style.setProperty('--mouse-x', `${x}`);
            element.style.setProperty('--mouse-y', `${y}`);
            rafRef.current = null;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentTranslate, setCurrentTranslate] = useState(0);
    const [prevTranslate, setPrevTranslate] = useState(0);

    // Animation state
    const trackRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const draggingRef = useRef(false); // To access fresh state in loop if needed, though strictly we use state for renders

    // Using a ref for currentTranslate to avoid closure staleness in the animation loop
    const translateRef = useRef(0);

    // Speed of auto-scroll (pixels per frame)
    const scrollSpeed = 0.5;

    const animationLoop = useCallback(() => {
        if (!draggingRef.current) {
            translateRef.current -= scrollSpeed;

            // Reset if we've scrolled past the first set of items
            // We need to know the width of the first set. 
            // Approximation: width of half the track.
            if (trackRef.current) {
                const trackWidth = trackRef.current.scrollWidth;
                const halfWidth = trackWidth / 2;

                if (Math.abs(translateRef.current) >= halfWidth) {
                    translateRef.current = 0;
                }
            }

            setCurrentTranslate(translateRef.current);
        }
        animationRef.current = requestAnimationFrame(animationLoop);
    }, []);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animationLoop);
        return () => cancelAnimationFrame(animationRef.current);
    }, [animationLoop]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        draggingRef.current = true;

        const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
        setStartX(pageX);

        // Only cancel animation loop if we want to purely manual drag. 
        // But for "pause and drag", we keep the loop running but conditionally update?
        // Actually, better to just pause the AUTOMATIC update.
        // We still need to update state during drag.
        cancelAnimationFrame(animationRef.current);

        setPrevTranslate(translateRef.current);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;

        const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
        const currentPosition = pageX;
        const diff = currentPosition - startX;

        translateRef.current = prevTranslate + diff;
        setCurrentTranslate(translateRef.current);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        draggingRef.current = false;

        // Constrain bounds if needed, or simply let it flow back to loop?
        // To ensure infinite loop stability, we should probably check bounds here too.
        if (trackRef.current) {
            const trackWidth = trackRef.current.scrollWidth;
            const halfWidth = trackWidth / 2;
            // If dragged too far left
            if (Math.abs(translateRef.current) >= halfWidth) {
                translateRef.current = translateRef.current % halfWidth;
            }
            // If dragged too far right (positive)
            if (translateRef.current > 0) {
                translateRef.current = -halfWidth + translateRef.current;
            }
        }

        // Restart loop
        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(animationLoop);
    };


    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        // Check for hash and scroll if needed
        if (window.location.hash) {
            const element = document.querySelector(window.location.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);

    return (
        <>
            {/* Hero Section */}
            <section id="home" className="hero" ref={heroRef} onMouseMove={handleHeroMouseMove}>
                <div className="hero-background"></div>

                {/* Interactive Camera Interface */}
                <div className="camera-interface">
                    <div className="camera-grid"></div>
                    <div className="focus-rect">
                        <div className="focus-corner top-left"></div>
                        <div className="focus-corner top-right"></div>
                        <div className="focus-corner bottom-left"></div>
                        <div className="focus-corner bottom-right"></div>
                    </div>
                    <div className="camera-data top-left">ISO <span>800</span></div>
                    <div className="camera-data top-right">RAW</div>
                    <div className="camera-data bottom-left"><span>ƒ</span>/2.8</div>
                    <div className="camera-data bottom-right">1/250</div>
                </div>

                <div className="hero-content">
                    <div className="parallax-content">
                        <h1 className="hero-title">
                            <span className="hero-subtitle">Welcome to</span>
                            it's ouR Studio
                        </h1>
                        <p className="hero-description">Capture your authentic self in our premium self-photography studio</p>
                        <div className="hero-buttons">
                            <Link to="/gallery" className="btn btn-primary btn-large">View Gallery</Link>
                            <button className="btn btn-secondary btn-large" onClick={() => openBooking()}>Book Session</button>
                        </div>
                    </div>
                </div>
                <div className="scroll-indicator">
                    <span>Scroll to explore</span>
                    <div className="scroll-arrow"></div>
                </div>
            </section>

            {/* Gallery Preview Section */}
            <section id="gallery" className="gallery-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Featured Moments</h2>
                        <p className="section-subtitle">A glimpse into our studio sessions</p>
                    </div>

                    <div
                        className="gallery-carousel-container"
                        onMouseDown={handleDragStart}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onMouseMove={handleDragMove}
                        onTouchStart={handleDragStart}
                        onTouchEnd={handleDragEnd}
                        onTouchMove={handleDragMove}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <div
                            className="gallery-track"
                            ref={trackRef}
                            style={{
                                transform: `translateX(${currentTranslate}px)`,
                                animation: 'none', // Override CSS animation
                                width: 'max-content',
                                display: 'flex',
                                gap: 'var(--spacing-md)'
                            }}
                        >
                            {/* Render items twice for infinite scroll effect */}
                            {[...dynamicGalleryItems, ...dynamicGalleryItems].map((item, index) => (
                                <div className="gallery-card" key={index}>
                                    <div className="gallery-card-inner">
                                        <img src={item.src} alt={item.title} loading="lazy" draggable={false} />
                                        <div className="gallery-overlay">
                                            <div className="gallery-info">
                                                <div className="gallery-category">{item.category}</div>
                                                <div className="gallery-title">{item.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <Link to="/gallery" className="btn btn-primary btn-large">View Full Gallery</Link>
                    </div>
                </div>
            </section>

            <PromoSection />

            {/* Services Preview Section */}
            <section id="services" className="services-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Our Packages</h2>
                        <p className="section-subtitle">Simple pricing for everyone</p>
                    </div>

                    <div className="services-grid">
                        {/* Solo Package */}
                        <div className="service-card">
                            <div className="service-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <h3 className="service-title">Solo</h3>
                            <p className="service-duration">15 Minutes</p>
                            <div className="service-price">₱299</div>
                            <p className="service-description">Perfect for a quick profile update or self-portrait session.</p>
                            <ul className="service-features">
                                <li>1 Person</li>
                                <li>10 min shoot + 5 min selection</li>
                                <li>1 Background selection</li>
                                <li>10 Raw soft copies</li>
                                <li>1 4R print</li>
                            </ul>
                            <button className="btn btn-outline" onClick={() => openBooking('solo')}>Book Now</button>
                        </div>

                        {/* Basic Package (Best Selling) */}
                        <div className="service-card featured">
                            <div className="featured-badge">Best Selling</div>
                            <div className="service-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>
                            </div>
                            <h3 className="service-title">Basic</h3>
                            <p className="service-duration">25 Minutes</p>
                            <div className="service-price">₱399</div>
                            <p className="service-description">Our most popular choice for couples and duos.</p>
                            <ul className="service-features">
                                <li>1-2 People</li>
                                <li>15 min shoot + 10 min selection</li>
                                <li>1 Background selection</li>
                                <li>15 Raw soft copies</li>
                                <li>2 strips print</li>
                                <li>Free use of props & wardrobe</li>
                            </ul>
                            <button className="btn btn-secondary" onClick={() => openBooking('basic')}>Book Now</button>
                        </div>

                        {/* Barkada Package */}
                        <div className="service-card">
                            <div className="service-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h3 className="service-title">Barkada</h3>
                            <p className="service-duration">50 Minutes</p>
                            <div className="service-price">₱1,949</div>
                            <p className="service-description">The ultimate group experience for friends and family.</p>
                            <ul className="service-features">
                                <li>Up to 8 People</li>
                                <li>30 min shoot + 20 min selection</li>
                                <li>1 Background selection</li>
                                <li>Soft copies of all raw photos</li>
                                <li>8 strips print</li>
                                <li>2 A5 prints & 2 4R prints</li>
                            </ul>
                            <button className="btn btn-outline" onClick={() => openBooking('barkada')}>Book Now</button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <Link to="/services" className="btn btn-primary btn-large">See All Services</Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Happy Faces</h2>
                        <p className="section-subtitle">Stories from our studio</p>
                    </div>

                    <div className="testimonials-grid">
                        {feedbacks.length > 0 ? (
                            feedbacks.map((feedback) => (
                                <div className="testimonial-card" key={feedback.id}>
                                    <div className="stars">{'★'.repeat(feedback.rating)}</div>
                                    <p className="testimonial-quote">{feedback.message}</p>
                                    <div className="testimonial-author">
                                        <div className="author-avatar">{feedback.name.charAt(0)}</div>
                                        <div className="author-info">
                                            <h4>{feedback.name}</h4>
                                            <span className="author-role">Verified Customer</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="testimonial-card" style={{ gridColumn: '1 / -1', textAlign: 'center', display: 'block' }}>
                                <p className="testimonial-quote" style={{ fontStyle: 'normal' }}>Be the first to share your experience!</p>
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <button className="btn btn-primary" onClick={() => setIsFeedbackOpen(true)}>Leave a Review</button>
                    </div>
                </div>
            </section>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="about-content">
                        <div className="about-image">
                            <div className="about-image-wrapper">
                                <img src={aboutContent.imageUrl} alt="it's ouR Studio Photography Studio" id="aboutImage" />
                                <div className="developing-badge">Developing Stories since 2024</div>
                            </div>
                        </div>
                        <div className="about-text">
                            <h2 className="section-title">{aboutContent.title}</h2>

                            <div className="about-signature">
                                "Capturing raw emotion in every frame."
                            </div>

                            <p className="about-description">
                                {aboutContent.description1}
                            </p>
                            <p className="about-description">
                                {aboutContent.description2}
                            </p>

                            <div className="film-strip-container">
                                <div className="film-holes top"></div>
                                <div className="about-features film-strip">
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Pro Gear</h4>
                                            <p>Top-tier equipment</p>
                                        </div>
                                    </div>
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Creative</h4>
                                            <p>Limitless freedom</p>
                                        </div>
                                    </div>
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Private</h4>
                                            <p>Your own space</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="film-holes bottom"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BackdropVisualizer />

            {/* Ready to Shoot CTA Section */}
            <section className="cta-section">
                <div className="cta-background">
                    <div className="cta-Aurora-1"></div>
                    <div className="cta-Aurora-2"></div>
                </div>
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Capture Your Story?</h2>
                        <p className="cta-subtitle">Book your session today and create timeless memories with us.</p>
                        <div className="cta-buttons">
                            <button className="btn btn-secondary btn-large" onClick={() => openBooking()}>Book Now</button>
                            <Link to="/services" className="btn btn-outline-light btn-large">View Packages</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Get in Touch</h2>
                        <p className="section-subtitle">We'd love to hear from you</p>
                    </div>

                    <div className="contact-container">
                        <div className="contact-form-wrapper">
                            <form className="contact-form">
                                <div className="form-group">
                                    <label htmlFor="contactName">Name</label>
                                    <input type="text" id="contactName" placeholder="Your Name" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="contactEmail">Email</label>
                                    <input type="email" id="contactEmail" placeholder="your@email.com" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="contactMessage">Message</label>
                                    <textarea id="contactMessage" rows={5} placeholder="How can we help you?"></textarea>
                                </div>
                                <button type="button" className="btn btn-primary">Send Message</button>
                            </form>
                        </div>

                        <div className="contact-info-wrapper">
                            <div className="info-card">
                                <h3>Studio Location</h3>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </span>
                                    <p>123 Creative Avenue, Art District<br />Makati City, Philippines</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    </span>
                                    <p>+63 912 345 6789</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </span>
                                    <p>hello@itsourstudio.com</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </span>
                                    <p>Mon - Sun: 10:00 AM - 9:00 PM</p>
                                </div>

                                <div className="social-links-container">
                                    <h4>Follow Us</h4>
                                    <div className="social-links">
                                        <a href="#" className="social-link">Facebook</a>
                                        <a href="#" className="social-link">Instagram</a>
                                        <a href="#" className="social-link">TikTok</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    );
};

export default Home;
