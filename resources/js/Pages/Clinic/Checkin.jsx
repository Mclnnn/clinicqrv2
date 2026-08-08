import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import PublicLayout from '../../Layouts/PublicLayout';

export default function Checkin({ token }) {
    const form = useForm({
        student_id: '',
        purpose: 'General Check-in',
        scan_latitude: '',
        scan_longitude: '',
        scan_accuracy: '',
        scan_location_status: 'not_requested',
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            form.setData('scan_location_status', 'unsupported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => form.setData({
                ...form.data,
                scan_latitude: position.coords.latitude,
                scan_longitude: position.coords.longitude,
                scan_accuracy: position.coords.accuracy,
                scan_location_status: 'allowed',
            }),
            () => form.setData('scan_location_status', 'denied'),
            { enableHighAccuracy: true, timeout: 6000 },
        );
    }, []);

    function submit(event) {
        event.preventDefault();
        form.post(`/clinic/checkin/${token}`);
    }

    return (
        <PublicLayout title="Clinic Check-in" subtitle="Enter your Student or Employee ID to log your clinic visit.">
            <form onSubmit={submit} className="space-y-4">
                <input value={form.data.student_id} onChange={event => form.setData('student_id', event.target.value)} className="field" placeholder="Student or Employee ID" />
                {form.errors.student_id && <p className="text-sm text-rose-300">{form.errors.student_id}</p>}
                <input value={form.data.purpose} onChange={event => form.setData('purpose', event.target.value)} className="field" placeholder="Purpose" />
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-400">Location status: {form.data.scan_location_status}</div>
                <button disabled={form.processing} className="w-full rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950">{form.processing ? 'Checking in...' : 'Check in'}</button>
            </form>
        </PublicLayout>
    );
}
