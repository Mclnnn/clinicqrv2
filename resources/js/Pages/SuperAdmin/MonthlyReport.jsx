import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowLeft, BrainCircuit, CalendarCheck, CheckCircle2, ClipboardCheck, FileText, MapPin, TrendingUp } from 'lucide-react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';
import InfoTooltip from '../../Components/InfoTooltip';

export default function MonthlyReport({ intelligence = {} }) {
    const actual = intelligence.actual ?? {};
    const forecast = intelligence.forecast;
    const workload = intelligence.workloadForecast ?? {};
    const workloadRow = workload.row;
    const workloadInfo = workload.modelInfo ?? {};
    const decision = intelligence.decision;
    const event = intelligence.event;

    return (
        <SuperAdminLayout
            title="Monthly Health Intelligence Report"
            subtitle="Actual clinic activity, ML forecast, clinic-head review, and prevention follow-through."
            actions={<Link href="/superadmin/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-900"><ArrowLeft size={16} /> Dashboard</Link>}
        >
            <Head title="Monthly Health Intelligence Report" />

            <section className="overflow-hidden rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),linear-gradient(135deg,#0f172a,#020617)] p-6 shadow-2xl shadow-slate-950/50">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-100"><BrainCircuit size={14} /> Decision-support report</span>
                <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div><h2 className="text-3xl font-black sm:text-4xl">{actual.month ?? 'Monthly report'}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">A clear record of what the clinic observed, what the ML model forecasts, and how the clinic head responded.</p></div>
                    <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]"><Metric label="Actual visits" value={actual.currentTotal ?? 0} /><Metric label="Next-month forecast" value={forecast?.predicted_cases ?? '—'} /><Metric label="Decision" value={decision?.decision ?? 'Pending'} compact /></div>
                </div>
            </section>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <Stage number="1" title="Actual clinic activity" icon={Activity} tone="border-blue-300/30" subtitle={intelligence.actualDataStatus}>
                    <div className="grid gap-3 sm:grid-cols-3"><DataBox label="This month" value={actual.currentTotal ?? 0} /><DataBox label="Last month" value={actual.previousTotal ?? 0} /><DataBox label="Change" value={`${actual.change ?? 0}%`} /></div>
                    {(actual.currentTotal ?? 0) > 0 ? <><div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Top current concern</div><div className="mt-2 text-xl font-black text-white">{actual.topConcern?.label} <span className="text-cyan-200">({actual.topConcern?.value} cases)</span></div></div><Hotspots rows={actual.departmentHotspots ?? []} /></> : <EmptyState text="Actual ClinicQR data will appear here once this month’s visits are recorded." />}
                </Stage>

                <Stage number="2" title="Next-month ML forecast" icon={TrendingUp} tone="border-cyan-300/35" subtitle={forecast ? `Historical data through ${formatMonth(intelligence.sourceMonth)} → forecast for ${formatMonth(intelligence.predictionMonth)}` : 'Forecast file not available'}>
                    {forecast ? <><div className="rounded-xl border border-cyan-300/30 bg-cyan-950/50 p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-widest text-cyan-200">Highest review priority</div><div className="mt-2 text-2xl font-black text-white">{forecast.complaint_category}</div></div><InfoTooltip text="Priority score (0–100): higher means earlier clinic-head review." side="bottom"><span className="cursor-help rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-black text-cyan-100">Priority {forecast.priority_score}</span></InfoTooltip></div><div className="mt-4 grid grid-cols-3 gap-3"><DataBox label="Current" value={forecast.current_cases} tooltip="Latest recorded case count in the forecast's source month." /><DataBox label="Predicted" value={forecast.predicted_cases} tooltip="ML estimate for the next month. This is for planning, not diagnosis." /><DataBox label="Trend" value={forecast.trend_level} tooltip="A label showing how the forecast compares with recent historical patterns." /></div></div><div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4"><div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-400">ML recommendation <InfoTooltip text="An ML recommendation is a suggested preventive response. The clinic head must review and decide the final action." /></div><p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{forecast.recommendation}</p><p className="mt-2 text-sm leading-6 text-slate-400">{forecast.reason}</p></div></> : <EmptyState text="Run the ML training script to generate a next-month health forecast." />}
                </Stage>

                <Stage number="3" title="Operational workload test forecast" icon={CalendarCheck} tone="border-indigo-300/35" subtitle={workloadRow ? `Dataset test forecast for ${formatWeekRange(workloadRow.prediction_week_start, workloadRow.prediction_week)}` : 'Workload forecast file not available'}>
                    {workloadRow ? <><div className="rounded-xl border border-indigo-300/30 bg-indigo-950/45 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-widest text-indigo-200">Expected clinic workload</div><div className="mt-2 text-2xl font-black text-white">{workloadRow.predicted_total_visits} visits <span className="text-indigo-200">({workloadRow.workload_level})</span></div></div><InfoTooltip text="Workload score (0-100): higher means earlier preparation." side="bottom"><span className="cursor-help rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-sm font-black text-indigo-100">Score {workloadRow.priority_score}</span></InfoTooltip></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><DataBox label="Dataset latest week" value={formatWeekRange(workloadRow.source_week_start, workloadRow.source_week)} /><DataBox label="Test forecast week" value={formatWeekRange(workloadRow.prediction_week_start, workloadRow.prediction_week)} /><DataBox label="8-week average" value={Number(workloadRow.rolling_8_average ?? 0).toFixed(2)} /></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><DataBox label="Health visits" value={workloadRow.current_health_visits} tooltip="Health visits are records with recognized sickness or complaint categories." /><DataBox label="Non-health visits" value={workloadRow.current_non_health_visits} tooltip="Non-health visits include certificates, enrollment requirements, supplies, and other clinic services." /><DataBox label="Main driver" value={workloadRow.main_recent_driver} /></div><div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Preparation guidance</div><p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{workloadRow.recommendation}</p><p className="mt-2 text-sm leading-6 text-slate-400">Best validation method: {workloadInfo.selectedMethod ?? workloadRow.forecast_method ?? 'Not available'}; validation error: {workloadInfo.mae ? `+/-${Number(workloadInfo.mae).toFixed(2)} visits` : 'not available'}.</p><p className="mt-2 border-t border-slate-700 pt-2 text-xs leading-5 text-slate-500">This is a dataset-based test forecast. Live future forecasting will use newly recorded ClinicQR visits.</p></div><div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-xs leading-5 text-amber-50/75"><span className="font-black uppercase tracking-widest text-amber-100/80">Development mode: </span>This report uses historical clinic records and available test ClinicQR logs. Once the clinic begins daily use, new visit logs will advance the forecast period automatically.</div></> : <EmptyState text={workload.message ?? 'Run the workload forecast script to generate an operational busy-week forecast.'} />}
                </Stage>

                <Stage number="4" title="Clinic-head decision" icon={ClipboardCheck} tone="border-emerald-300/30" subtitle="A human decision is required; ML only provides decision support.">
                    {decision ? <div className="rounded-xl border border-emerald-300/30 bg-emerald-950/50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-black text-emerald-100"><CheckCircle2 size={16} /> {decision.decision}</span><span className="text-sm text-slate-400">{decision.decided_by ?? 'Clinic head'} · {formatDate(decision.decided_at)}</span></div><div className="mt-4 text-xs font-black uppercase tracking-widest text-emerald-200">Final action</div><p className="mt-2 text-lg font-black leading-7 text-white">{decision.final_action}</p>{decision.remarks && <p className="mt-3 border-t border-emerald-300/15 pt-3 text-sm leading-6 text-slate-300"><span className="font-bold text-slate-100">Note: </span>{decision.remarks}</p>}</div> : <EmptyState text="The clinic head has not yet recorded a decision for this forecast. Review it on the dashboard." action="Review forecast" href="/superadmin/dashboard" />}
                </Stage>

                <Stage number="5" title="Prevention event follow-through" icon={CalendarCheck} tone="border-amber-300/30" subtitle="Approved prevention activities can be turned into QR-attendance events.">
                    {event ? <div className="rounded-xl border border-amber-300/30 bg-amber-950/40 p-5"><div className="text-xs font-black uppercase tracking-widest text-amber-200">Linked prevention event</div><div className="mt-2 text-xl font-black text-white">{event.title}</div><div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300"><span className="inline-flex items-center gap-1"><CalendarCheck size={15} /> {event.event_date}</span>{event.event_time && <span>{event.event_time}</span>}<span className="rounded-full border border-amber-300/25 px-2 py-0.5 text-xs font-black uppercase text-amber-100">{event.status}</span></div><Link href={`/superadmin/qr-attendance/${event.id}/qr`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-200"><FileText size={16} /> View event QR</Link></div> : decision ? <EmptyState text="No prevention event is linked to this decision yet." action="Open decision history" href="/superadmin/ml-decision-history" /> : <EmptyState text="An event can be created after the clinic head records an eligible prevention decision." />}
                </Stage>
            </div>
        </SuperAdminLayout>
    );
}

