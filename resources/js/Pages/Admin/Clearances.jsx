import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function Clearances({ clearances, status, statusOptions }) {
    const [rejecting, setRejecting] = useState(null);
    const form = useForm({ rejection_reason: '' });

    function approve(id) {
        if (confirm('Approve this clearance request?')) {
            router.post(`/admin/clearances/${id}/approve`, {}, { preserveScroll: true });
        }
    }

    function reject(event) {
        event.preventDefault();
        form.post(`/admin/clearances/${rejecting.id}/reject`, { preserveScroll: true, onSuccess: () => setRejecting(null) });
    }

    return (
        <AdminLayout title="Clearances" subtitle="Review and approve student medical clearance requests.">
            <Head title="Admin Clearances" />
            <div className="mb-5 flex flex-wrap gap-2">
                {statusOptions.map(option => (
                    <Link key={option} href={`/admin/clearances?status=${option}`} className={`rounded-lg px-3 py-2 text-sm font-bold ${status === option ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'}`}>
                        {option}
                    </Link>
                ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Patient</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clearances.data?.map(clearance => (
                            <tr key={clearance.id} className="border-b border-white/5">
                                <td className="px-4 py-3 font-bold">{clearance.patient_name}<div className="text-xs text-slate-500">{clearance.student_id}</div></td>
                                <td className="px-4 py-3 text-slate-300">{clearance.clearance_type ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-400">{clearance.purpose ?? clearance.visit_purpose ?? '-'}</td>
                                <td className="px-4 py-3">{clearance.status}</td>
                                <td className="px-4 py-3">
                                    {clearance.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => approve(clearance.id)} className="mr-2 rounded-lg border border-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-200">Approve</button>
                                            <button onClick={() => setRejecting(clearance)} className="rounded-lg border border-rose-300/20 px-3 py-1 text-xs font-bold text-rose-200">Reject</button>
                                        </>
                                    ) : <span className="text-slate-500">Reviewed</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={clearances.links} />

            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
                    <form onSubmit={reject} className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-6">
                        <h2 className="text-lg font-black">Reject Clearance</h2>
                        <textarea rows="4" value={form.data.rejection_reason} onChange={event => form.setData('rejection_reason', event.target.value)} className="field mt-4" placeholder="Reason" />
                        {form.errors.rejection_reason && <p className="mt-2 text-sm text-rose-300">{form.errors.rejection_reason}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={() => setRejecting(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold">Cancel</button>
                            <button disabled={form.processing} className="rounded-lg bg-rose-300 px-4 py-2 text-sm font-black text-slate-950">Reject</button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}

function Pagination({ links = [] }) {
    return <div className="mt-5 flex flex-wrap gap-2">{links.map((link, index) => <Link key={index} href={link.url ?? '#'} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${link.active ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>;
}
