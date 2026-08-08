import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function CreateAccount({ nextEmployeeId }) {
    const form = useForm({
        name: '',
        username: '',
        email: '',
        role: 'Clinic Staff',
        employee_id: nextEmployeeId ?? '',
        password: '',
        password_confirmation: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/admin/create-account', { preserveScroll: true, onSuccess: () => form.reset('name', 'username', 'email', 'password', 'password_confirmation') });
    }

    return (
        <AdminLayout title="Create Account" subtitle="Create staff or admin accounts for superadmin approval.">
            <Head title="Create Account" />
            <form onSubmit={submit} className="max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Full name" value={form.data.name} onChange={value => form.setData('name', value)} error={form.errors.name} />
                    <Input label="Username" value={form.data.username} onChange={value => form.setData('username', value)} error={form.errors.username} />
                    <Input label="Email" type="email" value={form.data.email} onChange={value => form.setData('email', value)} error={form.errors.email} />
                    <Input label="Employee ID" value={form.data.employee_id} onChange={value => form.setData('employee_id', value)} error={form.errors.employee_id} />
                    <label className="block">
                        <span className="text-sm font-bold text-slate-300">Role</span>
                        <select value={form.data.role} onChange={event => form.setData('role', event.target.value)} className="field mt-2 bg-slate-950">
                            <option>Clinic Staff</option>
                            <option>Admin</option>
                        </select>
                        {form.errors.role && <p className="mt-2 text-sm text-rose-300">{form.errors.role}</p>}
                    </label>
                    <Input label="Password" type="password" value={form.data.password} onChange={value => form.setData('password', value)} error={form.errors.password} />
                    <Input label="Confirm password" type="password" value={form.data.password_confirmation} onChange={value => form.setData('password_confirmation', value)} error={form.errors.password_confirmation} />
                </div>
                <button disabled={form.processing} className="mt-5 rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">{form.processing ? 'Creating...' : 'Create account'}</button>
            </form>
        </AdminLayout>
    );
}

function Input({ label, value, onChange, error, type = 'text' }) {
    return <label className="block"><span className="text-sm font-bold text-slate-300">{label}</span><input type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="field mt-2" />{error && <p className="mt-2 text-sm text-rose-300">{error}</p>}</label>;
}
