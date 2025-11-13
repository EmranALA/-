import React, { useMemo, useState, useEffect } from 'react';
import { students, halaqat, users, teacherClassifications, addAccountantAlert, scheduledAlerts as allScheduledAlerts, addScheduledAlert, deleteScheduledAlert } from '../../data/mockData';
import { useAuth, useLabels } from '../../context/AuthContext';
import { PaymentStatus, Role, ScheduledAlert } from '../../types';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
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

const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const QuickActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; }> = ({ label, icon, onClick }) => (
    <button onClick={onClick} className="flex items-center w-full p-4 bg-slate-100 rounded-lg text-slate-700 font-semibold hover:bg-sky-100 hover:text-sky-800 transition-colors duration-200 shadow-sm border border-transparent hover:border-sky-200">
        {icon}
        <span className="mr-3">{label}</span>
    </button>
);


const SupervisorDashboard: React.FC<{ setActivePage: (page: string) => void }> = ({ setActivePage }) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();

    const [notificationTab, setNotificationTab] = useState<'instant' | 'scheduled'>('instant');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'teacher' | 'supervisor' | 'classification'>('teacher');
    const [targetId, setTargetId] = useState<string>('');
    const [notificationStatus, setNotificationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [scheduledAlerts, setScheduledAlerts] = useState<ScheduledAlert[]>([]);
    const [scheduleType, setScheduleType] = useState<'once' | 'weekly' | 'monthly'>('once');
    const [scheduleValue, setScheduleValue] = useState<string>(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (user) {
            setScheduledAlerts(allScheduledAlerts.filter(a => a.subscriberId === user.subscriberId));
        }
    }, [user, notificationTab]);

    const supervisedHalaqat = useMemo(() => halaqat.filter(h => h.supervisorId === user?.id), [user]);
    const supervisedStudents = useMemo(() => {
        const supervisedHalaqatIds = supervisedHalaqat.map(h => h.id);
        return students.filter(s => s.halaqaId !== undefined && supervisedHalaqatIds.includes(s.halaqaId));
    }, [supervisedHalaqat]);

    const teachers = useMemo(() => users.filter(u => u.role === Role.Teacher && u.subscriberId === user?.subscriberId), [user]);
    const supervisors = useMemo(() => users.filter(u => u.role === Role.Supervisor && u.subscriberId === user?.subscriberId), [user]);
    const classifications = useMemo(() => teacherClassifications.filter(c => c.subscriberId === user?.subscriberId), [user]);


    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        setNotificationStatus(null);

        if (!message.trim() || !targetId) {
            setNotificationStatus({ type: 'error', message: 'يرجى كتابة رسالة واختيار المستهدف.' });
            return;
        }

        let targetUserIds: number[] = [];
        const numericTargetId = parseInt(targetId);

        if (targetType === 'teacher') {
            targetUserIds = [numericTargetId];
        } else if (targetType === 'supervisor') {
             // Supervisors don't get alerts, their teachers do.
            const supervisorHalaqaIds = halaqat.filter(h => h.supervisorId === numericTargetId).map(h => h.id);
            const teacherIds = new Set<number>();
            halaqat.forEach(h => {
                if (supervisorHalaqaIds.includes(h.id)) {
                    h.teacherIds.forEach(tid => teacherIds.add(tid));
                }
            });
            targetUserIds = Array.from(teacherIds);
        } else if (targetType === 'classification') {
            targetUserIds = users.filter(u => u.role === Role.Teacher && u.classificationIds?.includes(numericTargetId)).map(u => u.id);
        }

        if (targetUserIds.length === 0) {
            setNotificationStatus({ type: 'error', message: 'لم يتم العثور على معلمين بالمحددات المختارة.' });
            return;
        }

        addAccountantAlert({
            message,
            targetUserIds,
            senderId: user!.id,
            actions: [{label: 'تم الاطلاع'}, {label: 'ذكرني لاحقا'}]
        });
        
        setNotificationStatus({ type: 'success', message: `تم إرسال الإشعار بنجاح إلى ${targetUserIds.length} معلم.` });
        setMessage('');
        setTargetId('');
    };

    const handleScheduleNotification = (e: React.FormEvent) => {
        e.preventDefault();
        setNotificationStatus(null);
        if (!message.trim() || !targetId || !scheduleValue) {
            setNotificationStatus({ type: 'error', message: 'يرجى ملء جميع الحقول.' });
            return;
        }
        
        addScheduledAlert({
            message,
            targetType,
            targetId: parseInt(targetId),
            scheduleType,
            scheduleValue,
            senderId: user!.id,
            subscriberId: user!.subscriberId!,
        });

        if (user) {
           setScheduledAlerts(allScheduledAlerts.filter(a => a.subscriberId === user.subscriberId));
        }
        setNotificationStatus({ type: 'success', message: 'تم جدولة الإشعار بنجاح.' });
        setMessage('');
        setTargetId('');
    };
    
     const handleDeleteScheduled = (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا الإشعار المجدول؟')) {
            deleteScheduledAlert(id);
            setScheduledAlerts(prev => prev.filter(a => a.id !== id));
        }
    };

    
     const renderTargetSelector = () => {
        let options = [];
        let label = '';

        switch (targetType) {
            case 'teacher':
                label = 'اختر المعلم';
                options = teachers.map(t => ({ value: t.id, label: t.name }));
                break;
            case 'supervisor':
                label = 'اختر المشرف';
                options = supervisors.map(s => ({ value: s.id, label: s.name }));
                break;
            case 'classification':
                label = 'اختر التصنيف';
                options = classifications.map(c => ({ value: c.id, label: c.name }));
                break;
        }

        return (
             <div className="flex-1">
                <label className="sr-only">{label}</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                    <option value="">-- {label} --</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        );
    };

    const renderScheduleValueInput = () => {
        switch (scheduleType) {
            case 'once':
                return <input type="date" value={scheduleValue} onChange={e => setScheduleValue(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md" />;
            case 'weekly':
                return (
                    <select value={scheduleValue} onChange={e => setScheduleValue(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                        <option value="0">الأحد</option>
                        <option value="1">الاثنين</option>
                        <option value="2">الثلاثاء</option>
                        <option value="3">الأربعاء</option>
                        <option value="4">الخميس</option>
                        <option value="5">الجمعة</option>
                        <option value="6">السبت</option>
                    </select>
                );
            case 'monthly':
                return <input type="number" min="1" max="31" value={scheduleValue} onChange={e => setScheduleValue(e.target.value)} placeholder="يوم في الشهر" className="w-full p-2 border bg-white text-slate-900 rounded-md" />;
            default:
                return null;
        }
    };

    const getTargetName = (type: string, id: number) => {
        switch(type) {
            case 'teacher': return users.find(u => u.id === id)?.name;
            case 'supervisor': return users.find(u => u.id === id)?.name;
            case 'classification': return teacherClassifications.find(c => c.id === id)?.name;
            default: return 'N/A';
        }
    };
    
    const getScheduleText = (type: string, value: string) => {
        switch(type) {
            case 'once': return `مرة واحدة في ${value}`;
            case 'weekly': return `كل يوم ${['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][parseInt(value, 10)]}`;
            case 'monthly': return `يوم ${value} من كل شهر`;
            default: return 'N/A';
        }
    };


    const ICONS = {
        students: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        halaqat: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>,
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">{getLabel('dashboard.title.supervisor')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="الحلقات التابعة لي" value={supervisedHalaqat.length} icon={ICONS.halaqat} color="bg-teal-500" />
                <StatCard title="الطلاب في حلقاتي" value={supervisedStudents.length} icon={ICONS.students} color="bg-sky-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50">
                    <h3 className="text-xl font-bold mb-4">حلقاتي الإشرافية</h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {supervisedHalaqat.map(h => <li key={h.id} className="p-3 bg-slate-100 rounded-lg font-semibold">{h.name}</li>)}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">إجراءات سريعة</h3>
                    <div className="space-y-3">
                        <QuickActionButton label="إضافة طالب جديد" icon={<PlusCircleIcon />} onClick={() => setActivePage('students')} />
                        <QuickActionButton label="إضافة حلقة جديدة" icon={<PlusCircleIcon />} onClick={() => setActivePage('halaqat')} />
                        <QuickActionButton label="إنشاء تقرير شامل" icon={<PlusCircleIcon />} onClick={() => setActivePage('reports')} />
                    </div>
                </div>
            </div>

             <div className="mt-8 bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50">
                <h3 className="text-xl font-bold mb-4">إرسال إشعارات للمعلمين</h3>
                <div className="flex border-b mb-4">
                    <button onClick={() => setNotificationTab('instant')} className={`px-4 py-2 font-semibold transition-colors ${notificationTab === 'instant' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>إرسال فوري</button>
                    <button onClick={() => setNotificationTab('scheduled')} className={`px-4 py-2 font-semibold transition-colors ${notificationTab === 'scheduled' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>الإشعارات المجدولة</button>
                </div>

                {notificationTab === 'instant' ? (
                    <form onSubmit={handleSendNotification} className="space-y-4">
                        <div>
                            <label htmlFor="notification-message-supervisor" className="block text-sm font-medium text-slate-700 mb-1">نص الرسالة</label>
                            <textarea
                                id="notification-message-supervisor"
                                rows={4}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full p-2 border bg-white text-slate-900 rounded-md border-slate-300 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                                placeholder="اكتب رسالتك هنا..."
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">إرسال إلى</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                 <div className="flex-1 flex space-x-1 space-x-reverse rounded-lg bg-slate-100 p-1">
                                    <button type="button" onClick={() => { setTargetType('teacher'); setTargetId(''); }} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${targetType === 'teacher' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'}`}>معلم</button>
                                    <button type="button" onClick={() => { setTargetType('supervisor'); setTargetId(''); }} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${targetType === 'supervisor' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'}`}>مشرف</button>
                                    <button type="button" onClick={() => { setTargetType('classification'); setTargetId(''); }} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${targetType === 'classification' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'}`}>تصنيف</button>
                                </div>
                               {renderTargetSelector()}
                            </div>
                        </div>
                         {notificationStatus && (
                            <div className={`p-3 rounded-md text-sm ${notificationStatus.type === 'success' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'}`}>
                                {notificationStatus.message}
                            </div>
                        )}
                        <div className="text-left">
                            <button type="submit" className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 transition-all transform hover:scale-105 shadow-md hover:shadow-lg">إرسال الإشعار</button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold mb-4">جدولة إشعار جديد</h4>
                             <form onSubmit={handleScheduleNotification} className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">نص الرسالة</label>
                                    <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md" placeholder="اكتب رسالتك هنا..." />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">إرسال إلى</label>
                                    <div className="flex gap-2">
                                        <select value={targetType} onChange={e => { setTargetType(e.target.value as any); setTargetId('')}} className="p-2 border bg-white text-slate-900 rounded-md">
                                            <option value="teacher">معلم</option>
                                            <option value="supervisor">مشرف</option>
                                            <option value="classification">تصنيف</option>
                                        </select>
                                       {renderTargetSelector()}
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">توقيت الإرسال</label>
                                    <div className="flex gap-2">
                                        <select value={scheduleType} onChange={e => { setScheduleType(e.target.value as any); setScheduleValue(''); }} className="p-2 border bg-white text-slate-900 rounded-md">
                                            <option value="once">لمرة واحدة</option>
                                            <option value="weekly">أسبوعي</option>
                                            <option value="monthly">شهري</option>
                                        </select>
                                        <div className="flex-1">{renderScheduleValueInput()}</div>
                                    </div>
                                </div>
                                {notificationStatus && (<div className={`p-3 rounded-md text-sm ${notificationStatus.type === 'success' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'}`}>{notificationStatus.message}</div>)}
                                <div className="text-left">
                                    <button type="submit" className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800">جدولة الإشعار</button>
                                </div>
                            </form>
                        </div>
                        <div>
                             <h4 className="font-bold mb-4">الإشعارات المجدولة الحالية</h4>
                             <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {scheduledAlerts.length > 0 ? scheduledAlerts.map(alert => (
                                    <div key={alert.id} className="bg-slate-50 p-3 rounded-lg border">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-slate-700 flex-1 pr-2">"{alert.message}"</p>
                                            <button onClick={() => handleDeleteScheduled(alert.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                                            <p><strong>المستهدف:</strong> {getTargetName(alert.targetType, alert.targetId)}</p>
                                            <p><strong>الجدولة:</strong> {getScheduleText(alert.scheduleType, alert.scheduleValue)}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-slate-500 text-center p-4">لا توجد إشعارات مجدولة.</p>}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupervisorDashboard;
