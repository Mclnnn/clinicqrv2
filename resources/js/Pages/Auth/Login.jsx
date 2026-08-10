import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
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

                <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/35">or</span>
                    <span className="h-px flex-1 bg-white/10" />
                </div>

                <button
                    type="button"
                    onClick={() => router.visit('/school-portal/login')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center font-black text-cyan-50 transition hover:border-cyan-200/50 hover:bg-cyan-300/20"
                >
                    <Building2 size={18} />
                    Continue with School Portal
                </button>

                <p className="text-center text-sm text-white/55">
                    Wala pang account? <Link href="/register" className="font-bold text-blue-200">Create Account</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
