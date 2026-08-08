import ClinicShell, { icons } from './ClinicShell';

const sections = [
    {
        label: 'Main',
        items: [
            { label: 'Home', href: '/user/home', icon: icons.Home },
            { label: 'Dashboard', href: '/user/dashboard', icon: icons.LayoutDashboard },
        ],
    },
    {
        label: 'Services',
        items: [
            { label: 'Appointments', href: '/student/appointments', icon: icons.CalendarDays },
            { label: 'Medicines', href: '/student/medicines', icon: icons.Pill },
            { label: 'Symptom Checker', href: '/student/symptom-checker', icon: icons.Stethoscope },
            { label: 'Events', href: '/student/events', icon: icons.Sparkles },
            { label: 'QR Scan', href: '/student/qr-scan', icon: icons.QrCode },
        ],
    },
    {
        label: 'Records',
        items: [
            { label: 'Visit History', href: '/user/visits', icon: icons.ClipboardList },
            { label: 'Clearance', href: '/student/clearance', icon: icons.FileText },
        ],
    },
    {
        label: 'Account',
        items: [
            { label: 'Profile', href: '/profile', icon: icons.User },
        ],
    },
];

const mobileLinks = [
    { label: 'Home', shortLabel: 'Home', href: '/user/home', icon: icons.Home },
    { label: 'Appointments', shortLabel: 'Appt', href: '/student/appointments', icon: icons.CalendarDays },
    { label: 'QR Scan', shortLabel: 'Scan', href: '/student/qr-scan', icon: icons.QrCode, primary: true },
    { label: 'Medicines', shortLabel: 'Meds', href: '/student/medicines', icon: icons.Pill },
    { label: 'Profile', shortLabel: 'Profile', href: '/profile', icon: icons.User },
];

export default function UserLayout({ title, subtitle, actions, children }) {
    return (
        <ClinicShell
            roleLabel="User"
            roleTone="user"
            homeHref="/user/home"
            title={title}
            subtitle={subtitle}
            actions={actions}
            sections={sections}
            mobileLinks={mobileLinks}
            hideDesktopTitle
        >
            {children}
        </ClinicShell>
    );
}
