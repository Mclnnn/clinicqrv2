import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Pill, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';

const prompts = [
    {
        question: 'How are you feeling today?',
        sub: 'Welcome back to your ClinicQR portal. Your clinic services are ready whenever you need them.',
    },
    {
        question: 'Any symptoms bothering you lately?',
        sub: "Do not ignore the signs. Try the symptom checker or book a consultation with clinic staff.",
    },
    {
        question: 'When was your last clinic visit?',
        sub: 'Regular checkups help you stay ahead of health concerns. Booking an appointment only takes a minute.',
    },
    {
        question: 'Have you been getting enough rest?',
        sub: 'Fatigue and stress can affect your health. The clinic is here to help you get proper care.',
    },
];

const imageSlides = [
    {
        image: '/images/clinic/1.png',
        title: 'DSSC Clinic',
        desc: 'Facilities and services',
        href: '/student/appointments',
        cta: 'Book Now',
    },
    {
        image: '/images/clinic/2.png',
        title: 'Clinic Area',
        desc: 'Comfortable care space',
        href: '/user/visits',
        cta: 'View Visits',
    },
    {
        image: '/images/clinic/3.png',
        title: 'Medicines',
        desc: 'Check available stocks',
        href: '/student/medicines',
        cta: 'View Medicines',
    },
];

const serviceSlides = [
    {
        icon: Stethoscope,
        title: 'DSSC Clinic is Open',
        desc: 'Mon - Fri, 8:00 AM - 5:00 PM. Walk-ins and scheduled appointments welcome.',
        href: '/student/appointments',
        cta: 'Book Now',
        tone: 'blue',
    },
    {
        icon: CalendarDays,
        title: 'Skip the Queue',
        desc: 'Book your appointment online and arrive right on time.',
        href: '/student/appointments',
        cta: 'Schedule',
        tone: 'blue',
    },
    {
        icon: Pill,
        title: 'Medicines Available',
        desc: 'Check what is currently stocked at the clinic before your visit.',
        href: '/student/medicines',
        cta: 'View Stocks',
        tone: 'blue-soft',
    },
];

