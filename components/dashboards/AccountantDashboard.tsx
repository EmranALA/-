import React, { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { 
    students as allStudents, 
    paymentRecords, 
    halaqat as allHalaqat, 
    users, 
    studentClassifications,
    formatDate
} from '../../data/mockData';
import { useAuth, useLabels } from '../../context/AuthContext';
import { PaymentStatus, Student, Halaqa, Role } from '../../types';

// --- Icons ---
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M18 10a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ActivityPaymentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

// --- Components ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50 flex items-center space-x-4 space-x-reverse border-t-4 ${color.replace('bg-', 'border-')} transition-all duration-300 hover:shadow-xl hover:scale-[1.03]`}>
        <div className={`p-4 rounded-full ${color} shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-4xl font-bold text-slate-800">{value}</p>
            <p className="text-slate-500 font-semibold">{title}</p>
        </div>
    </div>
);

const PIE_COLORS = {
  [PaymentStatus.Paid]: '#10b981', // emerald-500
  [PaymentStatus.Late]: '#f59e0b', // amber-500
  [PaymentStatus.Unpaid]: '#ef4444', // red-500
};

// --- Main Dashboard Component ---
const AccountantDashboard: React.FC = () => {
    const { user } = useAuth();
    const { getLabel } = useLabels();

    const dashboardData = useMemo(() => {
        if (!user || !user.subscriberId) return null;
        
        const { subscriberId } = user;
        const studentsInSub = allStudents.filter(s => s.subscriberId === subscriberId);
        const studentIdsInSub = new Set(studentsInSub.map(s => s.id));
        const paymentsInSub = paymentRecords.filter(p => studentIdsInSub.has(p.studentId));

        // --- KPIs ---
        const thisMonthStr = new Date().toISOString().slice(0, 7);
        const totalCollectedThisMonth = paymentsInSub
            .filter(p => p.paymentMonth === thisMonthStr)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const lateAndUnpaidStudents = studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Late || s.paymentStatus === PaymentStatus.Unpaid);
        
        const totalDueAmount = lateAndUnpaidStudents.reduce((sum, s) => {
            const classification = studentClassifications.find(c => c.id === s.classificationId);
            return sum + (classification?.defaultAmount || 100);
        }, 0);

        const paidCount = studentsInSub.length - lateAndUnpaidStudents.length;
        const paymentRatio = studentsInSub.length > 0 ? (paidCount / studentsInSub.length) * 100 : 0;

        // --- Pie Chart ---
        const paymentStatusCounts = {
            [PaymentStatus.Paid]: paidCount,
            [PaymentStatus.Late]: studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Late).length,
            [PaymentStatus.Unpaid]: studentsInSub.filter(s => s.paymentStatus === PaymentStatus.Unpaid).length,
        };
        const pieData = Object.entries(paymentStatusCounts).map(([name, value]) => ({ name, value }));
        
        // --- Recent Payments ---
        const recentPayments = [...paymentsInSub]
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .slice(0, 5)
            .map(p => ({
                ...p,
                studentName: studentsInSub.find(s => s.id === p.studentId)?.name || 'غير معروف'
            }));

        // --- Payments by Teacher (Bar Chart) ---
        const teachersInSub = users.filter(u => u.role === Role.Teacher && u.subscriberId === subscriberId);
        const paymentsByTeacher = teachersInSub.map(teacher => {
            const teacherStudents = studentsInSub.filter(s => s.teacherId === teacher.id);
            const paidStudents = teacherStudents.filter(s => s.paymentStatus === PaymentStatus.Paid).length;
            const unpaidStudents = teacherStudents.length - paidStudents;
            return {
                name: teacher.name,
                'دفع': paidStudents,
                'لم يدفع': unpaidStudents,
            };
        });

        // --- Follow-up List ---
        const highPriorityFollowUps = lateAndUnpaidStudents
            .map(student => {
                const classification = studentClassifications.find(c => c.id === student.classificationId);
                const dueAmount = classification?.defaultAmount || 100;
                return {
                    studentName: student.name,
                    dueAmount,
                    halaqaName: allHalaqat.find(h => h.id === student.halaqaId)?.name || 'N/A'
                };
            })
            .sort((a, b) => b.dueAmount - a.dueAmount)
            .slice(0, 5);

        return {
            totalCollectedThisMonth,
            totalDueAmount,
            lateUnpaidCount: lateAndUnpaidStudents.length,
            paymentRatio,
            pieData,
            recentPayments,
            paymentsByTeacher,
            highPriorityFollowUps
        };
    }, [user]);

    if (!dashboardData) {
        return <div>جاري تحميل البيانات...</div>;
    }

    const { totalCollectedThisMonth, totalDueAmount, lateUnpaidCount, paymentRatio, pieData, recentPayments, paymentsByTeacher, highPriorityFollowUps } = dashboardData;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{getLabel('dashboard.title.accountant')}</h2>
                <p className="mt-1 text-slate-500">نظرة شاملة ومفصلة على الوضع المالي للمركز.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="التحصيل هذا الشهر" value={`${totalCollectedThisMonth.toLocaleString('ar-SA')} ريال`} icon={<MoneyIcon />} color="bg-sky-500" />
                <StatCard title="إجمالي المستحقات" value={`${totalDueAmount.toLocaleString('ar-SA')} ريال`} icon={<ExclamationIcon />} color="bg-amber-500" />
                <StatCard title="نسبة السداد" value={`${paymentRatio.toFixed(1)}%`} icon={<CheckCircleIcon />} color="bg-teal-500" />
                <StatCard title="طلاب متأخرون" value={lateUnpaidCount} icon={<ExclamationIcon />} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-sky-500">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">حالة الدفع حسب المعلم</h3>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={paymentsByTeacher} margin={{ top: 5, right: 20, left: -10, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" interval={0} height={100} />
                                    <YAxis label={{ value: 'عدد الطلاب', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
                                    <Tooltip formatter={(value, name) => [`${value} طالب`, name]} />
                                    <Legend verticalAlign="top" />
                                    <Bar dataKey="دفع" stackId="a" fill="#10b981" />
                                    <Bar dataKey="لم يدفع" stackId="a" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">أحدث الدفعات المسجلة</h3>
                        <ul className="space-y-4">
                           {recentPayments.map(payment => (
                                <li key={payment.id} className="flex items-center gap-4 p-2 bg-slate-50 rounded-md">
                                    <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                                        <ActivityPaymentIcon />
                                    </div>
                                    <div className="flex-grow flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800">{payment.studentName}</p>
                                            <p className="text-xs text-slate-500">{formatDate(payment.paymentDate)}</p>
                                        </div>
                                        <p className="font-bold text-teal-600 text-lg">{payment.amount} ريال</p>
                                    </div>
                                </li>
                            ))}
                            {recentPayments.length === 0 && <p className="text-center text-slate-500 py-4">لا توجد دفعات مسجلة حديثاً.</p>}
                        </ul>
                    </div>
                </div>

                {/* Side Column */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-500">
                         <h3 className="text-xl font-bold mb-4 text-slate-800">توزيع حالات الدفع</h3>
                         <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as PaymentStatus]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} طالب`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-amber-500">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">أولوية المتابعة</h3>
                        <p className="text-sm text-slate-600 mb-3">الطلاب أصحاب المبالغ المستحقة الأعلى:</p>
                        <ul className="space-y-3">
                            {highPriorityFollowUps.map((item, index) => (
                                <li key={index} className="flex justify-between items-center p-2 bg-amber-50 rounded-md">
                                    <div>
                                        <span className="font-semibold text-sm">{item.studentName}</span>
                                        <span className="block text-xs text-slate-500">{item.halaqaName}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{item.dueAmount} ريال</span>
                                </li>
                            ))}
                            {highPriorityFollowUps.length === 0 && <p className="text-center text-slate-500 py-4">لا يوجد طلاب متأخرون حالياً.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;
