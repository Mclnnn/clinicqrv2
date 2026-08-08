import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    FileText,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    Pill,
    QrCode,
    Search,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    User,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export const icons = {
    Bell,
    CalendarDays,
    ArrowLeft,
    ClipboardList,
    FileText,
    Home,
    LayoutDashboard,
    Pill,
    QrCode,
    Search,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    User,
    UserCheck,
    Users,
};

function initials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase() || 'CQ';
}

function isActivePath(currentPath, href) {
    return currentPath === href || (href !== '/' && currentPath.startsWith(`${href}/`));
}

function notificationTone(type) {
    return {
        success: 'success',
        warning: 'warning',
        error: 'error',
        info: 'info',
    }[type] ?? 'info';
}

export default function ClinicShell({
    roleLabel,
    roleTone = 'user',
    homeHref,
    title,
    subtitle,
    actions,
    sections,
    quickLinks,
    mobileLinks = [],
    children,
    hideDesktopTitle = false,
}) {
    const { auth, flash, notifications } = usePage().props;
    const user = auth?.user;
    const currentPath = window.location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState({});

    const latestNotifications = Array.isArray(notifications?.latest) ? notifications.latest : [];
    const unreadCount = notifications?.unread_count ?? 0;

    useEffect(() => {
        const nextOpenGroups = {};
        sections.forEach(section => {
            section.items?.forEach(item => {
                if (item.children?.some(child => isActivePath(currentPath, child.href))) {
                    nextOpenGroups[item.label] = true;
                }
            });
        });
        setOpenGroups(nextOpenGroups);
    }, [currentPath, sections]);

    const roleClass = `cq-role-pill ${roleTone}`;
    const displayId = user?.student_id ?? user?.employee_id ?? user?.user_type ?? user?.role ?? 'Clinic user';

    const quick = useMemo(() => quickLinks ?? sections.flatMap(section => section.items ?? []).filter(item => !item.children).slice(0, 5), [quickLinks, sections]);

    function logout() {
        router.post('/logout');
    }

    function goBack() {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(homeHref);
    }

    function closeMenus() {
        setProfileOpen(false);
        setNotifOpen(false);
    }

    function renderIcon(Icon, className = 'cq-nav-icon') {
        return Icon ? <Icon className={className} aria-hidden="true" /> : <span className={className}>CQ</span>;
    }

    return (
        <main className="cq-shell cq-user-shell">
            <header className="cq-topbar">
                <div className="cq-topbar-row">
                    <div className="flex min-w-0 items-center gap-4">
                        <button className="cq-ham" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                            <Menu size={20} aria-hidden="true" />
                        </button>
                        <div className="hidden sm:flex items-center gap-3">
                            <img src="/images/clinic/school logo.png" alt="DSSC" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
                            <div className="flex flex-col">
                                <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px', opacity: 0.8 }}>DAVAO DEL SUR STATE COLLEGE</span>
                                <span style={{ fontSize: '13px', fontWeight: '700' }}>Health Services</span>
                            </div>
                        </div>
                        <button className="cq-back-btn" type="button" onClick={goBack} aria-label="Go back">
                            <ArrowLeft size={19} aria-hidden="true" />
                        </button>
                    </div>

                    <nav className="cq-quick" aria-label="Quick navigation">
                        {quick.map(item => (
                            <Link key={item.href} href={item.href} className={isActivePath(currentPath, item.href) ? 'active' : ''}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="cq-user-top-actions flex min-w-0 items-center gap-2">
                        <span className={roleClass}>{roleLabel}</span>

                        <div className="cq-menu-wrap">
                            <button
                                type="button"
                                className="cq-icon-btn"
                                onClick={() => {
                                    setNotifOpen(value => !value);
                                    setProfileOpen(false);
                                }}
                                aria-label="Notifications"
                            >
                                <Bell size={18} aria-hidden="true" />
                                {unreadCount > 0 && <span className="cq-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>

                            {notifOpen && (
                                <div className="cq-dropdown cq-notif-dropdown">
                                    <div className="cq-dropdown-head">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button type="button" onClick={() => router.post('/notifications/read-all')} className="cq-text-action">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="cq-dropdown-list">
                                        {latestNotifications.length ? latestNotifications.map(item => (
                                            <Link key={item.id} href={`/notifications/${item.id}`} className={`cq-notif-item ${!item.is_read ? 'unread' : ''}`} onClick={closeMenus}>
                                                <span className={`cq-notif-dot ${notificationTone(item.type)}`}></span>
                                                <span className="min-w-0">
                                                    <span className="cq-notif-title">{item.title}</span>
                                                    <span className="cq-notif-msg">{item.message}</span>
                                                </span>
                                            </Link>
                                        )) : (
                                            <div className="cq-empty-menu">No notifications yet.</div>
                                        )}
                                    </div>
                                    <Link href="/notifications" className="cq-dropdown-foot" onClick={closeMenus}>View all notifications</Link>
                                </div>
                            )}
                        </div>

                        <div className="cq-menu-wrap">
                            <button
                                type="button"
                                className="cq-avatar-btn"
                                onClick={() => {
                                    setProfileOpen(value => !value);
                                    setNotifOpen(false);
                                }}
                                aria-label="Account menu"
                            >
                                <span className="cq-avatar">
                                    {user?.profile_photo_url ? <img src={user.profile_photo_url} alt="" /> : initials(user?.name)}
                                </span>
                                <ChevronDown className="hidden text-white/35 sm:block" size={16} aria-hidden="true" />
                            </button>

                            {profileOpen && (
                                <div className="cq-dropdown cq-profile-dropdown">
                                    <div className="cq-profile-card">
                                        <span className="cq-avatar big">
                                            {user?.profile_photo_url ? <img src={user.profile_photo_url} alt="" /> : initials(user?.name)}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="cq-profile-name">{user?.name ?? roleLabel}</span>
                                            <span className="cq-profile-email">{user?.email ?? displayId}</span>
                                        </span>
                                    </div>
                                    <Link href="/profile" className="cq-dd-link" onClick={closeMenus}>
                                        <User size={16} aria-hidden="true" /> My Profile
                                    </Link>
                                    <button type="button" className="cq-dd-link danger" onClick={logout}>
                                        <LogOut size={16} aria-hidden="true" /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>

                        {actions && <div className="cq-user-actions-slot min-w-0">{actions}</div>}
                    </div>
                </div>
            </header>

            {sidebarOpen && <button className="cq-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu"></button>}

            <aside className={`cq-side ${sidebarOpen ? 'open' : ''}`}>
                <div className="cq-side-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <button type="button" className="cq-side-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img src="/images/clinic/school logo.png" alt="DSSC" style={{ height: '70px', width: '70px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>Davao Del Sur State College</div>
                            <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px', opacity: 0.8 }}>Health Services Clinic</div>
                        </div>
                    </div>
                    <Link href={homeHref} className="flex min-w-0 items-center justify-center gap-2 no-underline text-white" onClick={() => setSidebarOpen(false)} style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                        <Stethoscope size={16} aria-hidden="true" />
                        <span>ClinicQR</span>
                    </Link>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label={`${roleLabel} navigation`}>
                    {sections.map(section => (
                        <div key={section.label} className="cq-side-section">
                            <div className="cq-side-label">{section.label}</div>
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    if (item.children?.length) {
                                        const open = openGroups[item.label];
                                        const active = item.children.some(child => isActivePath(currentPath, child.href));
                                        return (
                                            <div key={item.label}>
                                                <button
                                                    type="button"
                                                    className={`cq-side-link cq-side-group ${active ? 'active' : ''}`}
                                                    onClick={() => setOpenGroups(groups => ({ ...groups, [item.label]: !open }))}
                                                >
                                                    {renderIcon(item.icon)}
                                                    <span>{item.label}</span>
                                                    <ChevronDown className={`cq-chevron ${open ? 'open' : ''}`} size={16} aria-hidden="true" />
                                                </button>
                                                {open && (
                                                    <div className="cq-subnav">
                                                        {item.children.map(child => (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                className={`cq-subnav-link ${isActivePath(currentPath, child.href) ? 'active' : ''}`}
                                                                onClick={() => setSidebarOpen(false)}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`cq-side-link ${isActivePath(currentPath, item.href) ? 'active' : ''}`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            {renderIcon(item.icon)}
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="cq-side-user">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="cq-avatar">
                            {user?.profile_photo_url ? <img src={user.profile_photo_url} alt="" /> : initials(user?.name)}
                        </span>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-bold">{user?.name ?? roleLabel}</div>
                            <div className="truncate text-xs text-white/45">{displayId}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="cq-logout-btn">
                        <LogOut size={16} aria-hidden="true" /> Log out
                    </button>
                </div>
            </aside>

            <section className="cq-main">
                {title && !hideDesktopTitle && (
                    <div className="cq-page-head">
                        <div>
                            <h1 className="cq-font-display text-3xl font-black">{title}</h1>
                            {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
                        </div>
                        {actions}
                    </div>
                )}
                {title && hideDesktopTitle && (
                    <div className="mb-5 lg:hidden">
                        <h1 className="cq-font-display text-2xl font-black">{title}</h1>
                        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
                    </div>
                )}
                {flash?.success && <div className="cq-alert success">{flash.success}</div>}
                {flash?.error && <div className="cq-alert error">{flash.error}</div>}
                {flash?.info && <div className="cq-alert info">{flash.info}</div>}
                {children}
            </section>

            {!!mobileLinks.length && (
                <nav className="cq-mobile-nav" aria-label="Mobile navigation">
                    {mobileLinks.map(item => {
                        const active = isActivePath(currentPath, item.href);
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href} className={`cq-mobile-nav-item ${item.primary ? 'scan' : ''} ${active ? 'active' : ''}`}>
                                <span className="cq-mobile-nav-icon">{renderIcon(Icon, 'cq-mobile-icon-svg')}</span>
                                <span className="cq-mobile-nav-label">{item.shortLabel ?? item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </main>
    );
}
