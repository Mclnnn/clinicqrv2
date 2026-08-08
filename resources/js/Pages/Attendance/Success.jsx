import PublicLayout from '../../Layouts/PublicLayout';

export default function Success({ event, user }) {
    return (
        <PublicLayout title="Attendance Recorded" subtitle={event.title}>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">{user.name} has been recorded for this event.</div>
        </PublicLayout>
    );
}
