import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Index({ notifications }) {
    return (
        <UserLayout title="Notifications" subtitle="Clinic messages and account updates." actions={<button onClick={() => router.post('/notifications/read-all')} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold">Mark all read</button>}>
            <Head title="Notifications" />
            <div className="space-y-3">
                {notifications.data?.length ? notifications.data.map(notification => (
                    <Link key={notification.id} href={`/notifications/${notification.id}`} className="block rounded-lg border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="font-black">{notification.title}</div>
                                <div className="mt-1 text-sm text-slate-400">{notification.message}</div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${notification.is_read ? 'bg-slate-500/10 text-slate-400' : 'bg-blue-300/10 text-blue-200'}`}>{notification.is_read ? 'Read' : 'New'}</span>
                        </div>
                    </Link>
                )) : <p className="text-sm text-slate-500">No notifications.</p>}
            </div>
        </UserLayout>
    );
}
