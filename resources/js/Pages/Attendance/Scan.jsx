import { useForm } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';

export default function Scan({ event }) {
    const form = useForm({ student_id: '' });

    function submit(submitEvent) {
        submitEvent.preventDefault();
        form.post(`/attendance/scan/${event.qr_token}`);
    }

    return (
        <PublicLayout title="Event Attendance" subtitle={event.title}>
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">{event.location ?? 'Clinic'} - {event.event_date}</div>
                <input value={form.data.student_id} onChange={event => form.setData('student_id', event.target.value)} className="field" placeholder="Student or Employee ID" />
                {form.errors.student_id && <p className="text-sm text-rose-300">{form.errors.student_id}</p>}
                <button disabled={form.processing} className="w-full rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">{form.processing ? 'Recording...' : 'Record attendance'}</button>
            </form>
        </PublicLayout>
    );
}