function Stage({ number, title, icon: Icon, tone, subtitle, children }) {
    return <section className={`rounded-2xl border ${tone} bg-slate-950 p-5 shadow-xl shadow-slate-950/35`}><div className="flex items-start gap-3 border-b border-slate-700 pb-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-black text-cyan-100">{number}</span><div><div className="flex items-center gap-2"><Icon size={18} className="text-cyan-200" /><h2 className="text-lg font-black">{title}</h2></div><p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p></div></div><div className="pt-4">{children}</div></section>;
}

function Metric({ label, value, compact = false }) {
    return <div className="rounded-xl border border-slate-700 bg-slate-950 p-3"><div className={`font-black ${compact ? 'text-lg' : 'text-2xl'} text-cyan-100`}>{value}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div></div>;
}

function DataBox({ label, value, tooltip }) {
    return <div className="rounded-xl border border-slate-700 bg-slate-900 p-3"><div className="text-lg font-black text-white">{value}</div><div className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}{tooltip && <InfoTooltip text={tooltip} />}</div></div>;
}

function Hotspots({ rows }) {
    if (!rows.length) return <div className="mt-4 text-sm text-slate-400">No department hotspot data is available.</div>;
    return <div className="mt-4"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><MapPin size={14} /> Department hotspots</div><div className="space-y-2">{rows.map(row => <div key={row.label} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><span className="font-semibold text-slate-200">{row.label}</span><span className="font-black text-cyan-200">{row.value}</span></div>)}</div></div>;
}

function EmptyState({ text, action, href }) {
    return <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-5 text-sm leading-6 text-slate-400">{text}{action && <Link href={href} className="mt-3 inline-flex rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/20">{action}</Link>}</div>;
}

function formatMonth(monthKey) {
    if (!monthKey) return 'unknown month';
    const [year, month] = monthKey.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatWeekRange(dateValue, fallback) {
    if (!dateValue) return fallback ?? 'unknown week';

    const start = new Date(dateValue);
    if (Number.isNaN(start.getTime())) return fallback ?? 'unknown week';

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })}`;
    }

    if (sameYear) {
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'date unavailable';
}
