import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function Events({ events }) {
    const [editing, setEditing] = useState(null);
    const form = useForm({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        category: 'General',
        status: 'Upcoming',
    });

    function open(event = null) {
        setEditing(event ?? {});
        form.setData({
            title: event?.title ?? '',
            description: event?.description ?? '',
            event_date: event?.event_date?.slice?.(0, 10) ?? '',
            event_time: event?.event_time ?? '',
            location: event?.location ?? '',
            category: event?.category ?? 'General',
            status: event?.status ?? 'Upcoming',
        });
    }

    function close() {
        setEditing(null);
        form.reset();
    }

    function submit(event) {
        event.preventDefault();
        if (editing.id) {
            form.put(`/admin/events/${editing.id}`, { preserveScroll: true, onSuccess: close });
        } else {
            form.post('/admin/events', { preserveScroll: true, onSuccess: close });
        }
    }

    function destroy(id) {
        if (confirm('Delete this event?')) {
            router.delete(`/admin/events/${id}`, { preserveScroll: true });
        }
    }

    return (
        <AdminLayout title="Events" subtitle="Clinic events that can also use QR attendance." actions={<button onClick={() => open()} className="rounded-lg bg-blue-300 px-4 py-2 text-sm font-black text-slate-950">Add event</button>}>
            <Head title="Admin Events" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {events.data?.map(event => (
                    <article key={event.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black">{event.title}</h2>
                                <p className="mt-1 text-sm text-slate-500">{event.event_date} {event.event_time ?? ''}</p>
                            </div>
                            <span className="rounded-full bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-200">{event.status}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-400">{event.location ?? 'Clinic'}</p>
                        {event.description && <p className="mt-3 text-sm leading-6 text-slate-500">{event.description}</p>}
                        <div className="mt-5 flex gap-2">
                            <button onClick={() => open(event)} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold">Edit</button>
                            <button onClick={() => destroy(event.id)} className="rounded-lg border border-rose-300/20 px-3 py-2 text-sm font-bold text-rose-200">Delete</button>
                        </div>
                    </article>
                ))}
            </div>
            <Pagination links={events.links} />

            {editing !== null && (
                <Modal title={editing.id ? 'Edit Event' : 'Add Event'} onClose={close}>
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <Input label="Title" value={form.data.title} onChange={value => form.setData('title', value)} error={form.errors.title} className="md:col-span-2" />
                        <Input label="Date" type="date" value={form.data.event_date} onChange={value => form.setData('event_date', value)} error={form.errors.event_date} />
                        <Input label="Time" type="time" value={form.data.event_time} onChange={value => form.setData('event_time', value)} error={form.errors.event_time} />
                        <Input label="Location" value={form.data.location} onChange={value => form.setData('location', value)} error={form.errors.location} />
                        <label className="block">
                            <span className="text-sm font-bold text-slate-300">Status</span>
                            <select value={form.data.status} onChange={event => form.setData('status', event.target.value)} className="field mt-2 bg-slate-950">
                                <option>Upcoming</option>
                                <option>Ongoing</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                        </label>
                        <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-slate-300">Description</span>
                            <textarea rows="4" value={form.data.description} onChange={event => form.setData('description', event.target.value)} className="field mt-2" />
                        </label>
                        <button disabled={form.processing} className="rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950 md:col-span-2">{form.processing ? 'Saving...' : 'Save event'}</button>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}

function Input({ label, value, onChange, error, type = 'text', className = '' }) {
    return <label className={`block ${className}`}><span className="text-sm font-bold text-slate-300">{label}</span><input type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="field mt-2" />{error && <p className="mt-2 text-sm text-rose-300">{error}</p>}</label>;
}

function Modal({ title, children, onClose }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"><div className="w-full max-w-2xl rounded-lg border border-white/10 bg-slate-950 p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2><button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1">x</button></div>{children}</div></div>;
}

function Pagination({ links = [] }) {
    return <div className="mt-5 flex flex-wrap gap-2">{links.map((link, index) => <Link key={index} href={link.url ?? '#'} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${link.active ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>;
}
