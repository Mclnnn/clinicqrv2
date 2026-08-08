import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/login');
    }

    return (
        <AuthLayout title="Sign in" subtitle="Secure access to the DSSC clinic management portal. Monitor visits, manage clearances, and track activities.">
            <Head title="Login" />
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/75">Email Address</label>
                    <input type="email" value={form.data.email} onChange={event => form.setData('email', event.target.value)} className="cq-form-field mt-2" />
                    {form.errors.email && <p className="mt-2 text-sm text-rose-300">{form.errors.email}</p>}
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/75">Password</label>
                    <input type="password" value={form.data.password} onChange={event => form.setData('password', event.target.value)} className="cq-form-field mt-2" />
                    {form.errors.password && <p className="mt-2 text-sm text-rose-300">{form.errors.password}</p>}
                </div>
                <button disabled={form.processing} className="cq-primary-btn w-full border-0">
                    {form.processing ? 'Signing in...' : 'Sign in'}
                </button>
                <p className="text-center text-sm text-white/55">
                    Wala pang account? <Link href="/register" className="font-bold text-blue-200">Create Account</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
