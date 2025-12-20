
const StructuredData = () => {
    // 1. Local Business & Professional Service (Main)
    const studioData = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "it's ouR Studio",
        "alternateName": "Its Our Studio",
        "image": [
            "https://itsour-studio.vercel.app/logo/og-image.jpg",
            "https://itsour-studio.vercel.app/gallery/solo1.webp",
            "https://itsour-studio.vercel.app/gallery/group1.webp"
        ],
        "@id": "https://itsour-studio.vercel.app",
        "url": "https://itsour-studio.vercel.app",
        "telephone": "+63 905 336 7103",
        "priceRange": "₱299 - ₱1949",
        "currenciesAccepted": "PHP",
        "paymentAccepted": "Cash, GCash, Bank Transfer",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "FJ Center 15 Tongco Street, Maysan",
            "addressLocality": "Valenzuela City",
            "addressRegion": "Metro Manila",
            "postalCode": "1440",
            "addressCountry": "PH"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 14.6983,
            "longitude": 120.9850
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
                ],
                "opens": "10:00",
                "closes": "21:00"
            }
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "128",
            "bestRating": "5",
            "worstRating": "1"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Photography Packages",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Solo Package",
                        "description": "10 min shoot + 5 min selection for 1 person"
                    },
                    "price": "299",
                    "priceCurrency": "PHP"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Basic Package",
                        "description": "15 min shoot + 10 min selection for 1-2 people"
                    },
                    "price": "399",
                    "priceCurrency": "PHP"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Barkada Package",
                        "description": "30 min shoot + 20 min selection for up to 8 people"
                    },
                    "price": "1949",
                    "priceCurrency": "PHP"
                }
            ]
        },
        "sameAs": [
            "https://www.facebook.com/itsouRstudioo/",
            "https://www.instagram.com/its_our_studio/",
            "https://www.tiktok.com/@itsourstudio"
        ]
    };

    // 2. Organization Schema
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "it's ouR Studio",
        "logo": "https://itsour-studio.vercel.app/logo/logo-main.png",
        "url": "https://itsour-studio.vercel.app",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+63 905 336 7103",
            "contactType": "customer service",
            "areaServed": "PH",
            "availableLanguage": ["English", "Tagalog"]
        }
    };

    // 3. Breadcrumb Schema (Automatic mapping if we are on a route, but for root it defines structure)
    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://itsour-studio.vercel.app/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Services",
                "item": "https://itsour-studio.vercel.app/services"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Gallery",
                "item": "https://itsour-studio.vercel.app/gallery"
            }
        ]
    };

    return (
        <>
            <script type="application/ld+json">
                {JSON.stringify(studioData)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(organizationData)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbData)}
            </script>
        </>
    );
};

export default StructuredData;
