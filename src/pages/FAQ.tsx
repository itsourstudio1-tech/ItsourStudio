import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './FAQ.css';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    order: number;
}

const FAQ = () => {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'siteContent', 'faq'));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.items) {
                        setFaqs(data.items.sort((a: FAQItem, b: FAQItem) => a.order - b.order));
                    }
                }
            } catch (err) {
                console.error("Error fetching FAQs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // SEO: Generate FAQ Schema
    const faqSchema = faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    } : null;

    return (
        <div className="faq-page">
            {faqSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
                </script>
            )}
            <div className="faq-container">
                <div className="faq-header">
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about our studio services.</p>
                </div>

                {loading ? (
                    <div className="faq-loading">
                        <div className="spinner"></div>
                    </div>
                ) : faqs.length > 0 ? (
                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div
                                key={faq.id}
                                className={`faq-item ${openIndex === index ? 'active' : ''}`}
                            >
                                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                                    <span>{faq.question}</span>
                                    <span className="faq-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </span>
                                </button>
                                <div className="faq-answer">
                                    <div className="faq-answer-content">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <p>No questions added yet. Please contact us directly!</p>
                        <Link to="/contact" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Contact Us</Link>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '4rem', color: '#666' }}>
                    <p>Can't find what you're looking for?</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <a href="mailto:itsourstudio1@gmail.com" style={{ color: '#c9a86c', fontWeight: 600 }}>Email Us</a>
                        <span>•</span>
                        <a href="https://www.facebook.com/itsouRstudioo/" target="_blank" rel="noreferrer" style={{ color: '#c9a86c', fontWeight: 600 }}>Message on Facebook</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
