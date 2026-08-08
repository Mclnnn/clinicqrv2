import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChartLine, ClipboardList, FileText, LockKeyhole, Stethoscope } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
    const { flash } = usePage().props;

    return (
        <main className="cq-login">
            <Link href="/" className="cq-login-back grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-white no-underline transition hover:bg-white/20" aria-label="Back to home">
                <ArrowLeft size={19} aria-hidden="true" />
            </Link>
            <div className="cq-auth-grid">
                <section className="cq-login-left">
                    <Link href="/" className="mb-10 flex items-center gap-3 no-underline text-white">
                        <span className="cq-logo-box"><Stethoscope size={19} aria-hidden="true" /></span>
                        <span className="cq-logo-text">Clinic<em>QR</em></span>
                    </Link>
                    <h1 className="font-['Sora'] text-5xl font-black leading-none tracking-tight sm:text-6xl">
                        Welcome<br />back to<br />ClinicQR.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">{subtitle}</p>
                    <div className="mt-8 grid max-w-xl gap-3 text-sm text-white/75">
                        <Feature icon={ClipboardList}>QR-based patient visit logging</Feature>
                        <Feature icon={FileText}>Medical clearance management</Feature>
                        <Feature icon={ChartLine}>Real-time activity monitoring</Feature>
                        <Feature icon={LockKeyhole}>Multi-role access control</Feature>
                    </div>
                </section>

                <section className="grid place-items-center">
                    <div className="cq-login-card">
                        <h2 className="font-['Sora'] text-3xl font-black">{title}</h2>
                        <p className="mt-2 text-sm text-white/55">Enter your credentials to access your account</p>
                        <div className="mt-6">
                            {flash?.success && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{flash.success}</div>}
                            {flash?.error && <div className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{flash.error}</div>}
                            {children}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Feature({ icon: Icon, children }) {
    return (
        <div className="cq-auth-feature">
            <span><Icon size={17} aria-hidden="true" /></span>
            {children}
        </div>
    );
}
