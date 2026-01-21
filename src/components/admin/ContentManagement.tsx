import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/compressImage';
import ServicesManagement from './ServicesManagement';
import GalleryManagement from './GalleryManagement';
import './ContentManagement.css';

interface ContentManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

interface SiteContent {
    about: {
        title: string;
        description1: string;
        description2: string;
        imageUrl: string;
    };
    footer: {
        brandText: string;
        email: string;
        facebook: string;
        instagram: string;
        pinterest: string;
    };
    promoBanner: {
        isVisible: boolean;
        text: string;
        promoCode: string;
    };
    seasonalPromo: {
        isActive: boolean;
        title: string;
        description: string;
        price: string;
        originalPrice: string;
        imageUrl: string;
        features: string[];
        tag: string;
    };
}

interface BackdropColor {
    id: string;
    name: string;
    hex: string;
    textColor: string;
    accentColor: string;
    description: string;
    order: number;
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    order: number;
}

const ContentManagement = ({ showToast }: ContentManagementProps) => {
    // Content State
    const [content, setContent] = useState<SiteContent>({
        about: {
            title: "About it's ouR Studio",
            description1: "Welcome to it's ouR Studio, where you're in complete control of your photography experience.",
            description2: "Equipped with professional lighting, multiple backdrops, and an intuitive remote control system.",
            imageUrl: "/about-studio.jpg"
        },
        footer: {
            brandText: "Empowering you to capture your authentic self",
            email: "hello@studiolens.com",
            facebook: "#",
            instagram: "#",
            pinterest: "#"
        },
        promoBanner: {
            isVisible: false,
            text: "Holiday Special! Get 20% OFF",
            promoCode: "HOLIDAY20"
        },
        seasonalPromo: {
            isActive: false,
            title: "Holiday Special Session",
            description: "Celebrate the season with our exclusive holiday package.",
            price: "₱999",
            originalPrice: "₱1,499",
            imageUrl: "/gallery/duo4.webp",
            features: ["45 Mins Session", "Unlimited Soft Copies", "Holiday Themed Props"],
            tag: "Limited Time Offer"
        }
    });

    // Content Image Upload States
    const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
    const [aboutImagePreview, setAboutImagePreview] = useState<string>('');
    const [seasonalImageFile, setSeasonalImageFile] = useState<File | null>(null);
    const [seasonalImagePreview, setSeasonalImagePreview] = useState<string>('');
    const [contentUploading, setContentUploading] = useState<'about' | 'seasonal' | null>(null);
    const [replacingImage, setReplacingImage] = useState<{ about: boolean; seasonal: boolean }>({ about: false, seasonal: false });

    // Backdrop Management State
    const [backdrops, setBackdrops] = useState<BackdropColor[]>([]);
    const [backdropForm, setBackdropForm] = useState<BackdropColor>({
        id: '',
        name: '',
        hex: '#ffffff',
        textColor: '#000000',
        accentColor: '#888888',
        description: '',
        order: 0
    });
    const [editingBackdropId, setEditingBackdropId] = useState<string | null>(null);

    // Navigation State
    const [activeSection, setActiveSection] = useState<'promoBanner' | 'seasonalPromo' | 'about' | 'footer' | 'backdrops' | 'faq' | 'services' | 'gallery'>('promoBanner');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // For mobile view navigation
    const [isBackdropModalOpen, setIsBackdropModalOpen] = useState(false);

    // FAQ State
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [faqForm, setFaqForm] = useState<FAQItem>({ id: '', question: '', answer: '', order: 0 });
    const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

    // Fetch Site Content
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const aboutDoc = await getDoc(doc(db, 'siteContent', 'about'));
                const footerDoc = await getDoc(doc(db, 'siteContent', 'footer'));
                const promoDoc = await getDoc(doc(db, 'siteContent', 'promoBanner'));

                const seasonalDoc = await getDoc(doc(db, 'siteContent', 'seasonalPromo'));
                const faqDoc = await getDoc(doc(db, 'siteContent', 'faq'));

                if (aboutDoc.exists()) setContent(prev => ({ ...prev, about: aboutDoc.data() as any }));
                if (footerDoc.exists()) setContent(prev => ({ ...prev, footer: footerDoc.data() as any }));
                if (promoDoc.exists()) setContent(prev => ({ ...prev, promoBanner: promoDoc.data() as any }));
                if (seasonalDoc.exists()) setContent(prev => ({ ...prev, seasonalPromo: seasonalDoc.data() as any }));
                if (faqDoc.exists()) setFaqs(faqDoc.data().items || []);
            } catch (err) {
                console.log("No content found, using defaults");
            }
        };
        fetchContent();
    }, []);

    // Fetch Backdrops
    useEffect(() => {
        const q = query(collection(db, 'backdrops'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const backdropsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BackdropColor[];
            setBackdrops(backdropsData);
        }, (error) => {
            console.error("Error fetching backdrops:", error);
            showToast('error', 'Error', 'Failed to fetch backdrops');
        });
        return () => unsubscribe();
    }, [showToast]);

    // Safety Patch for HMR/updates
    useEffect(() => {
        if (!content.seasonalPromo) {
            setContent(prev => ({
                ...prev,
                seasonalPromo: {
                    isActive: false,
                    title: "Holiday Special Session",
                    description: "Celebrate the season with our exclusive holiday package.",
                    price: "₱999",
                    originalPrice: "₱1,499",
                    imageUrl: "/gallery/duo4.webp",
                    features: ["45 Mins Session", "Unlimited Soft Copies", "Holiday Themed Props"],
                    tag: "Limited Time Offer"
                }
            }));
        }
    }, [content.seasonalPromo]);

    const handleContentChange = (section: 'about' | 'footer' | 'promoBanner' | 'seasonalPromo', field: string, value: any) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSaveContent = async (section: 'about' | 'footer' | 'promoBanner' | 'seasonalPromo') => {
        try {
            await setDoc(doc(db, 'siteContent', section), content[section]);
            showToast('success', 'Saved', `${section.charAt(0).toUpperCase() + section.slice(1)} content updated successfully.`);
        } catch (error) {
            console.error("Error saving content:", error);
            showToast('error', 'Error', 'Failed to save content.');
        }
    };

    // Image Upload Handlers
    const handleContentImageChange = (e: React.ChangeEvent<HTMLInputElement>, section: 'about' | 'seasonal') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            showToast('error', 'File too large', 'Image must be less than 15MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        if (section === 'about') {
            if (aboutImagePreview) URL.revokeObjectURL(aboutImagePreview);
            setAboutImageFile(file);
            setAboutImagePreview(previewUrl);
        } else {
            if (seasonalImagePreview) URL.revokeObjectURL(seasonalImagePreview);
            setSeasonalImageFile(file);
            setSeasonalImagePreview(previewUrl);
        }
    };

    const handleContentImageDrop = (e: React.DragEvent<HTMLDivElement>, section: 'about' | 'seasonal') => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            showToast('error', 'Invalid file', 'Please drop an image file');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            showToast('error', 'File too large', 'Image must be less than 15MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        if (section === 'about') {
            if (aboutImagePreview) URL.revokeObjectURL(aboutImagePreview);
            setAboutImageFile(file);
            setAboutImagePreview(previewUrl);
        } else {
            if (seasonalImagePreview) URL.revokeObjectURL(seasonalImagePreview);
            setSeasonalImageFile(file);
            setSeasonalImagePreview(previewUrl);
        }
    };

    const handleUploadContentImage = async (section: 'about' | 'seasonal') => {
        const file = section === 'about' ? aboutImageFile : seasonalImageFile;
        if (!file) {
            showToast('error', 'No image', 'Please select an image first');
            return;
        }

        setContentUploading(section);

        try {
            const compressedBlob = await compressImage(file);
            const storageRef = ref(storage, `content/${section}_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, compressedBlob);
            const imageUrl = await getDownloadURL(storageRef);

            if (section === 'about') {
                handleContentChange('about', 'imageUrl', imageUrl);
                setAboutImageFile(null);
                setAboutImagePreview('');
                setReplacingImage(prev => ({ ...prev, about: false }));
            } else {
                handleContentChange('seasonalPromo', 'imageUrl', imageUrl);
                setSeasonalImageFile(null);
                setSeasonalImagePreview('');
                setReplacingImage(prev => ({ ...prev, seasonal: false }));
            }

            showToast('success', 'Image Uploaded', 'Image uploaded successfully. Remember to save the section.');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('error', 'Upload Failed', 'Failed to upload image');
        } finally {
            setContentUploading(null);
        }
    };

    const handleRemoveCurrentContentImage = (section: 'about' | 'seasonal') => {
        if (section === 'about') {
            handleContentChange('about', 'imageUrl', '');
        } else {
            handleContentChange('seasonalPromo', 'imageUrl', '');
        }
    };

    const removeContentImage = (section: 'about' | 'seasonal') => {
        if (section === 'about') {
            if (aboutImagePreview) URL.revokeObjectURL(aboutImagePreview);
            setAboutImageFile(null);
            setAboutImagePreview('');
        } else {
            if (seasonalImagePreview) URL.revokeObjectURL(seasonalImagePreview);
            setSeasonalImageFile(null);
            setSeasonalImagePreview('');
        }
    };

    // Backdrop Functions
    const handleEditBackdrop = (backdrop: BackdropColor) => {
        setEditingBackdropId(backdrop.id);
        setBackdropForm(backdrop);
        setIsMobileMenuOpen(false); // Go to edit view on mobile
        setActiveSection('backdrops');
        setIsBackdropModalOpen(true); // Open modal instead of scrolling
    };

    const handleCancelBackdropEdit = () => {
        setEditingBackdropId(null);
        setBackdropForm({
            id: '',
            name: '',
            hex: '#ffffff',
            textColor: '#000000',
            accentColor: '#888888',
            description: '',
            order: backdrops.length + 1
        });
        setIsBackdropModalOpen(false);
    };

    const handleDeleteBackdrop = async (id: string) => {
        if (window.confirm("Delete this backdrop? This will remove it from the visualizer.")) {
            try {
                await deleteDoc(doc(db, 'backdrops', id));
                showToast('success', 'Deleted', 'Backdrop deleted');
            } catch (error) {
                console.error("Error deleting backdrop:", error);
                showToast('error', 'Error', 'Failed to delete backdrop');
            }
        }
    };

    const handleSaveBackdrop = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingBackdropId) {
                // Update
                const docRef = doc(db, 'backdrops', editingBackdropId);
                await setDoc(docRef, { ...backdropForm, id: editingBackdropId }, { merge: true });
                showToast('success', 'Updated', 'Backdrop updated successfully');
            } else {
                // Create
                let newId = backdropForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                if (!newId) newId = `backdrop-${Date.now()}`;

                const existing = backdrops.find(b => b.id === newId);
                if (existing) {
                    showToast('error', 'Duplicate', 'A backdrop with this name/ID already exists.');
                    return;
                }

                await setDoc(doc(db, 'backdrops', newId), { ...backdropForm, id: newId });
                showToast('success', 'Created', 'Backdrop created successfully');
            }
            handleCancelBackdropEdit();
        } catch (error) {
            console.error("Error saving backdrop:", error);
            showToast('error', 'Error', 'Failed to save backdrop');
        }
    };

    // FAQ Functions
    const handleEditFaq = (faq: FAQItem) => {
        setEditingFaqId(faq.id);
        setFaqForm(faq);
        setIsBackdropModalOpen(false); // Close other modals if any
        setIsFaqModalOpen(true);
    };

    const handleCancelFaqEdit = () => {
        setEditingFaqId(null);
        setFaqForm({ id: '', question: '', answer: '', order: faqs.length + 1 });
        setIsFaqModalOpen(false);
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let updatedFaqs = [...faqs];
            if (editingFaqId) {
                updatedFaqs = updatedFaqs.map(f => f.id === editingFaqId ? { ...faqForm, id: editingFaqId } : f);
                showToast('success', 'Updated', 'FAQ updated');
            } else {
                const newFaq = { ...faqForm, id: `faq-${Date.now()}` };
                updatedFaqs.push(newFaq);
                showToast('success', 'Created', 'FAQ created');
            }
            updatedFaqs.sort((a, b) => a.order - b.order);
            setFaqs(updatedFaqs);
            await setDoc(doc(db, 'siteContent', 'faq'), { items: updatedFaqs });
            handleCancelFaqEdit();
        } catch (error) {
            console.error("Error saving FAQ:", error);
            showToast('error', 'Error', 'Failed to save FAQ');
        }
    };

    const handleDeleteFaq = async (id: string) => {
        if (!window.confirm("Delete this FAQ?")) return;
        try {
            const updatedFaqs = faqs.filter(f => f.id !== id);
            setFaqs(updatedFaqs);
            await setDoc(doc(db, 'siteContent', 'faq'), { items: updatedFaqs });
            showToast('success', 'Deleted', 'FAQ deleted');
        } catch (error) {
            console.error("Error deleting FAQ:", error);
            showToast('error', 'Error', 'Failed to delete FAQ');
        }
    };

    const navigateToSection = (section: typeof activeSection) => {
        setActiveSection(section);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className={`content-management ${isMobileMenuOpen ? 'mobile-menu-open' : 'mobile-content-open'}`}>
            <div className="bookings-section content-layout">
                {/* Sidebar / Menu */}
                <div className="content-sidebar">
                    <div className="sidebar-group-title">Site Sections</div>
                    <button
                        className={`content-nav-btn ${activeSection === 'promoBanner' ? 'active' : ''}`}
                        onClick={() => navigateToSection('promoBanner')}
                    >
                        <div className="nav-icon">📢</div>
                        <div className="nav-label">
                            <span>Promo Banner</span>
                            <small>Top announcement bar</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'seasonalPromo' ? 'active' : ''}`}
                        onClick={() => navigateToSection('seasonalPromo')}
                    >
                        <div className="nav-icon">🎄</div>
                        <div className="nav-label">
                            <span>Seasonal Section</span>
                            <small>Limited time offers</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'about' ? 'active' : ''}`}
                        onClick={() => navigateToSection('about')}
                    >
                        <div className="nav-icon">📖</div>
                        <div className="nav-label">
                            <span>About Section</span>
                            <small>Story & details</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'footer' ? 'active' : ''}`}
                        onClick={() => navigateToSection('footer')}
                    >
                        <div className="nav-icon">🔗</div>
                        <div className="nav-label">
                            <span>Footer Info</span>
                            <small>Links & contacts</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'faq' ? 'active' : ''}`}
                        onClick={() => navigateToSection('faq')}
                    >
                        <div className="nav-icon">❓</div>
                        <div className="nav-label">
                            <span>FAQ</span>
                            <small>Questions & Answers</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <div className="sidebar-group-title" style={{ marginTop: '1rem' }}>Tools</div>
                    <button
                        className={`content-nav-btn ${activeSection === 'backdrops' ? 'active' : ''}`}
                        onClick={() => navigateToSection('backdrops')}
                    >
                        <div className="nav-icon">🎨</div>
                        <div className="nav-label">
                            <span>Backdrops</span>
                            <small>Studio colors</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'gallery' ? 'active' : ''}`}
                        onClick={() => navigateToSection('gallery')}
                    >
                        <div className="nav-icon">🖼️</div>
                        <div className="nav-label">
                            <span>Image Carousel</span>
                            <small>Homepage Gallery</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>

                    <button
                        className={`content-nav-btn ${activeSection === 'services' ? 'active' : ''}`}
                        onClick={() => navigateToSection('services')}
                    >
                        <div className="nav-icon">📸</div>
                        <div className="nav-label">
                            <span>Services</span>
                            <small>Packages & Pricing</small>
                        </div>
                        <div className="nav-arrow">›</div>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="content-main">
                    {/* Mobile Header with Back Button */}
                    <div className="mobile-content-header">
                        <button className="btn-back" onClick={() => setIsMobileMenuOpen(true)}>
                            ← Back to Menu
                        </button>
                        <h3>{activeSection === 'promoBanner' ? 'Promo Banner' :
                            activeSection === 'seasonalPromo' ? 'Seasonal Promo' :
                                activeSection === 'about' ? 'About Section' :
                                    activeSection === 'footer' ? 'Footer Info' :
                                        activeSection === 'faq' ? 'FAQ Management' :
                                            activeSection === 'services' ? 'Services Management' :
                                                activeSection === 'gallery' ? 'Gallery & Carousel' : 'Backdrops'}</h3>
                    </div>

                    {/* Gallery Management */}
                    {activeSection === 'gallery' && (
                        <GalleryManagement showToast={showToast} />
                    )}

                    {/* Promo Banner Edit */}
                    {activeSection === 'promoBanner' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h4>Promo Banner</h4>
                                <p>Manage the banner that appears at the top of the site.</p>
                            </div>
                            <div className="card-body">
                                <div className="form-group-toggle">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={content.promoBanner.isVisible}
                                            onChange={(e) => handleContentChange('promoBanner', 'isVisible', e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span className="toggle-label">Show Promo Banner</span>
                                </div>

                                <div className="form-grid">
                                    <div className="full-width">
                                        <label className="form-label">Banner Text</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.promoBanner.text}
                                            onChange={(e) => handleContentChange('promoBanner', 'text', e.target.value)}
                                        />
                                    </div>
                                    <div className="full-width">
                                        <label className="form-label">Promo Code (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.promoBanner.promoCode}
                                            onChange={(e) => handleContentChange('promoBanner', 'promoCode', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSaveContent('promoBanner')}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Seasonal Promo Edit */}
                    {activeSection === 'seasonalPromo' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h4>Seasonal Promotion</h4>
                                <p>Configure the special offer section on the homepage.</p>
                            </div>
                            <div className="card-body">
                                <div className="form-group-toggle">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={content.seasonalPromo.isActive}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'isActive', e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span className="toggle-label">Activate Seasonal Section</span>
                                </div>

                                <div className="form-grid two-col">
                                    <div className="full-width">
                                        <label className="form-label">Promo Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.seasonalPromo.title}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="full-width">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            rows={3}
                                            value={content.seasonalPromo.description}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'description', e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="form-label">Price</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.seasonalPromo.price}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'price', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Original Price</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.seasonalPromo.originalPrice}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'originalPrice', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Tag (e.g. Best Value)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.seasonalPromo.tag}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'tag', e.target.value)}
                                        />
                                    </div>

                                    <div className="full-width">
                                        <label className="form-label">Promo Image</label>
                                        {content.seasonalPromo.imageUrl && !seasonalImageFile && !replacingImage.seasonal ? (
                                            <div className="current-image-preview">
                                                <div className="preview-label">Current Image</div>
                                                <img
                                                    src={content.seasonalPromo.imageUrl}
                                                    alt="Current seasonal promo"
                                                />
                                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => setReplacingImage(prev => ({ ...prev, seasonal: true }))}
                                                    >
                                                        Replace Image
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                                        onClick={() => handleRemoveCurrentContentImage('seasonal')}
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className={`drop-zone ${contentUploading === 'seasonal' ? 'disabled' : ''} ${seasonalImagePreview ? 'has-preview' : ''}`}
                                                    onClick={() => !contentUploading && document.getElementById('seasonal-image-upload')?.click()}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    onDrop={(e) => handleContentImageDrop(e, 'seasonal')}
                                                >
                                                    {seasonalImagePreview ? (
                                                        <div className="preview-container">
                                                            <img src={seasonalImagePreview} alt="Preview" />
                                                            <button
                                                                type="button"
                                                                className="remove-preview-btn"
                                                                onClick={(e) => { e.stopPropagation(); removeContentImage('seasonal'); }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="drop-placeholder">
                                                            <div className="icon">🎄</div>
                                                            <p>Drag & drop image here or click to upload</p>
                                                            <small>Max 15MB</small>
                                                        </div>
                                                    )}
                                                    <input
                                                        id="seasonal-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={contentUploading === 'seasonal'}
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleContentImageChange(e, 'seasonal')}
                                                    />
                                                    {replacingImage.seasonal && !seasonalImagePreview && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            style={{ marginTop: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                                            onClick={(e) => { e.stopPropagation(); setReplacingImage(prev => ({ ...prev, seasonal: false })); }}
                                                        >
                                                            Cancel Replace
                                                        </button>
                                                    )}
                                                </div>

                                                {seasonalImageFile && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ marginTop: '1rem', width: '100%' }}
                                                        onClick={() => handleUploadContentImage('seasonal')}
                                                        disabled={contentUploading === 'seasonal'}
                                                    >
                                                        {contentUploading === 'seasonal' ? 'Uploading...' : 'Upload Image'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="full-width">
                                        <label className="form-label">Features List (comma separated)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.seasonalPromo.features.join(', ')}
                                            onChange={(e) => handleContentChange('seasonalPromo', 'features', e.target.value.split(',').map(s => s.trim()))}
                                        />
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSaveContent('seasonalPromo')}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'about' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h4>About Section</h4>
                                <p>Edit the story and details shown in the About Us section.</p>
                            </div>
                            <div className="card-body">
                                <div className="form-grid">
                                    <div className="full-width">
                                        <label className="form-label">Section Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.about.title}
                                            onChange={(e) => handleContentChange('about', 'title', e.target.value)}
                                        />
                                    </div>

                                    <div className="full-width">
                                        <label className="form-label">Section Image</label>
                                        {content.about.imageUrl && !aboutImageFile && !replacingImage.about ? (
                                            <div className="current-image-preview">
                                                <div className="preview-label">Current Image</div>
                                                <img
                                                    src={content.about.imageUrl}
                                                    alt="Current about"
                                                />
                                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => setReplacingImage(prev => ({ ...prev, about: true }))}
                                                    >
                                                        Replace Image
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                                        onClick={() => handleRemoveCurrentContentImage('about')}
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className={`drop-zone ${contentUploading === 'about' ? 'disabled' : ''} ${aboutImagePreview ? 'has-preview' : ''}`}
                                                    onClick={() => !contentUploading && document.getElementById('about-image-upload')?.click()}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    onDrop={(e) => handleContentImageDrop(e, 'about')}
                                                >
                                                    {aboutImagePreview ? (
                                                        <div className="preview-container">
                                                            <img src={aboutImagePreview} alt="Preview" />
                                                            <button
                                                                type="button"
                                                                className="remove-preview-btn"
                                                                onClick={(e) => { e.stopPropagation(); removeContentImage('about'); }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="drop-placeholder">
                                                            <div className="icon">📸</div>
                                                            <p>Drag & drop image here or click to upload</p>
                                                            <small>Max 15MB</small>
                                                        </div>
                                                    )}
                                                    <input
                                                        id="about-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={contentUploading === 'about'}
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleContentImageChange(e, 'about')}
                                                    />
                                                    {replacingImage.about && !aboutImagePreview && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            style={{ marginTop: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                                            onClick={(e) => { e.stopPropagation(); setReplacingImage(prev => ({ ...prev, about: false })); }}
                                                        >
                                                            Cancel Replace
                                                        </button>
                                                    )}
                                                </div>

                                                {aboutImageFile && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ marginTop: '1rem', width: '100%' }}
                                                        onClick={() => handleUploadContentImage('about')}
                                                        disabled={contentUploading === 'about'}
                                                    >
                                                        {contentUploading === 'about' ? 'Uploading...' : 'Upload Image'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="full-width">
                                        <label className="form-label">Description Paragraph 1</label>
                                        <textarea
                                            className="form-input"
                                            rows={4}
                                            value={content.about.description1}
                                            onChange={(e) => handleContentChange('about', 'description1', e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="full-width">
                                        <label className="form-label">Description Paragraph 2</label>
                                        <textarea
                                            className="form-input"
                                            rows={4}
                                            value={content.about.description2}
                                            onChange={(e) => handleContentChange('about', 'description2', e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSaveContent('about')}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'footer' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h4>Footer Information</h4>
                                <p>Update links and contact details in the site footer.</p>
                            </div>
                            <div className="card-body">
                                <div className="form-grid two-col">
                                    <div className="full-width">
                                        <label className="form-label">Brand Slogan</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.footer.brandText}
                                            onChange={(e) => handleContentChange('footer', 'brandText', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Contact Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={content.footer.email}
                                            onChange={(e) => handleContentChange('footer', 'email', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Facebook URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.footer.facebook}
                                            onChange={(e) => handleContentChange('footer', 'facebook', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Instagram URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.footer.instagram}
                                            onChange={(e) => handleContentChange('footer', 'instagram', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Pinterest URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.footer.pinterest}
                                            onChange={(e) => handleContentChange('footer', 'pinterest', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSaveContent('footer')}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'backdrops' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h4>Backdrop Colors</h4>
                                <p>Manage the colors available in the "Select Your Vibe" visualizer.</p>
                            </div>
                            <div className="card-body">

                                {/* Add New Button (Desktop / Top of List) */}
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            handleCancelBackdropEdit();
                                            setIsBackdropModalOpen(true);
                                        }}
                                    >
                                        + Add New Backdrop
                                    </button>
                                </div>

                                {/* List of Backdrops */}
                                <div className="backdrops-list">
                                    {backdrops.map((bd) => (
                                        <div
                                            key={bd.id}
                                            className="backdrop-item"
                                            onClick={() => handleEditBackdrop(bd)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="backdrop-color-preview" style={{ backgroundColor: bd.hex }}></div>

                                            <div className="backdrop-info">
                                                <div className="backdrop-name">{bd.name}</div>
                                                <div className="backdrop-desc">{bd.description}</div>
                                            </div>

                                            <div className="backdrop-actions">
                                                <button
                                                    className="action-btn"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditBackdrop(bd);
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBackdrop(bd.id);
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {backdrops.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontStyle: 'italic' }}>
                                        No backdrops found. Add one above.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Backdrop Modal */}
                    {isBackdropModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsBackdropModalOpen(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <button className="modal-close-btn" onClick={() => setIsBackdropModalOpen(false)}>×</button>
                                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: '#1e293b' }}>
                                    {editingBackdropId ? 'Edit Backdrop' : 'Add New Backdrop'}
                                </h3>

                                <form onSubmit={handleSaveBackdrop}>
                                    <div className="form-grid two-col" style={{ gap: '1rem' }}>
                                        <div className="full-width">
                                            <label className="form-label">Display Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Midnight Black"
                                                value={backdropForm.name}
                                                onChange={e => setBackdropForm({ ...backdropForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-grid three-col full-width" style={{ marginTop: '0.5rem' }}>
                                            <div>
                                                <label className="form-label">Hex Color</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input
                                                        type="color"
                                                        value={backdropForm.hex}
                                                        onChange={e => setBackdropForm({ ...backdropForm, hex: e.target.value })}
                                                        style={{ width: '100%', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={backdropForm.hex}
                                                    onChange={e => setBackdropForm({ ...backdropForm, hex: e.target.value })}
                                                    style={{ fontSize: '0.8rem', marginTop: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Text Color</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input
                                                        type="color"
                                                        value={backdropForm.textColor}
                                                        onChange={e => setBackdropForm({ ...backdropForm, textColor: e.target.value })}
                                                        style={{ width: '100%', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={backdropForm.textColor}
                                                    onChange={e => setBackdropForm({ ...backdropForm, textColor: e.target.value })}
                                                    style={{ fontSize: '0.8rem', marginTop: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Accent</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input
                                                        type="color"
                                                        value={backdropForm.accentColor}
                                                        onChange={e => setBackdropForm({ ...backdropForm, accentColor: e.target.value })}
                                                        style={{ width: '100%', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={backdropForm.accentColor}
                                                    onChange={e => setBackdropForm({ ...backdropForm, accentColor: e.target.value })}
                                                    style={{ fontSize: '0.8rem', marginTop: '4px' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="full-width">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-input"
                                                rows={2}
                                                placeholder="Short description..."
                                                value={backdropForm.description}
                                                onChange={e => setBackdropForm({ ...backdropForm, description: e.target.value })}
                                                required
                                            ></textarea>
                                        </div>
                                        <div className="full-width">
                                            <label className="form-label">Sort Order</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={backdropForm.order}
                                                onChange={e => setBackdropForm({ ...backdropForm, order: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => setIsBackdropModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            {editingBackdropId ? 'Update' : 'Add'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}


                    {/* FAQ Management Section */}
                    {activeSection === 'faq' && (
                        <div className="content-card">
                            <div className="card-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4>Frequently Asked Questions</h4>
                                        <p>Manage common questions for your customers.</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => {
                                        setFaqForm({ id: '', question: '', answer: '', order: faqs.length + 1 });
                                        setIsFaqModalOpen(true);
                                    }}>
                                        + Add Question
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="faq-list">
                                    {faqs.map(faq => (
                                        <div key={faq.id} className="faq-item-card">
                                            <div className="faq-header-row">
                                                <h5 className="faq-question-text">{faq.question}</h5>
                                                <span className="faq-order-badge">#{faq.order}</span>
                                            </div>
                                            <div className="faq-answer-text">
                                                {faq.answer}
                                            </div>
                                            <div className="faq-actions">
                                                <button className="btn btn-outline" onClick={() => handleEditFaq(faq)}>
                                                    <span style={{ marginRight: '5px' }}>✏️</span> Edit
                                                </button>
                                                <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteFaq(faq.id)}>
                                                    <span style={{ marginRight: '5px' }}>🗑️</span> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {faqs.length === 0 && (
                                        <div className="faq-empty-state">
                                            <h5>No FAQs added yet</h5>
                                            <p>Create your own or load standard ones.</p>
                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                                <button className="btn btn-primary" onClick={() => {
                                                    setFaqForm({ id: '', question: '', answer: '', order: faqs.length + 1 });
                                                    setIsFaqModalOpen(true);
                                                }}>
                                                    Add First Question
                                                </button>
                                                <button className="btn btn-outline" onClick={async () => {
                                                    if (!window.confirm("Load default studio FAQs? This will add 6 common questions.")) return;
                                                    const defaultFaqs: FAQItem[] = [
                                                        { id: 'faq-1', question: 'Do I need to book in advance?', answer: 'Yes, we highly recommend booking your slot in advance to ensure availability. Walk-ins are subject to time slot openings.', order: 1 },
                                                        { id: 'faq-2', question: 'Can I bring my pet?', answer: 'Absolutely! We are a pet-friendly studio. We love capturing moments with your furry friends. Just make sure they are potty trained or wearing diapers.', order: 2 },
                                                        { id: 'faq-3', question: 'What happens if I am late?', answer: 'Your session time starts promptly at your booked time. If you arrive late, it will consume part of your session time as we need to respect the bookings of clients after you.', order: 3 },
                                                        { id: 'faq-4', question: 'How do I receive my photos?', answer: 'All soft copies will be sent to your provided email address via a Google Drive link within 24 hours after your session.', order: 4 },
                                                        { id: 'faq-5', question: 'Can we bring props or outfits?', answer: 'Yes! We encourage you to bring your own props, outfits, and accessories to make your shoot unique. We also have a selection of basic props available.', order: 5 },
                                                        { id: 'faq-6', question: 'What is your cancellation policy?', answer: 'Rescheduling is allowed up to 24 hours before your session. Cancellations made less than 24 hours prior may forfeit the reservation fee.', order: 6 }
                                                    ];
                                                    setFaqs(defaultFaqs);
                                                    await setDoc(doc(db, 'siteContent', 'faq'), { items: defaultFaqs });
                                                    showToast('success', 'Loaded Defaults', 'Default FAQs have been added.');
                                                }}>
                                                    Load Default Questions
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'services' && (
                        <ServicesManagement showToast={showToast} />
                    )}

                    {/* FAQ Modal */}
                    {isFaqModalOpen && (
                        <div className="modal-overlay" onClick={handleCancelFaqEdit}>
                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                                <div className="modal-header">
                                    <h3>{editingFaqId ? 'Edit Question' : 'Add New Question'}</h3>
                                    <button className="close-btn" onClick={handleCancelFaqEdit}>&times;</button>
                                </div>
                                <form onSubmit={handleSaveFaq}>
                                    <div className="modal-body">
                                        <div className="full-width">
                                            <label className="form-label">Question</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={faqForm.question}
                                                onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                                                required
                                                placeholder="e.g. How do I book?"
                                            />
                                        </div>
                                        <div className="full-width">
                                            <label className="form-label">Answer</label>
                                            <textarea
                                                className="form-input"
                                                rows={4}
                                                value={faqForm.answer}
                                                onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                                                required
                                                placeholder="Enter the answer here..."
                                            ></textarea>
                                        </div>
                                        <div className="full-width">
                                            <label className="form-label">Display Order</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={faqForm.order}
                                                onChange={e => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button type="button" className="btn btn-outline" onClick={handleCancelFaqEdit}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">{editingFaqId ? 'Update' : 'Add'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}



                </div>
            </div>
        </div>
    );
};

export default ContentManagement;
