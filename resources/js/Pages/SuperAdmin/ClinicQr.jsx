import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '../../Layouts/SuperAdminLayout';

export default function ClinicQr({ qrCode, scanUrl, pastTokens, isLocalScanUrl }) {
    return (
        <SuperAdminLayout title="Clinic QR Code" subtitle="Persistent QR for clinic check-ins.">
            <Head title="Clinic QR Code" />
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center sm:p-6">
                    <div className="mx-auto inline-block rounded-lg bg-white p-4" dangerouslySetInnerHTML={{ __html: qrCode }} />
                    <div className="mt-5 break-all rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">{scanUrl}</div>
                    {isLocalScanUrl && (
                        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-left text-sm leading-6 text-amber-100">
                            This QR uses a local Herd URL. It works on this computer, but most phones cannot open <strong>clinicqrv2.test</strong>. For phone scanning, run <strong>npm run expose</strong>, open this QR page through the public Expose URL, then scan that displayed QR. You can also set <strong>QR_BASE_URL</strong> to the public URL and run <strong>php artisan optimize:clear</strong>.
                        </div>
                    )}
                    <button onClick={() => router.post('/superadmin/qr-clinic/regenerate')} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200">Regenerate QR</button>
                </section>
                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                    <h2 className="text-lg font-black">Recent QR Tokens</h2>
                    <div className="mt-4 space-y-3">
                        {pastTokens?.map(token => (
                            <div key={token.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                                <div className="break-all text-sm font-bold">{token.token}</div>
                                <div className="mt-1 text-xs text-slate-500">{token.valid_date ?? token.created_at}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </SuperAdminLayout>
    );
}
