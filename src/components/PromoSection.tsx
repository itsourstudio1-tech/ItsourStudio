import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useBooking } from '../context/BookingContext';
import './PromoSection.css';

interface PromoData {
    isActive: boolean;
    title: string;
    description: string;
    price: string;
    originalPrice?: string;
    imageUrl: string;
    features: string[];
    tag: string;
}

const PromoSection = () => {
    const { openBooking } = useBooking();
    const [promo, setPromo] = useState<PromoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'siteContent', 'seasonalPromo'), (doc) => {
            if (doc.exists()) {
                setPromo(doc.data() as PromoData);
            } else {
                // Initial Default Data if document doesn't exist
                setPromo({
                    isActive: false, // Default hidden until configured
                    title: "Holiday Special Session",
                    description: "Celebrate the season with our exclusive holiday package. Includes festive props and a special backdrop.",
                    price: "₱999",
                    originalPrice: "₱1,499",
                    imageUrl: "/gallery/duo4.webp", // Default fallback image
                    features: ["45 Mins Session", "Unlimited Soft Copies", "Holiday Themed Props", "4 Prints"],
                    tag: "Limited Time Offer"
                });
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    if (loading || !promo || !promo.isActive) return null;

    return (
        <section className="promo-section">
            <div className="container promo-container">
                <div className="promo-card">
                    <div className="promo-badge">{promo.tag || "Special Offer"}</div>

                    <div className="promo-image">
                        <img src={promo.imageUrl || "/gallery/duo4.webp"} alt={promo.title} />
                    </div>

                    <div className="promo-content">
                        <h2 className="promo-title">{promo.title}</h2>
                        <p className="promo-description">{promo.description}</p>

                        <div className="promo-price-block" style={{ marginBottom: '1.5rem' }}>
                            <div className="promo-price-tag">
                                {promo.price}
                                {promo.originalPrice && (
                                    <span className="promo-original-price">{promo.originalPrice}</span>
                                )}
                            </div>
                        </div>

                        {promo.features && promo.features.length > 0 && (
                            <ul className="promo-features">
                                {promo.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        )}

                        <button
                            className="btn btn-primary btn-large"
                            onClick={() => openBooking('seasonal-promo')}
                        >
                            Book This Offer
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoSection;
