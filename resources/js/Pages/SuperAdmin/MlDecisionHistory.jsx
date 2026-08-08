import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BrainCircuit, CalendarPlus, CheckCircle2, ClipboardList, MoreHorizontal, Pencil, Save, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';
import InfoTooltip from '../../Components/InfoTooltip';

export default function MlDecisionHistory({ decisions = [] }) {
    const [editingItem, setEditingItem] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const totals = decisions.reduce((result, item) => {
        result[item.decision] = (result[item.decision] ?? 0) + 1;
        return result;
    }, {});

    return (
        <SuperAdminLayout
            title="ML Decision History"
            subtitle="A permanent review trail for clinic-head responses to AI health forecasts."
            actions={<Link href="/superadmin/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"><ArrowLeft size={16} /> Dashboard</Link>}
        >
            <Head title="ML Decision History" />

            <section className="overflow-hidden rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.99),rgba(2,6,23,0.99))] p-6 shadow-2xl shadow-slate-950/50">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-100"><BrainCircuit size={14} /> Accountable AI</span>
                        <h2 className="mt-4 text-3xl font-black">Forecast decisions at a glance</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Every record shows how the clinic head reviewed an ML recommendation. This supports transparent, human-led preventive planning.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
                        <Summary label="Approved" value={totals.Approved ?? 0} tone="text-emerald-100" />
                        <Summary label="Modified" value={totals.Modified ?? 0} tone="text-cyan-100" />
                        <Summary label="Rejected" value={totals.Rejected ?? 0} tone="text-rose-100" />
                    </div>
                </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-600/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-md">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div><div className="flex items-center gap-2"><ClipboardList size={18} className="text-cyan-200" /><h2 className="text-lg font-black">Recorded decisions</h2></div><p className="mt-1 text-xs text-slate-400">Official clinic-head responses to ML health forecasts</p></div>
                    <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-black text-slate-200">{decisions.length} total</span>
                </div>

                {!decisions.length ? (
                    <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">No ML forecast decisions have been recorded yet.</div>
                ) : (
                    <div className="space-y-4">
                        {decisions.map(item => (
                            <DecisionRecord
                                key={item.id}
                                item={item}
                                menuOpen={openMenuId === item.id}
                                onToggleMenu={() => setOpenMenuId(current => current === item.id ? null : item.id)}
                                onStartEdit={() => {
                                    setEditingItem(item);
                                    setOpenMenuId(null);
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {editingItem && <DecisionEditModal
                item={editingItem}
                saving={savingId === editingItem.id}
                onClose={() => setEditingItem(null)}
                onSave={(changes) => {
                    setSavingId(editingItem.id);
                                    router.post('/superadmin/ml-recommendations/decision', {
                                        source_month: editingItem.source_month,
                                        prediction_month: editingItem.prediction_month,
                                        complaint_category: editingItem.complaint_category,
                                        current_cases: Number(editingItem.current_cases) || 0,
                                        predicted_cases: Number(editingItem.predicted_cases) || 0,
                                        trend_level: editingItem.trend_level,
                                        priority_score: Number(editingItem.priority_score) || 0,
                                        recommended_action: editingItem.recommended_action,
                                        ...changes,
                                    }, {
                                        preserveScroll: true,
                                        onSuccess: () => setEditingItem(null),
                                        onFinish: () => setSavingId(null),
                                    });
                }}
            />}
        </SuperAdminLayout>
    );
}

function DecisionRecord({ item, menuOpen, onToggleMenu, onStartEdit }) {
    const Icon = item.decision === 'Approved' ? CheckCircle2 : item.decision === 'Modified' ? Pencil : XCircle;
    const accent = {
        Approved: 'border-l-emerald-300',
        Modified: 'border-l-cyan-300',
        Rejected: 'border-l-rose-300',
    }[item.decision] ?? 'border-l-slate-400';
    const canCreateEvent = item.decision === 'Modified' || (item.decision === 'Approved' && !/no\s+(major\s+)?preventive|regular monitoring/i.test(item.final_action ?? ''));

    return (
        <article className={`overflow-hidden rounded-2xl border border-slate-600/80 border-l-4 ${accent} bg-slate-900 p-5 shadow-xl shadow-black/25`}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-700/90 pb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ClinicQR decision record #{item.id}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{formatMonth(item.prediction_month)} forecast</span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-white">{item.complaint_category}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${decisionTone(item.decision)}`}><Icon size={13} /> {item.decision}</span>
                        {item.trend_level && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">{item.trend_level} trend</span>}
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-slate-400">Forecast: {formatMonth(item.source_month)} data → {formatMonth(item.prediction_month)} prediction · {item.current_cases} current / {item.predicted_cases} predicted cases · <InfoTooltip text="Priority score (0–100): higher means earlier clinic-head review."><span className="cursor-help">Priority {item.priority_score}</span></InfoTooltip></p>
                </div>
                <div className="flex items-start gap-3 lg:text-right">
                    <div className="text-sm text-slate-400"><div className="font-bold text-slate-200">{item.decided_by}</div><div>{formatDateTime(item.decided_at)}</div></div>
                    <div className="relative">
                        <button type="button" onClick={onToggleMenu} aria-label={`Options for ${item.complaint_category}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-200 transition hover:bg-white/10"><MoreHorizontal size={18} /></button>
                        {menuOpen && <div className="absolute right-0 top-11 z-10 w-40 rounded-xl border border-white/15 bg-slate-950 p-1 shadow-2xl shadow-slate-950/70">
                            <button type="button" onClick={onStartEdit} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-black text-slate-100 transition hover:bg-white/10"><Pencil size={14} /> Edit decision</button>
                        </div>}
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Detail label="ML recommendation" value={item.recommended_action} />
                <Detail label="Final clinic-head action" value={item.final_action} accent />
            </div>
            {item.remarks && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-300"><span className="font-black text-slate-100">Decision note: </span>{item.remarks}</div>}
            {canCreateEvent && <div className="mt-4 flex justify-end"><Link href={`/superadmin/qr-attendance?ml_decision=${item.id}`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"><CalendarPlus size={17} /> Create prevention event</Link></div>}
        </article>
    );
}

function DecisionEditModal({ item, saving, onClose, onSave }) {
    const [form, setForm] = useState({
        decision: item.decision,
        final_action: item.final_action ?? '',
        remarks: item.remarks ?? '',
    });

    const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <form onSubmit={(event) => { event.preventDefault(); onSave(form); }} className="max-h-[calc(100dvh-32px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-300/25 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-start justify-between gap-4">
                <div><div className="text-xs font-black uppercase tracking-widest text-cyan-200">Clinic head review</div><h2 className="mt-2 text-2xl font-black">Edit {item.complaint_category} decision</h2><p className="mt-2 text-sm leading-6 text-slate-400">Update the final human response to this ML forecast.</p></div>
                <button type="button" onClick={onClose} disabled={saving} aria-label="Close editor" className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"><X size={18} /></button>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300"><span className="font-black text-slate-100">ML recommendation: </span>{item.recommended_action}</div>
            <div className="mt-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Final decision</div><div className="mt-2 grid gap-2 sm:grid-cols-3">{['Approved', 'Modified', 'Rejected'].map(option => <button key={option} type="button" onClick={() => update('decision', option)} className={`rounded-xl border px-3 py-3 text-sm font-black transition ${form.decision === option ? decisionTone(option) : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'}`}>{option}</button>)}</div></div>
            <label className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-400">Final preventive action<textarea value={form.final_action} onChange={(event) => update('final_action', event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-300/60" /></label>
            <label className="mt-4 block text-xs font-black uppercase tracking-widest text-slate-400">Decision notes <span className="normal-case tracking-normal">(optional)</span><textarea value={form.remarks} onChange={(event) => update('remarks', event.target.value)} rows={3} maxLength={2000} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-300/60" /></label>
            <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:opacity-50">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"><Save size={16} /> {saving ? 'Saving...' : 'Save changes'}</button></div>
        </form>
    </div>;
}

function Summary({ label, value, tone }) {
    return <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3"><div className={`text-2xl font-black ${tone}`}>{value}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div></div>;
}

function Detail({ label, value, accent = false }) {
    return <div className={`rounded-xl border p-4 ${accent ? 'border-cyan-300/35 bg-cyan-950/60' : 'border-slate-700 bg-slate-950'}`}><div className={`text-[10px] font-black uppercase tracking-widest ${accent ? 'text-cyan-200' : 'text-slate-400'}`}>{label}</div><p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{value || 'Not specified'}</p></div>;
}

function decisionTone(decision) {
    return {
        Approved: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        Modified: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
        Rejected: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
    }[decision] ?? 'border-white/10 bg-white/5 text-slate-200';
}

function formatMonth(monthKey) {
    if (!monthKey) return 'Unknown month';
    const [year, month] = monthKey.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
    if (!value) return 'Unknown date';
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
