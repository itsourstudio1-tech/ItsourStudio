import { type ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import EmailTest from './pages/EmailTest';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDownload from './pages/AdminDownload';

import { BookingProvider } from './context/BookingContext';
import BookingModal from './components/BookingModal';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true' || localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <Navigate to="/admin/login" replace />;
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
            <ScrollToTop />
            <BackToTop />
            {!isAdminRoute && <Navbar />}
            <Routes>
                <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/admin" replace /> : <Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/email-test" element={<EmailTest />} />
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

                {/* Catch all - redirects to home or admin if native */}
                <Route path="*" element={<Navigate to={Capacitor.isNativePlatform() ? "/admin" : "/"} replace />} />
            </Routes>
            {!isAdminRoute && <Footer />}
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
