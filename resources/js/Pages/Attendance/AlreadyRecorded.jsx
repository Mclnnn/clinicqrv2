import PublicLayout from '../../Layouts/PublicLayout';

export default function AlreadyRecorded({ event, user }) {
    return (
        <PublicLayout title="Already Recorded" subtitle={event.title}>
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">{user.name} already has an attendance record for this event.</div>
        </PublicLayout>
    );
}
