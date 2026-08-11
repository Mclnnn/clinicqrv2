import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, BrainCircuit, CalendarCheck, CheckCircle2, FileText, MoreHorizontal, Pencil, ShieldCheck, Sparkles, Stethoscope, TrendingUp, Users, XCircle } from 'lucide-react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';
import InfoTooltip from '../../Components/InfoTooltip';

export default function Dashboard({ stats, userBreakdown, recentLogs, pendingClearances, recentUsers, analytics, mlDecisions = {} }) {
    const report = analytics?.monthlyReport ?? {};
    const mlPredictions = analytics?.mlPredictions ?? {};
    const workloadForecast = analytics?.workloadForecast ?? {};

    return (
        <SuperAdminLayout title="Super Admin Dashboard" subtitle="System-wide clinic intelligence and account oversight.">
            <Head title="Super Admin Dashboard" />

            <section className="rounded-lg border border-blue-300/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6 shadow-2xl shadow-blue-950/20">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-200">
                            <ShieldCheck size={14} /> Exclusive
                        </span>
                        <h2 className="mt-5 text-3xl font-black sm:text-4xl">Health trends, prevention signals, and system control</h2>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                            {report.symposium?.title ?? 'Student Wellness Symposium'} is recommended from the current {report.month ?? 'monthly'} clinic trend.
                        </p>
                    </div>
                    <Link href="/superadmin/monthly-report" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-200">
                        <FileText size={18} /> Monthly report
                    </Link>
                </div>
            </section>

            <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Stat icon={Users} label="Users" value={stats.total_users} />
                <Stat icon={Stethoscope} label="Visits" value={stats.total_visits} />
                <Stat icon={CalendarCheck} label="Pending" value={stats.pending_clearances} />
                <Stat icon={Activity} label="Activities" value={stats.total_activities} />
                <Stat icon={BarChart3} label="Visits today" value={stats.visits_today} />
                <Stat icon={Sparkles} label="Trend change" value={`${report.change ?? 0}%`} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Panel
                    title="Monthly Clinic Visits"
                    action={
                        <InfoTooltip side="bottom" text="Actual ClinicQR visits from the last 6 months.">
                            <span className="cursor-help rounded-full bg-blue-300/10 px-3 py-1 text-xs font-black text-blue-100">6-month view</span>
                        </InfoTooltip>
                    }
                >
                    <LineChart rows={analytics?.monthlyTrend} />
                </Panel>
                <Panel title="Top Sickness Trends" action={<span className="rounded-full bg-blue-300/10 px-3 py-1 text-xs font-black text-blue-100">{report.month}</span>}>
                    <RankedBars rows={analytics?.visitPurpose} fallbackMonth={report.month} />
                </Panel>
            </div>

            <MlPredictionPanel predictions={mlPredictions} initialDecisions={mlDecisions} />

            <WorkloadForecastPanel forecast={workloadForecast} />

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Panel title="Monthly Prevention Brief">
                    <PreventionBrief report={report} />
                </Panel>
                <Panel title="Inventory Risk">
                    <InventoryRisk stock={analytics?.medicineStock} />
                </Panel>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <UserBreakdown users={userBreakdown} />
                <Panel title="Pending Clearances" action={<Link href="/admin/clearances" className="text-sm font-bold text-blue-200">Review</Link>}>
                    <Rows items={pendingClearances?.map(item => ({
                        title: item.user_name ?? 'Unknown patient',
                        meta: item.clearance_type ?? item.purpose ?? 'Medical Clearance',
                        tag: item.status,
                    }))} empty="No pending clearances." />
                </Panel>
            </div>

            <Panel title="User List" action={<Link href="/table/users" className="text-sm font-bold text-blue-200">View table</Link>} className="mt-6">
                <UserList users={recentUsers} />
            </Panel>

            <Panel title="Recent Activity" className="mt-6">
                <Rows items={recentLogs?.map(log => ({
                    title: log.user_name ?? 'System',
                    meta: log.action ?? log.additional_details ?? 'Activity',
                    tag: log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Recent',
                }))} empty="No activity yet." />
            </Panel>
        </SuperAdminLayout>
    );
}

