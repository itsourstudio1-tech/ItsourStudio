import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import './Admin.css';
import './AdminAnalytics.css';

interface Booking {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    package: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'completed';
    totalPrice: number;
    paymentProofUrl?: string;
    createdAt?: any;
    notes?: string;
    [key: string]: any; // Allow indexing
}

interface Feedback {
    id: string;
    name: string;
    rating: number;
    message: string;
    showInTestimonials: boolean;
    createdAt?: any;
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

interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    status: 'active' | 'inactive';
    password?: string; // stored for simple auth, TODO: use Firebase Auth
    createdAt?: any;
    lastLogin?: any;
}

interface GalleryData {
    id: string;
    src: string;
    category: 'solo' | 'duo' | 'group';
    alt: string;
    createdAt: any;
}

interface Toast {
    id: number;
    type: 'success' | 'error';
    title: string;
    message: string;
}

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
    // Data States
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        revenue: 0
    });

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

    const [activeTab, setActiveTab] = useState<'bookings' | 'feedbacks' | 'content' | 'users' | 'gallery' | 'calendar' | 'analytics'>('analytics');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [unavailableDates, setUnavailableDates] = useState<Record<string, string>>({}); // date -> reason map
    const [calendarModal, setCalendarModal] = useState<{
        show: boolean;
        date: string | null;
        type: 'block' | 'unblock' | null;
        dayBookings: Booking[];
    }>({ show: false, date: null, type: null, dayBookings: [] });
    const [blockReason, setBlockReason] = useState('');

    // Analytics Calculations
    const analyticsData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                key: d.toLocaleString('default', { month: 'short' }),
                month: d.getMonth(),
                year: d.getFullYear(),
                bookings: 0,
                revenue: 0
            };
        }).reverse();

        bookings.forEach(booking => {
            const date = new Date(booking.date);
            if (isNaN(date.getTime())) return;

            const monthData = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
            if (monthData) {
                monthData.bookings++;
                if (booking.status === 'confirmed' || booking.status === 'completed') {
                    monthData.revenue += (booking.totalPrice || 0);
                }
            }
        });

        return last6Months;
    }, [bookings]);

    // Fetch Unavailable Dates
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'unavailableDates'), (snapshot) => {
            const dates: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                dates[data.date] = data.reason;
            });
            setUnavailableDates(dates);
        });
        return () => unsubscribe();
    }, []);

    const maxRevenue = Math.max(...analyticsData.map(d => d.revenue), 1000);
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'viewer',
        status: 'active'
    });

    // Gallery States
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryFile, setGalleryFile] = useState<File | null>(null);
    const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
    const [galleryForm, setGalleryForm] = useState({
        category: 'solo',
        alt: ''
    });

    // Calendar State
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [toasts, setToasts] = useState<Toast[]>([]);

    // Filter/Sort/Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    // Toast Helper
    const showToast = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    // remove toast manually
    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Fetch Bookings Real-time
    useEffect(() => {
        const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Booking[];

            setBookings(bookingsData);

            // Calculate Stats
            const newStats = bookingsData.reduce((acc, curr) => {
                acc.total++;
                if (curr.status === 'pending') acc.pending++;
                if (curr.status === 'confirmed') {
                    acc.confirmed++;
                    acc.revenue += curr.totalPrice || 0;
                }
                return acc;
            }, { total: 0, pending: 0, confirmed: 0, revenue: 0 });

            setStats(newStats);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            showToast('error', 'Error', 'Failed to fetch bookings data');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Feedbacks Real-time
    useEffect(() => {
        const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Feedback[];
            setFeedbacks(feedbacksData);
        }, (error) => {
            console.error("Error fetching feedbacks:", error);
            showToast('error', 'Error', 'Failed to fetch feedback data');
        });

        return () => unsubscribe();
    }, []);

    // Fetch Users Real-time
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
            showToast('error', 'Error', 'Failed to fetch users');
        });

        return () => unsubscribe();
    }, []);



    // Fetch Gallery Items Real-time
    useEffect(() => {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const galleryData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GalleryData[];
            setGalleryItems(galleryData);
        }, (error) => {
            console.error("Error fetching gallery:", error);
            showToast('error', 'Error', 'Failed to fetch gallery items');
        });

        return () => unsubscribe();
    }, []);

    // Fetch Site Content
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const aboutDoc = await getDoc(doc(db, 'siteContent', 'about'));
                const footerDoc = await getDoc(doc(db, 'siteContent', 'footer'));

                if (aboutDoc.exists()) {
                    setContent(prev => ({ ...prev, about: aboutDoc.data() as any }));
                }
                if (footerDoc.exists()) {
                    setContent(prev => ({ ...prev, footer: footerDoc.data() as any }));
                }

                const promoDoc = await getDoc(doc(db, 'siteContent', 'promoBanner'));
                if (promoDoc.exists()) {
                    setContent(prev => ({ ...prev, promoBanner: promoDoc.data() as any }));
                }

                const seasonalDoc = await getDoc(doc(db, 'siteContent', 'seasonalPromo'));
                if (seasonalDoc.exists()) {
                    setContent(prev => ({ ...prev, seasonalPromo: seasonalDoc.data() as any }));
                }
            } catch (err) {
                console.log("No content found, using defaults");
            }
        };
        fetchContent();
    }, []);

    // Safety Patch: Ensure seasonalPromo exists in state (for HMR/updates)
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

    const processedBookings = bookings.filter(booking => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = booking.fullName.toLowerCase().includes(term) ||
            booking.email.toLowerCase().includes(term) ||
            booking.id.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const totalPages = Math.ceil(processedBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = processedBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sendEmailNotification = async (booking: Booking, status: string, reason?: string) => {
        const emailType = status === 'confirmed' ? 'confirmed' : status === 'rejected' ? 'rejected' : null;

        if (!emailType) return;

        try {
            await fetch('http://localhost:3001/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: emailType,
                    booking: {
                        name: booking.fullName,
                        email: booking.email,
                        package: booking.package,
                        date: booking.date,
                        time_start: booking.time,
                        reason: reason || 'Scheduling conflict'
                    }
                })
            });
            console.log(`Email sent for status: ${status}`);
            showToast('success', 'Email Sent', `Notification sent to ${booking.email}`);
        } catch (error) {
            console.error("Failed to send email notification", error);
            showToast('error', 'Email Failed', 'Status updated but failed to send email.');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        let reason = '';
        if (newStatus === 'rejected') {
            const result = prompt("Please enter a reason for rejection:", "Bookings are full");
            if (result === null) return; // Cancelled
            reason = result;
        }

        try {
            const bookingRef = doc(db, 'bookings', id);
            await updateDoc(bookingRef, {
                status: newStatus,
                rejectionReason: reason || null
            });

            showToast('success', 'Status Updated', `Booking marked as ${newStatus}`);

            // Find the booking object to send email
            const booking = bookings.find(b => b.id === id);
            if (booking && (newStatus === 'confirmed' || newStatus === 'rejected')) {
                await sendEmailNotification(booking, newStatus, reason);
            }

        } catch (error) {
            console.error("Error updating status:", error);
            showToast('error', 'Update Failed', 'Failed to update booking status');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'bookings', id));
                showToast('success', 'Deleted', 'Booking deleted successfully');
            } catch (error) {
                console.error("Error deleting booking:", error);
                showToast('error', 'Delete Failed', 'Failed to delete booking');
            }
        }
    };

    const handleToggleFeedback = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'feedbacks', id), {
                showInTestimonials: !currentStatus
            });
            showToast('success', 'Updated', `Feedback ${!currentStatus ? 'published' : 'hidden'}`);
        } catch (error) {
            console.error("Error updating feedback:", error);
            showToast('error', 'Error', 'Failed to update feedback status');
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        if (window.confirm("Delete this feedback?")) {
            try {
                await deleteDoc(doc(db, 'feedbacks', id));
                showToast('success', 'Deleted', 'Feedback deleted successfully');
            } catch (error) {
                console.error("Error deleting feedback:", error);
                showToast('error', 'Error', 'Failed to delete feedback');
            }
        }
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

    const handleContentChange = (section: 'about' | 'footer' | 'promoBanner' | 'seasonalPromo', field: string, value: any) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // User Management Functions
    const resetUserForm = () => {
        setUserForm({
            fullName: '',
            email: '',
            password: '',
            role: 'viewer',
            status: 'active'
        });
        setEditingUser(null);
        setShowUserModal(false);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({
            fullName: user.fullName,
            email: user.email,
            password: user.password || '',
            role: user.role, // @ts-ignore
            status: user.status
        });
        setShowUserModal(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const userRef = doc(db, 'users', editingUser.id);
                await updateDoc(userRef, {
                    ...userForm,
                    updatedAt: serverTimestamp()
                });
                showToast('success', 'Updated', 'User updated successfully');
            } else {
                await addDoc(collection(db, 'users'), {
                    ...userForm,
                    createdAt: serverTimestamp()
                });
                showToast('success', 'Created', 'User created successfully');
            }
            resetUserForm();
        } catch (error) {
            console.error("Error saving user:", error);
            showToast('error', 'Error', 'Failed to save user');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteDoc(doc(db, 'users', id));
                showToast('success', 'Deleted', 'User deleted successfully');
            } catch (error) {
                console.error("Error deleting user:", error);
                showToast('error', 'Error', 'Failed to delete user');
            }
        }
    };

    // Gallery Functions
    const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 15 * 1024 * 1024) {
                showToast('error', 'File too large', 'Limit is 15MB');
                return;
            }
            setGalleryFile(file);
            const url = URL.createObjectURL(file);
            setGalleryPreview(url);
        }
    };

    const handleSaveGalleryItem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!galleryFile) {
            showToast('error', 'Missing Image', 'Please upload an image first');
            return;
        }

        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('galleryImage', galleryFile);

            const response = await fetch('http://localhost:3001/upload/gallery', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const imageUrl = data.path;

            // 2. Save to Firestore
            await addDoc(collection(db, 'gallery'), {
                src: imageUrl,
                category: galleryForm.category,
                alt: galleryForm.alt,
                createdAt: serverTimestamp()
            });

            showToast('success', 'Uploaded', 'Image added to gallery');

            // Reset
            setGalleryFile(null);
            setGalleryPreview(null);
            setGalleryForm({ category: 'solo', alt: '' });
            setShowGalleryModal(false);

        } catch (error) {
            console.error("Error upload to gallery:", error);
            showToast('error', 'Error', 'Failed to upload image');
        }
    };

    const handleDeleteGalleryItem = async (id: string) => {
        // ideally we should also delete the file from disk using an API, but for now we just remove from DB
        if (window.confirm("Delete this image from gallery?")) {
            try {
                await deleteDoc(doc(db, 'gallery', id));
                showToast('success', 'Deleted', 'Image removed from gallery');
            } catch (error) {
                console.error("Error deleting gallery item:", error);
                showToast('error', 'Error', 'Failed to delete image');
            }
        }
    };

    const handlePrevMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDayClick = (day: number) => {
        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dateDay = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dateDay}`;

        // Get bookings for this day
        const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'rejected');

        if (unavailableDates[dateString]) {
            // Already unavailable -> Open Unblock Modal
            setCalendarModal({ show: true, date: dateString, type: 'unblock', dayBookings });
        } else {
            // Available -> Open Block Modal (with booking info)
            setBlockReason('');
            setCalendarModal({ show: true, date: dateString, type: 'block', dayBookings });
        }
    };

    const handleSaveCalendarAction = async () => {
        if (!calendarModal.date || !calendarModal.type) return;

        try {
            if (calendarModal.type === 'unblock') {
                const q = query(collection(db, 'unavailableDates'), where('date', '==', calendarModal.date));
                const snapshot = await getDocs(q);
                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                showToast('success', 'Date Updated', 'Date is now available for booking');
            } else {
                if (!blockReason.trim()) {
                    showToast('error', 'Validation', 'Please enter a reason');
                    return;
                }
                await addDoc(collection(db, 'unavailableDates'), {
                    date: calendarModal.date,
                    reason: blockReason,
                    createdAt: serverTimestamp()
                });
                showToast('success', 'Date Blocked', 'Date marked as unavailable');
            }
            setCalendarModal({ show: false, date: null, type: null, dayBookings: [] });
        } catch (err) {
            console.error("Error updating calendar:", err);
            showToast('error', 'Error', 'Failed to update calendar');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h1 className="sidebar-brand" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: 0 }}>ItsourStudio.</h1>
                    <p className="sidebar-role" style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginTop: '0.25rem', letterSpacing: '1px' }}>ADMIN WORKSPACE</p>
                </div>
                <nav className="sidebar-nav">
                    <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span className="nav-label">Bookings</span>
                    </button>
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            <span className="nav-label">Analytics</span>
                        </button>
                    )}
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span className="nav-label">Calendar</span>
                        </button>
                    )}
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span className="nav-label">Users</span>
                        </button>
                    )}
                    <button className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span className="nav-label">Gallery</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => setActiveTab('feedbacks')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span className="nav-label">Feedbacks</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span className="nav-label">Content</span>
                    </button>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                    <button className="nav-item logout-btn" onClick={() => {
                        if (window.confirm('Are you sure you want to logout?')) {
                            sessionStorage.clear();
                            localStorage.clear();
                            window.location.href = '/#/admin/login';
                        }
                    }} style={{ color: '#ef4444', width: '100%' }}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage bookings, gallery, and site content</p>
                    </div>
                </header>

                {activeTab === 'analytics' && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <div className="stat-info">
                                    <h4>Total Bookings</h4>
                                    <div className="stat-value">{stats.total}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </div>
                                <div className="stat-info">
                                    <h4>Pending Requests</h4>
                                    <div className="stat-value">{stats.pending}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <div className="stat-info">
                                    <h4>Confirmed Sessions</h4>
                                    <div className="stat-value">{stats.confirmed}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                </div>
                                <div className="stat-info">
                                    <h4>Total Est. Revenue</h4>
                                    <div className="stat-value">₱{stats.revenue.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Trend Chart */}
                        <div className="analytics-card" style={{ marginBottom: '2rem' }}>
                            <div className="analytics-header">
                                <span className="analytics-title">Revenue Trend (Last 6 Months)</span>
                            </div>
                            <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '2rem', padding: '2rem 1rem 0' }}>
                                {analyticsData.map((data) => (
                                    <div key={data.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '100%',
                                            background: '#e0f2fe',
                                            borderRadius: '4px 4px 0 0',
                                            height: `${(data.revenue / maxRevenue) * 100}%`,
                                            position: 'relative',
                                            transition: 'height 0.5s ease',
                                            minHeight: '4px'
                                        }}>
                                            {data.revenue > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-25px',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#0ea5e9',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    ₱{(data.revenue / 1000).toFixed(1)}k
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{data.key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="analytics-grid">
                            <div className="analytics-card">
                                <div className="analytics-header">
                                    <span className="analytics-title">Booking Status Distribution</span>
                                </div>
                                {['pending', 'confirmed', 'rejected'].map(status => {
                                    const count = bookings.filter(b => b.status === status).length;
                                    const percentage = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                                    const color = status === 'confirmed' ? '#10b981' :
                                        status === 'pending' ? '#f59e0b' :
                                            status === 'rejected' ? '#ef4444' : '#3b82f6';
                                    return (
                                        <div className="progress-item" key={status}>
                                            <div className="progress-label">
                                                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                                <span>{count} ({percentage}%)</span>
                                            </div>
                                            <div className="progress-track">
                                                <div className="progress-fill" style={{ width: `${percentage}%`, background: color }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="analytics-card">
                                <div className="analytics-header">
                                    <span className="analytics-title">Popular Packages</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {Object.entries(bookings.reduce((acc, curr) => {
                                        const pkgName = curr.package || 'Unknown';
                                        acc[pkgName] = (acc[pkgName] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>))
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 4)
                                        .map(([pkg, count], index) => (
                                            <div className="package-item" key={pkg}>
                                                <div className="package-rank">{index + 1}</div>
                                                <div className="package-info">
                                                    <span className="package-name">{pkg}</span>
                                                    <span className="package-count">{count} bookings</span>
                                                </div>
                                                <div className="package-trend">
                                                    {bookings.length > 0 && Math.round((count / bookings.length) * 100)}%
                                                </div>
                                            </div>
                                        ))}
                                    {bookings.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', margin: '1rem' }}>No data available</p>}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'calendar' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>Calendar Management</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Click a date to block/unblock it for bookings.</p>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div className="custom-calendar-admin" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <button className="btn btn-outline" onClick={handlePrevMonth} style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-dark)' }}>
                                        {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button className="btn btn-outline" onClick={handleNextMonth} style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                                <div className="calendar-grid-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', padding: '0.5rem', color: '#64748b' }}>{d}</div>
                                    ))}
                                    {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                                        <div key={`empty-${i}`} style={{ padding: '1rem', background: '#f8fafc' }}></div>
                                    ))}
                                    {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                                        const day = i + 1;
                                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isUnavailable = !!unavailableDates[dateString];
                                        const isPast = date < new Date() && date.getDate() !== new Date().getDate();

                                        const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'rejected');

                                        return (
                                            <div
                                                key={day}
                                                onClick={() => handleDayClick(day)}
                                                style={{
                                                    minHeight: '100px', // Increased height to fit bookings
                                                    padding: '0.5rem',
                                                    background: isUnavailable ? '#fee2e2' : (isPast ? '#f8fafc' : '#ffffff'), // Different bg for past
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    opacity: isPast ? 0.8 : 1,
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    gap: '0.25rem'
                                                }}
                                                className={`calendar-day-admin ${isUnavailable ? 'unavailable' : ''}`}
                                            >
                                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '600' }}>{day}</span>
                                                    {dayBookings.length > 0 && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            background: '#e0f2fe',
                                                            color: '#0369a1',
                                                            padding: '2px 6px',
                                                            borderRadius: '99px',
                                                            fontWeight: '700'
                                                        }}>
                                                            {dayBookings.length}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Unavailable Badge */}
                                                {isUnavailable && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        color: '#b91c1c',
                                                        background: 'rgba(255,255,255,0.6)',
                                                        padding: '2px 4px',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '100%'
                                                    }}>
                                                        {unavailableDates[dateString]}
                                                    </span>
                                                )}

                                                {/* Booking Previews (dots/lines) */}
                                                {dayBookings.slice(0, 3).map((bk) => (
                                                    <div key={bk.id} style={{
                                                        width: '100%',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 4px',
                                                        borderRadius: '3px',
                                                        background: bk.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                                                        color: bk.status === 'confirmed' ? '#166534' : '#b45309',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {bk.time}
                                                    </div>
                                                ))}
                                                {dayBookings.length > 3 && (
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', paddingLeft: '4px' }}>
                                                        + {dayBookings.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <>
                        {/* Stats Cards */}


                        {/* Bookings Table */}
                        <div className="bookings-section">
                            <div className="bookings-header">
                                <h3>Recent Bookings</h3>
                            </div>

                            {/* Toolbar: Search and Filter */}
                            <div className="dashboard-controls" style={{ padding: '0 2rem', marginTop: '1.5rem' }}>
                                <div className="search-wrapper">
                                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    <input
                                        type="text"
                                        placeholder="Search by name, email..."
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <select
                                        className="filter-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bookings-table-container">
                                <table className="bookings-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('fullName')} className={`sort-header ${sortConfig.key === 'fullName' ? 'active' : ''}`}>
                                                Client
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'fullName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </span>
                                            </th>
                                            <th onClick={() => handleSort('date')} className={`sort-header ${sortConfig.key === 'date' ? 'active' : ''}`}>
                                                Date & Time
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </span>
                                            </th>
                                            <th onClick={() => handleSort('package')} className={`sort-header ${sortConfig.key === 'package' ? 'active' : ''}`}>
                                                Package
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'package' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </span>
                                            </th>
                                            <th onClick={() => handleSort('status')} className={`sort-header ${sortConfig.key === 'status' ? 'active' : ''}`}>
                                                Status
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </span>
                                            </th>
                                            <th onClick={() => handleSort('totalPrice')} className={`sort-header ${sortConfig.key === 'totalPrice' ? 'active' : ''}`}>
                                                Total
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'totalPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </span>
                                            </th>
                                            <th>Payment</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBookings.map((booking) => (
                                            <tr key={booking.id}>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{booking.fullName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.email}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.phone}</div>
                                                </td>
                                                <td>
                                                    <div>{booking.date}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.time}</div>
                                                </td>
                                                <td>{booking.package}</td>
                                                <td>
                                                    <select
                                                        value={booking.status}
                                                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                        className={`status-badge status-${booking.status}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td>₱{booking.totalPrice?.toLocaleString()}</td>
                                                <td>
                                                    {booking.paymentProofUrl ? (
                                                        <button
                                                            className="proof-link"
                                                            onClick={() => setSelectedImage(booking.paymentProofUrl || null)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                            View Proof
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No proof uploaded</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="action-btn"
                                                        title="Delete Booking"
                                                        onClick={() => handleDelete(booking.id)}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {processedBookings.length === 0 && (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                                    {searchTerm || statusFilter !== 'all' ? 'No bookings match filters' : 'No bookings found.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {processedBookings.length > 0 && (
                                <div className="pagination-controls">
                                    <div className="page-info">
                                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, processedBookings.length)} of {processedBookings.length} entries
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                            Previous
                                        </button>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'feedbacks' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>Customer Feedbacks</h3>
                        </div>
                        <div className="bookings-table-container">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Rating</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbacks.map((feedback) => (
                                        <tr key={feedback.id}>
                                            <td>{feedback.createdAt?.toDate ? feedback.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                            <td style={{ fontWeight: 500 }}>{feedback.name}</td>
                                            <td style={{ color: '#FFD700' }}>{'★'.repeat(feedback.rating)}</td>
                                            <td style={{ maxWidth: '300px' }}>{feedback.message}</td>
                                            <td>
                                                <button
                                                    className={`btn ${feedback.showInTestimonials ? 'btn-primary' : 'btn-outline'}`}
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                                    onClick={() => handleToggleFeedback(feedback.id, feedback.showInTestimonials)}
                                                >
                                                    {feedback.showInTestimonials ? 'Published' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    onClick={() => handleDeleteFeedback(feedback.id)}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {feedbacks.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                                No feedbacks found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>Content Management</h3>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            {/* Promo Banner Edit */}
                            <div className="content-group" style={{ marginBottom: '3rem' }}>
                                <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Promotional Banner</h4>
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={content.promoBanner.isVisible}
                                                onChange={(e) => handleContentChange('promoBanner', 'isVisible', e.target.checked)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                        <span style={{ fontWeight: 500 }}>
                                            {content.promoBanner.isVisible ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="form-label">Banner Text</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Holiday Special! Get 20% OFF"
                                                value={content.promoBanner.text}
                                                onChange={(e) => handleContentChange('promoBanner', 'text', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Promo Code (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. HOLIDAY20"
                                                value={content.promoBanner.promoCode}
                                                onChange={(e) => handleContentChange('promoBanner', 'promoCode', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: 'fit-content' }}
                                        onClick={() => handleSaveContent('promoBanner')}
                                    >
                                        Save Banner Settings
                                    </button>
                                </div>
                            </div>

                            {/* Seasonal Promo Edit */}
                            <div className="content-group" style={{ marginBottom: '3rem' }}>
                                <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Seasonal / Limited Time Section</h4>
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={content.seasonalPromo.isActive}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'isActive', e.target.checked)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                        <span style={{ fontWeight: 500 }}>
                                            {content.seasonalPromo.isActive ? 'Section Visible' : 'Section Hidden'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="form-label">Title</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={content.seasonalPromo.title}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Tag (Badge)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={content.seasonalPromo.tag}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'tag', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
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
                                            <label className="form-label">Original Price (Strike-through)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={content.seasonalPromo.originalPrice}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'originalPrice', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Image URL</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={content.seasonalPromo.imageUrl}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'imageUrl', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Features (Comma separated)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={content.seasonalPromo.features.join(', ')}
                                                onChange={(e) => handleContentChange('seasonalPromo', 'features', e.target.value.split(',').map(s => s.trim()))}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: 'fit-content' }}
                                        onClick={() => handleSaveContent('seasonalPromo')}
                                    >
                                        Save Seasonal Section
                                    </button>
                                </div>
                            </div>

                            {/* About Section Edit */}
                            <div className="content-group" style={{ marginBottom: '3rem' }}>
                                <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>About Section</h4>
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div>
                                        <label className="form-label">Section Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.about.title}
                                            onChange={(e) => handleContentChange('about', 'title', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Image URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={content.about.imageUrl}
                                            onChange={(e) => handleContentChange('about', 'imageUrl', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Description Paragraph 1</label>
                                        <textarea
                                            className="form-input"
                                            rows={4}
                                            value={content.about.description1}
                                            onChange={(e) => handleContentChange('about', 'description1', e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="form-label">Description Paragraph 2</label>
                                        <textarea
                                            className="form-input"
                                            rows={4}
                                            value={content.about.description2}
                                            onChange={(e) => handleContentChange('about', 'description2', e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: 'fit-content' }}
                                        onClick={() => handleSaveContent('about')}
                                    >
                                        Save About Section
                                    </button>
                                </div>
                            </div>

                            {/* Footer Section Edit */}
                            <div className="content-group">
                                <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Footer Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
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
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: '1.5rem' }}
                                    onClick={() => handleSaveContent('footer')}
                                >
                                    Save Footer Info
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>User Management (RBMS)</h3>
                            <button className="btn btn-primary" onClick={() => {
                                resetUserForm();
                                setShowUserModal(true);
                            }}>
                                + Add User
                            </button>
                        </div>
                        <div className="bookings-table-container">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td style={{ fontWeight: 500 }}>{user.fullName}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`status-badge role-${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: user.status === 'active' ? '#2e7d32' : '#c62828',
                                                    background: user.status === 'active' ? '#e8f5e9' : '#ffebee',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    {user.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td> {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="action-btn"
                                                        title="Edit User"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        title="Delete User"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {activeTab === 'gallery' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>Gallery Manager</h3>
                            <button className="btn btn-primary" onClick={() => setShowGalleryModal(true)}>
                                + Add Photo
                            </button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {galleryItems.map((item) => (
                                    <div key={item.id} style={{
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: '#fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ aspectRatio: '3/4', position: 'relative' }}>
                                            <img
                                                src={item.src}
                                                alt={item.alt}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '0.5rem',
                                                right: '0.5rem',
                                                background: 'rgba(255,255,255,0.9)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {item.category}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                {item.alt || 'No Title'}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteGalleryItem(item.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#c62828',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                                title="Delete Image"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {galleryItems.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                                        No images in gallery yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}



                {/* Gallery Upload Modal */}
                <div className={`admin-modal-overlay ${showGalleryModal ? 'active' : ''}`} onClick={() => setShowGalleryModal(false)}>
                    <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Upload to Gallery</h3>
                            <button className="btn-close" onClick={() => setShowGalleryModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveGalleryItem}>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{
                                    border: '2px dashed #ddd',
                                    borderRadius: '8px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: '#fafafa'
                                }} onClick={() => document.getElementById('gallery-upload')?.click()}>
                                    {galleryPreview ? (
                                        <img src={galleryPreview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }} />
                                    ) : (
                                        <div>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            <p style={{ marginTop: '0.5rem', color: '#666' }}>Click to upload image (Max 15MB)</p>
                                        </div>
                                    )}
                                    <input
                                        id="gallery-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleGalleryFileChange}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-input"
                                        value={galleryForm.category}
                                        onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                                    >
                                        <option value="solo">Solo</option>
                                        <option value="duo">Duo</option>
                                        <option value="group">Group</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Title / Caption</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Summer Photoshoot"
                                        value={galleryForm.alt}
                                        onChange={e => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    Upload and Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* User Modal */}
                <div className={`admin-modal-overlay ${showUserModal ? 'active' : ''}`} onClick={resetUserForm}>
                    <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <button className="btn-close" onClick={resetUserForm}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveUser}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        value={userForm.fullName}
                                        onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        value={userForm.email}
                                        onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Password</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder={editingUser ? "Leave same or enter new" : "Enter password"}
                                        value={userForm.password}
                                        onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="form-label">Role</label>
                                        <select
                                            className="form-input"
                                            value={userForm.role}
                                            onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input"
                                            value={userForm.status}
                                            onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Image Preview Modal */}
                <div className={`image-modal-overlay ${selectedImage ? 'active' : ''}`} onClick={() => setSelectedImage(null)}>
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setSelectedImage(null)}>&times;</button>
                        {selectedImage && <img src={selectedImage} alt="Payment Proof" />}
                    </div>
                </div>

                {/* Calendar Action Modal */}
                <div className={`admin-modal-overlay ${calendarModal.show ? 'active' : ''}`} onClick={() => setCalendarModal({ ...calendarModal, show: false })}>
                    <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {new Date(calendarModal.date || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <button className="btn-close" onClick={() => setCalendarModal({ ...calendarModal, show: false })}>&times;</button>
                        </div>

                        <div style={{ marginBottom: '1.5rem', maxHeight: '40vh', overflowY: 'auto' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Scheduled Sessions</h4>
                            {calendarModal.dayBookings.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {calendarModal.dayBookings.map(booking => (
                                        <div key={booking.id} style={{
                                            padding: '1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            borderLeft: `4px solid ${booking.status === 'confirmed' ? '#2e7d32' : '#f59e0b'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#333' }}>{booking.time} - {booking.fullName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{booking.package}</div>
                                            </div>
                                            <span className={`status-badge status-${booking.status}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                    No scheduled sessions for this day.
                                </p>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: calendarModal.type === 'block' ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                                {calendarModal.type === 'block' ? 'Block Availability' : 'Restore Availability'}
                            </h4>

                            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                {calendarModal.type === 'block'
                                    ? `Mark this date as unavailable for new bookings.`
                                    : `Remove the administrative block (${unavailableDates[calendarModal.date || '']}) and allow bookings.`
                                }
                            </p>

                            {calendarModal.type === 'block' && (
                                <div>
                                    <label className="form-label">Reason for blocking</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Maintenance, Personal Holiday"
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setCalendarModal({ ...calendarModal, show: false })}>Close</button>
                            <button
                                className={`btn ${calendarModal.type === 'block' ? 'btn-primary' : 'btn-primary'}`}
                                onClick={handleSaveCalendarAction}
                                style={{
                                    backgroundColor: calendarModal.type === 'block' ? '#ef4444' : '#10b981',
                                    borderColor: calendarModal.type === 'block' ? '#ef4444' : '#10b981'
                                }}
                            >
                                {calendarModal.type === 'block' ? 'Confirm Block' : 'Confirm Unblock'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toast Notifications */}
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => removeToast(toast.id)}>
                            <div className="toast-icon">
                                {toast.type === 'success' ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                )}
                            </div>
                            <div className="toast-content">
                                <span className="toast-title">{toast.title}</span>
                                <span className="toast-message">{toast.message}</span>
                            </div>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
