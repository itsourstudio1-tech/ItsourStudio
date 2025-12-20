import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <div className="light-leak"></div>

            <div className="not-found-container">
                {/* Viewfinder Decorative Brackets */}
                <div className="viewfinder">
                    <div className="bracket top-left"></div>
                    <div className="bracket top-right"></div>
                    <div className="bracket bottom-left"></div>
                    <div className="bracket bottom-right"></div>
                </div>

                <div className="not-found-text-content">
                    <span className="not-found-label">SYSTEM_AUTO_FOCUS: FAILED</span>
                    <h1 className="not-found-title">404 Not Found</h1>

                    <p className="not-found-text">
                        The shot you're looking for seems to have slipped past the shutter.
                        It might have been moved, deleted, or never existed in our roll.
                    </p>

                    <div className="not-found-actions">
                        <Link to="/" className="btn btn-primary">
                            Return to Studio
                        </Link>
                    </div>

                    <div className="suggested-links">
                        <Link to="/gallery" className="suggest-item">View Gallery</Link>
                        <Link to="/services" className="suggest-item">Our Packages</Link>
                        <Link to="/faq" className="suggest-item">Need Help?</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
