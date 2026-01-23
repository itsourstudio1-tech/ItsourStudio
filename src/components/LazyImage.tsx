import { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    wrapperClassName?: string;
}

const LazyImage = ({ src, alt, className = '', wrapperClassName = '' }: LazyImageProps) => {
    if (!src) return null;

    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '100px', // Load images slightly before they enter the viewport
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={imgRef} className={`lazy-image-container ${wrapperClassName}`}>
            {!isLoaded && <div className="skeleton lazy-image-skeleton"></div>}
            {isVisible && (
                <img
                    src={src}
                    alt={alt}
                    className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className}`}
                    onLoad={() => setIsLoaded(true)}
                />
            )}
        </div>
    );
};

export default LazyImage;
