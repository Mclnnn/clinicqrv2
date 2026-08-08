import { Head } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Events({ upcomingEvents, pastEvents }) {
    return (
        <UserLayout title="Events" subtitle="Clinic events and attendance activities.">
            <Head title="Events" />
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Panel title="Upcoming Events" empty="No upcoming events." events={upcomingEvents} />
                <Panel title="Past Events" empty="No past events listed." events={pastEvents} />
            </div>
        </UserLayout>
    );
}

function Panel({ title, events = [], empty }) {
    return (
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">{title}</h2>
            <div className="mt-5 space-y-3">
                {events.length ? events.map(event => (
                    <article key={event.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="font-black">{event.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{event.location ?? 'Clinic'} - {event.event_date} {event.event_time ?? ''}</p>
                            </div>
                            <span className="rounded-full bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{event.status ?? 'Active'}</span>
                        </div>
                        {event.description && <p className="mt-3 text-sm leading-6 text-slate-400">{event.description}</p>}
                    </article>
                )) : <p className="text-sm text-slate-500">{empty}</p>}
            </div>
        </section>
    );
}
