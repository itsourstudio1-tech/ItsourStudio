import { type ReactElement } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import EmailTest from './pages/EmailTest';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

import { BookingProvider } from './context/BookingContext';
import BookingModal from './components/BookingModal';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true' || localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';

const AppContent = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="app-container">
            <ScrollToTop />
            <BackToTop />
            {!isAdminRoute && <Navbar />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/email-test" element={<EmailTest />} />
                <Route path="/admin/login" element={<AdminLogin />} />

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

                {/* Catch all - redirects to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {!isAdminRoute && <Footer />}
            <BookingModal />
        </div>
    );
};

function App() {
    return (
        <BookingProvider>
            <Router>
                <AppContent />
            </Router>
        </BookingProvider>
    );
}

export default App;
