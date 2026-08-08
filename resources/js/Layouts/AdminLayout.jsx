import { usePage } from '@inertiajs/react';
import ClinicShell, { icons } from './ClinicShell';

const adminSections = [
    {
        label: 'Main',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: icons.LayoutDashboard },
        ],
    },
    {
        label: 'Clinic Management',
        items: [
            { label: 'Appointments', href: '/admin/appointments', icon: icons.CalendarDays },
            { label: 'Visit Logs', href: '/admin/visit-logs', icon: icons.ClipboardList },
            { label: 'Clearances', href: '/admin/clearances', icon: icons.FileText },
            { label: 'Medicines', href: '/admin/medicines', icon: icons.Pill },
            { label: 'Events', href: '/admin/events', icon: icons.Sparkles },
        ],
    },
    {
        label: 'Accounts',
        items: [
            { label: 'User Approvals', href: '/admin/user-approvals', icon: icons.UserCheck },
            { label: 'Create Account', href: '/admin/create-account', icon: icons.Users },
        ],
    },
];

const superAdminSections = [
    {
        label: 'Super Admin',
        items: [
            { label: 'Super Admin Dashboard', href: '/superadmin/dashboard', icon: icons.ShieldCheck },
            { label: 'Monthly Report', href: '/superadmin/monthly-report', icon: icons.FileText },
            { label: 'Approvals', href: '/superadmin/approvals', icon: icons.UserCheck },
            { label: 'Clinic QR', href: '/superadmin/qr-clinic', icon: icons.QrCode },
            { label: 'Event QR', href: '/superadmin/qr-attendance', icon: icons.Sparkles },
        ],
    },
];

const adminQuickLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Appointments', href: '/admin/appointments' },
    { label: 'Medicines', href: '/admin/medicines' },
    { label: 'Visit Logs', href: '/admin/visit-logs' },
    { label: 'Clearances', href: '/admin/clearances' },
];

const superAdminQuickLinks = [
    { label: 'Super Admin', href: '/superadmin/dashboard' },
    { label: 'Monthly Report', href: '/superadmin/monthly-report' },
    { label: 'Approvals', href: '/superadmin/approvals' },
    { label: 'Clinic QR', href: '/superadmin/qr-clinic' },
    { label: 'Event QR', href: '/superadmin/qr-attendance' },
    { label: 'Admin', href: '/dashboard' },
];

export default function AdminLayout({ title, subtitle, actions, children }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'Super Admin';
    const sections = isSuperAdmin ? [...superAdminSections, ...adminSections] : adminSections;
    const quickLinks = isSuperAdmin ? superAdminQuickLinks : adminQuickLinks;

    return (
        <ClinicShell
            roleLabel={isSuperAdmin ? 'Super Admin' : 'Admin'}
            roleTone={isSuperAdmin ? 'super' : 'admin'}
            homeHref={isSuperAdmin ? '/superadmin/dashboard' : '/dashboard'}
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
