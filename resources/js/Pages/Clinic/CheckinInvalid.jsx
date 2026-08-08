import { Link } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';

export default function CheckinInvalid({ reason }) {
    return (
        <PublicLayout title="Invalid QR Code" subtitle={reason ?? 'This clinic QR code could not be verified.'}>
            <Link href="/login" className="inline-block rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">Go to login</Link>
        </PublicLayout>
    );
}
