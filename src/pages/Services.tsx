import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Service {
    id: string;
    title: string;
    price: string;
    duration: string;
    description: string;
    features: string[];
    imageMain: string;
    imageDetail: string;
    imageAction: string;
    isBestSelling: boolean;
    isVisible?: boolean;
    order?: number;
}

const DEFAULT_SERVICES: Service[] = [
    {
        id: 'solo',
        title: 'Solo Package',
        price: '₱299',
        duration: '15 Minutes',
        description: 'Perfect for a quick profile update or self-portrait session.',
        features: [
            '1 Person',
            '10 min shoot + 5 min selection',
            '1 Background selection',
            '10 Raw soft copies',
            '1 4R print'
        ],
        imageMain: '/gallery/solo1.webp',
        imageDetail: '/gallery/solo2.webp',
        imageAction: '/gallery/solo3.webp',
        isBestSelling: false,
        isVisible: true,
    },
    {
        id: 'basic',
        title: 'Basic Package',
        price: '₱399',
        duration: '25 Minutes',
        description: 'Our most popular choice for couples and duos.',
        features: [
            '1-2 People',
            '15 min shoot + 10 min selection',
            '1 Background selection',
            '15 Raw soft copies',
            '2 strips print',
            'Free use of props & wardrobe'
        ],
        imageMain: '/gallery/duo1.webp',
        imageDetail: '/gallery/duo2.webp',
        imageAction: '/gallery/duo3.webp',
        isBestSelling: true,
        isVisible: true,
    },
    {
        id: 'transfer',
        title: 'Just Transfer',
        price: '₱549',
        duration: '30 Minutes',
        description: 'Get all your raw photos without prints.',
        features: [
            '1-2 People',
            '20 min shoot + 10 min transfer',
            '1 Background selection',
            'All Raw soft copies',
            'No prints included'
        ],
        imageMain: '/gallery/solo4.webp',
        imageDetail: '/gallery/solo5.webp',
        imageAction: '/gallery/solo1.webp',
        isBestSelling: false,
        isVisible: true,
    },
    {
        id: 'standard',
        title: 'Standard Package',
        price: '₱699',
        duration: '45 Minutes',
        description: 'More time, more photos, more memories.',
        features: [
            '1-4 People',
            '25 min shoot + 20 min selection',
            '2 Background selections',
            '20 Raw soft copies',
            '4 strips print',
            'Free use of props & wardrobe'
        ],
        imageMain: '/gallery/group1.webp',
        imageDetail: '/gallery/group2.webp',
        imageAction: '/gallery/group3.webp',
        isBestSelling: false,
        isVisible: true,
    },
    {
        id: 'birthday',
        title: 'Birthday Package',
        price: '₱599',
        duration: '45 Minutes',
        description: 'Celebrate your special day with a fun shoot!',
        features: [
            '1 Person (Birthday Celebrant)',
            '25 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '1 A4 print + 2 strips',
            'Free use of birthday props'
        ],
        imageMain: '/gallery/solo2.webp',
        imageDetail: '/gallery/solo3.webp',
        imageAction: '/gallery/solo4.webp',
        isBestSelling: false,
        isVisible: true,
    },
    {
        id: 'family',
        title: 'Family Package',
        price: '₱1,249',
        duration: '50 Minutes',
        description: 'Capture beautiful family portraits.',
        features: [
            'Up to 6 People',
            '30 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '2 A5 prints + 4 strips',
            'Free use of props'
        ],
        imageMain: '/gallery/group4.webp',
        imageDetail: '/gallery/group5.webp',
        imageAction: '/gallery/group1.webp',
        isBestSelling: false,
        isVisible: true,
    },
    {
        id: 'barkada',
        title: 'Barkada Package',
        price: '₱1,949',
        duration: '50 Minutes',
        description: 'The ultimate group experience for friends.',
        features: [
            'Up to 8 People',
            '30 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '8 strips print',
            '2 A5 prints & 2 4R prints'
        ],
        imageMain: '/gallery/group2.webp',
        imageDetail: '/gallery/group3.webp',
        imageAction: '/gallery/group4.webp',
        isBestSelling: false,
        isVisible: true,
    }
];



