import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function SchoolPortalLogin({ demoAccounts = [] }) {
    const form = useForm({
        login: '',
        password: '',
    });

    function submit(event) {
        event.preventDefault();
        form.post('/school-portal/login');
    }

    function useDemo(account) {
        form.setData({
            login: account.login,
            password: account.password,
        });
    }

    return (
        <AuthLayout title="School Portal Sign In" subtitle="Use your DSSC student or faculty portal account to continue to ClinicQR.">
            <Head title="School Portal Login" />

            <div className="mb-5 rounded-2xl border border-white/15 bg-white/[0.075] p-4 text-sm leading-6 text-white/75">
                <div className="flex items-center gap-2 font-black text-white">
                    <ShieldCheck size={17} />
                    DSSC portal identity
                </div>
                <p className="mt-2">
                    ClinicQR will verify your school portal account, then open your linked clinic account.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/75">School portal email or ID</label>
                    <input
                        type="text"
                        value={form.data.login}
                        onChange={event => form.setData('login', event.target.value)}
                        className="cq-form-field mt-2"
                        placeholder="student.portal@dssc.edu.ph"
                    />
                    {form.errors.login && <p className="mt-2 text-sm text-rose-300">{form.errors.login}</p>}
                </div>

                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/75">School portal password</label>
                    <input
                        type="password"
                        value={form.data.password}
                        onChange={event => form.setData('password', event.target.value)}
                        className="cq-form-field mt-2"
                        placeholder="portal123"
                    />
                    {form.errors.password && <p className="mt-2 text-sm text-rose-300">{form.errors.password}</p>}
                </div>

                <button disabled={form.processing} className="cq-primary-btn w-full border-0">
                    {form.processing ? 'Checking portal account...' : 'Login with School Portal'}
                </button>
            </form>

            {demoAccounts.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/55">Development access</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                        Temporary demo accounts while waiting for the official DSSC portal API.
                    </p>
                    <div className="mt-3 grid gap-3">
                        {demoAccounts.map(account => (
                            <button
                                key={account.login}
                                type="button"
                                onClick={() => useDemo(account)}
                                className="rounded-xl border border-white/10 bg-slate-950/35 p-3 text-left transition hover:border-white/25 hover:bg-white/10"
                            >
                                <div className="flex items-center gap-2 text-sm font-black text-white">
                                    {account.type === 'Student' ? <GraduationCap size={16} /> : <Building2 size={16} />}
                                    {account.type}
                                    {account.department && <span className="text-white/45">· {account.department}</span>}
                                </div>
                                <div className="mt-1 text-xs text-white/55">{account.login} / {account.password}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-white/55">
                Need the normal ClinicQR login? <Link href="/login" className="font-bold text-blue-100">Go back</Link>
            </p>
        </AuthLayout>
    );
}
