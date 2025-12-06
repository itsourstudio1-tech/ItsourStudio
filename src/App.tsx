import { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

function App() {
    return (
        <BookingProvider>
            <Router>
                <div className="app-container">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/email-test" element={<EmailTest />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    <Footer />
                    <BookingModal />
                </div>
            </Router>
        </BookingProvider>
    );
}

export default App;
