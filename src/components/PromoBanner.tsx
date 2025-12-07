import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './PromoBanner.css';

interface PromoBannerProps {
    onClose: () => void;
}

interface BannerConfig {
    isVisible: boolean;
    text: string;
    promoCode: string;
}

const PromoBanner = ({ onClose }: PromoBannerProps) => {
    const [config, setConfig] = useState<BannerConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'siteContent', 'promoBanner'), (doc) => {
            if (doc.exists()) {
                setConfig(doc.data() as BannerConfig);
            } else {
                // Default if not set
                setConfig({ isVisible: false, text: '', promoCode: '' });
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    if (loading || !config || !config.isVisible) return null;

    return (
        <div className="promo-banner">
            <p>
                {config.text} {config.promoCode && (
                    <>
                        with code: <span className="promo-code">{config.promoCode}</span> 🎁
                    </>
                )}
            </p>
            <button className="close-btn" onClick={onClose} aria-label="Close banner">
                ✕
            </button>
        </div>
    );
};

export default PromoBanner;
