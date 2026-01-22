import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    return (
        <div className="privacy-policy-page">
            <div className="privacy-container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: December 20, 2025</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        It's ouR Studio ("we," "us," or "our") is committed to protecting your privacy
                        in accordance with Republic Act No. 10173, also known as the Data Privacy Act of 2012
                        of the Philippines, and its Implementing Rules and Regulations.
                    </p>
                    <p>
                        This Privacy Policy explains how we collect, use, disclose, and protect your
                        personal information when you use our website and services.
                    </p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>
                    <p>We collect the following personal information when you book our services:</p>
                    <ul>
                        <li><strong>Full Name</strong> - to identify you and personalize our services</li>
                        <li><strong>Email Address</strong> - to send booking confirmations and updates</li>
                        <li><strong>Phone Number</strong> - to contact you regarding your booking</li>
                        <li><strong>Preferred Date and Time</strong> - to schedule your session</li>
                        <li><strong>Selected Package</strong> - to prepare for your session</li>
                        <li><strong>Payment Proof</strong> - to verify your reservation payment</li>
                    </ul>
                </section>

                <section>
                    <h2>3. How We Use Your Information</h2>
                    <p>Your personal information is used for the following purposes:</p>
                    <ul>
                        <li>Processing and managing your bookings</li>
                        <li>Communicating with you about your sessions</li>
                        <li>Sending booking confirmations and reminders</li>
                        <li>Improving our services and customer experience</li>
                        <li>Complying with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Legal Basis for Processing</h2>
                    <p>
                        We process your personal data based on your <strong>consent</strong>, which you
                        provide when submitting the booking form, and for the <strong>performance of a contract</strong>
                        (your photography session booking).
                    </p>
                </section>

                <section>
                    <h2>5. Data Sharing and Disclosure</h2>
                    <p>
                        We do <strong>not</strong> sell, trade, or rent your personal information to third parties.
                        Your data may only be shared with:
                    </p>
                    <ul>
                        <li>Service providers who help us operate our business (e.g., email services)</li>
                        <li>Legal authorities when required by law</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational security measures to protect
                        your personal data, including:
                    </p>
                    <ul>
                        <li>Encrypted data transmission (SSL/HTTPS)</li>
                        <li>Secure authentication for administrative access</li>
                        <li>Access controls limiting who can view your data</li>
                        <li>Regular security updates and monitoring</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Data Retention</h2>
                    <p>
                        We retain your personal information only for as long as necessary to fulfill the
                        purposes for which it was collected, typically for a period of <strong>2 years</strong> after
                        your last transaction with us, unless a longer retention period is required by law.
                    </p>
                </section>

                <section>
                    <h2>8. Your Rights as a Data Subject</h2>
                    <p>Under the Data Privacy Act of 2012, you have the following rights:</p>
                    <ul>
                        <li><strong>Right to be Informed</strong> - Know how your data is being processed</li>
                        <li><strong>Right to Access</strong> - Request a copy of your personal data</li>
                        <li><strong>Right to Correction</strong> - Request correction of inaccurate data</li>
                        <li><strong>Right to Erasure</strong> - Request deletion of your data</li>
                        <li><strong>Right to Object</strong> - Object to certain processing activities</li>
                        <li><strong>Right to Data Portability</strong> - Receive your data in a portable format</li>
                    </ul>
                    <p>
                        To exercise any of these rights, please contact us using the information below.
                    </p>
                </section>

                <section>
                    <h2>9. Cookies and Tracking</h2>
                    <p>
                        Our website uses cookies and similar technologies for analytics purposes
                        (Google Analytics via Firebase). These help us understand how visitors use our site
                        to improve the user experience. You can control cookies through your browser settings.
                    </p>
                </section>

                <section>
                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. Any changes will be posted
                        on this page with an updated "Last Updated" date. We encourage you to review this
                        policy periodically.
                    </p>
                </section>

                <section>
                    <h2>11. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy or wish to exercise your
                        data subject rights, please contact us:
                    </p>
                    <div className="contact-info">
                        <p><strong>It's ouR Studio</strong></p>
                        <p>Email: itsourstudio1@gmail.ccom</p>
                        <p>Phone: 0905 336 7103</p>
                    </div>
                </section>

                <section>
                    <h2>12. Complaints</h2>
                    <p>
                        If you believe your data privacy rights have been violated, you may file a complaint
                        with the <strong>National Privacy Commission (NPC)</strong>:
                    </p>
                    <div className="contact-info">
                        <p>Website: <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer">www.privacy.gov.ph</a></p>
                        <p>Email: complaints@privacy.gov.ph</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
