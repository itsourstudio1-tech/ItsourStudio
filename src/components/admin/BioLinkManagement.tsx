
import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/compressImage';

import BioIcon, { VALID_ICONS } from '../BioIcon';
import './BioLinkManagement.css';

interface BioLink {
    id: string;
    title: string;
    url: string;
    icon: string;
    isActive: boolean;
    order: number;
    special?: boolean;
}

interface BioProfile {
    displayName: string;
    bioDescription: string;
    profileImage: string;
    backgroundImage: string;
    themeColor: string;
    socials: {
        instagram: string;
        facebook: string;
        tiktok: string;
        website: string;
    };
}

interface Props {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const BioLinkManagement = ({ showToast }: Props) => {
    // Data States
    const [links, setLinks] = useState<BioLink[]>([]);
    const [profile, setProfile] = useState<BioProfile>({
        displayName: "",
        bioDescription: "",
        profileImage: "",
        backgroundImage: "",
        themeColor: "#000000",
        socials: { instagram: '', facebook: '', tiktok: '', website: '' }
    });

    // UI States
    const [uploading, setUploading] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState<BioLink | null>(null);
    const [linkFormData, setLinkFormData] = useState({ title: '', url: '', icon: '🔗', special: false });

    // Mobile View State
    const [activeMobileTab, setActiveMobileTab] = useState<'profile' | 'links'>('links');

