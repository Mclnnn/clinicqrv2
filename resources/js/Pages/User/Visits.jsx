import { Head, Link } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Visits({ visits }) {
    return (
        <UserLayout title="Visit History" subtitle="Clinic check-ins and visits connected to your account.">
            <Head title="Visit History" />
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">QR</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.data?.map(visit => (
                            <tr key={visit.log_id} className="border-b border-white/5">
                                <td className="px-4 py-3 font-bold">{visit.visit_purpose ?? 'Clinic Visit'}</td>
                                <td className="px-4 py-3 text-slate-400">{visit.timestamp ? new Date(visit.timestamp).toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 text-slate-400">{visit.qr_scanned ? 'Yes' : 'No'}</td>
                                <td className="px-4 py-3">{visit.verification_status ?? 'Logged'}</td>
                                <td className="px-4 py-3 text-slate-400">{visit.medical_notes ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={visits.links} />
        </UserLayout>
    );
}

function Pagination({ links = [] }) {
    return (
        <div className="mt-5 flex flex-wrap gap-2">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${link.active ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}
