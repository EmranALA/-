import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { users as allUsers, students as allStudents, halaqat as allHalaqat, paymentRecords, studentClassifications, formatDate } from '../../data/mockData';
import { useAuth, useLabels } from '../../context/AuthContext';
import { Role, PaymentStatus, User, Student, Halaqa } from '../../types';

// --- Icons ---
const StudentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const HalaqatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6" /></svg>;
const TeachersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SupervisorsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ActivityUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ActivityPaymentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

// --- Components ---
const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center gap-5 border-r-4 border-slate-100 hover:border-sky-300">
        <div className={`p-3 rounded-lg ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-slate-500 font-semibold text-sm">{title}</p>
        </div>
    </div>
);

const PAYMENT_PIE_COLORS = {
  [PaymentStatus.Paid]: '#10b981', // teal-500
  [PaymentStatus.Late]: '#f59e0b', // amber-500
  [PaymentStatus.Unpaid]: '#ef4444', // red-500
};
const CLASSIFICATION_PIE_COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#6b7280'];


// --- Main Dashboard Component ---
const AdminDashboard: React.FC<{ setActivePage: (page: string) => void }> = ({ setActivePage }) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();

    const dashboardData = useMemo(() => {
        if (!user || !user.subscriberId) return null;

        const { subscriberId } = user;
        const studentsInSub = allStudents.filter(s => s.subscriberId === subscriberId);
        const usersInSub = allUsers.filter(u => u.subscriberId === subscriberId);
        const halaqatInSub = allHalaqat.filter(h => {
            const supervisor = allUsers.find(u => u.id === h.supervisorId);
            return supervisor?.subscriberId === subscriberId;
        });

        const totalStudents = studentsInSub.length;
        const totalHalaqat = halaqatInSub.length;
        const totalTeachers = usersInSub.filter(u => u.role === Role.Teacher).length;
        const totalSupervisors = usersInSub.filter(u => u.role === Role.Supervisor).length;
        
        // Financial Data
        const thisMonth = new Date().toISOString().slice(0, 7);
        const totalCollectedThisMonth = paymentRecords
            .filter(p => p.paymentMonth === thisMonth && studentsInSub.some(s => s.id === p.studentId))
            .reduce((sum, p) => sum + p.amount, 0);

        const paymentStatusCounts = {
            [PaymentStatus.Paid]: studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Paid).length,
            [PaymentStatus.Late]: studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Late).length,
            [PaymentStatus.Unpaid]: studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Unpaid).length,
        };
        
        const totalDueAmount = studentsInSub
            .filter(s => s.paymentStatus === PaymentStatus.Late || s.paymentStatus === PaymentStatus.Unpaid)
            .reduce((sum, s) => {
                const classification = studentClassifications.find(c => c.id === s.classificationId);
                return sum + (classification?.defaultAmount || 100); // Default 100 if not classified
            }, 0);

        const paymentRatio = totalStudents > 0 ? (paymentStatusCounts[PaymentStatus.Paid] / totalStudents) * 100 : 0;
        
        const paymentPieData = Object.entries(paymentStatusCounts).map(([name, value]) => ({ name, value }));

        // Student Classification Data
        const classificationCounts = studentsInSub.reduce((acc, student) => {
            const classificationId = student.classificationId || 0; // Group unclassified students under ID 0
            acc[classificationId] = (acc[classificationId] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const classificationPieData = Object.entries(classificationCounts).map(([id, value]) => {
            const classification = studentClassifications.find(c => c.id === parseInt(id));
            return {
                name: classification ? classification.name : 'غير مصنف',
                value: value,
            };
        });

        // Recent Activities
        const recentPayments = [...paymentRecords]
            .filter(p => studentsInSub.some(s => s.id === p.studentId))
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .slice(0, 3)
            .map(p => ({
                type: 'payment',
                id: p.id,
                date: p.paymentDate,
                text: `تم تسجيل دفعة بقيمة ${p.amount} ريال للطالب ${allStudents.find(s => s.id === p.studentId)?.name || ''}.`
            }));
        
        // Assuming new students have higher IDs
        const recentStudents = [...studentsInSub]
            .sort((a,b) => b.id - a.id)
            .slice(0, 2)
            .map(s => ({
                type: 'student',
                id: s.id,
                date: new Date().toISOString(), // Mock date
                text: `تم تسجيل طالب جديد: ${s.name} في حلقة ${allHalaqat.find(h=>h.id === s.halaqaId)?.name || 'غير محددة'}.`
            }));

        const recentActivities = [...recentPayments, ...recentStudents]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        // Urgent Follow-ups
        const lateStudentsByTeacher: { [key: number]: { teacher: User; count: number } } = {};
        studentsInSub
            .filter(s => s.paymentStatus === PaymentStatus.Late || s.paymentStatus === PaymentStatus.Unpaid)
            .forEach(s => {
                if (s.teacherId) {
                    if (!lateStudentsByTeacher[s.teacherId]) {
                        const teacher = usersInSub.find(u => u.id === s.teacherId);
                        if(teacher) lateStudentsByTeacher[s.teacherId] = { teacher, count: 0 };
                    }
                    if(lateStudentsByTeacher[s.teacherId]) lateStudentsByTeacher[s.teacherId].count++;
                }
            });

        const topLateTeachers = Object.values(lateStudentsByTeacher)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        return {
            totalStudents, totalHalaqat, totalTeachers, totalSupervisors,
            totalCollectedThisMonth, totalDueAmount, paymentRatio, paymentPieData,
            classificationPieData,
            recentActivities, topLateTeachers,
        };
    }, [user]);

    if (!dashboardData) {
        return <div>جاري تحميل البيانات...</div>;
    }

    const { totalStudents, totalHalaqat, totalTeachers, totalSupervisors, totalCollectedThisMonth, totalDueAmount, paymentRatio, paymentPieData, classificationPieData, recentActivities, topLateTeachers } = dashboardData;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{getLabel('dashboard.title.admin')}</h2>
                <p className="mt-1 text-slate-500">نظرة شاملة على أداء المركز والأنشطة الأخيرة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي الطلاب" value={totalStudents} icon={<StudentsIcon />} color="bg-sky-500" />
                <StatCard title="إجمالي الحلقات" value={totalHalaqat} icon={<HalaqatIcon />} color="bg-teal-500" />
                <StatCard title="إجمالي المعلمين" value={totalTeachers} icon={<TeachersIcon />} color="bg-amber-500" />
                <StatCard title="إجمالي المشرفين" value={totalSupervisors} icon={<SupervisorsIcon />} color="bg-indigo-500" />
            </div>

            <div className="space-y-8">
                {/* Financial Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">نظرة عامة على الأداء المالي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={paymentPieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                                        {paymentPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PAYMENT_PIE_COLORS[entry.name as PaymentStatus]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} طالب`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm text-slate-500">التحصيل هذا الشهر</p>
                                <p className="text-2xl font-bold text-teal-600">{totalCollectedThisMonth.toLocaleString('ar-SA')} ريال</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm text-slate-500">إجمالي المستحقات</p>
                                <p className="text-2xl font-bold text-red-600">{totalDueAmount.toLocaleString('ar-SA')} ريال</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm text-slate-500">نسبة السداد</p>
                                <p className="text-2xl font-bold text-sky-600">{paymentRatio.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Student Classifications */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">توزيع تصنيفات الطلاب</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={classificationPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.value}`}>
                                        {classificationPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CLASSIFICATION_PIE_COLORS[index % CLASSIFICATION_PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} طالب`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Recent Activities */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">أحدث الأنشطة</h3>
                        <ul className="space-y-4">
                            {recentActivities.map(activity => (
                                <li key={`${activity.type}-${activity.id}`} className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${activity.type === 'payment' ? 'bg-teal-100 text-teal-600' : 'bg-sky-100 text-sky-600'}`}>
                                        {activity.type === 'payment' ? <ActivityPaymentIcon /> : <ActivityUserIcon />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-slate-700">{activity.text}</p>
                                        <p className="text-xs text-slate-400">{formatDate(activity.date)}</p>
                                    </div>
                                </li>
                            ))}
                            {recentActivities.length === 0 && <p className="text-center text-slate-500 py-4">لا توجد أنشطة حديثة.</p>}
                        </ul>
                    </div>
                </div>

                 {/* Urgent Follow-ups */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">متابعات هامة</h3>
                    <p className="text-sm font-semibold text-slate-600 mb-3">أكثر المعلمين مع طلاب متأخرين:</p>
                    <ul className="space-y-3">
                        {topLateTeachers.map(({ teacher, count }) => (
                            <li key={teacher.id} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                                <span className="font-semibold text-sm">{teacher.name}</span>
                                <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{count} طلاب</span>
                            </li>
                        ))}
                        {topLateTeachers.length === 0 && <p className="text-center text-slate-500 py-4">لا يوجد طلاب متأخرون حالياً.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
