import { Head, router, useForm, usePage } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';

export default function Profile({ notifications }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const account = useForm({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        password: '',
        password_confirmation: '',
    });
    const personal = useForm({
        date_of_birth: user.date_of_birth ?? '',
        gender: user.gender ?? '',
        contact_number: user.contact_number ?? '',
        address: user.address ?? '',
        user_type: user.user_type ?? '',
        department: user.department ?? '',
        student_id: user.student_id ?? '',
        employee_id: user.employee_id ?? '',
    });

    function saveAccount(event) {
        event.preventDefault();
        account.put('/profile', { preserveScroll: true, onSuccess: () => account.setData({ ...account.data, password: '', password_confirmation: '' }) });
    }

    function savePersonal(event) {
        event.preventDefault();
        personal.put('/profile/personal', { preserveScroll: true });
    }

    function uploadPhoto(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        router.post('/profile/photo', { photo: file }, { forceFormData: true, preserveScroll: true });
    }

    return (
        <UserLayout title="My Profile" subtitle="Manage account details and clinic profile information.">
            <Head title="Profile" />
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {user.profile_photo_url ? <img src={user.profile_photo_url} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <span className="grid h-20 w-20 place-items-center rounded-lg bg-blue-500 text-2xl font-black">{user.name?.charAt(0)}</span>}
                        <div>
                            <div className="text-xl font-black">{user.name}</div>
                            <div className="mt-1 text-sm text-slate-500">{user.student_id ?? user.employee_id ?? user.user_type}</div>
                            <label className="mt-3 inline-block cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                                Upload photo
                                <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                            </label>
                            {user.profile_photo_url && <button onClick={() => router.delete('/profile/photo', { preserveScroll: true })} className="mt-2 rounded-lg border border-rose-300/20 px-3 py-2 text-sm font-bold text-rose-200 sm:ml-2 sm:mt-0">Remove</button>}
                        </div>
                    </div>
                    <div className="mt-6">
                        <h2 className="text-lg font-black">Notifications</h2>
                        <div className="mt-3 space-y-2">
                            {notifications?.length ? notifications.map(item => (
                                <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                                    <div className="text-sm font-bold">{item.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">{item.message}</div>
                                </div>
                            )) : <p className="text-sm text-slate-500">No notifications.</p>}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <FormPanel title="Account" onSubmit={saveAccount} processing={account.processing}>
                        <Input label="Name" value={account.data.name} onChange={value => account.setData('name', value)} error={account.errors.name} />
                        <Input label="Username" value={account.data.username} onChange={value => account.setData('username', value)} error={account.errors.username} />
                        <Input label="Email" type="email" value={account.data.email} onChange={value => account.setData('email', value)} error={account.errors.email} />
                        <Input label="New password" type="password" value={account.data.password} onChange={value => account.setData('password', value)} error={account.errors.password} />
                        <Input label="Confirm password" type="password" value={account.data.password_confirmation} onChange={value => account.setData('password_confirmation', value)} error={account.errors.password_confirmation} />
                    </FormPanel>

                    <FormPanel title="Personal Information" onSubmit={savePersonal} processing={personal.processing}>
                        <Input label="Date of birth" type="date" value={personal.data.date_of_birth} onChange={value => personal.setData('date_of_birth', value)} error={personal.errors.date_of_birth} />
                        <Input label="Gender" value={personal.data.gender} onChange={value => personal.setData('gender', value)} error={personal.errors.gender} />
                        <Input label="Contact number" value={personal.data.contact_number} onChange={value => personal.setData('contact_number', value)} error={personal.errors.contact_number} />
                        <Input label="Department" value={personal.data.department} onChange={value => personal.setData('department', value)} error={personal.errors.department} />
                        <Input label="Address" value={personal.data.address} onChange={value => personal.setData('address', value)} error={personal.errors.address} />
                    </FormPanel>
                </section>
            </div>
        </UserLayout>
    );
}

function FormPanel({ title, onSubmit, processing, children }) {
    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">{title}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
            <button disabled={processing} className="mt-5 rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">{processing ? 'Saving...' : 'Save changes'}</button>
        </form>
    );
}

function Input({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-bold text-slate-300">{label}</span>
            <input type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="field mt-2" />
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </label>
    );
}