function MlPredictionPanel({ predictions = {}, initialDecisions = {} }) {
    const rows = predictions.rows ?? [];
    const top = predictions.highestPriority ?? rows[0];
    const modelInfo = predictions.modelInfo ?? {};
    const [selectedCategory, setSelectedCategory] = useState(top?.complaint_category ?? rows[0]?.complaint_category);
    const [decisions, setDecisions] = useState(initialDecisions);
    const [modifyingCategory, setModifyingCategory] = useState(null);
    const [customActions, setCustomActions] = useState({});
    const [decisionNotes, setDecisionNotes] = useState({});
    const [savingCategory, setSavingCategory] = useState(null);
    const [editingDecisionCategory, setEditingDecisionCategory] = useState(null);
    const [openDecisionMenuCategory, setOpenDecisionMenuCategory] = useState(null);
    const [selectedFocusTick, setSelectedFocusTick] = useState(0);
    const selected = rows.find(row => row.complaint_category === selectedCategory) ?? top;
    const detailRef = useRef(null);

    const selectPrediction = (category) => {
        setSelectedCategory(category);
        window.setTimeout(() => {
            if (!detailRef.current) return;

            const headerOffset = 112;
            const target = detailRef.current.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });

            window.setTimeout(() => {
                setSelectedFocusTick(current => current + 1);
            }, 520);
        }, 80);
    };

    const recordDecision = (decision, action) => {
        if (!selected) return;

        const category = selected.complaint_category;
        const remarks = decisionNotes[category] ?? '';
        setSavingCategory(category);

        router.post('/superadmin/ml-recommendations/decision', {
            source_month: predictions.sourceMonth,
            prediction_month: predictions.predictionMonth,
            complaint_category: category,
            current_cases: Number(selected.current_cases) || 0,
            predicted_cases: Number(selected.predicted_cases) || 0,
            trend_level: selected.trend_level,
            priority_score: Number(selected.priority_score) || 0,
            recommended_action: selected.recommendation,
            decision,
            final_action: action,
            remarks,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDecisions(current => ({
                    ...current,
                    [category]: { decision, action, remarks, decided_by: 'Current clinic head' },
                }));
                setModifyingCategory(null);
                setEditingDecisionCategory(null);
            },
            onFinish: () => setSavingCategory(null),
        });
    };

    const editDecision = () => {
        if (!selected) return;

        const category = selected.complaint_category;
        const existingDecision = decisions[category];
        setDecisionNotes(current => ({ ...current, [category]: current[category] ?? existingDecision?.remarks ?? '' }));
        setCustomActions(current => ({ ...current, [category]: current[category] ?? existingDecision?.action ?? selected.recommendation ?? '' }));
        setEditingDecisionCategory(category);
        setOpenDecisionMenuCategory(null);
    };

    if (!predictions.available || !rows.length) {
        return (
            <section className="mt-6 overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
                <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                        <BrainCircuit size={24} />
                    </span>
                    <div>
                        <h2 className="text-xl font-black">AI Health Trend Prediction</h2>
                        <p className="mt-1 text-sm text-slate-400">Prediction results are not available yet. Train the ML model to generate dashboard insights.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-blue-100/20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,rgba(36,70,184,0.92),rgba(16,47,104,0.94)_42%,rgba(7,26,61,0.96))] shadow-2xl shadow-blue-950/25">
            <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="border-b border-white/12 p-6 xl:border-b-0 xl:border-r">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-50">
                                <BrainCircuit size={14} /> ML Forecast
                            </span>
                            <h2 className="mt-4 text-2xl font-black">AI Health Trend Prediction</h2>
                            <p className="mt-2 text-sm leading-6 text-blue-50/70">
                                ClinicQR reviewed historical clinic logbook patterns and generated a next-month health trend forecast for clinic head review.
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(predictions.overallStatus)}`}>
                            {predictions.overallStatus}
                        </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <AiMiniStat label="Latest data" value={formatMonth(predictions.sourceMonth)} />
                        <AiMiniStat label="Forecast" value={formatMonth(predictions.predictionMonth)} />
                        <AiMiniStat label="Top priority" value={top?.complaint_category ?? 'None'} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                        <div className="flex gap-3">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-100" />
                            <div>
                                <div className="text-sm font-black text-amber-50">Decision-support notice</div>
                                <p className="mt-1 text-sm leading-6 text-amber-50/75">
                                    {modelInfo.notice ?? 'Decision-support forecast only. Final preventive actions remain subject to clinic head review.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.08] p-5 shadow-xl shadow-blue-950/10">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-blue-100/65">Highest review priority</div>
                                <div className="mt-2 text-3xl font-black text-white">{top?.complaint_category}</div>
                            </div>
                            <InfoTooltip side="left" text="Priority score (0–100): higher means earlier clinic-head review.">
                                <div className="cursor-help"><PriorityOrb score={top?.priority_score ?? 0} /></div>
                            </InfoTooltip>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <MetricPill label="Current" value={top?.current_cases ?? 0} tooltip="Current cases are the latest recorded count for this health category in the source month." />
                            <MetricPill label="Predicted" value={top?.predicted_cases ?? 0} tooltip="Predicted cases are the ML model's estimate for the next month. This is a forecast, not a diagnosis." />
                            <MetricPill label="Trend" value={top?.trend_level ?? 'Unknown'} tooltip="Trend compares the forecast with recent historical patterns to help guide clinic-head review." />
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-300">{top?.reason}</p>
                    </div>

                    {selected && (
                        <PredictionDetail
                            key={`${selected.complaint_category}-${selectedFocusTick}`}
                            detailRef={detailRef}
                            row={selected}
                            decision={decisions[selected.complaint_category]}
                            isModifying={modifyingCategory === selected.complaint_category}
                            isEditingDecision={editingDecisionCategory === selected.complaint_category}
                            isDecisionMenuOpen={openDecisionMenuCategory === selected.complaint_category}
                            customAction={customActions[selected.complaint_category] ?? decisions[selected.complaint_category]?.action ?? selected.recommendation ?? ''}
                            decisionNotes={decisionNotes[selected.complaint_category] ?? ''}
                            saving={savingCategory === selected.complaint_category}
                            onApprove={() => recordDecision('Approved', selected.recommendation)}
                            onReject={() => recordDecision('Rejected', 'Continue regular monitoring')}
                            onModify={() => setModifyingCategory(selected.complaint_category)}
                            onCustomActionChange={(value) => setCustomActions(current => ({ ...current, [selected.complaint_category]: value }))}
                            onDecisionNotesChange={(value) => setDecisionNotes(current => ({ ...current, [selected.complaint_category]: value }))}
                            onSaveModification={() => recordDecision('Modified', customActions[selected.complaint_category] ?? selected.recommendation)}
                            onCancelModification={() => setModifyingCategory(null)}
                            onToggleDecisionMenu={() => setOpenDecisionMenuCategory(current => current === selected.complaint_category ? null : selected.complaint_category)}
                            onEditDecision={editDecision}
                            onCancelDecisionEdit={() => {
                                setModifyingCategory(null);
                                setEditingDecisionCategory(null);
                            }}
                        />
                    )}
                </div>

                <div className="bg-slate-950/18 p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black">Prediction Queue</h3>
                            <p className="mt-1 text-xs text-blue-50/55">Sorted by review urgency for fast clinic-head action.</p>
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-blue-50">{rows.length} signals</span>
                    </div>

                    <div className="space-y-3">
                        {rows.map((row, index) => (
                            <PredictionSignal
                                key={row.complaint_category}
                                row={row}
                                index={index}
                                active={selected?.complaint_category === row.complaint_category}
                                onSelect={() => selectPrediction(row.complaint_category)}
                            />
                        ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.06] p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-200">
                            <TrendingUp size={16} className="text-blue-100" />
                            Model information
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <ModelInfoItem label="Model" value={modelInfo.model ?? 'RandomForestRegressor'} />
                            <ModelInfoItem label="Prediction type" value={modelInfo.predictionType ?? 'Monthly case count forecast'} />
                            <ModelInfoItem label="Average error" value={modelInfo.mae ? `±${Number(modelInfo.mae).toFixed(2)} cases` : 'Not available'} />
                            <ModelInfoItem label="Training range" value={modelInfo.monthRange ?? 'Not available'} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function WorkloadForecastPanel({ forecast = {} }) {
    const row = forecast.row ?? {};
    const modelInfo = forecast.modelInfo ?? {};
    const available = Boolean(forecast.available && forecast.row);
    const predicted = Number(row.predicted_total_visits) || 0;
    const average = Number(row.rolling_8_average) || 0;
    const level = row.workload_level ?? 'Unknown';
    const maxBar = Math.max(predicted, average, 1);
    const interpretation = workloadInterpretation(predicted, average, modelInfo.selectedMethod ?? row.forecast_method);

    if (!available) {
        return (
            <section className="mt-6 rounded-2xl border border-indigo-300/20 bg-slate-950/85 p-6 shadow-2xl shadow-slate-950/25">
                <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-indigo-300/10 p-3 text-indigo-100">
                        <CalendarCheck size={24} />
                    </span>
                    <div>
                        <h2 className="text-xl font-black">Clinic Workload Forecast</h2>
                        <p className="mt-1 text-sm text-slate-400">{forecast.message ?? 'Workload prediction results are not available yet.'}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96))] shadow-2xl shadow-slate-950/25">
            <div className="grid gap-0 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="border-b border-white/10 p-6 xl:border-b-0 xl:border-r">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-100">
                                <CalendarCheck size={14} /> Workload Forecast
                            </span>
                            <h2 className="mt-4 text-2xl font-black">Clinic Busy-Week Test Forecast</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                ClinicQR reviewed the uploaded historical clinic dataset and tested the next-week workload forecast after the dataset's latest week.
                            </p>
                        </div>
                        <WorkloadBadge level={level} />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <AiMiniStat label="Dataset latest week" value={formatWeekRange(row.source_week_start, row.source_week)} />
                        <AiMiniStat label="Test forecast week" value={formatWeekRange(row.prediction_week_start, row.prediction_week)} />
                        <AiMiniStat label="Main driver" value={row.main_recent_driver ?? 'No dominant driver'} />
                    </div>

                    <div className="mt-5 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.07] p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-indigo-100/70">Predicted workload</div>
                                <div className="mt-2 text-4xl font-black text-white">{predicted}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-400">visits expected</div>
                            </div>
                            <InfoTooltip side="left" text="Workload score (0-100): higher means earlier preparation.">
                                <div className="cursor-help"><PriorityOrb score={row.priority_score ?? 0} /></div>
                            </InfoTooltip>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <WorkloadMeter label="Predicted visits" value={predicted} max={maxBar} tone="bg-indigo-300" />
                        <WorkloadMeter label="8-week average" value={average.toFixed(2)} max={maxBar} tone="bg-slate-300" />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MetricPill label="Health" value={row.current_health_visits ?? 0} tooltip="Health visits are records with recognized sickness or complaint categories." />
                        <MetricPill label="Non-health" value={row.current_non_health_visits ?? 0} tooltip="Non-health visits include records such as certificates, enrollment requirements, supplies, and other clinic services." />
                        <MetricPill label="Calendar" value={row.calendar_event ?? 'Regular'} tooltip="Calendar event is included as a possible workload signal when school calendar data is available." />
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/55 p-4">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-500">Recommended preparation</div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{row.recommendation}</p>
                    </div>

                    <div className="mt-4 rounded-xl border border-indigo-300/20 bg-indigo-300/[0.07] p-4">
                        <div className="text-xs font-black uppercase tracking-widest text-indigo-100/70">Forecast interpretation</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{interpretation}</p>
                        <p className="mt-2 border-t border-indigo-300/15 pt-2 text-xs leading-5 text-slate-400">
                            This is a dataset-based test forecast. Live future forecasting will use newly recorded ClinicQR visits.
                        </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] p-4">
                        <div className="flex gap-3">
                            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-100" />
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-amber-100/80">Development mode</div>
                                <p className="mt-1 text-xs leading-5 text-amber-50/75">
                                    This workload forecast uses historical clinic records and available test ClinicQR logs. Once the clinic begins daily use, new visit logs will advance the forecast period automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-200">
                            <TrendingUp size={16} className="text-indigo-200" />
                            Workload model information
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <ModelInfoItem label="Best validation method" value={modelInfo.selectedMethod ?? row.forecast_method ?? 'Not available'} />
                            <ModelInfoItem label="Prediction type" value={modelInfo.predictionType ?? 'Weekly clinic workload forecast'} />
                            <ModelInfoItem label="Validation error" value={modelInfo.mae ? `±${Number(modelInfo.mae).toFixed(2)} visits` : 'Not available'} />
                            <ModelInfoItem label="Historical weeks used" value={modelInfo.inputWeeks ? `${modelInfo.inputWeeks} weeks` : 'Not available'} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PredictionSignal({ row, index, active = false, onSelect }) {
    const maxWidth = Math.max(Number(row.priority_score) || 0, 8);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group w-full rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.10] ${
                active
                    ? 'border-white/35 bg-white/[0.13] shadow-lg shadow-blue-950/30'
                    : 'border-white/12 bg-slate-950/35'
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${active ? 'bg-white text-[#102f68]' : 'bg-white/10 text-blue-100'}`}>{index + 1}</span>
                        <span className="truncate font-black">{row.complaint_category}</span>
                        <TrendBadge level={row.trend_level} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-50/55">
                        <span>{row.current_cases} current</span>
                        <span>→</span>
                        <span>{row.predicted_cases} predicted</span>
                        <span>•</span>
                        <span>{row.recommended_action_type}</span>
                    </div>
                </div>
                <InfoTooltip side="top-end" text="Priority score (0–100): higher means earlier clinic-head review.">
                <div className="cursor-help text-left sm:text-right">
                    <div className="text-2xl font-black text-white">{row.priority_score}</div>
                    <div className="text-xs font-bold uppercase text-blue-50/50">Review score</div>
                </div>
                </InfoTooltip>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-white via-blue-200 to-[#2446b8] transition-all duration-700" style={{ width: `${maxWidth}%` }} />
            </div>
        </button>
    );
}

