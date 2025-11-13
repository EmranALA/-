import React, { useState, useEffect, useMemo } from 'react';
import { users, teacherClassifications, addAccountantAlert, scheduledAlerts as allScheduledAlerts, addScheduledAlert, deleteScheduledAlert } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Role, ScheduledAlert } from '../types';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const AccountantAlerts: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();

    const [notificationTab, setNotificationTab] = useState<'instant' | 'scheduled'>('instant');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'teacher' | 'supervisor' | 'classification'>('teacher');
    const [targetId, setTargetId] = useState<string>('');
    const [notificationStatus, setNotificationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [scheduledAlerts, setScheduledAlerts] = useState<ScheduledAlert[]>([]);
    const [scheduleType, setScheduleType] = useState<'once' | 'weekly' | 'monthly'>('once');
    const [scheduleValue, setScheduleValue] = useState<string>(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (user?.subscriberId) {
            setScheduledAlerts(allScheduledAlerts.filter(a => a.subscriberId === user.subscriberId));
        }
    }, [user, notificationTab]);

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

        if (targetType === 'teacher' || targetType === 'supervisor') {
            targetUserIds = [numericTargetId];
        } else if (targetType === 'classification') {
            targetUserIds = users.filter(u => u.role === Role.Teacher && u.classificationIds?.includes(numericTargetId)).map(u => u.id);
        }

        if (targetUserIds.length === 0) {
            setNotificationStatus({ type: 'error', message: 'لم يتم العثور على مستخدمين بالمحددات المختارة.' });
            return;
        }

        addAccountantAlert({
            message,
            targetUserIds,
            senderId: user!.id,
            actions: [{label: 'تم الاطلاع'}]
        });
        
        setNotificationStatus({ type: 'success', message: `تم إرسال الإشعار بنجاح إلى ${targetUserIds.length} مستخدم.` });
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
        let options: { value: number; label: string }[] = [];
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

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50">
            <h2 className="text-2xl font-bold mb-4">إرسال الإشعارات والتنبيهات</h2>
            <div className="flex border-b mb-4">
                <button onClick={() => setNotificationTab('instant')} className={`px-4 py-2 font-semibold transition-colors ${notificationTab === 'instant' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>إرسال فوري</button>
                <button onClick={() => setNotificationTab('scheduled')} className={`px-4 py-2 font-semibold transition-colors ${notificationTab === 'scheduled' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>الإشعارات المجدولة</button>
            </div>

            {notificationTab === 'instant' ? (
                <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                        <label htmlFor="notification-message-accountant" className="block text-sm font-medium text-slate-700 mb-1">نص الرسالة</label>
                        <textarea
                            id="notification-message-accountant"
                            rows={4}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full p-2 border bg-white text-slate-900 rounded-md border-slate-300 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                            placeholder="اكتب رسالتك هنا..."
                            readOnly={isReadOnly}
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
                        <button type="submit" disabled={isReadOnly} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 transition-all transform hover:scale-105 shadow-md hover:shadow-lg disabled:bg-slate-400">إرسال الإشعار</button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold mb-4">جدولة إشعار جديد</h4>
                         <form onSubmit={handleScheduleNotification} className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">نص الرسالة</label>
                                <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md" placeholder="اكتب رسالتك هنا..." readOnly={isReadOnly}/>
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
                                <button type="submit" disabled={isReadOnly} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">جدولة الإشعار</button>
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
                                        <button onClick={() => !isReadOnly && handleDeleteScheduled(alert.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-xs disabled:text-slate-400">حذف</button>
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
    );
};

export default AccountantAlerts;