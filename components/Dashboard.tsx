import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Tutorial, { TutorialStep } from './Tutorial';
import { useAuth } from '../context/AuthContext';
import { Role, LessonPlanRecord, SupervisoryVisit } from '../types';
import { 
    lessonPlanRecords as allLessonPlans, 
    formatDate, 
    halaqat as allHalaqat,
    supervisoryVisits as allVisits,
    users as allUsers
} from '../data/mockData';

const tutorialSteps: TutorialStep[] = [
    {
        title: 'أهلاً بك!',
        content: 'مرحباً بك في نظام إدارة الحلقات! دعنا نأخذك في جولة سريعة للتعرف على الواجهة الرئيسية.',
    },
    {
        title: 'القائمة الرئيسية',
        content: 'هذه هي القائمة الرئيسية. من هنا يمكنك التنقل بين جميع صفحات النظام المتاحة لك.',
        elementId: 'sidebar-nav',
    },
    {
        title: 'معلومات الحساب',
        content: 'هنا تجد اسمك وصلاحيتك، بالإضافة إلى الإشعارات الهامة وزر تسجيل الخروج من النظام.',
        elementId: 'app-header',
    },
    {
        title: 'مساحة العمل',
        content: 'هذه هي مساحة العمل الرئيسية. المحتوى هنا يتغير بناءً على الصفحة التي تختارها من القائمة الجانبية.',
        elementId: 'main-content-area',
    },
    {
        title: 'أنت الآن جاهز!',
        content: 'لقد تعرفت على الأساسيات. يمكنك الآن استكشاف باقي الميزات بنفسك. نتمنى لك تجربة ممتعة!',
    }
];


