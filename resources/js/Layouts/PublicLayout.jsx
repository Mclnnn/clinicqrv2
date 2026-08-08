import { Head, Link, usePage } from '@inertiajs/react';

export default function PublicLayout({ title, subtitle, children }) {
    const { flash } = usePage().props;

    return (
        <main className="cq-shell">
            <Head title={title} />
            <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-8 sm:px-5 sm:py-10">
                <Link href="/" className="mb-8 flex items-center gap-3 no-underline text-white">
                    <span className="cq-logo-box">CQ</span>
                    <span className="cq-logo-text">Clinic<em>QR</em></span>
                </Link>
                <section className="cq-glass p-4 sm:p-6">
                    <h1 className="cq-font-display text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                    {subtitle && <p className="mt-2 text-sm leading-6 text-white/50">{subtitle}</p>}
                    {flash?.success && <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{flash.success}</div>}
                    {flash?.error && <div className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{flash.error}</div>}
                    {flash?.info && <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-200">{flash.info}</div>}
                    <div className="mt-6">{children}</div>
                </section>
            </div>
        </main>
    );
}
