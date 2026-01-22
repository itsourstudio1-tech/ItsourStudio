import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import './BioLinks.css';
import BioIcon from '../components/BioIcon';
import { useBooking } from '../context/BookingContext';

interface BioLink {
    id: string;
    title: string;
    url: string;
    icon?: string; // Emoji or simple icon name
    isActive: boolean;
    order: number;
    special?: boolean; // Highlighted style
}

interface BioProfile {
    displayName: string;
    bioDescription: string;
    profileImage: string;
    backgroundImage: string;
    themeColor: string;
    socials: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        website?: string;
    };
}

const BioLinks = () => {
    const [links, setLinks] = useState<BioLink[]>([]);
    const [profile, setProfile] = useState<BioProfile>({
        displayName: "It's ouR Studio",
        bioDescription: "Self-photo studio. Your moment, your control.",
        profileImage: "", // Fallback will be handled in render
        backgroundImage: "", // Fallback to CSS default
        themeColor: "#000000",
        socials: {}
    });
    const [loading, setLoading] = useState(true);
    const { openBooking } = useBooking();

    useEffect(() => {
        // Set body background to dark to avoid white/cream gaps
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = 'var(--color-dark)';

        return () => {
            document.body.style.backgroundColor = originalBg;
        };
    }, []);

    useEffect(() => {
        // 1. Fetch Profile Settings
        const fetchProfile = async () => {
            // We'll use a specific doc in siteContent for this
            try {
                const docRef = doc(db, 'siteContent', 'bioProfile');
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setProfile(snapshot.data() as BioProfile);
                }
            } catch (err) {
                console.error("Error fetching bio profile:", err);
            }
        };

        fetchProfile();

        // 2. Fetch Links Real-time
        const q = query(
            collection(db, 'bioLinks'),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLinks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BioLink[];

            // Only show active links on public page
            setLinks(fetchedLinks.filter(l => l.isActive));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching bio links:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="bio-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Default Images
    const displayImage = profile.profileImage || '/logo/android-chrome-512x512.png'; // Assuming public asset
    const bgStyle = profile.backgroundImage
        ? { backgroundImage: `url(${profile.backgroundImage})` }
        : undefined;

    return (
        <div className="bio-links-container">
            {/* Background Layer */}
            <div className="bio-background" style={bgStyle}></div>

            {/* Visual Effects Layer */}
            <div className="bio-fx-container">
                <div className="bio-noise"></div>
            </div>

            <div className="bio-content">
                {/* Profile Header */}
                <div className="bio-profile">
                    <div className="bio-avatar-container">
                        <img
                            src={displayImage}
                            alt={profile.displayName}
                            className="bio-avatar"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=S';
                            }}
                        />
                    </div>
                    <h1 className="bio-name">{profile.displayName || "It's ouR Studio"}</h1>
                    <p className="bio-description">{profile.bioDescription}</p>
                </div>

                {/* Social Icons (Prioritized) */}
                <div className="bio-socials">
                    {/* Only render if they exist in profile.socials */}
                    {Object.entries(profile.socials || {}).map(([key, url]) => {
                        if (!url) return null;
                        return (
                            <a key={key} href={url} target="_blank" rel="noreferrer" className="bio-social-icon" aria-label={key}>
                                {getSocialIcon(key)}
                            </a>
                        );
                    })}
                </div>

                {/* Links List */}
                <div className="bio-links-list">
                    {links.map((link) => {
                        if (link.url === '#booking') {
                            return (
                                <button
                                    key={link.id}
                                    className="bio-link-item"
                                    data-special={link.special}
                                    onClick={() => openBooking()}
                                >
                                    {link.icon && <BioIcon name={link.icon} className="bio-link-icon" size={20} />}
                                    {link.title}
                                </button>
                            );
                        }
                        return (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bio-link-item"
                                data-special={link.special}
                            >
                                {link.icon && <BioIcon name={link.icon} className="bio-link-icon" size={20} />}
                                {link.title}
                            </a>
                        );
                    })}
                </div>



                <div className="bio-branding">
                    Powered by It's ouR Studio
                </div>
            </div>
        </div>
    );
};

// Helper for Social Icons
const getSocialIcon = (network: string) => {
    switch (network.toLowerCase()) {
        case 'instagram':
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
        case 'facebook':
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
        case 'tiktok':
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>;
        case 'website':
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
        default:
            return <span style={{ fontSize: '1.2rem' }}>🔗</span>;
    }
};

export default BioLinks;
