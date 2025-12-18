import { useNavigate } from 'react-router-dom';
import './Admin.css'; // Reusing some admin styles for consistency

const AdminDownload = () => {
    const navigate = useNavigate();

    return (
        <div className="admin-download-container">
            <div className="download-card fade-in">
                <div className="download-header">
                    <div className="app-icon-wrapper">
                        <img src="/logo/android-chrome-192x192.png" alt="App Icon" className="app-icon" />
                    </div>
                    <h1>It's ouR Studio Admin</h1>
                    <p className="version-tag">Version 1.0.0 (Stable)</p>
                </div>

                <div className="download-features">
                    <div className="feature">
                        <span className="feature-icon">🚀</span>
                        <div className="feature-text">
                            <h3>Lightning Fast</h3>
                            <p>Optimized with Tauri for minimal resource usage and instant startup.</p>
                        </div>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🔒</span>
                        <div className="feature-text">
                            <h3>Secure Access</h3>
                            <p>Dedicated ecosystem for studio management and booking control.</p>
                        </div>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">💼</span>
                        <div className="feature-text">
                            <h3>All-in-One</h3>
                            <p>Analytics, booking management, and content control in your taskbar.</p>
                        </div>
                    </div>
                </div>

                <div className="download-actions">
                    <a href="/downloads/Its_Our_Studio_Admin_Setup.exe" className="download-button" download>
                        <span className="btn-content">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download for Windows
                        </span>
                    </a>
                    <button onClick={() => navigate('/admin/login')} className="secondary-button">
                        Open Web Version
                    </button>
                </div>

                <div className="download-footer">
                    <p>Requires Windows 10 or later (x64)</p>
                    <p className="size-info">File size: ~4.5 MB</p>
                </div>
            </div>

            <div className="background-glow"></div>

            <style>{`
                .admin-download-container {
                    min-height: 100vh;
                    background: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    color: #fff;
                    font-family: 'League Spartan', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .background-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(191, 106, 57, 0.15) 0%, transparent 70%);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 0;
                    pointer-events: none;
                }

                .download-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 48px;
                    width: 100%;
                    max-width: 500px;
                    text-align: center;
                    z-index: 1;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
                }

                .app-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: #fff;
                    padding: 12px;
                    border-radius: 20px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }

                .app-icon {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 8px;
                    letter-spacing: -1px;
                }

                .version-tag {
                    color: #bf6a39;
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 40px;
                }

                .download-features {
                    text-align: left;
                    margin-bottom: 40px;
                }

                .feature {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .feature-icon {
                    font-size: 1.5rem;
                    background: rgba(191, 106, 57, 0.1);
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    border: 1px solid rgba(191, 106, 57, 0.2);
                }

                .feature-text h3 {
                    font-size: 1.1rem;
                    margin-bottom: 4px;
                    color: #fff;
                }

                .feature-text p {
                    font-size: 0.9rem;
                    color: #a0a0a0;
                    line-height: 1.4;
                    margin: 0;
                }

                .download-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .download-button {
                    background: #bf6a39;
                    color: #fff;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .download-button:hover {
                    background: #d47e4b;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(191, 106, 57, 0.3);
                }

                .secondary-button {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #a0a0a0;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .secondary-button:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .download-footer {
                    margin-top: 32px;
                    color: #666;
                    font-size: 0.8rem;
                }

                .size-info {
                    margin-top: 4px;
                    opacity: 0.7;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default AdminDownload;
