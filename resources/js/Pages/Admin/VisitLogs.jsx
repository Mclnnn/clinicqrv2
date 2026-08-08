import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function VisitLogs({ visits, users, search }) {
    const [editing, setEditing] = useState(null);
    const form = useForm({
        user_id: '',
        visit_date: new Date().toISOString().slice(0, 10),
        visit_time: new Date().toTimeString().slice(0, 5),
        visit_purpose: 'General Check-in',
        verification_status: 'Verified',
        medical_notes: '',
    });

    function submit(event) {
        event.preventDefault();
        if (editing) {
            form.put(`/admin/visit-logs/${editing.log_id}`, { preserveScroll: true, onSuccess: () => closeForm() });
        } else {
            form.post('/admin/visit-logs', { preserveScroll: true, onSuccess: () => closeForm() });
        }
    }

    function openEdit(visit) {
        setEditing(visit);
        const stamp = visit.timestamp ? new Date(visit.timestamp) : new Date();
        form.setData({
            user_id: visit.user_id ?? '',
            visit_date: stamp.toISOString().slice(0, 10),
            visit_time: stamp.toTimeString().slice(0, 5),
            visit_purpose: visit.visit_purpose ?? 'General Check-in',
            verification_status: visit.verification_status ?? 'Verified',
            medical_notes: visit.medical_notes ?? '',
        });
    }

    function closeForm() {
        setEditing(null);
        form.reset();
    }

    function destroy(id) {
        if (confirm('Delete this visit log?')) {
            router.delete(`/admin/visit-logs/${id}`, { preserveScroll: true });
        }
    }

    return (
        <AdminLayout
            title="Visit Logs"
            subtitle="Manual and QR clinic check-ins."
            actions={<button onClick={() => setEditing({})} className="rounded-lg bg-blue-300 px-4 py-2 text-sm font-black text-slate-950">Add visit</button>}
        >
            <Head title="Visit Logs" />
            <form className="mb-5 flex gap-3" onSubmit={event => {
                event.preventDefault();
                router.get('/admin/visit-logs', { search: event.currentTarget.search.value }, { preserveState: true, replace: true });
            }}>
                <input name="search" defaultValue={search ?? ''} className="field max-w-md" placeholder="Search patient" />
                <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200">Search</button>
            </form>

            <Table visits={visits.data} onEdit={openEdit} onDelete={destroy} />
            <Pagination links={visits.links} />

            {editing !== null && (
                <Modal title={editing.log_id ? 'Edit Visit' : 'Add Visit'} onClose={closeForm}>
                    <form id="visit-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-slate-300">Patient</span>
                            <select value={form.data.user_id} onChange={event => form.setData('user_id', event.target.value)} disabled={Boolean(editing.log_id)} className="field mt-2 bg-slate-950">
                                <option value="">Select patient</option>
                                {users.map(user => <option key={user.id} value={user.id}>{user.name} ({user.student_id ?? user.employee_id ?? user.id})</option>)}
                            </select>
                            {form.errors.user_id && <p className="mt-2 text-sm text-rose-300">{form.errors.user_id}</p>}
                        </label>
                        <Input label="Date" type="date" value={form.data.visit_date} onChange={value => form.setData('visit_date', value)} error={form.errors.visit_date} />
                        <Input label="Time" type="time" value={form.data.visit_time} onChange={value => form.setData('visit_time', value)} error={form.errors.visit_time} />
                        <Input label="Purpose" value={form.data.visit_purpose} onChange={value => form.setData('visit_purpose', value)} error={form.errors.visit_purpose} />
                        <Input label="Status" value={form.data.verification_status} onChange={value => form.setData('verification_status', value)} error={form.errors.verification_status} />
                        <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-slate-300">Medical notes</span>
                            <textarea rows="4" value={form.data.medical_notes} onChange={event => form.setData('medical_notes', event.target.value)} className="field mt-2" />
                        </label>
                        <button disabled={form.processing} className="rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950 md:col-span-2">{form.processing ? 'Saving...' : 'Save visit'}</button>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}

function Table({ visits, onEdit, onDelete }) {
    return (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map(visit => (
                        <tr key={visit.log_id} className="border-b border-white/5">
                            <td className="px-4 py-3 font-bold">{visit.patient_name ?? 'Unknown'}<div className="text-xs text-slate-500">{visit.student_id}</div></td>
                            <td className="px-4 py-3 text-slate-300">{visit.visit_purpose ?? 'General Check-in'}</td>
                            <td className="px-4 py-3 text-slate-400">{visit.timestamp ? new Date(visit.timestamp).toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">{visit.verification_status ?? 'Logged'}</td>
                            <td className="px-4 py-3">
                                <button onClick={() => onEdit(visit)} className="mr-2 rounded-lg border border-white/10 px-3 py-1 text-xs font-bold">Edit</button>
                                <button onClick={() => onDelete(visit.log_id)} className="rounded-lg border border-rose-300/20 px-3 py-1 text-xs font-bold text-rose-200">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
            <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-slate-950 p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-black">{title}</h2>
                    <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1">x</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Input({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-bold text-slate-300">{label}</span>
            <input type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="field mt-2" />
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </label>
    );
}

function Pagination({ links = [] }) {
    return <div className="mt-5 flex flex-wrap gap-2">{links.map((link, index) => <Link key={index} href={link.url ?? '#'} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${link.active ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>;
}
