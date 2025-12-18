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
                            <img src="/logo/android-chrome-192x192.png" alt="App Icon" className="app-icon" />
                            <div className="icon-glow"></div>
                        </div>
                        <div className="header-text">
                            <h1>It's ouR Studio <span className="highlight">Admin</span></h1>
                            <div className="version-badge">
                                <span className="pulse-dot"></span>
                                v1.0.0 Stable
                            </div>
                        </div>
                    </div>

                    <div className="features-grid">
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Fast</h3>
                                <p>Instant startup</p>
                            </div>
                        </div>
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Secure</h3>
                                <p>Safe ecosystem</p>
                            </div>
                        </div>
                        <div className="feature-item fade-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="feature-icon-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </div>
                            <div className="feature-content">
                                <h3>Tools</h3>
                                <p>All-in-one suite</p>
                            </div>
                        </div>
                    </div>

                    <div className="action-area fade-slide-up" style={{ animationDelay: '0.4s' }}>
                        <a href="/downloads/Its_Our_Studio_Admin_Setup.exe" className="download-button" download>
                            <div className="btn-shine"></div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dl-icon">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span className="btn-text">Download App</span>
                            <span className="btn-meta">Windows (x64) • 4.5MB</span>
                        </a>

                        <button onClick={() => navigate('/admin/login')} className="web-link">
                            <span>Continue to Web Version</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-download-container {
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                    background: #050505;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-family: 'League Spartan', sans-serif;
                    position: relative;
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

                /* Action Area */
                .action-area {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .download-button {
                    position: relative;
                    background: #bf6a39;
                    color: #fff;
                    text-decoration: none;
                    padding: 14px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .download-button:hover {
                    background: #d47e4b;
                    transform: scale(1.02);
                    box-shadow: 0 10px 30px rgba(191, 106, 57, 0.3);
                }

                .download-button:active {
                    transform: scale(0.98);
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
            `}</style>
        </div>
    );
};

export default AdminDownload;
