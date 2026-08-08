import { Head, Link, router, useForm } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Medicines({ medicines, categories, filters }) {
    const form = useForm({
        q: filters?.q ?? '',
        category: filters?.category ?? '',
        available_only: Boolean(filters?.available_only),
    });

    function submit(event) {
        event.preventDefault();
        router.get('/student/medicines', {
            q: form.data.q,
            category: form.data.category,
            available_only: form.data.available_only ? 1 : undefined,
        }, { preserveState: true, replace: true });
    }

    return (
        <UserLayout title="Medicines" subtitle="Browse clinic medicines and current availability.">
            <Head title="Medicines" />
            <form onSubmit={submit} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_220px_160px_auto]">
                <input value={form.data.q} onChange={event => form.setData('q', event.target.value)} className="field" placeholder="Search medicine" />
                <select value={form.data.category} onChange={event => form.setData('category', event.target.value)} className="field bg-slate-950">
                    <option value="">All categories</option>
                    {categories?.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-300">
                    <input type="checkbox" checked={form.data.available_only} onChange={event => form.setData('available_only', event.target.checked)} />
                    Available
                </label>
                <button className="rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">Filter</button>
            </form>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {medicines.data?.map(medicine => (
                    <article key={medicine.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black">{medicine.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">{medicine.category ?? 'Uncategorized'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${medicine.quantity > 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>
                                {medicine.quantity > 0 ? `${medicine.quantity} left` : 'Out'}
                            </span>
                        </div>
                        {medicine.usage && <p className="mt-4 text-sm leading-6 text-slate-300">{medicine.usage}</p>}
                        {medicine.description && <p className="mt-3 text-sm leading-6 text-slate-500">{medicine.description}</p>}
                    </article>
                ))}
            </div>
            <Pagination links={medicines.links} />
        </UserLayout>
    );
}

function Pagination({ links = [] }) {
    return (
        <div className="mt-5 flex flex-wrap gap-2">
            {links.map((link, index) => (
                <Link key={index} href={link.url ?? '#'} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${link.active ? 'bg-blue-300 text-slate-950' : 'border border-white/10 text-slate-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
            ))}
        </div>
    );
}