const Dashboard: React.FC = () => {
  const { user, isReadOnly } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  const isSupervisor = user?.role === Role.Supervisor;
  const isTeacher = user?.role === Role.Teacher;
  const [pendingApprovals, setPendingApprovals] = useState<LessonPlanRecord[]>([]);
  const [showApprovalNotification, setShowApprovalNotification] = useState(false);

  // New state for teacher lesson plan notifications
  const [approvedPlan, setApprovedPlan] = useState<LessonPlanRecord | null>(null);
  const [rejectedPlan, setRejectedPlan] = useState<LessonPlanRecord | null>(null);
  const [remindLater, setRemindLater] = useState(false);
  const [newSupervisoryVisit, setNewSupervisoryVisit] = useState<SupervisoryVisit | null>(null);


  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('halaqa_tutorial_seen');
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true);
    }
  }, []);
  
    useEffect(() => {
        if (user) {
            let defaultPage = 'dashboard';
            if (user.role === Role.ManagerOfInstitutions) {
                defaultPage = 'subordinateInstitutions';
            } else if (user.role === Role.AppManager) {
                defaultPage = 'appManager';
            }
            setActivePage(defaultPage);
        }
    }, [user]);

   useEffect(() => {
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        
        if (isSupervisor) {
            const pending = allLessonPlans.filter(p => p.supervisorId === user.id && p.status === 'pending');
            if (pending.length > 0) {
                setPendingApprovals(pending);
                setShowApprovalNotification(true);
            }
        }

        if (isTeacher) {
            // Lesson plan notifications
            if (!remindLater) {
                const teacherPlansToday = allLessonPlans.filter(p => p.teacherId === user.id && p.date === today);
                const approved = teacherPlansToday.find(p => p.status === 'approved');
                const rejected = teacherPlansToday.find(p => p.status === 'rejected');
                
                if (rejected) { // Priority to rejected plans
                    setRejectedPlan(rejected);
                } else if (approved) {
                    setApprovedPlan(approved);
                }
            }

            // Supervisory visit notification
            const teacherVisits = allVisits.filter(v => v.teacherId === user.id)
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (teacherVisits.length > 0) {
                const latestVisit = teacherVisits[0];
                const lastSeenVisitId = localStorage.getItem('halaqa_last_seen_visit_id');

                if (String(latestVisit.id) !== lastSeenVisitId) {
                    setNewSupervisoryVisit(latestVisit);
                }
            }
        }
  }, [user, isSupervisor, isTeacher, remindLater]);


  const handleCloseTutorial = () => {
      localStorage.setItem('halaqa_tutorial_seen', 'true');
      setIsTutorialOpen(false);
  };
  
  const handleViewApprovals = () => {
    setActivePage('planApprovals');
    setShowApprovalNotification(false);
  };

  const SupervisorApprovalNotification = () => (
    <div className="fixed top-20 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-sky-600/10 backdrop-blur-lg border border-sky-300/50 text-sky-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between max-w-sm animate-fade-in-down">
        <div className="flex items-center">
             <div className="p-2 bg-sky-200/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
            <div className="mr-3">
                <p className="font-bold">لديك {pendingApprovals.length} خطط بانتظار الاعتماد.</p>
            </div>
        </div>
        <div className="flex flex-col gap-2 mr-4">
             <button onClick={handleViewApprovals} className="text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700 whitespace-nowrap shadow-sm transition-colors">اطلع عليها</button>
             <button onClick={() => setShowApprovalNotification(false)} className="text-xs text-slate-600 hover:underline">لاحقاً</button>
        </div>
    </div>
  );

  const ApprovedPlanNotification = () => {
    if (!approvedPlan) return null;
    const halaqaName = allHalaqat.find(h => h.id === approvedPlan.halaqaId)?.name || 'غير معروفة';

    return (
        <div className="fixed top-20 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-teal-600/10 backdrop-blur-lg border border-teal-300/50 text-teal-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between max-w-sm animate-fade-in-down">
            <div className="flex items-center">
                <div className="p-2 bg-teal-200/50 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="mr-3">
                    <p className="font-bold">تم اعتماد خطة التحضير.</p>
                    <p className="text-sm">حلقة "{halaqaName}" ليوم {formatDate(approvedPlan.date)}</p>
                </div>
            </div>
            <button onClick={() => setApprovedPlan(null)} className="text-sm bg-teal-600 text-white px-3 py-1 rounded-md hover:bg-teal-700 shadow-sm transition-colors">حسنًا</button>
        </div>
    );
  };

  const RejectedPlanNotification = () => (
     <div className="fixed top-20 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-amber-600/10 backdrop-blur-lg border border-amber-300/50 text-amber-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between max-w-sm animate-fade-in-down">
        <div className="flex items-center">
             <div className="p-2 bg-amber-200/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="mr-3">
                <p className="font-bold">أعاد المشرف خطة التحضير للتصحيح.</p>
            </div>
        </div>
        <div className="flex flex-col gap-2 mr-4">
             <button onClick={() => { setActivePage('lessonPrep'); setRejectedPlan(null); }} className="text-sm bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 whitespace-nowrap shadow-sm transition-colors">أراجعها الآن</button>
             <button onClick={() => { setRejectedPlan(null); setRemindLater(true); }} className="text-xs text-slate-600 hover:underline">ذكرني لاحقاً</button>
        </div>
    </div>
  );

    const SupervisoryVisitNotification = () => {
        if (!newSupervisoryVisit) return null;

        const supervisorName = allUsers.find(u => u.id === newSupervisoryVisit.supervisorId)?.name || 'المشرف';

        const handleDismiss = () => {
            localStorage.setItem('halaqa_last_seen_visit_id', String(newSupervisoryVisit.id));
            setNewSupervisoryVisit(null);
        };

        const handleViewVisit = () => {
            setActivePage('supervisoryVisits');
            handleDismiss();
        };

        return (
            <div className="fixed top-20 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-indigo-600/10 backdrop-blur-lg border border-indigo-300/50 text-indigo-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between max-w-sm animate-fade-in-down">
                <div className="flex items-center">
                    <div className="p-2 bg-indigo-200/50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6zm-2.121 4.879A5.002 5.002 0 0012 17.5a5.002 5.002 0 004.121-2.621" />
                        </svg>
                    </div>
                    <div className="mr-3">
                        <p className="font-bold">لديك زيارة إشرافية جديدة.</p>
                        <p className="text-sm">قام {supervisorName} بزيارتك بتاريخ {formatDate(newSupervisoryVisit.date)}.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 mr-4">
                     <button onClick={handleViewVisit} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 whitespace-nowrap shadow-sm transition-colors">اطلع عليها</button>
                     <button onClick={handleDismiss} className="text-xs text-slate-600 hover:underline">لاحقاً</button>
                </div>
            </div>
        );
    };


  return (
    <div className="relative min-h-screen md:flex">
      {isTutorialOpen && <Tutorial steps={tutorialSteps} onClose={handleCloseTutorial} />}
      {isSupervisor && showApprovalNotification && <SupervisorApprovalNotification />}
      {isTeacher && approvedPlan && <ApprovedPlanNotification />}
      {isTeacher && rejectedPlan && <RejectedPlanNotification />}
      {isTeacher && newSupervisoryVisit && <SupervisoryVisitNotification />}
      
      {/* Overlay for mobile */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>}
      
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main id="main-content-area" className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8`}>
          <MainContent page={activePage} setActivePage={setActivePage} isReadOnly={isReadOnly} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;