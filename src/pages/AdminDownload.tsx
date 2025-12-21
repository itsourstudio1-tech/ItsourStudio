import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminDownload = () => {
    const navigate = useNavigate();

    return (
        <div className="admin-download-container">
            <div className="animated-bg"></div>

            <div className="content-wrapper">
                <div className="download-card stagger-in">
                    <div className="download-card-header">
                        <div className="app-icon-wrapper float-animation">
                            <img src="/logo/android-chrome-512x512.png" alt="App Icon" className="app-icon" />
                            <div className="icon-glow"></div>
                        </div>
                        <div className="header-text">
                            <h1>IoS <span className="highlight">Admin</span></h1>
                            <div className="version-badge">
                                <span className="pulse-dot"></span>
                                v1.1.0 Stable
                            </div>
                        </div>
                    </div>

                    <div className="features-grid">
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Multi-Platform</h3>
                                <p>Desktop & Mobile</p>
                            </div>
                        </div>
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Secure</h3>
                                <p>Encrypted Data</p>
                            </div>
                        </div>
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Native</h3>
                                <p>Optimized Build</p>
                            </div>
                        </div>
                    </div>

                    <div className="action-area fade-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="download-options-column">
                            <a href="/downloads/Its_Our_Studio_Admin_Setup1.exe" className="download-button windows" download>
                                <div className="btn-shine"></div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dl-icon">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <div className="btn-label-group">
                                    <span className="btn-text">Download for Windows</span>
                                    <span className="btn-meta">v1.1.0 • 4.5MB</span>
                                </div>
                            </a>

                            <a href="/downloads/IoS_Admin.apk" className="download-button android" download>
                                <div className="btn-shine"></div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dl-icon">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <div className="btn-label-group">
                                    <span className="btn-text">Download for Android</span>
                                    <span className="btn-meta">APK • 7.1MB</span>
                                </div>
                            </a>
                        </div>

                        <button onClick={() => navigate('/admin/login')} className="web-link">
                            <span>Continue to Web Version</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </button>

                        <div className="security-notice">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <p>
                                <strong>Windows User?</strong> If SmartScreen appears, click <span className="underline">More info</span> then <span className="underline">Run anyway</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-download-container {
                    min-height: 100vh;
                    width: 100vw;
                    overflow-x: hidden;
                    overflow-y: auto;
                    background: #050505;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-family: 'League Spartan', sans-serif;
                    position: relative;
                    padding: 40px 0;
                }

                .animated-bg {
                    position: absolute;
                    width: 200%;
                    height: 200%;
                    top: -50%;
                    left: -50%;
                    background: radial-gradient(circle at center, rgba(191, 106, 57, 0.15) 0%, transparent 60%);
                    animation: rotateBg 20s linear infinite;
                    z-index: 0;
                    opacity: 0.8;
                }

                @keyframes rotateBg {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .content-wrapper {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                }

                .download-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    padding: 40px;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 
                        0 0 0 1px rgba(0,0,0,0.4),
                        0 20px 40px -10px rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                /* Header Section */
                .download-card-header {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .app-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #fff, #e0e0e0);
                    border-radius: 20px;
                    padding: 12px;
                    position: relative;
                    box-shadow: 0 15px 30px -5px rgba(0,0,0,0.4);
                    z-index: 10;
                }

                .float-animation {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .icon-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 20px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.4), transparent);
                    filter: blur(10px);
                    opacity: 0.5;
                    z-index: -1;
                }

                .app-icon {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1));
                }

                .header-text h1 {
                    font-size: 2rem;
                    margin: 0;
                    font-weight: 600;
                    letter-spacing: -0.03em;
                    line-height: 1.1;
                    color: #ffffff;
                }

                .highlight {
                    background: linear-gradient(90deg, #bf6a39, #ff8c50);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 700;
                }

                .version-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 100px;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: #27c93f;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #27c93f;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 0.5; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0.5; transform: scale(0.8); }
                }

                /* Features Grid - Compact Row */
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }

                .feature-item {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 12px 10px;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                }

                .feature-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateY(-3px);
                    border-color: rgba(191, 106, 57, 0.3);
                }

                .feature-icon-box {
                    color: #bf6a39;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: center;
                }

                .feature-content h3 {
                    font-size: 0.9rem;
                    margin: 0;
                    color: #fff;
                    font-weight: 600;
                }

                .feature-content p {
                    font-size: 0.7rem;
                    margin: 2px 0 0;
                    color: rgba(255, 255, 255, 0.5);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .action-area {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .download-options-column {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .download-button {
                    position: relative;
                    background: rgba(255, 255, 255, 0.03);
                    color: #fff;
                    text-decoration: none;
                    padding: 16px;
                    border-radius: 18px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 16px;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.08);
                }

                .download-button.windows {
                    background: linear-gradient(135deg, #bf6a39, #8e4d29);
                }

                .download-button.android {
                    background: linear-gradient(135deg, #34495e, #2c3e50);
                }

                .download-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.3);
                    border-color: rgba(255,255,255,0.2);
                }

                .btn-label-group {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    text-align: left;
                }

                .btn-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: skewX(-20deg);
                    animation: shine 4s infinite;
                }

                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                }

                .btn-text {
                    font-weight: 700;
                    font-size: 1.05rem;
                }
                
                .btn-meta {
                    font-size: 0.7rem;
                    opacity: 0.7;
                    font-weight: 400;
                    border-left: 1px solid rgba(255,255,255,0.3);
                    padding-left: 10px;
                    margin-left: 5px;
                }

                .dl-icon {
                    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
                }

                .web-link {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    transition: color 0.2s;
                    padding: 8px;
                }

                .web-link:hover {
                    color: #fff;
                }

                .security-notice {
                    margin-top: 10px;
                    padding: 12px;
                    background: rgba(255, 193, 7, 0.1);
                    border: 1px solid rgba(255, 193, 7, 0.2);
                    border-radius: 12px;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.7);
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    text-align: left;
                    line-height: 1.4;
                }

                .security-notice svg {
                    color: #ffc107;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .security-notice strong {
                    color: #ffc107;
                    font-weight: 600;
                }

                .security-notice .underline {
                    text-decoration: underline;
                    color: #fff;
                }

                /* Entrance Animations */
                .stagger-in {
                    animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .fade-slide-up {
                    opacity: 0;
                    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-height: 700px) {
                    .download-card {
                        padding: 30px;
                        gap: 24px;
                    }
                    .app-icon-wrapper {
                        width: 60px;
                        height: 60px;
                        padding: 8px;
                    }
                    .header-text h1 {
                        font-size: 1.6rem;
                    }
                }

                @media (max-width: 600px) {
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    .download-card {
                        padding: 24px;
                        width: 90%;
                    }
                    .header-text h1 {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDownload;
