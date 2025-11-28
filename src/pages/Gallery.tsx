import React, { useState } from 'react';

// Gallery images from the studio
const galleryImages = [
    // Solo photos
    { id: 1, src: '/gallery/solo1.webp', category: 'solo', alt: 'Solo Portrait 1' },
    { id: 2, src: '/gallery/solo2.webp', category: 'solo', alt: 'Solo Portrait 2' },
    { id: 3, src: '/gallery/solo3.webp', category: 'solo', alt: 'Solo Portrait 3' },
    { id: 4, src: '/gallery/solo4.webp', category: 'solo', alt: 'Solo Portrait 4' },
    { id: 5, src: '/gallery/solo5.webp', category: 'solo', alt: 'Solo Portrait 5' },

    // Duo photos
    { id: 6, src: '/gallery/duo1.webp', category: 'duo', alt: 'Duo Photoshoot 1' },
    { id: 7, src: '/gallery/duo2.webp', category: 'duo', alt: 'Duo Photoshoot 2' },
    { id: 8, src: '/gallery/duo3.webp', category: 'duo', alt: 'Duo Photoshoot 3' },
    { id: 9, src: '/gallery/duo4.webp', category: 'duo', alt: 'Duo Photoshoot 4' },
    { id: 10, src: '/gallery/duo5.webp', category: 'duo', alt: 'Duo Photoshoot 5' },

    // Group photos
    { id: 11, src: '/gallery/group1.webp', category: 'group', alt: 'Group Photoshoot 1' },
    { id: 12, src: '/gallery/group2.webp', category: 'group', alt: 'Group Photoshoot 2' },
    { id: 13, src: '/gallery/group3.webp', category: 'group', alt: 'Group Photoshoot 3' },
    { id: 14, src: '/gallery/group4.webp', category: 'group', alt: 'Group Photoshoot 4' },
    { id: 15, src: '/gallery/group5.webp', category: 'group', alt: 'Group Photoshoot 5' },
];

const Gallery = () => {
    const [filter, setFilter] = useState('all');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const filteredImages = filter === 'all'
        ? galleryImages
        : galleryImages.filter(img => img.category === filter);

    const openLightbox = (index: number) => {
        // Find the index in the full array if needed, or just use the filtered index
        // For simplicity, let's just use the index within the filtered view
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
                        {filteredImages.map((image, index) => (
                            <div
                                key={image.id}
                                className="gallery-item"
                                onClick={() => openLightbox(index)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <img src={image.src} alt={image.alt} loading="lazy" />
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
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {lightboxOpen && (
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
