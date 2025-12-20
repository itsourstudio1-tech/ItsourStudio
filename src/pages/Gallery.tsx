import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import LazyImage from '../components/LazyImage';

interface GalleryImage {
    id: string;
    src: string;
    category: 'solo' | 'duo' | 'group';
    alt: string;
}

const Gallery = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Fetch Gallery Images
    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const fetchedImages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as GalleryImage[];

                setImages(fetchedImages);
            } catch (error) {
                console.error("Error fetching gallery:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
    }, []);

    const filteredImages = filter === 'all'
        ? images
        : images.filter(img => img.category === filter);

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    };

    if (loading) {
        return (
            <div className="gallery-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="gallery-page">
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Our Gallery</h1>
                    <p className="page-subtitle">Moments captured in our studio</p>
                </div>
            </section>

            <section className="gallery-section">
                <div className="container">
                    {/* Filter Buttons */}
                    <div className="gallery-filters">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Photos
                        </button>
                        <button
                            className={`filter-btn ${filter === 'solo' ? 'active' : ''}`}
                            onClick={() => setFilter('solo')}
                        >
                            Solo
                        </button>
                        <button
                            className={`filter-btn ${filter === 'duo' ? 'active' : ''}`}
                            onClick={() => setFilter('duo')}
                        >
                            Duo
                        </button>
                        <button
                            className={`filter-btn ${filter === 'group' ? 'active' : ''}`}
                            onClick={() => setFilter('group')}
                        >
                            Group
                        </button>
                    </div>

                    {/* Gallery Grid - Masonry Layout */}
                    <div className="gallery-masonry">
                        {filteredImages.length === 0 ? (
                            <div style={{
                                padding: '4rem 2rem',
                                textAlign: 'center',
                                width: '100%',
                                gridColumn: '1 / -1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    fontSize: '3rem',
                                    marginBottom: '1rem',
                                    padding: '1.5rem',
                                    background: 'var(--color-cream)',
                                    borderRadius: '50%',
                                    width: '100px',
                                    height: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-terracotta)'
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                                <h3 style={{
                                    color: 'var(--color-dark)',
                                    fontSize: '1.5rem',
                                    fontWeight: '600'
                                }}>
                                    No photos here yet
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-light)',
                                    maxWidth: '400px',
                                    lineHeight: '1.6'
                                }}>
                                    We haven't uploaded any {filter !== 'all' ? filter : ''} photos yet.
                                    Check back soon or book your session to be the first!
                                </p>
                            </div>
                        ) : (
                            filteredImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="gallery-item"
                                    onClick={() => openLightbox(index)}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <LazyImage src={image.src} alt={image.alt} />
                                    <div className="gallery-overlay">
                                        <div className="gallery-overlay-content">
                                            <svg className="view-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                            <span>View Full</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {lightboxOpen && filteredImages.length > 0 && (
                <div className="lightbox active" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
                    <button className="lightbox-prev" onClick={prevImage}>&#10094;</button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={filteredImages[currentImageIndex].src} alt={filteredImages[currentImageIndex].alt} />
                        <div className="lightbox-caption">
                            {filteredImages[currentImageIndex].alt} ({currentImageIndex + 1} / {filteredImages.length})
                        </div>
                    </div>
                    <button className="lightbox-next" onClick={nextImage}>&#10095;</button>
                </div>
            )}
        </div>
    );
};

export default Gallery;
