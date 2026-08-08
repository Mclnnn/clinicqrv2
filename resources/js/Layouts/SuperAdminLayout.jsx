import ClinicShell, { icons } from './ClinicShell';

const sections = [
    {
        label: 'Main',
        items: [
            { label: 'Dashboard', href: '/superadmin/dashboard', icon: icons.LayoutDashboard },
            { label: 'Monthly Report', href: '/superadmin/monthly-report', icon: icons.FileText },
            { label: 'ML Decision History', href: '/superadmin/ml-decision-history', icon: icons.ClipboardList },
            { label: 'Admin Dashboard', href: '/dashboard', icon: icons.ShieldCheck },
        ],
    },
    {
        label: 'Approvals',
        items: [
            { label: 'Approvals', href: '/superadmin/approvals', icon: icons.UserCheck },
        ],
    },
    {
        label: 'QR Codes',
        items: [
            { label: 'Clinic QR', href: '/superadmin/qr-clinic', icon: icons.QrCode },
            { label: 'Event QR', href: '/superadmin/qr-attendance', icon: icons.Sparkles },
        ],
    },
];

const quickLinks = [
    { label: 'Dashboard', href: '/superadmin/dashboard' },
    { label: 'Monthly Report', href: '/superadmin/monthly-report' },
    { label: 'Approvals', href: '/superadmin/approvals' },
    { label: 'Clinic QR', href: '/superadmin/qr-clinic' },
    { label: 'Event QR', href: '/superadmin/qr-attendance' },
];

export default function SuperAdminLayout({ title, subtitle, actions, children }) {
    return (
        <ClinicShell
            roleLabel="Super Admin"
            roleTone="super"
            homeHref="/superadmin/dashboard"
            title={title}
            subtitle={subtitle}
            actions={actions}
            sections={sections}
            quickLinks={quickLinks}
        >
            {children}
        </ClinicShell>
    );
}
