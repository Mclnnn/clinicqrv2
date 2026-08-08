import { Head, Link } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Show({ notification }) {
    return (
        <UserLayout title="Notification" subtitle={notification.title}>
            <Head title={notification.title} />
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-black">{notification.title}</h2>
                <p className="mt-4 leading-7 text-slate-300">{notification.message}</p>
                {notification.link && <Link href={notification.link} className="mt-5 inline-block rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">Open related page</Link>}
            </article>
        </UserLayout>
    );
}
