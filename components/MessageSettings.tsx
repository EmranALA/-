import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeacherSettings, updateTeacherSettings } from '../data/mockData';
import { TeacherSettings } from '../types';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const MessageSettings: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Partial<TeacherSettings>>({});
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (user) {
            const existingSettings = getTeacherSettings(user.id);
            setSettings({
                attendanceMessageTemplate: existingSettings?.attendanceMessageTemplate || 'تقرير الطالبـ/ـة {studentName} ليوم {date} في حلقة {halaqaName}:\n\n*الإنجاز:*\n{progressSummary}\n\n*ملاحظات:*\n{notes}',
                absenceMessageTemplate: existingSettings?.absenceMessageTemplate || 'عزيزي ولي الأمر، نود إعلامكم بأن الطالبـ/ـة {studentName} كان غائباً اليوم {date} عن حلقة {halaqaName}.',
            });
        }
    }, [user]);

    const handleSave = () => {
        if (user) {
            const currentSettings = getTeacherSettings(user.id) || { 
                teacherId: user.id, 
                groupMessageTemplate: '', 
                latePaymentMessageTemplate: '' 
            };
            const updated = {
                ...currentSettings,
                ...settings,
            };
            updateTeacherSettings(updated as TeacherSettings);
            setSaveStatus('تم الحفظ بنجاح!');
            setTimeout(() => setSaveStatus(''), 2500);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">إعداد رسائل التقارير اليومية</h2>
            <p className="text-slate-500 mb-6">
                قم بتخصيص نماذج الرسائل التي سترسلها لأولياء الأمور عبر الواتساب. يمكنك استخدام المتغيرات التالية ليتم استبدالها تلقائياً:
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm p-4 bg-slate-50 rounded-lg">
                <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">اسم الطالب</p>
                    <code className="bg-white border border-slate-200 px-2 py-1 rounded">{'{studentName}'}</code>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">اسم الحلقة</p>
                    <code className="bg-white border border-slate-200 px-2 py-1 rounded">{'{halaqaName}'}</code>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">التاريخ</p>
                    <code className="bg-white border border-slate-200 px-2 py-1 rounded">{'{date}'}</code>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">ملخص الإنجاز</p>
                    <code className="bg-sky-100 border border-sky-200 text-sky-700 px-2 py-1 rounded font-bold">{'{progressSummary}'}</code>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">الملاحظات</p>
                    <code className="bg-sky-100 border border-sky-200 text-sky-700 px-2 py-1 rounded font-bold">{'{notes}'}</code>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="attendanceMessageTemplate" className="block text-sm font-medium text-slate-700 mb-2">
                        نموذج رسالة الحضور والإنجاز
                    </label>
                    <textarea
                        id="attendanceMessageTemplate"
                        name="attendanceMessageTemplate"
                        value={settings.attendanceMessageTemplate || ''}
                        onChange={handleSettingsChange}
                        rows={6}
                        readOnly={isReadOnly}
                        className="w-full p-3 border rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900 read-only:bg-slate-100"
                    />
                     <p className="text-xs text-slate-500 mt-1">يتم استخدام المتغيرات <code className="text-xs">{'{progressSummary}'}</code> و <code className="text-xs">{'{notes}'}</code> في هذا النموذج فقط.</p>
                </div>
                 <div>
                    <label htmlFor="absenceMessageTemplate" className="block text-sm font-medium text-slate-700 mb-2">
                        نموذج رسالة الغياب
                    </label>
                    <textarea
                        id="absenceMessageTemplate"
                        name="absenceMessageTemplate"
                        value={settings.absenceMessageTemplate || ''}
                        onChange={handleSettingsChange}
                        rows={4}
                        readOnly={isReadOnly}
                        className="w-full p-3 border rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900 read-only:bg-slate-100"
                    />
                </div>
            </div>

             <div className="mt-8 flex items-center justify-end">
                {saveStatus && <p className="text-teal-600 text-sm ml-4">{saveStatus}</p>}
                <button onClick={handleSave} disabled={isReadOnly} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                    حفظ النماذج
                </button>
            </div>
        </div>
    );
};

export default MessageSettings;