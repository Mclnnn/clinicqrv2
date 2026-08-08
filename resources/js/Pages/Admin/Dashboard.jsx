import { Head, Link } from '@inertiajs/react';
import { Activity, AlertTriangle, ClipboardCheck, FileText, PackageCheck, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function Dashboard({ visitLogs, clearanceRecords, activityLogs, stats, analytics }) {
    const report = analytics?.monthlyReport ?? {};

    return (
        <AdminLayout title="Dashboard" subtitle="Live clinic operations, inventory, and health trends.">
            <Head title="Admin Dashboard" />

            <section className="cq-dashboard-hero admin">
                <div className="min-w-0">
                    <span className="cq-kicker">Operations</span>
                    <h2 className="cq-font-display mt-5 text-3xl font-black leading-tight sm:text-4xl">Clinic command center</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                        {report.topConcern?.label ?? 'Clinic visits'} lead this month with {report.currentTotal ?? 0} total visits recorded.
                    </p>
                </div>
                <Link href="/admin/visit-logs" className="cq-primary-btn">
                    <Stethoscope size={18} aria-hidden="true" /> View visits
                </Link>
            </section>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={Users} label="Users" value={stats?.total_users ?? 0} tone="blue" />
                <Stat icon={Stethoscope} label="Clinic visits" value={stats?.total_visits ?? 0} tone="blue-light" />
                <Stat icon={ClipboardCheck} label="Pending clearances" value={stats?.pending_clearances ?? 0} tone="blue-muted" />
                <Stat icon={AlertTriangle} label="Low stock items" value={(analytics?.medicineStock?.critical ?? 0) + (analytics?.medicineStock?.needOrder ?? 0)} tone="amber" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Panel title="Weekly Check-ins" action={<span className="cq-mini-badge">Last 7 days</span>}>
                    <BarChart rows={analytics?.weeklyTrend} />
                </Panel>
                <Panel title="Visit Purposes" action={<span className="cq-mini-badge">30 days</span>}>
                    <RankedBars rows={analytics?.visitPurpose} />
                </Panel>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <Panel title="Medicine Inventory" action={<Link href="/admin/medicines" className="text-sm font-bold text-blue-200">Manage</Link>}>
                    <InventorySummary stock={analytics?.medicineStock} />
                </Panel>
                <Panel title="Today Queue" action={<Link href="/admin/visit-logs" className="text-sm font-bold text-blue-200">Open logs</Link>}>
                    <Rows items={analytics?.todayQueue?.map(item => ({
                        title: item.name ?? 'Unknown student',
                        meta: `${item.purpose ?? 'Clinic Visit'} • ${item.time ?? ''}`,
                        tag: item.status,
                    }))} empty="No check-ins today." />
                </Panel>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel title="Recent Visits" action={<Link href="/admin/visit-logs" className="text-sm font-bold text-blue-200">Manage</Link>}>
                    <Rows items={visitLogs?.slice(0, 8).map(log => ({
                        title: log.patient_name ?? 'Unknown patient',
                        meta: log.visit_purpose ?? 'Clinic Visit',
                        tag: log.verification_status ?? 'Logged',
                    }))} empty="No visits yet." />
                </Panel>
                <Panel title="Clearances" action={<Link href="/admin/clearances" className="text-sm font-bold text-blue-200">Review</Link>}>
                    <Rows items={clearanceRecords?.slice(0, 8).map(item => ({
                        title: item.patient_name ?? 'Unknown patient',
                        meta: item.clearance_type ?? item.purpose ?? 'Medical Clearance',
                        tag: item.status,
                    }))} empty="No clearances yet." />
                </Panel>
            </div>

            <Panel title="Activity Logs" className="mt-6">
                <Rows items={activityLogs?.slice(0, 10).map(log => ({
                    title: log.user_name ?? 'System',
                    meta: log.action ?? log.additional_details ?? 'Activity',
                    tag: log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Recent',
                }))} empty="No activity yet." />
            </Panel>
        </AdminLayout>
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
    return <section className={`cq-dash-panel ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="cq-section-title">{title}</h2>{action}</div>{children}</section>;
}

function BarChart({ rows = [] }) {
    const max = Math.max(...rows.map(row => Number(row.value) || 0), 1);

    return (
        <div className="flex h-64 items-end gap-3 border-b border-white/10 pb-3">
            {rows.map(row => {
                const height = row.value ? Math.max((row.value / max) * 100, 8) : 3;
                return (
                    <div key={row.date ?? row.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-xs font-black text-white/70">{row.value}</span>
                        <div className="flex w-full flex-1 items-end rounded-t-lg bg-white/5 p-1">
                            <div className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 via-blue-300 to-emerald-200 transition-all duration-700" style={{ height: `${height}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{row.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function RankedBars({ rows = [] }) {
    const max = Math.max(...rows.map(row => Number(row.value) || 0), 1);
    if (!rows.length) return <div className="cq-empty-state"><FileText size={20} /><span>No visit data yet.</span></div>;

    return (
        <div className="space-y-3">
            {rows.map((row, index) => (
                <div key={row.label} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-bold">{index + 1}. {row.label}</span>
                        <span className="font-black text-blue-200">{row.value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${Math.max((row.value / max) * 100, 6)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function InventorySummary({ stock = {} }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <MiniStat icon={PackageCheck} label="Available" value={stock.available ?? 0} />
                <MiniStat icon={AlertTriangle} label="Critical" value={stock.critical ?? 0} />
            </div>
            <Rows items={stock.lowest?.map(item => ({
                title: item.name,
                meta: item.category ?? 'Medicine',
                tag: `${item.quantity} left`,
            }))} empty="Inventory is empty." />
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <Icon size={18} className="text-blue-200" aria-hidden="true" />
            <div className="mt-3 text-2xl font-black">{value}</div>
            <div className="mt-1 text-xs font-black uppercase text-slate-500">{label}</div>
        </div>
    );
}

function Rows({ items = [], empty }) {
    if (!items?.length) {
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
                        <div className="mt-1 truncate text-xs text-white/42">{item.meta}</div>
                    </div>
                    <span className="cq-mini-badge">{item.tag ?? 'Recent'}</span>
                </div>
            ))}
        </div>
    );
}