export default function Home({ totalVisits, recentVisits, latestClearance, totalNotes, upcomingAppointment }) {
    const { auth } = usePage().props;
    const name = auth?.user?.name?.split(' ')?.[0] ?? '';
    const [promptIndex, setPromptIndex] = useState(0);
    const [imageIndex, setImageIndex] = useState(0);
    const [serviceIndex, setServiceIndex] = useState(0);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setPromptIndex(index => (index + 1) % prompts.length);
        }, 4500);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setImageIndex(index => (index + 1) % imageSlides.length);
        }, 8000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setServiceIndex(index => (index + 1) % serviceSlides.length);
        }, 5500);
        return () => window.clearInterval(timer);
    }, []);

    const prompt = prompts[promptIndex];

    return (
        <UserLayout title="Home" subtitle="Your personal clinic portal.">
            <Head title="Home" />

            <section className="cq-glass cq-home-hero cq-home-hero-rich">
                <div className="cq-kicker">{greeting}</div>
                <h2 className="cq-font-display mt-7 text-4xl font-black leading-tight sm:text-5xl">
                    Hey{name ? `, ${name}` : ''}.
                </h2>
                <p key={prompt.question} className="cq-font-display cq-rotating-copy mt-3 max-w-4xl text-4xl font-black leading-tight text-white/50 sm:text-5xl">
                    {prompt.question}
                </p>
                <p key={prompt.sub} className="cq-rotating-copy mt-6 max-w-xl text-lg leading-8 text-white/45">
                    {prompt.sub}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/student/symptom-checker" className="cq-primary-btn">
                        <Stethoscope size={18} aria-hidden="true" /> Check symptoms
                    </Link>
                    <Link href="/student/appointments" className="cq-soft-btn">
                        <CalendarDays size={18} aria-hidden="true" /> Book appointment
                    </Link>
                </div>
            </section>

            <section className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <Carousel
                    slides={imageSlides}
                    index={imageIndex}
                    setIndex={setImageIndex}
                    renderSlide={slide => (
                        <div className="cq-photo-slide">
                            <img src={slide.image} alt={slide.title} />
                            <div className="cq-photo-slide-content">
                                <h3 className="cq-font-display text-3xl font-black">{slide.title}</h3>
                                <p className="mt-2 text-lg text-white/70">{slide.desc}</p>
                                <Link href={slide.href} className="cq-slide-btn">{slide.cta}</Link>
                            </div>
                        </div>
                    )}
                />

                <Carousel
                    slides={serviceSlides}
                    index={serviceIndex}
                    setIndex={setServiceIndex}
                    className="cq-service-carousel"
                    renderSlide={slide => {
                        const Icon = slide.icon;
                        return (
                            <div className={`cq-service-slide ${slide.tone}`}>
                                <span className="cq-service-icon"><Icon size={30} aria-hidden="true" /></span>
                                <h3 className="cq-font-display mt-4 text-3xl font-black">{slide.title}</h3>
                                <p className="mt-3 max-w-md text-white/70">{slide.desc}</p>
                                <Link href={slide.href} className="cq-slide-btn">{slide.cta}</Link>
                            </div>
                        );
                    }}
                />
            </section>

            <section className="mt-7 grid gap-4 md:grid-cols-4">
                <Card label="Total visits" value={totalVisits ?? 0} tone="blue" />
                <Card label="Clearance" value={latestClearance?.status ?? 'No record'} tone="blueLight" />
                <Card label="Last visit" value={recentVisits?.[0]?.timestamp ? new Date(recentVisits[0].timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'None'} tone="blueMuted" />
                <Card label="Med notes" value={totalNotes ?? 0} tone="amber" />
            </section>

            <section className="mt-7 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="space-y-4">
                    {upcomingAppointment && (
                        <section className="cq-glass p-5">
                            <div className="text-sm font-black uppercase tracking-widest text-blue-200">Upcoming Appointment</div>
                            <div className="mt-2 text-xl font-black">{upcomingAppointment.appointment_date}</div>
                        </section>
                    )}

                    <section className="cq-info-strip">
                        <Info icon={Clock} label="Clinic Hours" main="Mon - Fri, 8:00 AM - 5:00 PM" sub="Closed weekends and holidays" />
                        <Info icon={MapPin} label="Location" main="Admin Building, Ground Floor" sub="DSSC Main Campus" />
                        <Info icon={Phone} label="Contact" main="clinic@dssc.edu.ph" sub="Ask the clinic desk for urgent care" />
                    </section>
                </div>

                <section className="cq-glass p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="cq-section-title">Recent visits</h2>
                        <Link href="/user/visits" className="text-sm font-bold text-blue-200">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {recentVisits?.length ? recentVisits.slice(0, 4).map(visit => (
                            <div key={visit.log_id} className="cq-list-item">
                                <div className="min-w-0">
                                    <div className="truncate font-bold">{visit.visit_purpose ?? 'Clinic Visit'}</div>
                                    <div className="mt-1 text-sm text-white/45">{visit.timestamp ? new Date(visit.timestamp).toLocaleString() : 'Recent'}</div>
                                </div>
                                <span className="cq-mini-badge">{visit.verification_status ?? 'Logged'}</span>
                            </div>
                        )) : <p className="text-sm text-white/45">No visits yet.</p>}
                    </div>
                </section>
            </section>
        </UserLayout>
    );
}

function Carousel({ slides, index, setIndex, renderSlide, className = '' }) {
    function move(direction) {
        setIndex(value => (value + direction + slides.length) % slides.length);
    }

    return (
        <div className={`cq-glass cq-carousel ${className}`}>
            <div className="cq-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
                {slides.map(slide => (
                    <div key={slide.title} className="cq-carousel-slide">
                        {renderSlide(slide)}
                    </div>
                ))}
            </div>
            <button type="button" className="cq-car-btn prev" onClick={() => move(-1)} aria-label="Previous slide">
                <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" className="cq-car-btn next" onClick={() => move(1)} aria-label="Next slide">
                <ChevronRight size={18} aria-hidden="true" />
            </button>
            <div className="cq-dots">
                {slides.map((slide, dotIndex) => (
                    <button
                        key={slide.title}
                        type="button"
                        className={`cq-dot ${dotIndex === index ? 'active' : ''}`}
                        onClick={() => setIndex(dotIndex)}
                        aria-label={`Go to ${slide.title}`}
                    />
                ))}
            </div>
        </div>
    );
}

function Card({ label, value, tone }) {
    const colors = {
        blue: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
        blueLight: 'border-blue-300/20 bg-blue-300/10 text-blue-100',
        blueMuted: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
        amber: 'border-white/20 bg-white/10 text-white',
    };

    return (
        <div className={`cq-stat border ${colors[tone] ?? 'border-white/10'}`}>
            <div className="text-2xl font-black">{value}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-wide text-white/40">{label}</div>
        </div>
    );
}

function Info({ icon: Icon, label, main, sub }) {
    return (
        <div className="cq-glass cq-info-cell">
            <span className="cq-info-icon"><Icon size={20} aria-hidden="true" /></span>
            <span className="min-w-0">
                <span className="cq-info-label">{label}</span>
                <span className="cq-info-main">{main}</span>
                <span className="cq-info-sub">{sub}</span>
            </span>
        </div>
    );
}
