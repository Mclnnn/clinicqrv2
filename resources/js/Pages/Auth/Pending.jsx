import { Head, Link } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function Pending() {
    return (
        <AuthLayout title="Registration pending" subtitle="Your account was received and is waiting for admin approval. You can try logging in again once the clinic team approves it.">
            <Head title="Registration Pending" />
            <div className="space-y-5">
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                    Pending accounts cannot access dashboards yet. This keeps clinic data visible only to approved users.
                </div>
                <Link href="/login" className="block rounded-lg bg-blue-300 px-5 py-3 text-center font-black text-slate-950 hover:bg-blue-200">Back to login</Link>
            </div>
        </AuthLayout>
    );
}