function PredictionDetail({
    row,
    detailRef,
    decision,
    isModifying,
    isEditingDecision,
    isDecisionMenuOpen,
    customAction,
    decisionNotes,
    saving,
    onApprove,
    onReject,
    onModify,
    onCustomActionChange,
    onDecisionNotesChange,
    onSaveModification,
    onCancelModification,
    onToggleDecisionMenu,
    onEditDecision,
    onCancelDecisionEdit,
}) {
    return (
        <div ref={detailRef} className="cq-selected-signal-flash mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-100/70">
                        <span>Selected signal explanation</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
                            Now reviewing
                        </span>
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-cyan-50">{row.complaint_category}</h3>
                </div>
                <TrendBadge level={row.trend_level} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <MetricPill label="Current" value={row.current_cases} tooltip="The latest recorded case count for this category in the source month." />
                <MetricPill label="Predicted" value={row.predicted_cases} tooltip="The ML model's estimated case count for the next month." />
                <MetricPill label="Average" value={Number(row.baseline_average ?? 0).toFixed(2)} />
                <MetricPill label="Priority" value={row.priority_score} tooltip="Priority score (0–100): higher means earlier clinic-head review." tooltipOnValue />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">Recommended action</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{row.recommendation}</p>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/45 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">Reason</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{row.reason}</p>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-100/70">Clinic head decision</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                    Review the forecast, then choose the final preventive response. Your decision is recorded in the ClinicQR decision history.
                </p>

                {decision && (
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-sm font-bold ${decisionTone(decision.decision)}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>{decision.decision}: {decision.action}</div>
                            <div className="relative shrink-0">
                                <button type="button" onClick={onToggleDecisionMenu} aria-label="Decision options" className="rounded-lg p-1 transition hover:bg-white/10">
                                    <MoreHorizontal size={18} />
                                </button>
                                {isDecisionMenuOpen && (
                                    <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border border-white/15 bg-slate-950 p-1 shadow-xl shadow-slate-950/70">
                                        <button type="button" onClick={onEditDecision} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-black text-slate-100 transition hover:bg-white/10">
                                            <Pencil size={14} /> Edit decision
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {decision.remarks && <div className="mt-1 text-xs font-medium opacity-80">Note: {decision.remarks}</div>}
                        {decision.decided_by && <div className="mt-1 text-xs font-medium opacity-70">Recorded by {decision.decided_by}</div>}
                    </div>
                )}

                {(!decision || isEditingDecision) && <div className="mt-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Decision notes <span className="normal-case tracking-normal">(optional)</span></label>
                    <textarea
                        value={decisionNotes}
                        onChange={(event) => onDecisionNotesChange(event.target.value)}
                        rows={2}
                        maxLength={2000}
                        placeholder="Why this action was chosen, or what should be monitored"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                    />
                </div>}

                {(!decision || isEditingDecision) && (!isModifying ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={saving} onClick={onApprove} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                            <CheckCircle2 size={16} /> Approve recommendation
                        </button>
                        <button type="button" disabled={saving} onClick={onModify} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60">
                            <Pencil size={16} /> Modify action
                        </button>
                        <button type="button" disabled={saving} onClick={onReject} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-60">
                            <XCircle size={16} /> Reject / monitor
                        </button>
                        {decision && <button type="button" disabled={saving} onClick={onCancelDecisionEdit} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">Keep saved decision</button>}
                    </div>
                ) : (
                    <div className="mt-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Final action</label>
                        <textarea
                            value={customAction}
                            onChange={(event) => onCustomActionChange(event.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" disabled={saving} onClick={onSaveModification} className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save modified action'}</button>
                            <button type="button" disabled={saving} onClick={onCancelModification} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PriorityOrb({ score }) {
    return (
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-lg shadow-cyan-950/40">
            <div className="absolute inset-2 rounded-full border border-cyan-100/10" />
            <div className="text-center">
                <div className="text-3xl font-black text-cyan-100">{score}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-200/70">Score</div>
            </div>
        </div>
    );
}

function AiMiniStat({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-2 truncate text-lg font-black text-white">{value}</div>
        </div>
    );
}

function MetricPill({ label, value, tooltip, tooltipOnValue = false }) {
    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}{tooltip && !tooltipOnValue && <InfoTooltip text={tooltip} />}</div>
            {tooltipOnValue ? <InfoTooltip text={tooltip}><div className="mt-1 cursor-help text-lg font-black text-white">{value}</div></InfoTooltip> : <div className="mt-1 text-lg font-black text-white">{value}</div>}
        </div>
    );
}

function ModelInfoItem({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-bold text-slate-200">{value}</div>
        </div>
    );
}

function TrendBadge({ level }) {
    const tone = {
        Critical: 'border-red-300/30 bg-red-300/10 text-red-100',
        High: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
        Moderate: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        Stable: 'border-blue-300/30 bg-blue-300/10 text-blue-100',
        Low: 'border-slate-300/20 bg-white/5 text-slate-300',
    }[level] ?? 'border-slate-300/20 bg-white/5 text-slate-300';

    return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>{level}</span>;
}

function WorkloadBadge({ level }) {
    const tone = {
        High: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
        Moderate: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        Typical: 'border-indigo-300/30 bg-indigo-300/10 text-indigo-100',
        Low: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    }[level] ?? 'border-slate-300/20 bg-white/5 text-slate-300';

    return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tone}`}>{level}</span>;
}

function WorkloadMeter({ label, value, max, tone }) {
    const numericValue = Number(value) || 0;
    const width = Math.max((numericValue / Math.max(Number(max) || 1, 1)) * 100, numericValue > 0 ? 6 : 0);

    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</div>
                <div className="text-xl font-black text-white">{value}</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function workloadInterpretation(predicted, average, method) {
    const methodLabel = method || 'the best validation method';

    if (average > 0 && predicted <= average * 0.5) {
        return `ClinicQR detected a recent workload drop. ${methodLabel} produced a lower next-week estimate, but the recent 8-week average is still higher, so the clinic should keep monitoring.`;
    }

    if (average > 0 && predicted >= average * 1.25) {
        return `ClinicQR detected a possible workload increase. ${methodLabel} produced a higher next-week estimate than the recent 8-week average, so early preparation is recommended.`;
    }

    return `ClinicQR expects workload to stay near the recent pattern. ${methodLabel} was selected from validation results, so the forecast should be treated as planning support.`;
}

function statusTone(status = '') {
    return status.toLowerCase().includes('preventive')
        ? 'bg-amber-300/10 text-amber-100'
        : 'bg-emerald-300/10 text-emerald-100';
}

function decisionTone(decision = '') {
    return {
        Approved: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        Modified: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
        Rejected: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
    }[decision] ?? 'border-white/10 bg-white/5 text-slate-200';
}

function formatMonth(monthKey) {
    if (!monthKey) return '-';
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatWeekRange(dateValue, fallback) {
    if (!dateValue) return fallback ?? '-';

    const start = new Date(dateValue);
    if (Number.isNaN(start.getTime())) return fallback ?? '-';

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

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.07))] p-5 shadow-xl shadow-blue-950/10 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-blue-100/35">
            <Icon size={18} className="text-blue-200" aria-hidden="true" />
            <div className="mt-4 text-3xl font-black">{value ?? 0}</div>
            <div className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</div>
        </div>
    );
}

function Panel({ title, action, children, className = '' }) {
    return <section className={`rounded-2xl border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] p-5 shadow-2xl shadow-blue-950/12 backdrop-blur-md ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black">{title}</h2>{action}</div>{children}</section>;
}

function LineChart({ rows = [] }) {
    const safeRows = Array.isArray(rows) ? rows : [];

    if (!safeRows.length) {
        return <AnalyticsEmptyState title="No monthly visit records yet" message="ClinicQR will show a 6-month visit chart once clinic visit logs are recorded." />;
    }

    const values = safeRows.map(row => Number(row.value) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    const latest = values[values.length - 1] ?? 0;
    const previous = values[values.length - 2] ?? 0;
    const max = Math.max(...values, 1);
    const yMax = Math.max(Math.ceil(max / 10) * 10, 10);
    const chartLeft = 10;
    const chartRight = 94;
    const chartWidth = chartRight - chartLeft;
    const xForIndex = (index) => safeRows.length === 1 ? 52 : chartLeft + (index / (safeRows.length - 1)) * chartWidth;
    const points = safeRows.map((row, index) => {
        const x = xForIndex(index);
        const y = 92 - ((Number(row.value) || 0) / yMax) * 72;
        return `${x},${y}`;
    }).join(' ');
    const areaPoints = `${chartLeft},96 ${points} ${chartRight},96`;

    return (
        <div>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <AnalyticsMini label="Latest month" value={latest} />
                <AnalyticsMini label="Previous month" value={previous} />
                <AnalyticsMini label="6-month total" value={total} />
            </div>

            <div className="group/chart relative w-full cursor-help rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-blue-100/30 hover:bg-slate-950/55">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-400">Hover the chart to understand it quickly.</div>
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100">Visit volume</div>
                </div>
                <div className="pointer-events-none absolute left-1/2 top-12 z-20 w-80 -translate-x-1/2 rounded-xl border border-blue-100/25 bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-white opacity-0 shadow-2xl shadow-slate-950/70 transition duration-150 group-hover/chart:opacity-100">
                    Left numbers = number of clinic visits. Bottom labels = months. Each dot shows that month&apos;s total visits.
                </div>
                <svg viewBox="0 0 100 110" className="h-80 w-full overflow-visible" role="img" aria-label="Monthly clinic visits line chart">
                    <defs>
                        <linearGradient id="clinicVisitsLine" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#b9ccff" />
                            <stop offset="52%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                        <linearGradient id="clinicVisitsArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#b9ccff" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2446b8" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {[20, 38, 56, 74, 92].map(y => (
                        <line key={y} x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="rgba(255,255,255,.11)" strokeWidth="0.5" />
                    ))}

                    {safeRows.map((row, index) => {
                        const x = xForIndex(index);
                        return <line key={`guide-${row.month ?? row.label}`} x1={x} x2={x} y1="20" y2="96" stroke="rgba(255,255,255,.055)" strokeWidth="0.45" />;
                    })}

                    {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                        <text key={tick} x="2" y={94 - tick * 72} className="fill-slate-300 text-[3.6px] font-bold">
                            {Math.round(yMax * tick)}
                        </text>
                    ))}

                    <text x="5" y="17" className="fill-blue-100 text-[3.5px] font-black uppercase tracking-widest">
                        Clinic visits
                    </text>

                    <polygon points={areaPoints} fill="url(#clinicVisitsArea)" />
                    <polyline points={points} fill="none" stroke="url(#clinicVisitsLine)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

                    {safeRows.map((row, index) => {
                        const value = Number(row.value) || 0;
                        const x = xForIndex(index);
                        const y = 92 - (value / yMax) * 72;

                        return (
                            <g key={row.month ?? row.label}>
                                <circle cx={x} cy={y} r="3.6" fill="#071a3d" stroke="#eef3ff" strokeWidth="1.2" />
                                <text x={x} y={Math.max(y - 7, 8)} textAnchor="middle" className="fill-white text-[4px] font-black">{value}</text>
                            </g>
                        );
                    })}
                </svg>

                <div className="relative h-8 border-t border-white/10 pt-3">
                    {safeRows.map(row => (
                        <div
                            key={row.month ?? row.label}
                            className="absolute top-3 -translate-x-1/2 text-center text-xs font-black text-slate-300"
                            style={{ left: `${xForIndex(safeRows.indexOf(row))}%` }}
                        >
                            {row.label}
                        </div>
                    ))}
                </div>
                <div className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.22em] text-blue-100/80">
                    Month
                </div>
            </div>
        </div>
    );
}

