import { Head, Link } from '@inertiajs/react';
import {
    FileText,
    HousePlus,
    Megaphone,
    Syringe,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const stepData = [
    { num: 1, title: 'Create Account', desc: 'Register using your student or employee ID and complete your health profile in seconds.' },
    { num: 2, title: 'Get Approved', desc: 'Admin reviews your account. Students are auto-approved; staff accounts are verified by admins.' },
    { num: 3, title: 'Book a Visit', desc: 'Choose a date, pick a time slot, and confirm. Your appointment is set in under a minute.' },
    { num: 4, title: 'Scan & Check In', desc: 'Show your QR code at the clinic desk. Check-in is instant - fully paperless, fully seamless.' },
];

const serviceData = [
    { icon: HousePlus, title: 'General Consultation', desc: 'Book your clinic slot in advance for general health concerns. Reduce waiting time and get the care you need faster.', tag: 'Walk-in & Scheduled', tagClass: 'tag-blue' },
    { icon: FileText, title: 'Medical Certificates', desc: 'Request official medical certificates and clearances for academic requirements, internship, or employment.', tag: 'Digital Delivery', tagClass: 'tag-navy' },
    { icon: Syringe, title: 'Health Record Tracking', desc: 'All your clinic visits and medical notes in one secure place. Your complete health history, always accessible.', tag: 'Visit History', tagClass: 'tag-green' },
    { icon: Megaphone, title: 'Clinic Events & Alerts', desc: 'Stay informed about medical missions, vaccination drives, and health campaigns happening at DSSC.', tag: 'Announcements', tagClass: 'tag-blue' },
];

export default function Welcome() {
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setNavScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add('on');
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.rev').forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    return (
        <main className="landing-page">
            <Head title="ClinicQR - DSSC Health Services" />

            {/* Background Elements */}
            <div className="scene"></div>
            <div className="orb orb1"></div>
            <div className="orb orb2"></div>
            <div className="orb orb3"></div>

            {/* Navigation */}
            <nav className={navScrolled ? 'scrolled' : ''}>
                <div className="wrap">
                    <div className="nav-row">
                        <Link className="logo" href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src="/images/clinic/school logo.png" alt="DSSC" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                                <span style={{ fontSize: '9px', fontWeight: '600', opacity: 0.85, letterSpacing: '0.3px' }}>DAVAO DEL SUR STATE COLLEGE</span>
                                <span className="logo-name" style={{ margin: 0 }}>Clinic<em>QR</em></span>
                            </div>
                        </Link>
                        <ul className="nav-links">
                            <li><Link href="#steps">How it Works</Link></li>
                            <li><Link href="#services">Services</Link></li>
                            <li><Link href="/login" className="nav-btn">Sign In</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="overlay"></div>
                <div className="wrap hero-grid">
                    {/* Left Content */}
                    <div className="hero-left">
                        <span className="badge">DSSC Infirmary Care Center</span>
                        <h1>Your Campus Clinic,<br />Now Fully Digital.</h1>
                        <p>Book appointments, scan in with your QR code, request medical clearances, and check symptoms - all from one beautifully unified platform.</p>
                        <Link href="/register" className="btn-primary">Get Started</Link>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="steps">
                <div className="wrap">
                    <div className="rev" style={{ textAlign: 'center' }}>
                        <div className="s-chip" style={{ justifyContent: 'center' }}>How it Works</div>
                        <h2>Live in four<br />simple steps.</h2>
                        <p className="s-sub" style={{ margin: '0 auto' }}>From registration to your first clinic visit - it takes less than five minutes.</p>
                    </div>

                    <div className="steps-row">
                        {stepData.map((step, idx) => (
                            <div key={step.num} className="glass step rev" style={{ transitionDelay: `${idx * 0.1}s` }}>
                                <div className="step-n">{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="wrap">
                <div className="divider-accent"></div>
            </div>

            {/* Services Section */}
            <section id="services">
                <div className="wrap">
                    <div className="rev">
                        <div className="s-chip">Services</div>
                        <h2>All clinic services,<br />now digital.</h2>
                        <p className="s-sub">Everything DSSC Clinic offers, accessible from any device at any time.</p>
                    </div>

                    <div className="svc-grid">
                        {serviceData.map((service, idx) => {
                            const ServiceIcon = service.icon;

                            return (
                            <div key={idx} className="glass svc rev" style={{ transitionDelay: `${idx * 0.1}s` }}>
                                <div className="svc-i">
                                    <ServiceIcon size={27} strokeWidth={2.2} aria-hidden="true" />
                                </div>
                                <div>
                                    <h3>{service.title}</h3>
                                    <p>{service.desc}</p>
                                    <span className={`tag ${service.tagClass}`}>{service.tag}</span>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <div className="cta-wrap">
                <div className="wrap">
                    <div className="glass cta-box rev">
                        <div className="s-chip" style={{ justifyContent: 'center', marginBottom: '22px' }}>Ready to Start?</div>
                        <h2>Take control of your<br /><span style={{ color: 'var(--teal-light)' }}>health journey today.</span></h2>
                        <p>Join thousands of DSSC students and staff already on ClinicQR.</p>
                        <div className="cta-btns">
                            <Link href="/register" className="btn-primary">Create Account</Link>
                            <Link href="/login" className="btn-secondary">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer>
                <div className="wrap">
                    <div className="foot-row">
                        <div className="foot-copy">(c) 2025 ClinicQR - DSSC Health Services. All rights reserved.</div>
                        <ul className="foot-links">
                            <li><a href="#">Privacy</a></li>
                            <li><a href="#">Terms</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </main>
    );
}
