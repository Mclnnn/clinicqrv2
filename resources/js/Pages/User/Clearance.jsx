import { Head, router, useForm } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Clearance({ myRequests, existingPending }) {
    const form = useForm({
        contact_number: '',
        school_year: '',
        semester: '1st Semester',
        purpose: 'Enrollment',
        purpose_custom: '',
        clearance_type: 'Medical',
        documents: [],
    });

    function submit(event) {
        event.preventDefault();
        router.post('/clearance', form.data, { forceFormData: true, preserveScroll: true });
    }

    return (
        <UserLayout title="Medical Clearance" subtitle="Request and track clinic clearance records.">
            <Head title="Medical Clearance" />
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <h2 className="text-lg font-black">New Request</h2>
                    <div className="mt-4 space-y-4">
                        <input value={form.data.contact_number} onChange={event => form.setData('contact_number', event.target.value)} className="field" placeholder="Contact number" />
                        <input value={form.data.school_year} onChange={event => form.setData('school_year', event.target.value)} className="field" placeholder="School year" />
                        <select value={form.data.semester} onChange={event => form.setData('semester', event.target.value)} className="field bg-slate-950"><option>1st Semester</option><option>2nd Semester</option><option>Summer</option></select>
                        <input value={form.data.purpose} onChange={event => form.setData('purpose', event.target.value)} className="field" placeholder="Purpose" />
                        <input value={form.data.clearance_type} onChange={event => form.setData('clearance_type', event.target.value)} className="field" placeholder="Clearance type" />
                        <input type="file" multiple onChange={event => form.setData('documents', Array.from(event.target.files ?? []))} className="field" />
                        <button disabled={existingPending || form.processing} className="w-full rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50">{existingPending ? 'Pending request exists' : 'Submit request'}</button>
                    </div>
                </form>
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <h2 className="text-lg font-black">My Requests</h2>
                    <div className="mt-4 space-y-3">
                        {myRequests?.length ? myRequests.map(request => (
                            <div key={request.clearance_id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                                <div className="font-bold">{request.clearance_type ?? request.purpose}</div>
                                <div className="mt-1 text-sm text-slate-500">{request.created_at}</div>
                                <div className="mt-2 inline-block rounded-full bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{request.status}</div>
                            </div>
                        )) : <p className="text-sm text-slate-500">No clearance requests yet.</p>}
                    </div>
                </section>
            </div>
        </UserLayout>
    );
}
