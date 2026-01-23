import { useState } from 'react';
import './PatchNotes.css';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    badges: React.ReactNode[];
    children: React.ReactNode;
    isFeatured?: boolean;
    isPlanned?: boolean;
    defaultExpanded?: boolean;
}

const FeatureCard = ({ icon, title, badges, children, isFeatured, isPlanned, defaultExpanded = false }: FeatureCardProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`feature-card ${isFeatured ? 'featured' : ''} ${isPlanned ? 'planned' : ''} ${isExpanded ? 'active' : ''}`}>
            <button className="feature-header-btn" onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
                <div className="feature-header-left">
                    <span className="feature-icon-wrapper">{icon}</span>
                    <div className="feature-title-group">
                        <h3>{title}</h3>
                        <div className="badge-group">
                            {badges}
                        </div>
                    </div>
                </div>
                <svg
                    className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div className={`feature-body ${isExpanded ? 'expanded' : ''}`}>
                <div className="feature-body-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface PatchVersionProps {
    version: string;
    date: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

const PatchVersion = ({ version, date, children, defaultExpanded = false }: PatchVersionProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`patch-version-container ${isExpanded ? 'expanded' : ''}`}>
            <button className="patch-version-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="patch-version-info">
                    <div className="patch-version-title">
                        <h2>{version}</h2>
                        {defaultExpanded && <span className="version-tag">Latest</span>}
                    </div>
                    <p className="patch-version-date">Released on {date}</p>
                </div>
                <svg
                    className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div className={`patch-version-body ${isExpanded ? 'expanded' : ''}`}>
                {children}
            </div>
        </div>
    );
};


const SetupGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleDownloadEnv = () => {
        const envContent = `ADMIN_EMAIL=youremail@gmail.com
ADMIN_PASSWORD=
# ^^^ ENTER YOUR ADMIN DASHBOARD PASSWORD ABOVE BEFORE IMPORTING ^^^`;

        const blob = new Blob([envContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vercel.env';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="setup-guide-wrapper">
            <button className={`btn-tutorial-trigger ${isOpen ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                <span className="trigger-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                </span>
                <span className="trigger-text">
                    {isOpen ? 'Close Setup Guide' : 'Deployment Setup Guide'}
                </span>
                <span className="trigger-tag">Required for Email</span>
            </button>

            {isOpen && (
                <div className="inline-tutorial-content" onClick={e => e.stopPropagation()}>
                    <div className="tutorial-intro">
                        <h4>Enable Automated Reminders</h4>
                        <p>Follow these simple steps to configure the live server.</p>
                    </div>

                    <div className="tutorial-steps-container">
                        {/* Step 1 */}
                        <div className="tutorial-step">
                            <div className="step-marker">
                                <div className="step-circle">1</div>
                                <div className="step-line"></div>
                            </div>
                            <div className="step-content">
                                <div className="step-header">
                                    <strong>Download Configuration</strong>
                                </div>
                                <p>Get the pre-configured settings file. No editing needed.</p>
                                <button className="btn-download-primary" onClick={handleDownloadEnv}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Download vercel.env
                                </button>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="tutorial-step">
                            <div className="step-marker">
                                <div className="step-circle">2</div>
                                <div className="step-line"></div>
                            </div>
                            <div className="step-content">
                                <div className="step-header">
                                    <strong>Go to Vercel Settings</strong>
                                </div>
                                <p>Open your Project Dashboard and navigate to:</p>
                                <div className="breadcrumb">
                                    <span>Settings</span>
                                    <span className="separator">›</span>
                                    <span>Environment Variables</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="tutorial-step">
                            <div className="step-marker">
                                <div className="step-circle">3</div>
                            </div>
                            <div className="step-content">
                                <div className="step-header">
                                    <strong>Import & Activate</strong>
                                </div>
                                <p>Click <strong>"Import .env"</strong>, select the file you downloaded, and enter your login email and password.</p>
                                <div className="tip-box">
                                    <span className="tip-icon">💡</span>
                                    <span>This single action configures the entire email system.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PatchNotes = () => {
    return (
        <div className="patch-notes-container">
            <div className="patch-notes-wrapper">
                <header className="patch-notes-header">
                    <div className="header-top">
                        <h1>Patch Notes</h1>
                    </div>
                    <p className="update-meta">Track all updates and improvements to the studio system.</p>
                </header>

                <main className="patch-notes-main">

                    {/* v1.2.1 - The Visual & Dynamic Update */}
                    <PatchVersion version="v1.2.1" date="January 23, 2026" defaultExpanded={true}>
                        <FeatureCard
                            title="Services Page Revamp"
                            isFeatured
                            defaultExpanded
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <image x="2" y="2" width="20" height="20" href="/favicon.ico" />
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Adaptive "Menu Mode" Layout</strong>
                                    <ul>
                                        <li>Automatically detects packages without photos (e.g. Add-Ons).</li>
                                        <li>Switches to a premium "Frosted Glass" card design centered on screen.</li>
                                        <li>Features a grid-based layout with "See All / See Less" collapse toggle.</li>
                                    </ul>
                                </li>
                                <li><strong>Mobile Experience Overhaul</strong>
                                    <ul>
                                        <li>Optimized single-column stacking for small screens.</li>
                                        <li>Improved touch targets and spacing (3rem padding).</li>
                                        <li>Reduced motion and complexity for better mobile performance.</li>
                                    </ul>
                                </li>
                                <li><strong>Visual Polish</strong>
                                    <ul>
                                        <li><strong>Navigation:</strong> Non-sticky, terracotta-colored navbar for better contrast.</li>
                                        <li><strong>Scroll Tracker:</strong> Now accurately detects the middle of the viewport for active sections.</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Dynamic Admin Controls"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Flexible Pricing</strong>
                                    <ul>
                                        <li>Admins can now save services with empty prices (e.g. for custom quotes).</li>
                                        <li>Public site automatically hides the price tag if not set.</li>
                                        <li>Added safety confirmation popup for missing prices.</li>
                                    </ul>
                                </li>
                                <li><strong>Visibility Toggle</strong>
                                    <ul>
                                        <li>New "Visible" switch in Admin Dashboard.</li>
                                        <li>Instantly hide/show packages without deleting them.</li>
                                    </ul>
                                </li>
                                <li><strong>Backdrop Color Control</strong>
                                    <ul>
                                        <li>Enabled custom accent color styling for backdrop headers and titles.</li>
                                        <li>Admins can now fine-tune text contrast via the Accent Color picker.</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Performance & UX"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                    <polyline points="17 6 23 6 23 12"></polyline>
                                </svg>
                            }
                            badges={[<span key="improved" className="badge improved">IMPROVED</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Instant Image Loading</strong>
                                    <ul>
                                        <li>Switched to eager-loading for service images to eliminate "pop-in" delay.</li>
                                    </ul>
                                </li>
                                <li><strong>Booking Flow</strong>
                                    <ul>
                                        <li>Smart package auto-selection: Clicking "Book" now correctly pre-selects the specific package, overriding previous session data.</li>
                                        <li>Repositioned "Next Step" button for better intuitive mobile flow.</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>
                    </PatchVersion>

                    {/* v1.2.0 - The Reminder & IT Update */}
                    <PatchVersion version="v1.2.0" date="January 21, 2026" defaultExpanded={false}>
                        <FeatureCard
                            title="Session Reminders"
                            isFeatured
                            defaultExpanded
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Automated 30-Minute Warnings</strong>
                                    <ul>
                                        <li>System automatically scans for upcoming sessions every minute.</li>
                                        <li>Triggers email alerts exactly 30 minutes before start time.</li>
                                    </ul>
                                </li>
                                <li><strong>Dual Notification System</strong>
                                    <ul>
                                        <li><strong>Client:</strong> Friendly reminder to arrive early.</li>
                                        <li><strong>Admin:</strong> Operational alert to prepare the studio.</li>
                                    </ul>
                                </li>
                                <li><strong>Server-Side Reliability</strong>
                                    <ul>
                                        <li>Powered by robust background cron jobs.</li>
                                        <li>Works independently of browser sessions.</li>
                                    </ul>
                                </li>
                            </ul>

                            <SetupGuide />
                        </FeatureCard>

                        <FeatureCard
                            title="IT Notifications System"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Instant Email Alerts</strong>
                                    <ul>
                                        <li>Reports submitted now instantly notify the IT team via email.</li>
                                        <li>Emails include issue type, description, and direct screenshot links.</li>
                                    </ul>
                                </li>
                                <li><strong>Public & Admin Reporting</strong>
                                    <ul>
                                        <li>Unified reporting logic for both public visitors and internal staff.</li>
                                        <li>Consistent ticket tracking for all issue sources.</li>
                                    </ul>
                                </li>
                                <li><strong>Dedicated 'IT' Role</strong>
                                    <ul>
                                        <li>New user role specifically for technical staff.</li>
                                        <li>Ensures critical system alerts are routed only to the correct personnel.</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Email Template Refinements"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            }
                            badges={[<span key="improve" className="badge improved">IMPROVED</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Cleaner Layout</strong>
                                    <ul>
                                        <li>Removed emoji icons from headers for a more professional look.</li>
                                        <li>Improved spacing and alignment across all notification types.</li>
                                    </ul>
                                </li>
                                <li><strong>Standardized Formatting</strong>
                                    <ul>
                                        <li>Added consistent labeling (e.g., "Label: Value") to prevent display issues on mobile clients.</li>
                                        <li>Unified design language for Admin and Client alerts.</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>
                    </PatchVersion>

                    {/* v1.1.0 - The Admin Overhaul */}
                    <PatchVersion version="v1.1.0" date="January 21, 2026">
                        <FeatureCard
                            title="Notification System"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            }
                            badges={[<span key="core" className="badge improved">CORE</span>]}
                        >
                            <ul className="change-list">
                                <li><strong>Real-time Booking Alerts</strong>
                                    <ul>
                                        <li>Instant notification when new booking is submitted</li>
                                        <li>Automatic detection without page refresh</li>
                                    </ul>
                                </li>
                                <li><strong>Multi-Channel Notifications</strong>
                                    <ul>
                                        <li>Native browser notifications (Windows/macOS compatible)</li>
                                        <li>Taskbar icon flashing for background attention</li>
                                        <li>Custom notification sound</li>
                                    </ul>
                                </li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Services Management"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li>Complete services management interface for admins</li>
                                <li>Dynamic creation, editing, and deletion of service packages</li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Carousel Management"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li>Control homepage image carousel from the admin panel</li>
                                <li>Built-in image optimization and compression engine</li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Admin Report System"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            }
                            badges={[<span key="new" className="badge new">NEW</span>]}
                        >
                            <ul className="change-list">
                                <li>Direct communication line from admins to the IT team</li>
                                <li>Screenshot attachment support for clearer bug reporting</li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Backdrop Enhancements"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                </svg>
                            }
                            badges={[<span key="improved" className="badge improved">IMPROVED</span>]}
                        >
                            <ul className="change-list">
                                <li>Integrated professional-grade color wheel for backdrop selection</li>
                                <li>Real-time preview for hex, text, and accent color combinations</li>
                            </ul>
                        </FeatureCard>

                        <FeatureCard
                            title="Confirmation Dialogs"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            }
                            badges={[<span key="improved" className="badge improved">IMPROVED</span>]}
                        >
                            <ul className="change-list">
                                <li>Updated QoL design for all confirmation popups</li>
                                <li>Clearer visual feedback for destructive actions</li>
                            </ul>
                        </FeatureCard>
                    </PatchVersion>

                    <section className="patch-section planned">
                        <h2 className="section-label">Future Roadmap</h2>



                        <FeatureCard
                            title="Unified Notification Center"
                            isPlanned
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            }
                            badges={[<span key="planned" className="badge planned">PLANNED</span>]}
                        >
                            <p className="planned-note">A centralized notification hub within the Admin Dashboard to aggregate all system alerts, booking updates, and reports in a single view.</p>
                        </FeatureCard>

                        <FeatureCard
                            title="Audit & Walk-in System"
                            isPlanned
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                            }
                            badges={[<span key="planned" className="badge planned">PLANNED</span>]}
                        >
                            <p className="planned-note">Comprehensive audit logging integrated with a walk-in customer portal to capture all studio activity and manual bookings in one place.</p>
                        </FeatureCard>
                    </section>
                </main>

                <footer className="patch-notes-footer">
                    <p>If you encounter any issues or have suggestions, please use the <strong>Report Issue</strong> tool in the sidebar.</p>
                    <div className="footer-copyright">© 2026 It's ouR Studio</div>
                </footer>
            </div>
        </div>
    );
};

export default PatchNotes;
