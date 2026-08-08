import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        user_type: 'Student',
        department: '',
        contact_number: '',
        date_of_birth: '',
        gender: 'Male',
        address: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/register');
    }

    return (
        <AuthLayout title="Create Account" subtitle="Register as a student, employee, or staff member. Admin approval is required before access is granted.">
            <Head title="Register" />
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={form.errors.name} className="sm:col-span-2">
                    <input value={form.data.name} onChange={event => form.setData('name', event.target.value)} className="field" />
                </Field>
                <Field label="Email" error={form.errors.email} className="sm:col-span-2">
                    <input type="email" value={form.data.email} onChange={event => form.setData('email', event.target.value)} className="field" />
                </Field>
                <Field label="Password" error={form.errors.password}>
                    <input type="password" value={form.data.password} onChange={event => form.setData('password', event.target.value)} className="field" />
                </Field>
                <Field label="Confirm password" error={form.errors.password_confirmation}>
                    <input type="password" value={form.data.password_confirmation} onChange={event => form.setData('password_confirmation', event.target.value)} className="field" />
                </Field>
                <Field label="Type" error={form.errors.user_type}>
                    <select value={form.data.user_type} onChange={event => form.setData('user_type', event.target.value)} className="field">
                        <option>Student</option>
                        <option>Employee</option>
                        <option>Staff</option>
                    </select>
                </Field>
                <Field label="Department or course" error={form.errors.department}>
                    <input value={form.data.department} onChange={event => form.setData('department', event.target.value)} className="field" />
                </Field>
                <Field label="Contact number" error={form.errors.contact_number}>
                    <input value={form.data.contact_number} onChange={event => form.setData('contact_number', event.target.value)} className="field" />
                </Field>
                <Field label="Date of birth" error={form.errors.date_of_birth}>
                    <input type="date" value={form.data.date_of_birth} onChange={event => form.setData('date_of_birth', event.target.value)} className="field" />
                </Field>
                <Field label="Gender" error={form.errors.gender}>
                    <select value={form.data.gender} onChange={event => form.setData('gender', event.target.value)} className="field">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Prefer not to say</option>
                    </select>
                </Field>
                <Field label="Address" error={form.errors.address} className="sm:col-span-2">
                    <textarea rows="3" value={form.data.address} onChange={event => form.setData('address', event.target.value)} className="field" />
                </Field>
                <button disabled={form.processing} className="cq-primary-btn border-0 sm:col-span-2">
                    {form.processing ? 'Submitting...' : 'Submit registration'}
                </button>
                <p className="text-center text-sm text-white/55 sm:col-span-2">
                    Already registered? <Link href="/login" className="font-bold text-blue-200">Log in</Link>
                </p>
            </form>
        </AuthLayout>
    );
}

function Field({ label, error, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-bold text-white/75">{label}</span>
            <div className="mt-2">{children}</div>
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </label>
    );
}
