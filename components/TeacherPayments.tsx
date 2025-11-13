import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, useLabels } from '../context/AuthContext';
import { students as allStudents, halaqat as allHalaqat, getTeacherSettings, updateTeacherSettings, formatDate, getHalaqaSetting, saveHalaqaSetting } from '../data/mockData';
import { Student, Halaqa, PaymentStatus, TeacherSettings, HalaqaSetting } from '../types';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.138l-.515 1.876 1.91.505z" />
    </svg>
);

const TeacherPayments: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();
    const [activeTab, setActiveTab] = useState<'payments' | 'settings'>('payments');
    const [settings, setSettings] = useState<Partial<TeacherSettings>>({});
    const [halaqaSettings, setHalaqaSettings] = useState<Record<number, Partial<HalaqaSetting>>>({});
    const [saveStatus, setSaveStatus] = useState('');

    const myStudents = useMemo(() => {
        if (!user) return [];
        return allStudents.filter(s => s.teacherId === user.id);
    }, [user]);

    const myHalaqat = useMemo(() => {
        if (!user) return [];
        return allHalaqat.filter(h => h.teacherIds.includes(user.id));
    }, [user]);

    useEffect(() => {
        if (user) {
            const teacherSettings = getTeacherSettings(user.id);
            setSettings({
                groupMessageTemplate: teacherSettings?.groupMessageTemplate || "السلام عليكم، هذا تذكير بحالة السداد لطلاب حلقة {halaqaName}...\n{studentList}",
                latePaymentMessageTemplate: teacherSettings?.latePaymentMessageTemplate || "عزيزي ولي الأمر، نود تذكيركم بسداد الرسوم للطالب {studentName}.",
            });
            
            const initialHalaqaSettings: Record<number, Partial<HalaqaSetting>> = {};
            myHalaqat.forEach(h => {
                initialHalaqaSettings[h.id] = getHalaqaSetting(h.id) || { halaqaId: h.id };
            });
            setHalaqaSettings(initialHalaqaSettings);
        }
    }, [user, myHalaqat]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleHalaqaLinkChange = (halaqaId: number, link: string) => {
        setHalaqaSettings(prev => ({
            ...prev,
            [halaqaId]: { ...prev[halaqaId], whatsAppGroupLink: link }
        }));
    };

    const handleSaveSettings = () => {
        if (user && !isReadOnly) {
            const currentSettings = getTeacherSettings(user.id) || { teacherId: user.id, groupMessageTemplate: '', latePaymentMessageTemplate: '' };
            updateTeacherSettings({ ...currentSettings, ...settings } as TeacherSettings);

            Object.values(halaqaSettings).forEach(hs => {
                // FIX: Explicitly cast `hs` from `unknown` to `Partial<HalaqaSetting>` to resolve TypeScript error.
                const setting = hs as Partial<HalaqaSetting>;
                if (setting.halaqaId) {
                    saveHalaqaSetting(setting as HalaqaSetting);
                }
            });

            setSaveStatus('تم الحفظ بنجاح!');
            setTimeout(() => setSaveStatus(''), 2500);
        }
    };
    
    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-teal-100 text-teal-800';
            case PaymentStatus.Late: return 'bg-amber-100 text-amber-800';
            case PaymentStatus.Unpaid: return 'bg-red-100 text-red-800';
        }
    };

    const handleSendReminder = (student: Student) => {
        if (!student.phoneNumber) {
            alert('لا يوجد رقم هاتف مسجل لهذا الطالب.');
            return;
        }
        const message = (settings.latePaymentMessageTemplate || '')
            .replace('{studentName}', student.name)
            .replace('{halaqaName}', allHalaqat.find(h => h.id === student.halaqaId)?.name || '');
        
        window.open(`https://wa.me/${student.phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'payments' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>{getLabel('teacherPayments.tabs.payments')}</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'settings' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>{getLabel('teacherPayments.tabs.settings')}</button>
            </div>

            {activeTab === 'payments' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3">الطالب</th>
                                <th className="p-3">الحلقة</th>
                                <th className="p-3">حالة الدفع</th>
                                <th className="p-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myStudents.map(student => (
                                <tr key={student.id} className="border-b">
                                    <td className="p-3 font-semibold">{student.name}</td>
                                    <td className="p-3">{allHalaqat.find(h => h.id === student.halaqaId)?.name || 'N/A'}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(student.paymentStatus)}`}>
                                            {student.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {(student.paymentStatus === PaymentStatus.Late || student.paymentStatus === PaymentStatus.Unpaid) && (
                                            <button onClick={() => handleSendReminder(student)} disabled={!student.phoneNumber} className="flex items-center px-3 py-1 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600 disabled:bg-slate-300">
                                                <WhatsAppIcon /> تذكير
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                        <label className="block font-semibold mb-2">نموذج رسالة التذكير بالدفع المتأخر</label>
                        <textarea name="latePaymentMessageTemplate" value={settings.latePaymentMessageTemplate} onChange={handleSettingsChange} rows={4} className="w-full p-2 border rounded-md bg-white text-slate-900" readOnly={isReadOnly}/>
                    </div>
                     <div>
                        <label className="block font-semibold mb-2">روابط مجموعات الواتساب</label>
                        {myHalaqat.map(h => (
                             <div key={h.id} className="mb-2">
                                <label className="block text-sm text-slate-600 mb-1">{h.name}</label>
                                <input type="url" value={halaqaSettings[h.id]?.whatsAppGroupLink || ''} onChange={e => handleHalaqaLinkChange(h.id, e.target.value)} placeholder="https://chat.whatsapp.com/..." className="w-full p-2 border rounded-md bg-white text-slate-900" readOnly={isReadOnly}/>
                             </div>
                        ))}
                    </div>
                     <div className="flex justify-end items-center gap-4">
                        {saveStatus && <p className="text-teal-600 font-semibold">{saveStatus}</p>}
                        <button onClick={handleSaveSettings} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800" disabled={isReadOnly}>
                            حفظ الإعدادات
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TeacherPayments;
