import { Head, Link, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';

export default function EventQrIndex({ events, prefill = null }) {
    const form = useForm({
        title: prefill?.title ?? '',
        description: prefill?.description ?? '',
        location: '',
        event_date: '',
        event_time: '',
        ml_recommendation_decision_id: prefill?.ml_recommendation_decision_id ?? '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/superadmin/qr-attendance', { preserveScroll: true, onSuccess: () => form.reset() });
    }

    return (
        <SuperAdminLayout title="Event QR Attendance" subtitle="Create event QR codes and monitor attendance scans.">
            <Head title="Event QR Attendance" />
            <div className="cq-event-page">
                {prefill && <section className="cq-event-ml-notice mb-5 rounded-xl p-4 text-sm"><div className="font-black">ML decision connected</div><p className="mt-1 leading-6">Creating a prevention event for <span className="font-bold">{prefill.category}</span> based on the {prefill.forecast_month} forecast. Review and adjust the suggested details before creating its QR code.</p></section>}
                <form onSubmit={submit} className="cq-event-form grid gap-4 rounded-2xl p-6 md:grid-cols-2">
                    <div className="md:col-span-2"><div className="text-xs font-black uppercase tracking-widest text-cyan-200">Event planning</div><h2 className="mt-2 text-xl font-black">Create prevention event QR</h2><p className="mt-1 text-sm text-slate-400">Complete the event details before generating its attendance QR code.</p></div>
                    <label className="md:col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">Event title<input value={form.data.title} onChange={event => form.setData('title', event.target.value)} className="field cq-event-form-field mt-2" placeholder="Event title" /></label>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event date<input type="date" value={form.data.event_date} onChange={event => form.setData('event_date', event.target.value)} className="field cq-event-form-field mt-2" /></label>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event time<input type="time" value={form.data.event_time} onChange={event => form.setData('event_time', event.target.value)} className="field cq-event-form-field mt-2" /></label>
                    <label className="md:col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">Location<input value={form.data.location} onChange={event => form.setData('location', event.target.value)} className="field cq-event-form-field mt-2" placeholder="Location" /></label>
                    <label className="md:col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">Event description<textarea rows="4" value={form.data.description} onChange={event => form.setData('description', event.target.value)} className="field cq-event-form-field mt-2" placeholder="Description" /></label>
                    <button disabled={form.processing} className="cq-event-submit rounded-xl px-4 py-3 font-black md:col-span-2">{form.processing ? 'Creating event...' : 'Create event QR'}</button>
                </form>
                <div className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-black">Existing prevention events</h2><span className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">{events?.length ?? 0} total</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {events?.map(event => (
                        <article key={event.id} className="cq-event-card rounded-2xl p-5">
                            <h2 className="text-lg font-black">{event.title}</h2>
                            <p className="mt-2 text-sm text-slate-400">{event.event_date} {event.event_time ?? ''}</p>
                            <p className="mt-4 text-sm text-slate-300">{event.attendances_count ?? 0} attendees</p>
                            <div className="mt-5 flex gap-2">
                                <Link href={`/superadmin/qr-attendance/${event.id}/qr`} className="cq-event-action rounded-lg px-3 py-2 text-sm font-bold">View QR</Link>
                                <button onClick={() => router.delete(`/superadmin/qr-attendance/${event.id}`)} className="rounded-lg border border-rose-300/30 bg-rose-950/50 px-3 py-2 text-sm font-bold text-rose-100">Delete</button>
                            </div>
                        </article>
                    ))}
                </div></div>
            </div>
        </SuperAdminLayout>
    );
}
