import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/compressImage'; // Assuming this utility exists based on ContentManagement
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
    const [links, setLinks] = useState<BioLink[]>([]);
    const [profile, setProfile] = useState<BioProfile>({
        displayName: "",
        bioDescription: "",
        profileImage: "",
        backgroundImage: "",
        themeColor: "#000000",
        socials: { instagram: '', facebook: '', tiktok: '', website: '' }
    });

    // Modal & Form States
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [editingLink, setEditingLink] = useState<BioLink | null>(null);
    const [linkForm, setLinkForm] = useState({
        title: '',
        url: '',
        icon: '🔗',
        special: false
    });

    // Upload States
    const [uploading, setUploading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        // Fetch Profile
        const fetchProfile = async () => {
            const docRef = doc(db, 'siteContent', 'bioProfile');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setProfile(snap.data() as BioProfile);
            }
        };
        fetchProfile();

        // Fetch Links
        const q = query(collection(db, 'bioLinks'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BioLink)));
        });
        return () => unsubscribe();
    }, []);

    // --- Profile Handlers ---

    const handleProfileChange = (field: string, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (network: string, value: string) => {
        setProfile(prev => ({
            ...prev,
            socials: { ...prev.socials, [network]: value }
        }));
    };

    const handleSaveProfile = async () => {
        try {
            await setDoc(doc(db, 'siteContent', 'bioProfile'), profile);
            showToast('success', 'Saved', 'Bio profile updated successfully');
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'Failed to save profile');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        setUploading(true);
        try {
            const compressed = await compressImage(file);
            const storagePath = `bio/${type}_${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, compressed);
            const url = await getDownloadURL(storageRef);

            const field = type === 'profile' ? 'profileImage' : 'backgroundImage';
            handleProfileChange(field, url);

            // Auto-save to persistence
            await updateDoc(doc(db, 'siteContent', 'bioProfile'), {
                [field]: url
            });

            showToast('success', 'Uploaded', `${type === 'profile' ? 'Profile' : 'Background'} image updated`);
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // --- Link Handlers ---

    const openLinkModal = (link?: BioLink) => {
        if (link) {
            setEditingLink(link);
            setLinkForm({
                title: link.title,
                url: link.url,
                icon: link.icon || '🔗',
                special: link.special || false
            });
        } else {
            setEditingLink(null);
            setLinkForm({ title: '', url: '', icon: '🔗', special: false });
        }
        setShowLinkModal(true);
    };

    const handleSaveLink = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLink) {
                await updateDoc(doc(db, 'bioLinks', editingLink.id), {
                    title: linkForm.title,
                    url: linkForm.url,
                    icon: linkForm.icon,
                    special: linkForm.special
                });
                showToast('success', 'Updated', 'Link updated');
            } else {
                await addDoc(collection(db, 'bioLinks'), {
                    title: linkForm.title,
                    url: linkForm.url,
                    icon: linkForm.icon,
                    special: linkForm.special,
                    isActive: true,
                    order: links.length + 1,
                    createdAt: serverTimestamp()
                });
                showToast('success', 'Created', 'New link added');
            }
            setShowLinkModal(false);
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'Failed to save link');
        }
    };

    const toggleLinkStatus = async (link: BioLink) => {
        try {
            await updateDoc(doc(db, 'bioLinks', link.id), {
                isActive: !link.isActive
            });
        } catch (error) {
            showToast('error', 'Error', 'Failed to update status');
        }
    };

    const deleteLink = async (id: string) => {
        if (!confirm('Delete this link permanently?')) return;
        try {
            await deleteDoc(doc(db, 'bioLinks', id));
            showToast('success', 'Deleted', 'Link removed');
        } catch (error) {
            showToast('error', 'Error', 'Failed to delete');
        }
    };

    const moveLink = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === links.length - 1) return;

        const newLinks = [...links];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newLinks[index];
        newLinks[index] = newLinks[targetIndex];
        newLinks[targetIndex] = temp;

        // Optimistic UI update
        setLinks(newLinks);

        // Update orders in DB
        // We only strictly need to update the two affected docs
        try {
            const batchPromises = newLinks.map((link, idx) =>
                updateDoc(doc(db, 'bioLinks', link.id), { order: idx + 1 })
            );
            await Promise.all(batchPromises);
        } catch (err) {
            console.error("Order update failed", err);
            // Revert handled by real-time listener eventually
        }

    };

    const populateDefaults = async () => {
        setUploading(true);
        try {
            // 1. Populate Links
            const defaults = [
                { title: '📅 Book a Session', url: '/', icon: '📅', order: 1, isActive: true, special: true },
                { title: '✨ Our Services', url: '/services', icon: '✨', order: 2, isActive: true, special: false },
                { title: '📸 View Gallery', url: '/gallery', icon: '📸', order: 3, isActive: true, special: false },
                { title: '❓ FAQ', url: '/faq', icon: '❓', order: 4, isActive: true, special: false }
            ];

            const batchPromises = defaults.map(l =>
                addDoc(collection(db, 'bioLinks'), {
                    ...l,
                    createdAt: serverTimestamp()
                })
            );
            await Promise.all(batchPromises);

            // 2. Populate Socials (from Footer defaults)
            const defaultSocials = {
                instagram: "https://www.instagram.com/its_our_studio/",
                facebook: "https://www.facebook.com/itsouRstudioo/",
                tiktok: "https://www.tiktok.com/@itsourstudio",
                website: window.location.origin // Dynamic Website Link
            };

            await setDoc(doc(db, 'siteContent', 'bioProfile'), {
                ...profile,
                socials: defaultSocials
            }, { merge: true });

            // Optimistic Update
            setProfile(prev => ({
                ...prev,
                socials: { ...prev.socials, ...defaultSocials }
            }));

            showToast('success', 'Populated', 'Default links and socials added');
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'Failed to populate defaults');
        } finally {
            setUploading(false);
        }
    };

    const commonEmojis = ['🔗', '📸', '📅', '💬', '⭐', '📍', '✉️', '🎵', '🎥', '🛒', '💸', '🙋‍♂️', '🏠', '❓', '✨', '🔥'];

    return (
        <div className="bio-management">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Link in Bio Manager</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {links.length === 0 && (
                        <button className="btn btn-outline" onClick={populateDefaults} disabled={uploading}>
                            ⚡ Populate Defaults
                        </button>
                    )}
                    <a href="/links" target="_blank" className="btn btn-outline">
                        View Verified Page ↗
                    </a>
                </div>
            </div>

            <div className="bio-section">
                <h3>Profile Appearance</h3>
                <div className="profile-form-grid">
                    <div>
                        <div className="form-group margin-bottom-1">
                            <label className="form-label">Display Name</label>
                            <input
                                className="form-input"
                                value={profile.displayName}
                                onChange={e => handleProfileChange('displayName', e.target.value)}
                            />
                        </div>
                        <div className="form-group margin-bottom-1">
                            <label className="form-label">Bio Description</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={profile.bioDescription}
                                onChange={e => handleProfileChange('bioDescription', e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary margin-top-1" onClick={handleSaveProfile} disabled={uploading}>
                            Save Profile Info
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <label className="form-label mb-2">Profile Picture</label>
                            <div className="img-preview-box" onClick={() => document.getElementById('profile-upload')?.click()}>
                                {profile.profileImage ? (
                                    <img src={profile.profileImage} alt="Profile" />
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>👤</span>
                                )}
                            </div>
                            <input
                                id="profile-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => handleImageUpload(e, 'profile')}
                            />
                            {uploading && <small>Uploading...</small>}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <label className="form-label mb-2">Background</label>
                            <div className="img-preview-box" onClick={() => document.getElementById('bg-upload')?.click()}>
                                {profile.backgroundImage ? (
                                    <img src={profile.backgroundImage} alt="Background" />
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>🖼️</span>
                                )}
                            </div>
                            <input
                                id="bg-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => handleImageUpload(e, 'background')}
                            />
                        </div>
                    </div>
                </div>

                <div className="margin-top-2">
                    <label className="form-label">Social Handles (URLs)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <input className="form-input" placeholder="Instagram URL" value={profile.socials?.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} />
                        <input className="form-input" placeholder="Facebook URL" value={profile.socials?.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} />
                        <input className="form-input" placeholder="TikTok URL" value={profile.socials?.tiktok || ''} onChange={e => handleSocialChange('tiktok', e.target.value)} />
                        <input className="form-input" placeholder="Website URL" value={profile.socials?.website || ''} onChange={e => handleSocialChange('website', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="bio-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Active Links</h3>
                    <button className="btn btn-primary" onClick={() => openLinkModal()}>
                        + Add New Link
                    </button>
                </div>

                <div className="link-list">
                    {links.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>No links yet. Add one!</p>}

                    {links.map((link, index) => (
                        <div key={link.id} className={`link-item-row ${!link.isActive ? 'inactive' : ''}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button className="btn-icon small" disabled={index === 0} onClick={() => moveLink(index, 'up')}>▲</button>
                                <button className="btn-icon small" disabled={index === links.length - 1} onClick={() => moveLink(index, 'down')}>▼</button>
                            </div>

                            <div className="link-icon-display">
                                {link.icon}
                            </div>

                            <div className="link-info">
                                <div className="link-title">
                                    {link.title} {link.special && <span className="badge badge-warning" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>Special</span>}
                                </div>
                                <div className="link-url">{link.url}</div>
                            </div>

                            <div className="link-actions">
                                <button className="btn-icon" onClick={() => toggleLinkStatus(link)} title={link.isActive ? "Hide" : "Show"}>
                                    {link.isActive ? '👁️' : '🚫'}
                                </button>
                                <button className="btn-icon" onClick={() => openLinkModal(link)} title="Edit">
                                    ✏️
                                </button>
                                <button className="btn-icon delete" onClick={() => deleteLink(link.id)} title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showLinkModal && (
                <div className="modal-overlay active" onClick={() => setShowLinkModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingLink ? 'Edit Link' : 'Add New Link'}</h3>
                            <button className="modal-close" onClick={() => setShowLinkModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveLink}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Button Title</label>
                                    <input
                                        className="form-input"
                                        required
                                        value={linkForm.title}
                                        onChange={e => setLinkForm({ ...linkForm, title: e.target.value })}
                                        placeholder="e.g. Book Now"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Destination URL</label>
                                    <input
                                        className="form-input"
                                        required
                                        type="url"
                                        value={linkForm.url}
                                        onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Icon (Emoji)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            className="form-input"
                                            style={{ width: '60px', textAlign: 'center' }}
                                            value={linkForm.icon}
                                            onChange={e => setLinkForm({ ...linkForm, icon: e.target.value })}
                                        />
                                        <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#666' }}>Type or pick one:</span>
                                    </div>
                                    <div className="emoji-picker-grid">
                                        {commonEmojis.map(emoji => (
                                            <button
                                                type="button"
                                                key={emoji}
                                                className="emoji-btn"
                                                onClick={() => setLinkForm({ ...linkForm, icon: emoji })}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={linkForm.special}
                                            onChange={e => setLinkForm({ ...linkForm, special: e.target.checked })}
                                        />
                                        <span>Highlight this link (Special Style)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowLinkModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Link</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BioLinkManagement;
