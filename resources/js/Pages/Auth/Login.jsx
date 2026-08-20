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

                <a
                    href="/auth/student-portal/redirect"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-blue-500/25"
                >
                    <Building2 size={18} className="transition group-hover:scale-110 text-blue-300" />
                    Sign in with Student Portal (SSO)
                </a>

                <div className="flex items-center justify-between text-xs text-white/55 hidden">
                    <span>Using demo/manual connector?</span>
                    <Link href="/school-portal/login" className="font-bold text-blue-200 hover:underline">
                        School Portal Login
                    </Link>
                </div>

                <p className="text-center text-sm text-white/55">
                    Wala pang account? <Link href="/register" className="font-bold text-blue-200">Create Account</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
