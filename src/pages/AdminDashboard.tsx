import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../utils/compressImage';
import './Admin.css';
import './AdminAnalytics.css';
import UserManagement from '../components/admin/UserManagement';
import FeedbackManagement from '../components/admin/FeedbackManagement';
import ContentManagement from '../components/admin/ContentManagement';
import ReportManagement from '../components/admin/ReportManagement';
import NotificationHub from '../components/admin/NotificationHub';
import NotificationHistory from '../components/admin/NotificationHistory';
import SalesLedger from '../components/admin/SalesLedger';
import WalkInModal from '../components/admin/WalkInModal';
import InvoiceModal from '../components/admin/InvoiceModal';
import { UserPlus } from 'lucide-react';
import '../components/admin/FloatingTimer.css';


interface Booking {
    id: string;
    referenceNumber?: string;
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
    const navigate = useNavigate();
    // Data States
    const [bookings, setBookings] = useState<Booking[]>([]);


    const [galleryItems, setGalleryItems] = useState<GalleryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        revenue: 0
    });

    const [activeTab, setActiveTab] = useState<'bookings' | 'feedbacks' | 'content' | 'users' | 'gallery' | 'calendar' | 'analytics' | 'bio_links' | 'reports' | 'notifications' | 'sales'>('analytics');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [unavailableDates, setUnavailableDates] = useState<Record<string, string>>({}); // date -> reason map
    const [calendarModal, setCalendarModal] = useState<{
        show: boolean;
        date: string | null;
        type: 'block' | 'unblock' | null;
        dayBookings: Booking[];
    }>({ show: false, date: null, type: null, dayBookings: [] });
    const [blockReason, setBlockReason] = useState('');
    const [isWalkInOpen, setIsWalkInOpen] = useState(false);

    // Invoice State
    const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

    // Sync selectedInvoiceBooking with live bookings data
    useEffect(() => {
        if (selectedInvoiceBooking) {
            const liveBooking = bookings.find(b => b.id === selectedInvoiceBooking.id);
            if (liveBooking) {
                // Check if meaningful data changed to avoid unnecessary re-renders (optional but good practice)
                // For simplicity and ensuring updates, we just set it. React handles strict equality checks on primitives, 
                // but for objects it will trigger update. That is what we want.
                setSelectedInvoiceBooking(liveBooking);
            }
        }
    }, [bookings]);

    // Global Timer State for Walk-Ins
    const [activeTimer, setActiveTimer] = useState<{
        endTime: number;
        clientName: string;
        isRunning: boolean;
    } | null>(null);

    // Minimize/Floating Timer Logic
    const [timerString, setTimerString] = useState("00:00");
    useEffect(() => {
        let interval: any;
        if (activeTimer && activeTimer.isRunning) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = activeTimer.endTime - now;
                if (diff <= 0) {
                    setTimerString("00:00");
                    // Optionally alert or stop
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setTimerString(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

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


    // Gallery States
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Report Issue State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportSubject, setReportSubject] = useState('');
    const [reportMessage, setReportMessage] = useState('');
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    // Welcome Popup / Patch Notification State
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);

    useEffect(() => {
        const hasSeenUpdate = localStorage.getItem('admin_welcome_v1.2.2');
        if (!hasSeenUpdate) {
            setShowWelcomePopup(true);
        }
    }, []);

    const handleCloseWelcome = () => {
        localStorage.setItem('admin_welcome_v1.2.2', 'true');
        setShowWelcomePopup(false);
    };


    // Notification states
    const previousBookingCount = useRef<number>(0);
    const [isTabFlashing, setIsTabFlashing] = useState(false);
    const originalTitle = useRef(document.title);
    const flashInterval = useRef<number | null>(null);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportSubject.trim() || !reportMessage.trim()) {
            showToast('error', 'Error', 'Please fill in all fields');
            return;
        }

        setIsSubmittingReport(true);
        try {
            const reporterEmail = auth.currentUser?.email || 'Admin User';
            let screenshotUrl = null;

            if (screenshotFile) {
                const compressedBlob = await compressImage(screenshotFile);
                const storageRef = ref(storage, `reports/${Date.now()}_${screenshotFile.name}`);
                await uploadBytes(storageRef, compressedBlob);
                screenshotUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, 'reports'), {
                subject: reportSubject,
                description: reportMessage, // Renamed to description
                status: 'new', // Changed to 'new'
                timestamp: serverTimestamp(), // Changed createdAt to timestamp
                type: 'admin_report',
                screenshot: screenshotUrl, // Renamed to screenshot
                email: reporterEmail // Added email field for ReportManagement
            });

            // Notify IT Users via Email
            try {
                // Check for both 'it' and 'IT' just in case
                const itUsersQuery = query(collection(db, 'users'), where('role', 'in', ['it', 'IT']));
                const itSnapshot = await getDocs(itUsersQuery);
                console.log(`Found ${itSnapshot.size} IT users to notify.`);
                itSnapshot.forEach(doc => console.log('IT User Found:', doc.data())); // Debug Log

                const emailPromises = itSnapshot.docs.map(doc => {
                    const itUser = doc.data();
                    if (itUser.email) {
                        return fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'report_issue',
                                report: {
                                    subject: reportSubject,
                                    message: reportMessage,
                                    screenshotUrl: screenshotUrl,
                                    reporterEmail: reporterEmail,
                                    toEmail: itUser.email
                                }
                            })
                        }).then(res => {
                            if (!res.ok) console.error(`Failed to send email to ${itUser.email}: Status ${res.status}`);
                            else console.log(`Email sent to ${itUser.email}: Status ${res.status}`);
                            return res;
                        });
                    }
                    return Promise.resolve();
                });

                await Promise.all(emailPromises);
                console.log(`Report sent to ${emailPromises.length} IT users.`);
            } catch (emailErr) {
                console.error("Failed to send IT notification emails:", emailErr);
            }

            showToast('success', 'Report Sent', 'Your issue report has been submitted to the IT admin.');
            setReportSubject('');
            setReportMessage('');
            setScreenshotFile(null);
            setScreenshotPreview(null);
            setIsReportModalOpen(false);
        } catch (error) {
            console.error("Error submitting report:", error);
            showToast('error', 'Error', 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleTabChange = (tab: any) => {
        if (tab === 'patch-notes') {
            navigate('/patch-notes');
        } else {
            setActiveTab(tab);
            setIsSidebarOpen(false);
        }
    };

    // Toast Helper
    const showToast = useCallback((type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

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

            // Detect new booking
            if (previousBookingCount.current > 0 && bookingsData.length > previousBookingCount.current) {
                const newBooking = bookingsData[0]; // Most recent booking
                handleNewBookingNotification(newBooking);
            }
            previousBookingCount.current = bookingsData.length;

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



    const processedBookings = bookings.filter(booking => {
        if (!booking) return false;
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            String(booking.fullName || '').toLowerCase().includes(term) ||
            String(booking.email || '').toLowerCase().includes(term) ||
            String(booking.id || '').toLowerCase().includes(term) ||
            String(booking.referenceNumber || '').toLowerCase().includes(term);

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle Firestore Timestamps for sorting
        if (sortConfig.key === 'createdAt') {
            aValue = aValue?.seconds || 0;
            bValue = bValue?.seconds || 0;
        }

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

    // Handle new booking notification
    const handleNewBookingNotification = async (booking: Booking) => {
        // Play sound using native Audio API (same as Prime Audio button)
        try {
            const audio = new Audio('/notification.wav');
            audio.volume = 0.5;
            await audio.play();
            console.log('✓ Notification sound played successfully');
        } catch (error) {
            console.error('✗ Audio playback failed:', error);
            if ((error as Error).name === 'NotAllowedError') {
                console.warn('⚠️ Audio blocked - user needs to click Prime Audio first');
                showToast('error', 'Sound Blocked', 'Click "Prime Audio" to enable sounds');
            }
        }

        // Show toast notification
        showToast('success', '🎉 New Booking!', `${booking.fullName} booked ${booking.package}`);

        // Start tab flashing
        startTabFlashing();

        // Show browser notification (Windows taskbar)
        showBrowserNotification(booking);

        // Update favicon to show alert
        updateFaviconBadge();

        // Send email notification to admin
        await sendAdminEmailNotification(booking);
    };

    // Show native browser notification
    const showBrowserNotification = (booking: Booking) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                // Close any existing notifications first to ensure new one is noticed
                const existingNotification = (window as any).lastBookingNotification;
                if (existingNotification) {
                    existingNotification.close();
                }

                const notification = new Notification('🔴 NEW BOOKING ALERT!', {
                    body: `${booking.fullName} booked ${booking.package}\n📅 ${booking.date}\n🕐 ${booking.time}`,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'new-booking-' + Date.now(), // Unique tag to force new notification each time
                    requireInteraction: true, // Keeps notification visible and taskbar flashing
                    silent: false, // Ensures system sound plays
                    data: { bookingId: booking.id, timestamp: Date.now() }
                });

                // Store reference to close later
                (window as any).lastBookingNotification = notification;

                // When notification is clicked, focus the window and go to bookings
                notification.onclick = () => {
                    window.focus();
                    handleTabChange('bookings');
                    notification.close();
                };

                // When notification is closed, clear reference
                notification.onclose = () => {
                    (window as any).lastBookingNotification = null;
                };

                // Error handler
                notification.onerror = (error) => {
                    console.error('Notification error:', error);
                };

                // Auto-close after 30 seconds if user doesn't interact
                setTimeout(() => {
                    if (notification) {
                        notification.close();
                    }
                }, 30000);

                console.log('✓ Browser notification created successfully');
            } catch (error) {
                console.error('✗ Error showing browser notification:', error);
            }
        } else if (Notification.permission === 'default') {
            // Request permission if not yet determined
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showBrowserNotification(booking);
                }
            });
        } else if (Notification.permission === 'denied') {
            console.warn('⚠️ Notifications are blocked. Please enable in browser settings.');
            showToast('error', 'Notifications Blocked', 'Enable notifications in browser settings');
        }
    };

    // Update favicon to show notification badge
    const updateFaviconBadge = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Draw red circle badge
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(24, 8, 8, 0, 2 * Math.PI);
                ctx.fill();

                // Draw white exclamation mark
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', 24, 8);

                // Update favicon
                const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
                link.type = 'image/x-icon';
                link.rel = 'shortcut icon';
                link.href = canvas.toDataURL();
                document.head.appendChild(link);
            }
        } catch (error) {
            console.error('Error updating favicon:', error);
        }
    };

    // Restore original favicon when tab is focused
    useEffect(() => {
        const handleFocus = () => {
            if (!isTabFlashing) {
                // Restore original favicon (you might want to set this to your actual favicon path)
                const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                if (link) {
                    link.href = '/favicon.ico'; // Change this to your actual favicon path
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isTabFlashing]);

    // Tab flashing effect
    const startTabFlashing = () => {
        if (isTabFlashing) return;
        setIsTabFlashing(true);

        let isRed = false;
        flashInterval.current = setInterval(() => {
            if (isRed) {
                document.title = originalTitle.current;
            } else {
                document.title = '🔴 NEW BOOKING! 🔴';
            }
            isRed = !isRed;
        }, 1000);

        // Auto-stop after 30 seconds
        setTimeout(() => {
            stopTabFlashing();
        }, 30000);
    };

    const stopTabFlashing = () => {
        if (flashInterval.current) {
            clearInterval(flashInterval.current);
            flashInterval.current = null;
        }
        document.title = originalTitle.current;
        setIsTabFlashing(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTabFlashing();
        };
    }, []);

    // Stop flashing when user focuses on the tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isTabFlashing) {
                stopTabFlashing();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isTabFlashing]);

    // Send email to admin about new booking
    const sendAdminEmailNotification = async (booking: Booking) => {
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'new_booking_admin',
                    booking: {
                        referenceNumber: booking.referenceNumber,
                        name: booking.fullName,
                        email: booking.email,
                        phone: booking.phone,
                        package: booking.package,
                        date: booking.date,
                        time_start: booking.time,
                        totalPrice: booking.totalPrice
                    }
                })
            });
            console.log('Admin email notification sent');
        } catch (error) {
            console.error('Failed to send admin email notification', error);
        }
    };

    const sendEmailNotification = async (booking: Booking, status: string, reason?: string) => {
        const emailType = status === 'confirmed' ? 'confirmed' : status === 'rejected' ? 'rejected' : null;

        if (!emailType) return;

        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: emailType,
                    booking: {
                        referenceNumber: booking.referenceNumber,
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

            // Sync status to booked_slots (ignore error if not exists)
            try {
                const slotRef = doc(db, 'booked_slots', id);
                await updateDoc(slotRef, { status: newStatus });
            } catch (err) {
                console.log("Slot doc not found, skipping sync");
            }

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
                // Sync delete to booked_slots
                await deleteDoc(doc(db, 'booked_slots', id));

                showToast('success', 'Deleted', 'Booking deleted successfully');
            } catch (error) {
                console.error("Error deleting booking:", error);
                showToast('error', 'Delete Failed', 'Failed to delete booking');
            }
        }
    };









    // Gallery Functions
    const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const validFiles: File[] = [];

            files.forEach(file => {
                if (file.size > 15 * 1024 * 1024) {
                    showToast('error', 'File too large', `${file.name} exceeds 15MB`);
                } else {
                    validFiles.push(file);
                }
            });

            setGalleryFiles(prev => [...prev, ...validFiles]);
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryFile = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => {
            const newPreviews = [...prev];
            if (newPreviews[index]) {
                URL.revokeObjectURL(newPreviews[index]);
            }
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const handleSaveGalleryItem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (galleryFiles.length === 0) {
            showToast('error', 'Missing Images', 'Please select at least one image');
            return;
        }

        setUploading(true);
        setUploadProgress({ current: 0, total: galleryFiles.length });

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < galleryFiles.length; i++) {
                const file = galleryFiles[i];
                try {
                    // Optimize image before upload
                    const compressedBlob = await compressImage(file);

                    // 1. Upload Image to Firebase Storage
                    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, compressedBlob);
                    const imageUrl = await getDownloadURL(storageRef);

                    // 2. Save to Firestore
                    await addDoc(collection(db, 'gallery'), {
                        src: imageUrl,
                        category: galleryForm.category,
                        alt: galleryForm.alt,
                        createdAt: serverTimestamp()
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error);
                    failCount++;
                }
                setUploadProgress(prev => ({ ...prev, current: i + 1 }));
            }

            if (successCount > 0) {
                showToast('success', 'Upload Complete', `${successCount} images added to gallery`);
            }
            if (failCount > 0) {
                showToast('error', 'Upload Issues', `${failCount} images failed to upload`);
            }

            // Reset
            setGalleryFiles([]);
            setGalleryPreviews(prev => {
                prev.forEach(url => URL.revokeObjectURL(url));
                return [];
            });
            setGalleryForm({ category: 'solo', alt: '' });
            setShowGalleryModal(false);

        } catch (error) {
            console.error("Error in bulk upload process:", error);
            showToast('error', 'Error', 'An unexpected error occurred during upload');
        } finally {
            setUploading(false);
            setUploadProgress({ current: 0, total: 0 });
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
            <div className="mobile-header-bar">
                <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <span className="mobile-brand">ItsourStudio.</span>
            </div>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-brand" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: 0 }}>ItsourStudio.</h1>
                    <p className="sidebar-role" style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginTop: '0.25rem', letterSpacing: '1px' }}>ADMIN WORKSPACE</p>
                </div>
                <nav className="sidebar-nav">
                    <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => handleTabChange('bookings')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span className="nav-label">Bookings</span>
                    </button>
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabChange('analytics')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            <span className="nav-label">Analytics</span>
                        </button>
                    )}
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => handleTabChange('sales')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            <span className="nav-label">Sales</span>
                        </button>
                    )}
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => handleTabChange('calendar')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span className="nav-label">Calendar</span>
                        </button>
                    )}
                    {((sessionStorage.getItem('userRole') || localStorage.getItem('userRole')) === 'admin' || !(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'))) && (
                        <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>
                            <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span className="nav-label">Users</span>
                        </button>
                    )}
                    <button className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => handleTabChange('gallery')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span className="nav-label">Gallery</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => handleTabChange('feedbacks')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span className="nav-label">Feedbacks</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'content' ? 'active' : ''}`} onClick={() => handleTabChange('content')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span className="nav-label">Content</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleTabChange('reports')}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span className="nav-label">Reports</span>
                    </button>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                    <button className="nav-item" onClick={() => setIsReportModalOpen(true)} style={{ color: '#ef4444' }}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <span className="nav-label">Report Issue</span>
                    </button>
                    <button className="nav-item logout-btn" onClick={async () => {
                        if (window.confirm('Are you sure you want to logout?')) {
                            try {
                                await auth.signOut();
                                sessionStorage.clear();
                                localStorage.clear();
                                window.location.href = '/admin/login';
                            } catch (error) {
                                console.error("Error signing out:", error);
                            }
                        }
                    }} style={{ color: '#ef4444', width: '100%' }}>
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage bookings, gallery, and site content</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsWalkInOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #bf6a39 0%, #8b5e3b 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(191, 106, 57, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #8b5e3b 0%, #6d4a2f 100%)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(191, 106, 57, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #bf6a39 0%, #8b5e3b 100%)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(191, 106, 57, 0.3)';
                            }}
                        >
                            <UserPlus size={18} />
                            <span>Walk In</span>
                        </button>
                        <NotificationHub onViewAll={() => handleTabChange('notifications')} onNavigate={handleTabChange} />
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


                {activeTab === 'reports' && <ReportManagement showToast={showToast} />}

                {activeTab === 'notifications' && <NotificationHistory onNavigate={handleTabChange} />}

                {activeTab === 'sales' && <SalesLedger showToast={showToast} />}


                {activeTab === 'calendar' && (
                    <div className="bookings-section">
                        <div className="bookings-header">
                            <h3>Calendar Management</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Click a date to block/unblock it for bookings.</p>
                        </div>
                        <div className="calendar-container-padding">
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

                                {/* Mobile List View */}
                                <div className="calendar-list-mobile">
                                    {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                                        const day = i + 1;
                                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isUnavailable = !!unavailableDates[dateString];
                                        const isPast = date < new Date() && date.getDate() !== new Date().getDate();
                                        const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'rejected');
                                        const weekday = date.toLocaleString('default', { weekday: 'short' });

                                        return (
                                            <div
                                                key={day}
                                                className={`calendar-list-item ${isUnavailable ? 'unavailable' : ''} ${isPast ? 'past' : ''}`}
                                                onClick={() => handleDayClick(day)}
                                            >
                                                <div className="date-col">
                                                    <span className="day-number">{day}</span>
                                                    <span className="day-name">{weekday}</span>
                                                </div>
                                                <div className="info-col">
                                                    {isUnavailable ? (
                                                        <div className="status-blocked">
                                                            <span className="blo-label">Blocked</span>
                                                            <span className="blo-reason">{unavailableDates[dateString]}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="status-available">
                                                            {dayBookings.length > 0 ? (
                                                                <span className="booking-count">{dayBookings.length} Bookings</span>
                                                            ) : (
                                                                <span className="avail-label">Available</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="arrow-col">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </div>
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
                                        placeholder={isMobile ? "Search..." : "Search by name, email, ref number..."}
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
                                            <th onClick={() => handleSort('createdAt')} className={`sort-header ${sortConfig.key === 'createdAt' ? 'active' : ''}`}>
                                                Created
                                                <span className="sort-indicator">
                                                    {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                                            <tr
                                                key={booking.id}
                                                className={`booking-row status-${booking.status}`}
                                                onClick={() => setSelectedInvoiceBooking(booking)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view invoice"
                                            >
                                                <td data-label="Client">
                                                    <div style={{ fontWeight: 500 }}>{booking.fullName}</div>
                                                    {booking.referenceNumber && (
                                                        <div style={{ fontSize: '0.75rem', color: '#bf6a39', fontWeight: 600, fontFamily: 'monospace' }}>{booking.referenceNumber}</div>
                                                    )}
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.email}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.phone}</div>
                                                </td>
                                                <td data-label="Date & Time">
                                                    <div>{booking.date}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.time}</div>
                                                </td>
                                                <td data-label="Created At">
                                                    <div style={{ fontSize: '0.9rem' }}>{booking.createdAt?.seconds ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : '-'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.createdAt?.seconds ? new Date(booking.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                                </td>
                                                <td data-label="Package">{booking.package}</td>
                                                <td data-label="Status">
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
                                                <td data-label="Total">₱{booking.totalPrice?.toLocaleString()}</td>
                                                <td data-label="Payment">
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
                                                <td data-label="Actions">
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
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
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
                    <FeedbackManagement showToast={showToast} />
                )}

                {activeTab === 'content' && (
                    <ContentManagement showToast={showToast} />
                )}

                {activeTab === 'users' && (
                    <UserManagement showToast={showToast} />
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
                <div className={`admin-modal-overlay ${showGalleryModal ? 'active' : ''}`} onClick={() => !uploading && setShowGalleryModal(false)}>
                    <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Upload to Gallery {uploading && `(${uploadProgress.current}/${uploadProgress.total})`}</h3>
                            {!uploading && <button className="btn-close" onClick={() => setShowGalleryModal(false)}>&times;</button>}
                        </div>
                        <form onSubmit={handleSaveGalleryItem}>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>

                                {/* File Drop/Select Area */}
                                <div style={{
                                    border: '2px dashed #ddd',
                                    borderRadius: '8px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    position: 'relative',
                                    background: '#fafafa'
                                }} onClick={() => !uploading && document.getElementById('gallery-upload')?.click()}>

                                    <div>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                        <p style={{ marginTop: '0.5rem', color: '#666' }}>
                                            {uploading ? 'Uploading...' : 'Click to select images (Max 15MB each)'}
                                        </p>
                                    </div>

                                    <input
                                        id="gallery-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                        onChange={handleGalleryFilesChange}
                                    />
                                </div>

                                {/* Previews Grid */}
                                {galleryFiles.length > 0 && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                        gap: '0.5rem',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        padding: '0.5rem',
                                        background: '#f1f5f9',
                                        borderRadius: '8px'
                                    }}>
                                        {galleryPreviews.map((src, index) => (
                                            <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden' }}>
                                                <img src={src} alt={`preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {!uploading && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeGalleryFile(index); }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            right: '2px',
                                                            background: 'rgba(0,0,0,0.6)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Progress Bar */}
                                {uploading && (
                                    <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                                            height: '100%',
                                            background: '#3b82f6',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                )}

                                <div>
                                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Category (for all)</label>
                                    <select
                                        className="form-input"
                                        value={galleryForm.category}
                                        disabled={uploading}
                                        onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.95rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            backgroundColor: '#ffffff',
                                            color: '#1e293b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 1rem center',
                                            backgroundSize: '16px',
                                            paddingRight: '2.5rem',
                                            fontWeight: '500'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#bf6a39'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    >
                                        <option value="solo">Solo</option>
                                        <option value="duo">Duo</option>
                                        <option value="group">Group</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Title / Caption (Optional, for all)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Summer Photoshoot"
                                        value={galleryForm.alt}
                                        disabled={uploading}
                                        onChange={e => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.95rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            backgroundColor: '#ffffff',
                                            color: '#1e293b',
                                            transition: 'all 0.2s ease',
                                            fontWeight: '500'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#bf6a39';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(191, 106, 57, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e2e8f0';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={uploading || galleryFiles.length === 0}
                                >
                                    {uploading ? 'Uploading...' : `Upload ${galleryFiles.length > 0 ? galleryFiles.length + ' ' : ''}Images`}
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

                {/* Walk In Modal */}
                <WalkInModal
                    isOpen={isWalkInOpen}
                    onClose={() => setIsWalkInOpen(false)}
                    showToast={showToast}
                    activeTimer={activeTimer}
                    setActiveTimer={setActiveTimer}
                />

                {/* Invoice Modal */}
                <InvoiceModal
                    isOpen={!!selectedInvoiceBooking}
                    onClose={() => setSelectedInvoiceBooking(null)}
                    booking={selectedInvoiceBooking}
                    onUpdate={() => {
                        // Refresh logic if needed, but onSnapshot handles it automatically?
                        // Actually onSnapshot keeps 'bookings' fresh, but 'selectedInvoiceBooking' needs to be updated or re-fetched?
                        // InvoiceModal updates Firestore directly, causing onSnapshot to fire.
                        // But 'selectedInvoiceBooking' is local state copy. We should close it or update it.
                        // Simple fix: Close it for now, or let onSnapshot update the list below.
                        // Better: Since the modal closes after payment (based on my implementation), we are good.
                    }}
                />

                {/* Minimized Floating Timer */}
                {!isWalkInOpen && activeTimer && activeTimer.isRunning && (
                    <div
                        className="floating-timer-widget"
                        onClick={() => setIsWalkInOpen(true)}
                        title="Click to expand"
                    >
                        <div className="ft-loader"></div>
                        <div className="ft-content">
                            <span className="ft-time">{timerString}</span>
                            <span className="ft-client">{activeTimer.clientName}</span>
                        </div>
                    </div>
                )}

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

            {/* Report Issue Modal */}
            {isReportModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 10000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backdropFilter: 'blur(2px)'
                }} onClick={() => setIsReportModalOpen(false)}>
                    <div style={{
                        background: '#fff',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                            <span>⚠️</span> Report a Technical Issue
                        </h4>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Describe the issue you're facing. Our IT team will review it shortly.
                        </p>

                        <form onSubmit={handleSubmitReport}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#0f172a' }}>Subject</label>
                                <input
                                    type="text"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem'
                                    }}
                                    value={reportSubject}
                                    onChange={e => setReportSubject(e.target.value)}
                                    placeholder="e.g. Cannot upload images"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#0f172a' }}>Description</label>
                                <textarea
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        minHeight: '120px',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit'
                                    }}
                                    rows={5}
                                    value={reportMessage}
                                    onChange={e => setReportMessage(e.target.value)}
                                    placeholder="Please describe what happened..."
                                    required
                                ></textarea>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#0f172a' }}>Screenshot (Optional)</label>
                                <div style={{ border: '2px dashed #e2e8f0', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                                    {!screenshotPreview ? (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="screenshot-upload"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setScreenshotFile(file);
                                                        setScreenshotPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="screenshot-upload" style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
                                                <span style={{ color: '#ef4444', fontWeight: 500 }}>Click to upload</span> or drag and drop
                                            </label>
                                        </>
                                    ) : (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={screenshotPreview} alt="Screenshot Preview" style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScreenshotFile(null);
                                                    setScreenshotPreview(null);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" className="btn" style={{ background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={() => setIsReportModalOpen(false)} disabled={isSubmittingReport}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn" style={{ background: '#ef4444', color: 'white', border: 'none' }} disabled={isSubmittingReport}>
                                    {isSubmittingReport ? 'Sending...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Version 1.2.2 Welcome Popup */}
            {showWelcomePopup && (
                <div className="welcome-popup-overlay">
                    <div className="welcome-popup-card" onClick={e => e.stopPropagation()}>
                        {/* Left Panel - Branding */}
                        <div className="welcome-popup-left">
                            {/* Decorative Circle */}
                            <div className="welcome-decoration-circle" />

                            <h2 className="welcome-title">
                                Welcome to Your Dashboard
                            </h2>
                            <p className="welcome-subtitle">
                                We've added new features to help streamline your studio operations.
                            </p>
                            <div className="welcome-tags">
                                <span className="welcome-tag">Finance</span>
                                <span className="welcome-tag">Operations</span>
                                <span className="welcome-tag">Management</span>
                            </div>
                        </div>

                        {/* Right Panel - Content */}
                        <div className="welcome-popup-right">
                            <h3 className="welcome-content-title">Comprehensive Updates</h3>
                            <p className="welcome-content-text">
                                We have introduced major improvements to streamlining your workflow. From real-time revenue tracking to a dedicated walk-in manager and invoice system, the dashboard is now more powerful than ever.
                            </p>

                            <a
                                href="/patch-notes"
                                target="_blank"
                                className="welcome-link"
                            >
                                Read full Patch Notes <span style={{ fontSize: '1.25rem' }}>→</span>
                            </a>

                            <div className="welcome-info-box">
                                <div className="welcome-info-item">
                                    <span style={{ fontSize: '1.25rem' }}>🔍</span>
                                    <div><strong>Search Indexing:</strong> Google Search Console processing is ongoing. Site visibility may take time.</div>
                                </div>
                                <div className="welcome-info-item">
                                    <span style={{ fontSize: '1.25rem' }}>🐛</span>
                                    <div><strong>Beta Features:</strong> Please report any bugs via the report tool.</div>
                                </div>
                            </div>

                            <button
                                onClick={handleCloseWelcome}
                                className="welcome-btn-explore"
                            >
                                Explore Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
