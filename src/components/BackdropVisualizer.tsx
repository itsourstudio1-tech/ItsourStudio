
import { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface BackdropColor {
    id: string;
    name: string;
    hex: string;
    textColor: string;
    accentColor: string;
    description: string;
    order?: number;
}

const defaultBackdrops: BackdropColor[] = [
    { id: 'white', name: 'Classic White', hex: '#FDFDFD', textColor: '#1a1a1a', accentColor: '#d4d4d4', description: "Clean. Minimal. Timeless. The quintessential studio look.", order: 1 },
    { id: 'beige', name: 'Warm Beige', hex: '#EBE5CE', textColor: '#3e3830', accentColor: '#bfae91', description: "Earthy and organic. Complements skin tones with a soft, natural warmth.", order: 2 },
    { id: 'pink', name: 'Millennial Pink', hex: '#F4C2C2', textColor: '#5d2e2e', accentColor: '#d68f8f', description: "Playful yet chic. Perfect for capturing joy, birthdays, and vibrant personalities.", order: 3 },
    { id: 'blue', name: 'Serene Blue', hex: '#CDD6DB', textColor: '#2c3e50', accentColor: '#93a7b5', description: "Cool and calming. A breath of fresh air for a modern, airy aesthetic.", order: 4 },
    { id: 'gray', name: 'Studio Gray', hex: '#8C8C8C', textColor: '#ffffff', accentColor: '#4a4a4a', description: "Notes of sophistication. The perfect balance between dramatic and bright.", order: 5 },
    { id: 'black', name: 'Midnight Black', hex: '#111111', textColor: '#ffffff', accentColor: '#333333', description: "Bold. Dramatic. Elegant. Focuses all attention on you.", order: 6 },
    { id: 'brown', name: 'Mocha Brown', hex: '#5D4037', textColor: '#ffffff', accentColor: '#8d6e63', description: "Rich and vintage. Adds depth and a cinematic quality to every shot.", order: 7 },
];

const BackdropVisualizer = () => {
    const [backdrops, setBackdrops] = useState<BackdropColor[]>(defaultBackdrops);
    const [activeColor, setActiveColor] = useState<BackdropColor>(defaultBackdrops[0]);
    const [visibleColor, setVisibleColor] = useState<BackdropColor>(defaultBackdrops[0]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    // Fetch backdrops and seed if empty
    useEffect(() => {
        const q = query(collection(db, 'backdrops'), orderBy('order', 'asc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty && !snapshot.metadata.fromCache) {
                // Only seed if truly empty and not just offline/loading
                // Double check if we should auto-seed. For safety, let's just log and rely on default if fetch fails.
                // Actually, seeding is nice.
                try {
                    // Check one more time if truly empty to avoid race conditions?
                    // snapshot.empty is reliable.
                    console.log("Seeding default backdrops to Firestore...");
                    const batch = writeBatch(db);
                    defaultBackdrops.forEach((bd) => {
                        const docRef = doc(db, 'backdrops', bd.id);
                        batch.set(docRef, bd);
                    });
                    await batch.commit();
                } catch (e) {
                    console.error("Auto-seeding failed (likely permissions or executed twice):", e);
                }
            } else if (!snapshot.empty) {
                const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BackdropColor[];
                setBackdrops(fetched);

                // Update active/visible if the current selection was removed
                setActiveColor(prev => fetched.find(b => b.id === prev.id) || fetched[0]);
                setVisibleColor(prev => fetched.find(b => b.id === prev.id) || fetched[0]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleColorChange = (color: BackdropColor) => {
        if (activeColor.id === color.id) return;

        setActiveColor(color);
        setIsTransitioning(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = window.setTimeout(() => {
            setVisibleColor(color);
            setIsTransitioning(false);
        }, 400);
    };

    // If loading and no backdrops yet, show defaults (already set in state)

    return (
        <section
            className="backdrop-visualizer"
            style={{
                backgroundColor: activeColor.hex,
                color: activeColor.textColor,
            }}
        >
            <div className="visualizer-grain"></div>

            <div className="container relative">
                <div className="content-wrapper">
                    <header className="visualizer-header" style={{ color: activeColor.accentColor }}>
                        <span className="eyebrow" style={{ borderColor: activeColor.accentColor }}>Select Your Vibe</span>
                        <h2 className="title">Backdrop Collection</h2>
                    </header>

                    <div className="display-area">
                        <div className={`text-content ${isTransitioning ? 'out' : 'in'}`}>
                            <h3 className="color-name" style={{ color: activeColor.accentColor }}>
                                {visibleColor.name}
                            </h3>
                            <p className="color-description">
                                {visibleColor.description}
                            </p>
                        </div>

                        <div className="swatch-container">
                            {backdrops.map((color) => (
                                <button
                                    key={color.id}
                                    className={`swatch-btn ${activeColor.id === color.id ? 'active' : ''}`}
                                    onClick={() => handleColorChange(color)}
                                    aria-label={`Select ${color.name}`}
                                >
                                    <span
                                        className="swatch-fill"
                                        style={{ backgroundColor: color.hex }}
                                    ></span>
                                    <span
                                        className="swatch-ring"
                                        style={{ borderColor: activeColor.id === color.id ? activeColor.textColor : 'transparent' }}
                                    ></span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .backdrop-visualizer {
                    position: relative;
                    min-height: 85vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    padding: 4rem 0;
                    transition: background-color 1s cubic-bezier(0.22, 1, 0.36, 1), color 0.5s ease;
                }

                .visualizer-grain {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
                    opacity: 0.4;
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }

                .relative { position: relative; z-index: 10; }

                .content-wrapper {
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .visualizer-header {
                    margin-bottom: 5vh;
                }

                .eyebrow {
                    display: inline-block;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid;
                    opacity: 0.7;
                    transition: border-color 0.5s ease;
                }

                .title {
                    font-family: var(--font-display);
                    font-size: clamp(2rem, 5vw, 3.5rem);
                    font-weight: 300;
                    letter-spacing: -0.02em;
                    margin: 0;
                }

                .display-area {
                    width: 100%;
                    min-height: 400px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .text-content {
                    transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0, 0.2, 1), filter 0.4s ease;
                    will-change: opacity, transform;
                }

                .text-content.out {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                    filter: blur(10px);
                }

                .text-content.in {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    filter: blur(0);
                }

                .color-name {
                    font-family: var(--font-display);
                    font-size: clamp(4rem, 12vw, 9rem);
                    line-height: 1;
                    font-weight: 700;
                    margin: 0 0 1.5rem 0;
                    letter-spacing: -0.04em;
                    opacity: 1;
                    text-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }

                .color-description {
                    font-size: 1.25rem;
                    font-weight: 400;
                    max-width: 500px;
                    margin: 0 auto;
                    opacity: 0.8;
                    font-family: var(--font-body);
                    line-height: 1.6;
                }

                .swatch-container {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 4rem;
                    flex-wrap: wrap;
                }

                .swatch-btn {
                    position: relative;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .swatch-btn:hover {
                    transform: scale(1.15);
                }

                .swatch-btn.active {
                    transform: scale(1.3);
                    z-index: 10;
                }

                .swatch-fill {
                    position: absolute;
                    inset: 4px;
                    border-radius: 50%;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    border: 1px solid rgba(0,0,0,0.05);
                }

                .swatch-ring {
                    position: absolute;
                    inset: -6px;
                    border-radius: 50%;
                    border: 1px solid;
                    transition: all 0.4s ease;
                    opacity: 0;
                    transform: scale(0.8);
                }
                
                .swatch-btn.active .swatch-ring {
                    opacity: 0.4;
                    transform: scale(1);
                }

                @media (max-width: 768px) {
                    .swatch-btn {
                        width: 44px;
                        height: 44px;
                    }
                    .text-content {
                        min-height: auto;
                    }
                }
            `}</style>
        </section>
    );
};

export default BackdropVisualizer;
