import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';

export default function EventQrDetail({ event, qrCode, attendees }) {
    return (
        <SuperAdminLayout title={event.title} subtitle="Event QR code and attendance list.">
            <Head title="Event QR Detail" />
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center sm:p-6">
                    <div className="mx-auto inline-block rounded-lg bg-white p-4" dangerouslySetInnerHTML={{ __html: qrCode }} />
                    <div className="mt-5 text-sm text-slate-400">{event.scan_url}</div>
                    <div className="mt-4 flex justify-center gap-2">
                        {['active', 'ended', 'cancelled'].map(status => (
                            <button key={status} onClick={() => router.patch(`/superadmin/qr-attendance/${event.id}/status`, { status }, { preserveScroll: true })} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold">{status}</button>
                        ))}
                    </div>
                </section>
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                    <h2 className="text-lg font-black">Attendees</h2>
                    <div className="mt-4 space-y-3">
                        {attendees?.length ? attendees.map(attendance => (
                            <div key={attendance.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                                <div className="font-bold">{attendance.user?.name ?? attendance.student_id}</div>
                                <div className="mt-1 text-xs text-slate-500">{attendance.scanned_at}</div>
                            </div>
                        )) : <p className="text-sm text-slate-500">No attendees yet.</p>}
                    </div>
                </section>
            </div>
        </SuperAdminLayout>
    );
}
