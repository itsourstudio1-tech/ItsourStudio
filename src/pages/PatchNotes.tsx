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

const PatchNotes = () => {
    return (
        <div className="patch-notes-container">
            <div className="patch-notes-wrapper">
                <header className="patch-notes-header">
                    <div className="header-top">
                        <h1>Patch Notes</h1>
                        <span className="version-tag">v1.1.0</span>
                    </div>
                    <p className="update-meta">Released on January 21, 2026</p>
                </header>

                <main className="patch-notes-main">
                    <section className="patch-section">
                        <h2 className="section-label">Completed Updates</h2>

                        <FeatureCard
                            title="Notification System"
                            isFeatured
                            defaultExpanded
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            }
                            badges={[
                                <span key="new" className="badge new">NEW</span>,
                                <span key="featured" className="badge featured">MAJOR</span>
                            ]}
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
                                        <li>Browser tab title flashing and favicon badge indicators</li>
                                    </ul>
                                </li>
                                <li><strong>Admin Integration</strong>
                                    <ul>
                                        <li>Professional HTML email alerts with full booking details</li>
                                        <li>Click notification to jump directly to bookings page</li>
                                        <li>Persistent alerts in Windows Action Center</li>
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
                                <li>Flexible pricing, duration, and description configurations</li>
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
                                <li>Category organization (Solo, Duo, Group)</li>
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
                                <li>Automated IT alerts for every new report submission</li>
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
                                <li>Streamlined popover interface for a cleaner workspace</li>
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
                                <li>Standardized UI across all dashboard modules</li>
                            </ul>
                        </FeatureCard>
                    </section>

                    <section className="patch-section planned">
                        <h2 className="section-label">Future Roadmap</h2>

                        <FeatureCard
                            title="Session Reminders"
                            isPlanned
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            }
                            badges={[<span key="planned" className="badge planned">PLANNED</span>]}
                        >
                            <p className="planned-note">Automated multi-channel reminders scheduled 30 minutes before every session to minimize no-shows.</p>
                        </FeatureCard>

                        <FeatureCard
                            title="IT Admin Notifications"
                            isPlanned
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                </svg>
                            }
                            badges={[<span key="planned" className="badge planned">PLANNED</span>]}
                        >
                            <p className="planned-note">Real-time alerts for the IT team whenever high-priority admin reports are filed.</p>
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
