import { type ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import EmailTest from './pages/EmailTest';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDownload from './pages/AdminDownload';
import CookieConsent from './components/CookieConsent';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import StructuredData from './components/StructuredData';

import { BookingProvider } from './context/BookingContext';
import BookingModal from './components/BookingModal';
import { auth } from './firebase';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return user ? children : <Navigate to="/admin/login" replace />;
};

import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import LoadingScreen from './components/LoadingScreen';

const AppContent = ({ onRouteChange }: { onRouteChange: () => void }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const prevPathnameRef = useRef(location.pathname);

    useEffect(() => {
        // Only trigger loading if pathname actually changed
        if (prevPathnameRef.current !== location.pathname) {
            onRouteChange();
            prevPathnameRef.current = location.pathname;
        }
    }, [location.pathname, onRouteChange]);

    return (
        <div className="app-container">
            <StructuredData />
            <ScrollToTop />
            <BackToTop />
            {!isAdminRoute && <Navbar />}
            <Routes>
                <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/admin" replace /> : <Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/email-test" element={<EmailTest />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/download" element={<AdminDownload />} />

                {/* Redirects for hash links that might be interpreted as routes */}
                <Route path="/about" element={<Navigate to="/" replace state={{ scrollTo: 'about' }} />} />
                <Route path="/contact" element={<Navigate to="/" replace state={{ scrollTo: 'contact' }} />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all - renders 404 page */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <CookieConsent />}
            <BookingModal />
        </div>
    );
};

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoadRef = useRef(true);

    const handleRouteChange = useCallback(() => {
        if (!isInitialLoadRef.current) {
            // Show loading screen for page transitions
            setIsLoading(true);
        }
    }, []);

    const handleLoadComplete = useCallback(() => {
        setIsLoading(false);
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
        }
    }, []);

    return (
        <BookingProvider>
            <Router>
                {isLoading && <LoadingScreen onLoadComplete={handleLoadComplete} isPageTransition={!isInitialLoadRef.current} />}
                <AppContent onRouteChange={handleRouteChange} />
            </Router>
        </BookingProvider>
    );
}

export default App;
