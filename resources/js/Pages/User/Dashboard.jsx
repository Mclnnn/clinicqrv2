import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, ClipboardList, FileText, HeartPulse, NotebookText } from 'lucide-react';
import UserLayout from '../../Layouts/UserLayout';

function fmtDate(value) {
    return value ? new Date(value).toLocaleString() : 'No record';
}

export default function Dashboard({ totalVisits, lastVisit, recentVisits, clearances, latestClearance, medicalNotes, totalNotes }) {
    return (
        <UserLayout title="Dashboard" subtitle="Your clinic activity, clearances, and medical notes.">
            <Head title="User Dashboard" />

            <section className="cq-dashboard-hero">
                <div className="min-w-0">
                    <span className="cq-kicker">Health Snapshot</span>
                    <h2 className="cq-font-display mt-5 text-3xl font-black leading-tight sm:text-4xl">Your clinic records at a glance.</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                        Track recent visits, clearance progress, and clinic notes without digging through tables.
                    </p>
                </div>
                <Link href="/student/appointments" className="cq-primary-btn">
                    <CalendarCheck size={18} aria-hidden="true" /> Book appointment
                </Link>
            </section>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={HeartPulse} label="Total visits" value={totalVisits ?? 0} tone="blue" />
                <Stat icon={ClipboardList} label="Clearance" value={latestClearance?.status ?? 'No record'} tone="blue-light" />
                <Stat icon={CalendarCheck} label="Last visit" value={lastVisit ? new Date(lastVisit.timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'None'} tone="blue-muted" />
                <Stat icon={NotebookText} label="Med notes" value={totalNotes ?? 0} tone="amber" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <Panel title="Recent Visit History" action={<Link href="/user/visits" className="text-sm font-bold text-blue-200">View all</Link>}>
                    <List empty="No visits yet." items={recentVisits?.map(visit => ({
                        title: visit.visit_purpose ?? 'Clinic Visit',
                        meta: fmtDate(visit.timestamp),
                        tag: visit.verification_status ?? 'Logged',
                    }))} />
                </Panel>

                <Panel title="Clearance Requests">
                    <List empty="No clearance requests yet." items={clearances?.map(clearance => ({
                        title: clearance.clearance_type ?? clearance.purpose ?? 'Medical Clearance',
                        meta: clearance.created_at ? new Date(clearance.created_at).toLocaleDateString() : 'Recent',
                        tag: clearance.status,
                    }))} />
                </Panel>
            </div>

            <Panel title="Medical Notes" className="mt-6">
                <List empty="No medical notes yet." items={medicalNotes?.map(note => ({
                    title: note.medical_notes ?? 'Medical note',
                    meta: fmtDate(note.timestamp),
                    tag: note.visit_purpose ?? 'Visit',
                }))} />
            </Panel>
        </UserLayout>
    );
}

function Stat({ icon: Icon, label, value, tone }) {
    return (
        <div className={`cq-dash-stat ${tone}`}>
            <span className="cq-dash-stat-icon"><Icon size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
                <div className="truncate text-2xl font-black">{value}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/42">{label}</div>
            </div>
        </div>
    );
}

function Panel({ title, action, children, className = '' }) {
    return (
        <section className={`cq-dash-panel ${className}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="cq-section-title">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function List({ items = [], empty }) {
    if (!items.length) {
        return (
            <div className="cq-empty-state">
                <FileText size={20} aria-hidden="true" />
                <span>{empty}</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="cq-list-item">
                    <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{item.title}</div>
                        <div className="mt-1 text-xs text-white/42">{item.meta}</div>
                    </div>
                    <span className="cq-mini-badge">{item.tag ?? 'Logged'}</span>
                </div>
            ))}
        </div>
    );
}
