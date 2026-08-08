import { Head, router, useForm } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

const slots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export default function Appointments({ appointments }) {
    const form = useForm({
        appointment_type: 'Consultation',
        appointment_date: '',
        appointment_time: '',
        notes: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/student/appointments', { preserveScroll: true, onSuccess: () => form.reset() });
    }

    function cancel(id) {
        if (confirm('Cancel this appointment?')) {
            router.patch(`/student/appointments/${id}/cancel`, {}, { preserveScroll: true });
        }
    }

    return (
        <UserLayout title="Appointments" subtitle="Book a clinic visit and track request status.">
            <Head title="Appointments" />
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                    <h2 className="text-lg font-black">Book Appointment</h2>
                    <form onSubmit={submit} className="mt-5 space-y-4">
                        <Field label="Type" error={form.errors.appointment_type}>
                            <select value={form.data.appointment_type} onChange={event => form.setData('appointment_type', event.target.value)} className="field bg-slate-950">
                                <option>Consultation</option>
                                <option>Follow-up</option>
                                <option>Medical Certificate</option>
                                <option>Dental</option>
                            </select>
                        </Field>
                        <Field label="Date" error={form.errors.appointment_date}>
                            <input type="date" value={form.data.appointment_date} onChange={event => form.setData('appointment_date', event.target.value)} className="field" />
                        </Field>
                        <Field label="Time" error={form.errors.appointment_time}>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {slots.map(slot => (
                                    <button type="button" key={slot} onClick={() => form.setData('appointment_time', slot)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${form.data.appointment_time === slot ? 'border-blue-300 bg-blue-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="Notes" error={form.errors.notes}>
                            <textarea rows="4" value={form.data.notes} onChange={event => form.setData('notes', event.target.value)} className="field" />
                        </Field>
                        <button disabled={form.processing} className="w-full rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950 hover:bg-blue-200">
                            {form.processing ? 'Booking...' : 'Book appointment'}
                        </button>
                    </form>
                </section>

                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                    <h2 className="text-lg font-black">My Appointments</h2>
                    <div className="mt-5 space-y-3">
                        {appointments.data?.length ? appointments.data.map(appointment => (
                            <div key={appointment.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="font-black">{appointment.appointment_type}</div>
                                        <div className="mt-1 text-sm text-slate-400">{appointment.appointment_date} at {appointment.appointment_time}</div>
                                        {appointment.notes && <div className="mt-2 text-sm text-slate-500">{appointment.notes}</div>}
                                    </div>
                                    <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{appointment.status}</span>
                                </div>
                                {['Pending', 'Approved'].includes(appointment.status) && (
                                    <button onClick={() => cancel(appointment.id)} className="mt-4 rounded-lg border border-rose-300/20 px-3 py-2 text-sm font-bold text-rose-200 hover:bg-rose-400/10">Cancel</button>
                                )}
                            </div>
                        )) : <p className="text-sm text-slate-500">No appointments yet.</p>}
                    </div>
                </section>
            </div>
        </UserLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-bold text-slate-300">{label}</span>
            <div className="mt-2">{children}</div>
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </label>
    );
}
