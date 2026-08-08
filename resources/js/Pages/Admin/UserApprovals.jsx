import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function UserApprovals({ pendingUsers, allUsers }) {
    const [rejecting, setRejecting] = useState(null);
    const form = useForm({ rejection_reason: '' });

    function reject(event) {
        event.preventDefault();
        form.post(`/admin/user-approvals/${rejecting.id}/reject`, { preserveScroll: true, onSuccess: () => setRejecting(null) });
    }

    return (
        <AdminLayout title="User Approvals" subtitle="Approve student and employee registrations.">
            <Head title="User Approvals" />
            <UserTable
                users={pendingUsers}
                empty="No pending users."
                action={user => (
                    <>
                        <button onClick={() => router.post(`/admin/user-approvals/${user.id}/approve`, {}, { preserveScroll: true })} className="mr-2 rounded-lg border border-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-200">Approve</button>
                        <button onClick={() => setRejecting(user)} className="rounded-lg border border-rose-300/20 px-3 py-1 text-xs font-bold text-rose-200">Reject</button>
                    </>
                )}
            />
            <section className="mt-6">
                <h2 className="mb-3 text-lg font-black">All Users</h2>
                <UserTable users={allUsers} empty="No users yet." />
            </section>
            {rejecting && <RejectModal user={rejecting} form={form} onClose={() => setRejecting(null)} onSubmit={reject} />}
        </AdminLayout>
    );
}

function UserTable({ users, empty, action }) {
    return (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>{users.length ? users.map(user => <tr key={user.id} className="border-b border-white/5"><td className="px-4 py-3 font-bold">{user.name}<div className="text-xs text-slate-500">{user.email}</div></td><td className="px-4 py-3 text-slate-400">{user.user_type ?? user.role}</td><td className="px-4 py-3">{user.status}</td><td className="px-4 py-3">{action ? action(user) : <span className="text-slate-500">-</span>}</td></tr>) : <tr><td className="px-4 py-6 text-slate-500" colSpan="4">{empty}</td></tr>}</tbody>
            </table>
        </div>
    );
}

function RejectModal({ user, form, onClose, onSubmit }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-6"><h2 className="text-lg font-black">Reject {user.name}</h2><textarea rows="4" value={form.data.rejection_reason} onChange={event => form.setData('rejection_reason', event.target.value)} className="field mt-4" placeholder="Reason" />{form.errors.rejection_reason && <p className="mt-2 text-sm text-rose-300">{form.errors.rejection_reason}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold">Cancel</button><button disabled={form.processing} className="rounded-lg bg-rose-300 px-4 py-2 text-sm font-black text-slate-950">Reject</button></div></form></div>;
}
