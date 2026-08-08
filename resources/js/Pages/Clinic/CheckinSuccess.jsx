import PublicLayout from '../../Layouts/PublicLayout';

export default function CheckinSuccess({ user }) {
    return (
        <PublicLayout title="Check-in Recorded" subtitle={`${user.name} has been checked in successfully.`}>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Your clinic visit was logged. Please proceed to the clinic staff.</div>
        </PublicLayout>
    );
}
