import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

const categoryMeta = {
    Analgesics: {
        description: 'Analgesics are medications used to relieve pain without causing loss of consciousness.',
        usage: 'Use for pain relief as directed. Do not exceed the recommended dose.',
    },
    Antipyretics: {
        description: 'Antipyretics are drugs used to reduce fever.',
        usage: 'Use to reduce fever as directed. Monitor temperature and hydrate well.',
    },
    Antibiotics: {
        description: 'Antibiotics are medications used to treat bacterial infections.',
        usage: 'Take the full course as directed. Do not stop early even if you feel better.',
    },
    Antihistamines: {
        description: 'Antihistamines are used to treat allergic reactions and related symptoms.',
        usage: 'May cause drowsiness. Use as needed for allergy symptoms.',
    },
    'Nutritional Supplements': {
        description: 'Nutritional supplements provide vitamins and minerals to support health.',
        usage: 'Take as directed. Do not exceed recommended daily intake.',
    },
};

const fieldClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-300/40';

function statusFor(quantity) {
    if (quantity <= 0) return ['Out of Stock', 'border-rose-400/20 bg-rose-400/10 text-rose-300'];
    if (quantity < 10) return ['Critical', 'border-orange-400/20 bg-orange-400/10 text-orange-300'];
    if (quantity <= 30) return ['Need to Order', 'border-amber-400/20 bg-amber-400/10 text-amber-300'];
    return ['Available', 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'];
}

function Modal({ title, children, footer, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
            <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-lg font-black">{title}</h2>
                    <button onClick={onClose} type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="px-6 py-5">{children}</div>
                <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">{footer}</div>
            </div>
        </div>
    );
}

function MedicineForm({ mode, medicine, categoryGroups, onClose }) {
    const form = useForm({
        name: medicine?.name ?? '',
        category: medicine?.category ?? Object.values(categoryGroups)[0]?.[0] ?? 'Other',
        quantity: medicine?.quantity ?? 0,
        usage: medicine?.usage ?? '',
        description: medicine?.description ?? '',
    });

    function updateCategory(category) {
        const meta = categoryMeta[category];
        form.setData({
            ...form.data,
            category,
            usage: form.data.usage || meta?.usage || '',
            description: form.data.description || meta?.description || '',
        });
    }

    function submit(event) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (mode === 'edit') {
            form.put(`/admin/medicines/${medicine.id}`, options);
        } else {
            form.post('/admin/medicines', options);
        }
    }

    return (
        <Modal
            title={mode === 'edit' ? 'Edit Medicine' : 'Add Medicine'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10">Cancel</button>
                    <button type="submit" form="medicine-form" disabled={form.processing} className="rounded-lg bg-blue-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-blue-300">
                        {form.processing ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Medicine'}
                    </button>
                </>
            }
        >
            <form id="medicine-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Name</label>
                    <input required value={form.data.name} onChange={event => form.setData('name', event.target.value)} className={fieldClass} placeholder="Medicine name" />
                    {form.errors.name && <p className="mt-2 text-xs text-rose-300">{form.errors.name}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Category</label>
                    <select value={form.data.category} onChange={event => updateCategory(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-300/40">
                        {Object.entries(categoryGroups).map(([group, items]) => (
                            <optgroup key={group} label={group} className="bg-slate-900 text-white">
                                {items.map(item => <option key={item} value={item} className="bg-slate-900 text-white">{item}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Quantity</label>
                    <input type="number" min="0" required value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className={fieldClass} />
                    {form.errors.quantity && <p className="mt-2 text-xs text-rose-300">{form.errors.quantity}</p>}
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Usage / Instructions</label>
                    <input value={form.data.usage ?? ''} onChange={event => form.setData('usage', event.target.value)} className={fieldClass} placeholder="How to use..." />
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                    <textarea rows="3" value={form.data.description ?? ''} onChange={event => form.setData('description', event.target.value)} className={fieldClass} placeholder="Optional description..." />
                </div>
            </form>
        </Modal>
    );
}

export default function Medicines({ medicines, categoryGroups }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState(null);
    const rows = medicines.data ?? [];

    const totals = useMemo(() => ({
        total: medicines.total ?? rows.length,
        low: rows.filter(medicine => Number(medicine.quantity) > 0 && Number(medicine.quantity) <= 30).length,
        out: rows.filter(medicine => Number(medicine.quantity) <= 0).length,
    }), [medicines.total, rows]);

    function deleteMedicine(medicine) {
        if (!confirm(`Delete ${medicine.name}?`)) return;
        router.delete(`/admin/medicines/${medicine.id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Manage Medicines" />
            <AdminLayout
                title="Manage Medicines"
                subtitle="Add and manage clinic medicine inventory."
                actions={
                    <button onClick={() => setModal({ mode: 'create' })} className="rounded-lg bg-blue-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-blue-300">
                        Add Medicine
                    </button>
                }
            >
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                    {[
                        ['Total Medicines', totals.total],
                        ['Low / Need Order', totals.low],
                        ['Out of Stock', totals.out],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <div className="text-2xl font-black">{value}</div>
                            <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                    {rows.length === 0 ? (
                        <div className="px-6 py-20 text-center text-slate-500">No medicines found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-slate-500">
                                        <th className="px-5 py-4">Name</th>
                                        <th className="px-5 py-4">Category</th>
                                        <th className="px-5 py-4">Usage</th>
                                        <th className="px-5 py-4">Quantity</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(medicine => {
                                        const [label, classes] = statusFor(Number(medicine.quantity));
                                        return (
                                            <tr key={medicine.id} className="border-b border-white/5 text-sm text-slate-300 last:border-b-0 hover:bg-white/[0.03]">
                                                <td className="px-5 py-4 font-bold text-white">{medicine.name}</td>
                                                <td className="px-5 py-4">{medicine.category}</td>
                                                <td className="max-w-[240px] truncate px-5 py-4 text-slate-400">{medicine.usage || '-'}</td>
                                                <td className="px-5 py-4 font-black text-white">{medicine.quantity}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>{label}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setModal({ mode: 'edit', medicine })} className="rounded-lg bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-400/20">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => deleteMedicine(medicine)} className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {medicines.links?.length > 3 && (
                        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-4">
                            {medicines.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg border px-3 py-2 text-sm ${
                                        link.active
                                            ? 'border-blue-300/30 bg-blue-300/15 text-blue-200'
                                            : link.url
                                                ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                                : 'pointer-events-none border-white/5 text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </AdminLayout>

            {modal && (
                <MedicineForm
                    mode={modal.mode}
                    medicine={modal.medicine}
                    categoryGroups={categoryGroups}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