const ServiceShowcase = ({ service }: { service: Service }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Check if device is touch-enabled (disable auto-scroll for performance)
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    useEffect(() => {
        // Skip auto-scroll on mobile/touch devices for performance
        if (isTouchDevice) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let intervalId: ReturnType<typeof setInterval>;

        const startAutoScroll = () => {
            intervalId = setInterval(() => {
                if (isPaused || !scrollContainer) return;

                const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
                const maxScroll = scrollWidth - clientWidth;

                // Threshold to determine if we are at the end
                if (scrollLeft >= maxScroll - 10) {
                    scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    const scrollAmount = clientWidth * 0.85;
                    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }, 3000);
        };

        startAutoScroll();

        return () => clearInterval(intervalId);
    }, [isPaused, isTouchDevice]);

    // On mobile, render only a single image for performance
    if (isMobile) {
        return (
            <div className="service-showcase">
                <div className="showcase-single">
                    <img src={service.imageMain} alt={`${service.title}`} />
                </div>
            </div>
        );
    }

    return (
        <div className="service-showcase">
            <div
                className="showcase-grid"
                ref={scrollRef}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div className="showcase-item main">
                    <img src={service.imageMain} alt={`${service.title} main`} />
                </div>
                <div className="showcase-item">
                    <img src={service.imageDetail} alt={`${service.title} detail`} />
                </div>
                <div className="showcase-item">
                    <img src={service.imageAction} alt={`${service.title} action`} />
                </div>
            </div>
        </div>
    );
};

const TextOnlyFeatures = ({ features }: { features: string[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const LIMIT = 6; // Adjusted for 3 rows x 2 columns

    const visibleFeatures = isExpanded ? features : features.slice(0, LIMIT);
    const hasMore = features.length > LIMIT;

    return (
        <div style={{ width: '100%' }}>
            <ul className="service-features-large">
                {visibleFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                ))}
            </ul>
            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="btn-text-only-toggle"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-terracotta)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'block',
                        margin: '1rem auto 2rem',
                        textDecoration: 'underline'
                    }}
                >
                    {isExpanded ? 'See Less' : 'See All +'}
                </button>
            )}
        </div>
    );
};

import { useBooking } from '../context/BookingContext';

const Services = () => {
    const { openBooking } = useBooking();
    const [isDragging, setIsDragging] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
    const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
    const [loading, setLoading] = useState(true);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Initial load: Fetch services from Firestore
    useEffect(() => {
        const q = query(collection(db, 'services'), orderBy('order', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const fetchedServices = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as Service[];

                // Filter out hidden services
                // If isVisible is undefined (legacy), default to true
                const visibleServices = fetchedServices.filter(s => s.isVisible !== false);
                setServices(visibleServices);
            } else {
                setServices(DEFAULT_SERVICES);
            }
            setLoading(false);
        }, (error: any) => {
            console.error("Failed to fetch services, using defaults:", error);
            setLoading(false);
            // setServices(DEFAULT_SERVICES); // Optional: fallback to defaults on error
        });

        return () => unsubscribe();
    }, []);



    // Check if mobile for conditional rendering
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Initial check
        checkMobile();

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (loading || services.length === 0) return;

        const handleScroll = () => {
            if (isDragging) return;

            const viewportMiddle = window.innerHeight / 2;

            // Find the section that currently occupies the middle of the screen
            const activeIndex = services.findIndex(service => {
                const element = document.getElementById(service.id);
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top <= viewportMiddle && rect.bottom >= viewportMiddle;
            });

            if (activeIndex !== -1) {
                setSliderValue((activeIndex / (services.length - 1)) * 100);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isDragging, loading, services]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSliderDrag = (clientY: number) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const y = clientY - rect.top;
        const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));

        setSliderValue(percentage);

        // Calculate which service to scroll to
        const serviceIndex = Math.round((percentage / 100) * (services.length - 1));
        const targetService = services[serviceIndex];

        if (targetService) {
            scrollToSection(targetService.id);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleSliderDrag(e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            handleSliderDrag(e.clientY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleSliderDrag(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging && e.touches.length > 0) {
            handleSliderDrag(e.touches[0].clientY);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="services-page">
            {/* Decorative Elements - Only on desktop */}
            {!isMobile && (
                <>
                    <div className="services-orb services-orb-1"></div>
                    <div className="services-orb services-orb-2"></div>
                </>
            )}

            {/* Side Navigation - Only on desktop */}
            {!isMobile && (
                <nav className="side-nav">
                    <div
                        className="side-nav-track"
                        style={{ height: '300px' }}
                        ref={sliderRef}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        <div
                            className="side-nav-progress"
                            style={{ height: `${sliderValue}%` }}
                        ></div>
                    </div>
                </nav>
            )}

            {/* Service Sections */}
            {services.map((service, index) => {
                const hasImages = Boolean(service.imageMain || service.imageDetail || service.imageAction);
                return (
                    <section
                        key={service.id}
                        id={service.id}
                        className={`service-fullscreen ${index % 2 !== 0 ? 'alt-bg' : ''}`}
                    >
                        <div className={`service-split ${index % 2 !== 0 ? 'reverse' : ''} ${!hasImages ? 'text-only' : ''}`}>
                            <div className="service-info">
                                {service.isBestSelling && <div className="featured-badge">Best Selling</div>}
                                <h2 className="service-title-large">{service.title}</h2>
                                {(service.price && service.price !== '0' && service.price !== '₱0') && (
                                    <div className="service-price-large">{service.price}</div>
                                )}
                                <div className="service-duration-large">{service.duration}</div>
                                <p className="service-desc-large">{service.description}</p>

                                {hasImages ? (
                                    <ul className="service-features-large">
                                        {service.features.map((feature, idx) => (
                                            <li key={idx}>{feature}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <TextOnlyFeatures features={service.features} />
                                )}

                                <button
                                    onClick={() => openBooking(service.id)}
                                    className="btn btn-primary btn-large"
                                >
                                    Book This Package
                                </button>
                            </div>

                            {hasImages && <ServiceShowcase service={service} />}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default Services;
