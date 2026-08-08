import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

const statusClasses = {
    approved: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    rejected: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    completed: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
    cancelled: 'border-white/10 bg-white/5 text-slate-400',
};

const quickRejectReasons = [
    'The doctor is unavailable on your scheduled date.',
    'The clinic will be closed on your scheduled date.',
    'Incomplete requirements. Please submit necessary documents first.',
    'Please reschedule your appointment to another available date.',
];

const quickMessages = [
    'Your appointment is being reviewed. We will notify you soon.',
    'The doctor is currently unavailable. Please wait for further notice.',
    'Please come to the clinic on your scheduled date and time.',
    'Please complete the required documents before your appointment.',
    'We need to reschedule your appointment. Please contact the clinic.',
];

function formatDate(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function normalizeStatus(status) {
    return String(status || '').trim().toLowerCase();
}

function StatusBadge({ status }) {
    const key = normalizeStatus(status);
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[key] ?? statusClasses.cancelled}`}>
            {status || 'Unknown'}
        </span>
    );
}

function Modal({ title, children, onClose, footer }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
            <div className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-lg font-black">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    >
                        x
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
                <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">{footer}</div>
            </div>
        </div>
    );
}

function AppointmentModal({ action, appointment, onClose }) {
    const isReject = action === 'reject';
    const isReply = action === 'message';
    const form = useForm({
        comment: '',
        message: '',
    });

    const title = {
        approve: 'Approve Appointment',
        reject: 'Reject Appointment',
        complete: 'Mark Appointment Complete',
        message: `Reply to ${appointment?.user?.name ?? 'Student'}`,
    }[action];

    const submitLabel = {
        approve: 'Confirm Approve',
        reject: 'Reject Appointment',
        complete: 'Mark Complete',
        message: 'Send Message',
    }[action];

    const submitClass = isReject
        ? 'bg-rose-500 hover:bg-rose-400'
        : action === 'complete'
            ? 'bg-blue-500 hover:bg-blue-400'
            : 'bg-blue-400 text-slate-950 hover:bg-blue-300';

    function submit(event) {
        event.preventDefault();
        const payload = isReply ? { message: form.data.message } : { comment: form.data.comment };

        router.post(`/admin/appointments/${appointment.id}/${action}`, payload, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Modal
            title={title}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10">
                        Cancel
                    </button>
                    <button type="submit" form="appointment-action-form" disabled={form.processing} className={`rounded-lg px-4 py-2 text-sm font-black ${submitClass}`}>
                        {form.processing ? 'Working...' : submitLabel}
                    </button>
                </>
            }
        >
            <form id="appointment-action-form" onSubmit={submit} className="space-y-4">
                {(isReject || isReply) && (
                    <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                            Quick {isReply ? 'Messages' : 'Reasons'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(isReply ? quickMessages : quickRejectReasons).map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => isReply ? form.setData('message', item) : form.setData('comment', item)}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-blue-300/30 hover:bg-blue-300/10 hover:text-blue-200"
                                >
                                    {item.split('.')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isReply ? (
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Message</label>
                        <textarea
                            required
                            rows="4"
                            value={form.data.message}
                            onChange={event => form.setData('message', event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-300/40"
                            placeholder="Type your message..."
                        />
                    </div>
                ) : (
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                            {isReject ? 'Reason' : 'Admin Comment'} {isReject ? <span className="text-rose-300">*</span> : null}
                        </label>
                        <textarea
                            required={isReject}
                            rows="4"
                            value={form.data.comment}
                            onChange={event => form.setData('comment', event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-300/40"
                            placeholder={isReject ? 'Enter reason for rejection...' : 'Optional note...'}
                        />
                    </div>
                )}
            </form>
        </Modal>
    );
}

export default function Appointments({ appointments, status, statusOptions }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState(null);
    const rows = appointments.data ?? [];

    const counts = useMemo(() => ({
        visible: rows.length,
        total: appointments.total ?? rows.length,
    }), [appointments.total, rows.length]);

    return (
        <>
            <Head title="Manage Appointments" />
            <AdminLayout
                title="Manage Appointments"
                subtitle="Review and manage student appointment requests."
                actions={
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                        Showing <span className="font-bold text-white">{counts.visible}</span> of <span className="font-bold text-white">{counts.total}</span>
                    </div>
                }
            >
                    {flash?.success && (
                        <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300">
                            {flash.error}
                        </div>
                    )}

                    <div className="mb-5 flex flex-wrap gap-2">
                        {statusOptions.map(option => (
                            <Link
                                key={option}
                                href={`/admin/appointments?status=${option}`}
                                preserveScroll
                                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                                    status === option
                                        ? 'border-blue-300/30 bg-blue-300/15 text-blue-200'
                                        : 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                                }`}
                            >
                                {option === 'all' ? 'All' : option}
                            </Link>
                        ))}
                    </div>

                    <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                        {rows.length === 0 ? (
                            <div className="px-6 py-20 text-center text-slate-500">
                                <div className="text-4xl">...</div>
                                <p className="mt-3 text-sm">No appointments found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-slate-500">
                                            <th className="px-5 py-4">Student</th>
                                            <th className="px-5 py-4">Type</th>
                                            <th className="px-5 py-4">Date & Time</th>
                                            <th className="px-5 py-4">Notes</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Admin Comment</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(appointment => {
                                            const st = normalizeStatus(appointment.status);
                                            return (
                                                <tr key={appointment.id} className="border-b border-white/5 text-sm text-slate-300 last:border-b-0 hover:bg-white/[0.03]">
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-white">{appointment.user?.name ?? '-'}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{appointment.user?.student_id ?? appointment.user?.employee_id ?? ''}</div>
                                                    </td>
                                                    <td className="px-5 py-4">{appointment.appointment_type}</td>
                                                    <td className="px-5 py-4">
                                                        <div>{formatDate(appointment.appointment_date)}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{appointment.appointment_time}</div>
                                                    </td>
                                                    <td className="max-w-[180px] truncate px-5 py-4 text-slate-400">{appointment.notes || '-'}</td>
                                                    <td className="px-5 py-4"><StatusBadge status={appointment.status} /></td>
                                                    <td className="max-w-[200px] px-5 py-4 text-xs italic text-slate-500">
                                                        {appointment.admin_comment || appointment.rejection_reason || '-'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            {!['approved', 'rejected', 'cancelled', 'completed'].includes(st) && (
                                                                <>
                                                                    <button onClick={() => setModal({ action: 'approve', appointment })} className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20">
                                                                        Approve
                                                                    </button>
                                                                    <button onClick={() => setModal({ action: 'reject', appointment })} className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20">
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {st === 'approved' && (
                                                                <button onClick={() => setModal({ action: 'complete', appointment })} className="rounded-lg bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/20">
                                                                    Complete
                                                                </button>
                                                            )}
                                                            <button onClick={() => setModal({ action: 'message', appointment })} className="rounded-lg bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-400/20">
                                                                Reply
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {appointments.links?.length > 3 && (
                            <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-4">
                                {appointments.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={`rounded-lg border px-3 py-2 text-sm ${
                                            link.active
                                                ? 'border-blue-300/30 bg-blue-300/15 text-blue-200'
                                                : link.url
                                                    ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    : 'pointer-events-none border-white/5 text-slate-700'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
            </AdminLayout>

            {modal && (
                <AppointmentModal
                    action={modal.action}
                    appointment={modal.appointment}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
