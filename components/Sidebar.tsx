import React, { useMemo, useState, useEffect } from 'react';
import { useAuth, useLabels } from '../context/AuthContext';
import { Role } from '../types';
import { getSidebarConfig } from '../data/mockData';

// Icons for navigation items
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const StudentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const HalaqaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 004.773-9.805A4 4 0 0012 12a4 4 0 00-4.773 2.195M15 21a6 6 0 00-9-5.197" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PaymentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const SubscriptionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M18 10a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>;
const AppManagerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AccountantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const AlertsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const PromotionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18 3.65 18 4.597v13.043c0 .947.354 2.765-.832 3.584C16.458 22.364 13.9 24 9.832 24H7a4.001 4.001 0 01-1.564-.317z" /></svg>;
const StudyPlanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const LessonPrepIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const SupervisoryVisitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6zm-2.121 4.879A5.002 5.002 0 0012 17.5a5.002 5.002 0 004.121-2.621" />
</svg>;
const ApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>;
const StudentRecordsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m4 12a4 4 0 100-8 4 4 0 000 8zm-4-4h8" /></svg>;
const MessageSettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CustomizationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const GitHubActionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-2h2v-2h2v-2h2v-2h2l2.057-2.057A6 6 0 0121 7z" /></svg>;


const LogoIcon = () => (
    <svg className="h-10 w-10 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" opacity="0.6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
);


interface NavLinkProps {
    icon: React.ReactNode;
    label: string;
    pageName: string;
    activePage: string;
    onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, pageName, activePage, onClick }) => (
    <li className="relative">
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-3 text-right rounded-lg transition-all duration-200 group ${
                activePage === pageName
                    ? 'bg-sky-700 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-sky-100 hover:text-sky-800'
            }`}
        >
            <div className="flex-shrink-0">{icon}</div>
            <span className="mr-4 text-md md:text-lg font-semibold">{label}</span>
        </button>
    </li>
);

const allLinks: { [key: string]: { labelKey: string; icon: React.ReactNode } } = {
    dashboard: { labelKey: 'sidebar.dashboard', icon: <DashboardIcon /> },
    attendance: { labelKey: 'sidebar.attendance', icon: <AttendanceIcon /> },
    lessonPrep: { labelKey: 'sidebar.lessonPrep', icon: <LessonPrepIcon /> },
    studentRecords: { labelKey: 'sidebar.studentRecords', icon: <StudentRecordsIcon /> },
    planApprovals: { labelKey: 'sidebar.planApprovals', icon: <ApprovalIcon /> },
    supervisoryVisits: { labelKey: 'sidebar.supervisoryVisits', icon: <SupervisoryVisitIcon /> },
    students: { labelKey: 'sidebar.students', icon: <StudentsIcon /> },
    halaqat: { labelKey: 'sidebar.halaqat', icon: <HalaqaIcon /> },
    users: { labelKey: 'sidebar.users', icon: <UsersIcon /> },
    studyPlans: { labelKey: 'sidebar.studyPlans', icon: <StudyPlanIcon /> },
    reports: { labelKey: 'sidebar.reports', icon: <ReportsIcon /> },
    payments: { labelKey: 'sidebar.payments', icon: <PaymentsIcon /> },
    teacherPayments: { labelKey: 'sidebar.teacherPayments', icon: <PaymentsIcon /> },
    accountant: { labelKey: 'sidebar.accountant', icon: <AccountantIcon /> },
    accountantAlerts: { labelKey: 'sidebar.accountantAlerts', icon: <AlertsIcon /> },
    messageSettings: { labelKey: 'sidebar.messageSettings', icon: <MessageSettingsIcon /> },
    subscription: { labelKey: 'sidebar.subscription', icon: <SubscriptionIcon /> },
    appManager: { labelKey: 'sidebar.appManager', icon: <AppManagerIcon /> },
    hierarchicalInstitutions: { labelKey: 'sidebar.hierarchicalInstitutions', icon: <AppManagerIcon /> },
    subordinateInstitutions: { labelKey: 'sidebar.subordinateInstitutions', icon: <AppManagerIcon /> },
    promotion: { labelKey: 'sidebar.promotion', icon: <PromotionIcon /> },
    profile: { labelKey: 'sidebar.profile', icon: <ProfileIcon /> },
    settings: { labelKey: 'sidebar.settings', icon: <SettingsIcon /> },
    labelCustomization: { labelKey: 'sidebar.labelCustomization', icon: <CustomizationIcon /> },
    githubActionsGuide: { labelKey: 'sidebar.githubActionsGuide', icon: <GitHubActionsIcon /> },
    githubSecrets: { labelKey: 'sidebar.githubSecrets', icon: <KeyIcon /> },
};


const roleNavLinks: { [key in Role]?: string[] } = {
    [Role.Admin]: ['dashboard', 'attendance', 'students', 'halaqat', 'users', 'studyPlans', 'reports', 'payments', 'subscription', 'settings', 'profile'],
    [Role.DeputyManager]: ['dashboard', 'attendance', 'students', 'halaqat', 'users', 'reports', 'payments', 'profile'],
    [Role.Supervisor]: ['dashboard', 'attendance', 'students', 'halaqat', 'reports', 'planApprovals', 'supervisoryVisits', 'studyPlans', 'profile'],
    [Role.Teacher]: ['dashboard', 'attendance', 'studentRecords', 'lessonPrep', 'teacherPayments', 'supervisoryVisits', 'reports', 'messageSettings', 'profile'],
    [Role.Accountant]: ['dashboard', 'students', 'payments', 'accountantAlerts', 'profile'],
    [Role.AppManager]: ['appManager', 'hierarchicalInstitutions', 'promotion', 'labelCustomization', 'githubActionsGuide', 'githubSecrets', 'profile'],
    [Role.ManagerOfInstitutions]: ['subordinateInstitutions', 'profile'],
};


const Sidebar: React.FC<{
    activePage: string;
    setActivePage: (page: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();
    const [sidebarConfig, setSidebarConfig] = useState(getSidebarConfig());

     useEffect(() => {
        const handleSettingsUpdate = () => setSidebarConfig(getSidebarConfig());
        window.addEventListener('settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
    }, []);

    const navLinksToShow = useMemo(() => {
        if (!user) return [];
        const role = user.role;
        const customConfig = sidebarConfig[role];
        
        let linkIds = customConfig === null ? roleNavLinks[role] : customConfig;

        if (user.extraPermissions) {
            linkIds = [...(linkIds || []), ...user.extraPermissions];
        }
        
        if (!linkIds) return [];

        return [...new Set(linkIds)]
            .map((id: string) => {
                const linkData = allLinks[id];
                if (linkData) {
                    return { label: getLabel(linkData.labelKey), icon: linkData.icon, pageName: id };
                }
                return null; // Return null for invalid IDs
            })
            .filter((link): link is { label: string; icon: React.ReactNode; pageName: string } => link !== null);

    }, [user, sidebarConfig, getLabel]);

    const handleNavClick = (pageName: string) => {
        setActivePage(pageName);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };
    
    return (
        <aside className={`fixed md:relative inset-y-0 right-0 w-64 bg-slate-50 border-l border-slate-200 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center p-4 h-20 border-b">
                    <LogoIcon />
                    <h1 className="text-xl font-bold text-slate-800 mr-2">حلقاتي</h1>
                </div>
                <nav id="sidebar-nav" className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {navLinksToShow.map(link => (
                            <NavLink
                                key={link.pageName}
                                icon={link.icon}
                                label={link.label}
                                pageName={link.pageName}
                                activePage={activePage}
                                onClick={() => handleNavClick(link.pageName)}
                            />
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;