function RankedBars({ rows = [], fallbackMonth }) {
    const safeRows = Array.isArray(rows) ? rows.filter(row => Number(row.value) > 0) : [];
    const max = Math.max(...safeRows.map(row => Number(row.value) || 0), 1);

    if (!safeRows.length) {
        return <AnalyticsEmptyState title="No sickness trend detected" message={`No dominant sickness category has been recorded for ${fallbackMonth ?? 'the selected month'} yet.`} />;
    }

    return (
        <div className="space-y-3">
            {safeRows.slice(0, 5).map((row, index) => {
                const percent = Math.max((Number(row.value) / max) * 100, 8);

                return (
                    <div key={row.label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black text-blue-100">{index + 1}</span>
                            <span className="truncate font-black">{row.label}</span>
                        </div>
                        <span className="text-2xl font-black text-blue-100">{row.value}</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-100 via-blue-300 to-[#2446b8] transition-all duration-700" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-400">{percent.toFixed(0)}% of top category volume</div>
                </div>
                );
            })}
        </div>
    );
}

function AnalyticsMini({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
            <div className="text-xl font-black text-white">{value}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
        </div>
    );
}

function AnalyticsEmptyState({ title, message }) {
    return (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
            <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-blue-100">
                    <BarChart3 size={22} />
                </div>
                <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">{message}</p>
            </div>
        </div>
    );
}

function PreventionBrief({ report = {} }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                <div className="text-sm font-bold uppercase text-emerald-200">{report.month}</div>
                <div className="mt-2 text-2xl font-black">{report.topConcern?.label}</div>
                <div className="mt-1 text-sm text-slate-400">{report.topConcern?.value ?? 0} cases this month, {report.change ?? 0}% vs previous month</div>
            </div>
            <div className="space-y-2">
                {report.recommendations?.map(item => (
                    <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
                        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-200" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InventoryRisk({ stock = {} }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Critical" value={stock.critical ?? 0} />
                <MiniStat label="Need Order" value={stock.needOrder ?? 0} />
                <MiniStat label="Out" value={stock.out ?? 0} />
            </div>
            <Rows items={stock.lowest?.map(item => ({
                title: item.name,
                meta: item.category ?? 'Medicine',
                tag: `${item.quantity} left`,
            }))} empty="No inventory data." />
        </div>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-center">
            <div className="text-2xl font-black text-blue-200">{value}</div>
            <div className="mt-1 text-xs font-black uppercase text-slate-500">{label}</div>
        </div>
    );
}

function UserBreakdown({ users = {} }) {
    const entries = Object.entries(users);
    const total = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

    return (
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-black">Users</h2>
                <span className="rounded-full bg-blue-300/10 px-3 py-1 text-xs font-black text-blue-200">{total} total</span>
            </div>
            <div className="mt-4 space-y-3">
                {entries.map(([label, value]) => {
                    const percent = total ? Math.round((Number(value) / total) * 100) : 0;
                    return (
                        <div key={label} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold">{label}</span>
                                <span className="text-xl font-black text-blue-200">{value}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-blue-300" style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function UserList({ users = [] }) {
    if (!users?.length) return <p className="text-sm text-slate-500">No users yet.</p>;

    return (
        <div className="overflow-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-white/5">
                            <td className="px-4 py-3 font-bold">
                                {user.name}
                                <div className="text-xs font-medium text-slate-500">{user.email}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{user.role}</td>
                            <td className="px-4 py-3 text-slate-300">{user.user_type ?? user.student_id ?? user.employee_id ?? '-'}</td>
                            <td className="px-4 py-3">
                                <span className="rounded-full bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{user.status ?? 'Active'}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Rows({ items = [], empty }) {
    if (!items?.length) return <p className="text-sm text-slate-500">{empty}</p>;
    return <div className="space-y-3">{items.map((item, index) => <div key={index} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-950/50 p-4"><div className="min-w-0"><div className="truncate text-sm font-bold">{item.title}</div><div className="mt-1 truncate text-xs text-slate-500">{item.meta}</div></div><span className="shrink-0 rounded-full bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{item.tag}</span></div>)}</div>;
}