    // Initial Fetch
    useEffect(() => {
        const fetchProfile = async () => {
            const docRef = doc(db, 'siteContent', 'bioProfile');
            const snap = await getDoc(docRef);
            if (snap.exists()) setProfile(snap.data() as BioProfile);
        };
        fetchProfile();

        const q = query(collection(db, 'bioLinks'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BioLink)));
        });
        return () => unsubscribe();
    }, []);

    // Handlers
    const updateProfile = (field: string, value: any) => setProfile(prev => ({ ...prev, [field]: value }));
    const updateSocial = (network: string, value: string) => setProfile(prev => ({ ...prev, socials: { ...prev.socials, [network]: value } }));

    const saveProfile = async () => {
        setUploading(true);
        try {
            await setDoc(doc(db, 'siteContent', 'bioProfile'), profile);
            showToast('success', 'Saved', 'Profile updated');
        } catch (e) { showToast('error', 'Error', 'Failed to save'); }
        finally { setUploading(false); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        try {
            const compressed = await compressImage(e.target.files[0]);
            const storagePath = `bio/${type}_${Date.now()}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, compressed);
            const url = await getDownloadURL(storageRef);

            const field = type === 'profile' ? 'profileImage' : 'backgroundImage';
            updateProfile(field, url);
            await updateDoc(doc(db, 'siteContent', 'bioProfile'), { [field]: url });
            showToast('success', 'Uploaded', 'Image updated');
        } catch (e) { showToast('error', 'Error', 'Upload failed'); }
        finally { setUploading(false); }
    };

    // Link Logic
    const openLinkModal = (link?: BioLink) => {
        setCurrentLink(link || null);
        setLinkFormData(link ? {
            title: link.title,
            url: link.url,
            icon: link.icon,
            special: link.special || false
        } : { title: '', url: '', icon: 'Link', special: false });
        setModalOpen(true);
    };

    const saveLink = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentLink) {
                await updateDoc(doc(db, 'bioLinks', currentLink.id), linkFormData);
            } else {
                await addDoc(collection(db, 'bioLinks'), {
                    ...linkFormData,
                    isActive: true,
                    order: links.length + 1,
                    createdAt: serverTimestamp()
                });
            }
            setModalOpen(false);
            showToast('success', 'Success', 'Link saved');
        } catch (e) { showToast('error', 'Error', 'Failed to save link'); }
    };

    const deleteLink = async (id: string) => {
        if (confirm('Delete this link?')) await deleteDoc(doc(db, 'bioLinks', id));
    };

    const toggleStatus = async (link: BioLink) => {
        await updateDoc(doc(db, 'bioLinks', link.id), { isActive: !link.isActive });
    };

    // Drag & Drop Logic
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image hack if needed, but default is usually fine
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        // Optional: Re-order visually in real-time if desired, or just wait for drop
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;

        const newLinks = [...links];
        const [draggedItem] = newLinks.splice(draggedIdx, 1);
        newLinks.splice(dropIndex, 0, draggedItem);

        // Optimistic UI
        setLinks(newLinks);
        setDraggedIdx(null);

        // Update Backend
        try {
            const batchPromises = newLinks.map((link, idx) =>
                updateDoc(doc(db, 'bioLinks', link.id), { order: idx + 1 })
            );
            await Promise.all(batchPromises);
        } catch (err) {
            console.error("Failed to reorder", err);
            showToast('error', 'Error', 'Failed to save order');
        }
    };

    // Defaults
    const populateDefaults = async () => {
        if (!confirm('Populate default links and socials?')) return;
        setUploading(true);
        try {
            // Links
            await Promise.all([
                { title: 'Our Services', url: '/services', icon: 'Star', order: 1, isActive: true, special: false },
                { title: 'View Gallery', url: '/gallery', icon: 'Camera', order: 2, isActive: true, special: false },
                { title: 'FAQ', url: '/faq', icon: 'HelpCircle', order: 3, isActive: true, special: false }
            ].map(l => addDoc(collection(db, 'bioLinks'), { ...l, createdAt: serverTimestamp() })));

            // Socials
            const defaultSocials = {
                instagram: "https://www.instagram.com/its_our_studio/",
                facebook: "https://www.facebook.com/itsouRstudioo/",
                tiktok: "https://www.tiktok.com/@itsourstudio",
                website: window.location.origin
            };
            updateProfile('socials', defaultSocials);
            await setDoc(doc(db, 'siteContent', 'bioProfile'), { ...profile, socials: defaultSocials }, { merge: true });

            showToast('success', 'Done', 'Defaults populated');
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    };

    return (
        <div className="bio-manager-layout">
            <div className="mobile-tabs">
                <button
                    className={`mobile-tab-btn ${activeMobileTab === 'links' ? 'active' : ''}`}
                    onClick={() => setActiveMobileTab('links')}
                >
                    🔗 Links
                </button>
                <button
                    className={`mobile-tab-btn ${activeMobileTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveMobileTab('profile')}
                >
                    🎨 Design
                </button>
            </div>

            {/* Sidebar: Profile & Settings */}
            <aside className={`bio-sidebar ${activeMobileTab === 'links' ? 'mobile-hidden' : ''}`}>
                <div className="bio-sidebar-header">
                    <h3>Profile Config</h3>
                    <button className="text-btn small" onClick={saveProfile} disabled={uploading}>
                        {uploading ? 'Saving..' : 'Save All'}
                    </button>
                </div>

                <div className="profile-card">
                    <div className="avatar-upload" onClick={() => document.getElementById('p-upload')?.click()}>
                        <img
                            src={profile.profileImage || '/logo/android-chrome-512x512.png'}
                            alt="Avatar"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logo/android-chrome-512x512.png'; }}
                        />
                        <div className="overlay">📷</div>
                        <input id="p-upload" type="file" hidden onChange={e => handleImageUpload(e, 'profile')} />
                    </div>

                    <input
                        className="invisible-input name"
                        placeholder="Your Display Name"
                        value={profile.displayName}
                        onChange={e => updateProfile('displayName', e.target.value)}
                    />
                    <textarea
                        className="invisible-input bio"
                        placeholder="Short bio description..."
                        rows={2}
                        value={profile.bioDescription}
                        onChange={e => updateProfile('bioDescription', e.target.value)}
                    />
                </div>

                <div className="socials-config">
                    <label>Social Links</label>
                    <div className="social-input-row">
                        <span>📸</span>
                        <input placeholder="Instagram URL" value={profile.socials.instagram} onChange={e => updateSocial('instagram', e.target.value)} />
                    </div>
                    <div className="social-input-row">
                        <span>📘</span>
                        <input placeholder="Facebook URL" value={profile.socials.facebook} onChange={e => updateSocial('facebook', e.target.value)} />
                    </div>
                    <div className="social-input-row">
                        <span>🎵</span>
                        <input placeholder="TikTok URL" value={profile.socials.tiktok} onChange={e => updateSocial('tiktok', e.target.value)} />
                    </div>
                    <div className="social-input-row">
                        <span>🌐</span>
                        <input placeholder="Website URL" value={profile.socials.website} onChange={e => updateSocial('website', e.target.value)} />
                    </div>
                </div>

                <div className="bg-config">
                    <label>Background Image</label>
                    <div className="bg-preview" onClick={() => document.getElementById('bg-upload')?.click()} style={{ backgroundImage: `url(${profile.backgroundImage})` }}>
                        <span>Click to Change Background</span>
                        <input id="bg-upload" type="file" hidden onChange={e => handleImageUpload(e, 'background')} />
                    </div>
                </div>

                {links.length === 0 && (
                    <button className="btn-utility full-width mt-4" onClick={populateDefaults}>
                        ⚡ Populate Defaults
                    </button>
                )}

                <a href="/links" target="_blank" className="btn-view-live">
                    View Live Page ↗
                </a>
            </aside>

            {/* Main: Link List */}
            <main className={`bio-main ${activeMobileTab === 'profile' ? 'mobile-hidden' : ''}`}>
                <div className="main-header">
                    <h2>Your Links</h2>
                    <button className="btn-primary-compact" onClick={() => openLinkModal()}>
                        + Add Link
                    </button>
                    <button className="btn-secondary-compact ml-2" onClick={() => openLinkModal({
                        id: '',
                        title: 'Book a Session',
                        url: '#booking',
                        icon: 'Calendar',
                        isActive: true,
                        order: links.length + 1,
                        special: true
                    })}>
                        + Booking Btn
                    </button>
                </div>

                <div className="links-grid">
                    {links.length === 0 ? (
                        <div className="empty-state">No links yet. Add one!</div>
                    ) : (
                        links.map((link, idx) => (
                            <div
                                key={link.id}
                                className={`link-card ${!link.isActive ? 'inactive' : ''} ${link.special ? 'special' : ''} ${draggedIdx === idx ? 'dragging' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragEnter={(e) => handleDragEnter(e)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                            >
                                <div className="lc-drag" style={{ cursor: 'grab', fontSize: '1.5rem', opacity: 0.5 }}>
                                    ☰
                                </div>

                                <div className="lc-icon">
                                    <BioIcon name={link.icon} size={20} />
                                </div>

                                <div className="lc-content">
                                    <div className="lc-title">{link.title} {link.special && <span className="tag-special">★</span>}</div>
                                    <div className="lc-url">{link.url}</div>
                                </div>

                                <div className="lc-actions">
                                    <button onClick={() => toggleStatus(link)} title="Toggle Visibility">
                                        {link.isActive ? '👁️' : '🚫'}
                                    </button>
                                    <button onClick={() => openLinkModal(link)} title="Edit">✏️</button>
                                    <button className="danger" onClick={() => deleteLink(link.id)} title="Delete">🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Compact Modal */}
            {modalOpen && (
                <div className="overlay-backdrop" onClick={() => setModalOpen(false)}>
                    <div className="compact-modal" onClick={e => e.stopPropagation()}>
                        <h3>{currentLink ? 'Edit Link' : 'New Link'}</h3>
                        <input
                            placeholder="Title (e.g. Book Now)"
                            value={linkFormData.title}
                            onChange={e => setLinkFormData({ ...linkFormData, title: e.target.value })}
                            autoFocus
                        />
                        <input
                            placeholder="URL (https://...)"
                            value={linkFormData.url}
                            onChange={e => setLinkFormData({ ...linkFormData, url: e.target.value })}
                        />

                        <div className="form-group">
                            <label className="text-sm font-semibold mb-2 block">Choose Icon</label>
                            <div className="emoji-picker-grid">
                                {VALID_ICONS.map(iconName => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        className={`emoji-btn ${linkFormData.icon === iconName ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                                        onClick={() => setLinkFormData({ ...linkFormData, icon: iconName })}
                                        title={iconName}
                                    >
                                        <BioIcon name={iconName} size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-row mt-2">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={linkFormData.special}
                                    onChange={e => setLinkFormData({ ...linkFormData, special: e.target.checked })}
                                />
                                Highlight Custom?
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-text" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn-primary-compact" onClick={saveLink}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BioLinkManagement;
