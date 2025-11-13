import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

import AdminDashboard from './dashboards/AdminDashboard';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import Attendance from './Attendance';
import StudentManagement from './StudentManagement';
import HalaqaManagement from './HalaqaManagement';
import UserManagement from './UserManagement';
import Reports from './Reports';
import Payments from './Payments';
import Subscription from './Subscription';
import AppManager from './AppManager';
import Profile from './Profile';
import PromotionPage from './PromotionPage';
import TeacherPayments from './TeacherPayments';
import StudyPlanManagement from './StudyPlanManagement';
import LessonPrep from './LessonPrep';
import SupervisoryVisits from './SupervisoryVisits';
import PlanApprovals from './PlanApprovals';
import StudentRecords from './StudentRecords';
import MessageSettings from './MessageSettings';
import Settings, { LabelCustomization } from './Settings';
import AccountantAlerts from './AccountantAlerts';
import ImportantDates from './ImportantDates'; // Assuming this component exists and may need isReadOnly
import SubordinateInstitutions from './SubordinateInstitutions';
import HierarchicalInstitutions from './HierarchicalInstitutions';
import GitHubActionsGuide from './GitHubActionsGuide';
import GitHubSecretsManager from './GitHubSecretsManager';

interface MainContentProps {
    page: string;
    setActivePage: (page: string) => void;
    isReadOnly: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ page, setActivePage, isReadOnly }) => {
    const { user } = useAuth();

    const renderDashboard = () => {
        switch (user?.role) {
            case Role.AppManager:
                return <AppManager />; // AppManager's main page is subscriber management
            case Role.ManagerOfInstitutions:
                return <SubordinateInstitutions />;
            case Role.Admin:
            case Role.DeputyManager:
                return <AdminDashboard setActivePage={setActivePage} />;
            case Role.Supervisor:
                return <SupervisorDashboard setActivePage={setActivePage} />;
            case Role.Teacher:
                return <TeacherDashboard />;
            case Role.Accountant:
                return <AccountantDashboard />;
            default:
                return <div>مرحباً بك!</div>;
        }
    };

    const renderContent = () => {
        switch (page) {
            case 'dashboard':
                return renderDashboard();
            case 'attendance':
                // FIX: Pass the isReadOnly prop to the Attendance component as suggested by the comment.
                return <Attendance isReadOnly={isReadOnly} />; // Attendance is read-only for supervisors, but teacher actions should be disabled if isReadOnly
            case 'students':
                return <StudentManagement isReadOnly={isReadOnly} />;
            case 'halaqat':
                return <HalaqaManagement isReadOnly={isReadOnly} />;
            case 'users':
                return <UserManagement isReadOnly={isReadOnly} />;
            case 'reports':
                return <Reports />;
            case 'payments':
                return <Payments isReadOnly={isReadOnly} />;
            case 'teacherPayments':
                return <TeacherPayments isReadOnly={isReadOnly} />;
            case 'messageSettings':
                return <MessageSettings isReadOnly={isReadOnly} />;
            case 'subscription':
                return <Subscription isReadOnly={isReadOnly} />;
            case 'appManager':
                return <AppManager />;
            case 'hierarchicalInstitutions':
                return <HierarchicalInstitutions />;
            case 'subordinateInstitutions':
                return <SubordinateInstitutions />;
             case 'profile':
                return <Profile isReadOnly={isReadOnly} />;
            case 'promotion':
                return <PromotionPage isReadOnly={isReadOnly} />;
            case 'accountant':
                return <AccountantDashboard />;
            case 'accountantAlerts':
                return <AccountantAlerts isReadOnly={isReadOnly} />;
            case 'studyPlans':
                return <StudyPlanManagement isReadOnly={isReadOnly} />;
            case 'lessonPrep':
                return <LessonPrep isReadOnly={isReadOnly} />;
            case 'studentRecords':
                return <StudentRecords />; // Read-only by design, but check for actions
            case 'planApprovals':
                return <PlanApprovals isReadOnly={isReadOnly} />;
            case 'supervisoryVisits':
                return <SupervisoryVisits isReadOnly={isReadOnly} />;
            case 'settings':
                return <Settings isReadOnly={isReadOnly} />;
            // This page was missing from the switch, adding it.
            case 'importantDates':
                return <ImportantDates isReadOnly={isReadOnly} />;
            case 'labelCustomization':
                return <LabelCustomization isReadOnly={isReadOnly} />;
            case 'githubActionsGuide':
                return <GitHubActionsGuide />;
            case 'githubSecrets':
                return <GitHubSecretsManager />;
            default:
                return <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>;
        }
    };

    return <div className="h-full">{renderContent()}</div>;
};

export default MainContent;