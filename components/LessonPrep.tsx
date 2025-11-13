import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getStudyPlanConfigurationsForTeacher,
    halaqat,
    saveLessonPlanRecord,
    getLessonPlanRecord,
    applyLessonPlanToStudents,
    getLessonPlansForTeacher,
    deleteLessonPlanRecord,
    formatDate,
} from '../data/mockData';
import { StudyPlanConfiguration, Halaqa, LessonPlanRecord, LessonPlanStatus } from '../types';
import ConfirmationModal from './ConfirmationModal';

const StatusIndicator: React.FC<{status: LessonPlanStatus, notes?: string}> = ({ status, notes }) => {
    const statusMap = {
        draft: { text: 'مسودة', color: 'bg-slate-100 text-slate-600' },
        pending: { text: 'في انتظار اعتماد المشرف', color: 'bg-amber-100 text-amber-700' },
        approved: { text: 'تم الاعتماد', color: 'bg-teal-100 text-teal-700' },
        rejected: { text: 'أعيدت للتصحيح', color: 'bg-red-100 text-red-700' },
    };
    const info = statusMap[status];

    return (
        <div className={`p-4 rounded-lg ${info.color} border-l-4 ${info.color.replace('bg-', 'border-').replace('-100', '-500')}`}>
            <p className="font-bold text-lg">{info.text}</p>
            {status === 'rejected' && notes && (
                <p className="text-sm mt-1">ملاحظات المشرف: {notes}</p>
            )}
        </div>
    );
};

const StatusBadge: React.FC<{status: LessonPlanStatus}> = ({ status }) => {
    const statusMap = {
        draft: { text: 'مسودة', color: 'bg-slate-200 text-slate-700' },
        pending: { text: 'بانتظار الاعتماد', color: 'bg-amber-200 text-amber-800' },
        approved: { text: 'معتمدة', color: 'bg-teal-200 text-teal-800' },
        rejected: { text: 'مرفوضة', color: 'bg-red-200 text-red-800' },
    };
    const info = statusMap[status];
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${info.color}`}>{info.text}</span>
};

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const LessonPrep: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const today = new Date().toISOString().slice(0, 10);
    
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [previousPlans, setPreviousPlans] = useState<LessonPlanRecord[]>([]);
    const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);

    const [preparationDate, setPreparationDate] = useState(today);
    const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>('');
    const [currentPlan, setCurrentPlan] = useState<LessonPlanRecord | null>(null);
    const [planData, setPlanData] = useState<Record<string, string>>({});
    const [feedbackMessage, setFeedbackMessage] = useState('');
    
    const activeStudyPlan = useMemo(() => {
        if (!user) return null;
        const plans = getStudyPlanConfigurationsForTeacher(user.id);
        return plans.length > 0 ? plans[0] : null;
    }, [user]);

    const myHalaqat = useMemo(() => {
        if (!user) return [];
        return halaqat.filter(h => h.teacherIds.includes(user.id));
    }, [user]);

    useEffect(() => {
        if (myHalaqat.length > 0 && !selectedHalaqaId) {
            setSelectedHalaqaId(String(myHalaqat[0].id));
        }
    }, [myHalaqat, selectedHalaqaId]);

    const refreshPreviousPlans = () => {
        if (user) {
            setPreviousPlans(getLessonPlansForTeacher(user.id));
        }
    };

    useEffect(() => {
        if (user && selectedHalaqaId && activeStudyPlan && activeTab === 'current') {
            const halaqaId = Number(selectedHalaqaId);
            const existingPlan = getLessonPlanRecord(user.id, halaqaId, preparationDate);
            const halaqa = myHalaqat.find(h => h.id === halaqaId);

            if (existingPlan) {
                setCurrentPlan(existingPlan);
                setPlanData(existingPlan.planData || {});
            } else {
                const newPlan: Omit<LessonPlanRecord, 'id'> = {
                    teacherId: user.id,
                    halaqaId,
                    planConfigId: activeStudyPlan.id,
                    date: preparationDate,
                    planData: {},
                    status: 'draft',
                    supervisorId: halaqa!.supervisorId,
                    lastModified: new Date().toISOString()
                };
                setCurrentPlan({ ...newPlan, id: -1 }); // Temporary ID
                setPlanData({});
            }
        }
    }, [user, selectedHalaqaId, preparationDate, activeStudyPlan, activeTab]);

    useEffect(() => {
        if (user) {
            refreshPreviousPlans();
        }
    }, [user]);

    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(''), 3000);
    };

    const handlePlanDataChange = (fieldId: string, value: string) => {
        setPlanData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = (newStatus: LessonPlanStatus) => {
        if (!currentPlan) return;
        
        // When saving a rejected plan, it should become editable again as a draft.
        const isRevising = currentPlan.status === 'rejected' && newStatus === 'draft';
        const finalStatus = isRevising ? 'draft' : newStatus;
        
        const recordToSave = { ...currentPlan, planData, status: finalStatus, date: preparationDate, supervisorNotes: isRevising ? '' : currentPlan.supervisorNotes };
        const savedRecord = saveLessonPlanRecord(recordToSave);
        setCurrentPlan(savedRecord);
        refreshPreviousPlans();
        showFeedback(newStatus === 'draft' ? 'تم حفظ التحضير كمسودة!' : 'تم إرسال الخطة للاعتماد!');
    };
    
    const handleApplyToAll = () => {
        if (currentPlan) {
            // This logic allows applying the lesson to students regardless of the plan's approval status.
            const recordToApply = { ...currentPlan, planData, date: preparationDate };
             if (Object.keys(recordToApply.planData).every(key => !recordToApply.planData[key])) {
                 alert('لا يوجد محتوى في التحضير لتطبيقه على الطلاب.');
                 return;
            }
            applyLessonPlanToStudents(recordToApply);
            showFeedback('تم تطبيق الدرس على جميع طلاب الحلقة بنجاح!');
        }
    };

    const handleDuplicatePlan = () => {
        if (!currentPlan || !user || !activeStudyPlan) return;

        const newPlanForToday: Omit<LessonPlanRecord, 'id'> = {
            teacherId: user.id,
            halaqaId: currentPlan.halaqaId,
            planConfigId: activeStudyPlan.id,
            date: today,
            planData: { ...currentPlan.planData }, // Copy data
            status: 'draft', // New plan is a draft
            supervisorId: currentPlan.supervisorId,
            lastModified: new Date().toISOString()
        };
        
        // Set the view to the new duplicated plan
        setCurrentPlan({ ...newPlanForToday, id: -1 }); // Use temporary ID
        setPlanData({ ...currentPlan.planData });
        setPreparationDate(today); // Switch to today's date
        showFeedback('تم تكرار الخطة. يمكنك تعديلها وحفظها كمسودة جديدة لليوم.');
    };

    const handleCreateNewPrep = () => {
        if (!user || myHalaqat.length === 0) return;
        const halaqaId = Number(selectedHalaqaId) || myHalaqat[0].id;
        const halaqa = myHalaqat.find(h => h.id === halaqaId);

        const newPlan: Omit<LessonPlanRecord, 'id'> = {
            teacherId: user.id,
            halaqaId: halaqaId,
            planConfigId: activeStudyPlan!.id,
            date: today,
            planData: {},
            status: 'draft',
            supervisorId: halaqa!.supervisorId,
            lastModified: new Date().toISOString()
        };
        setCurrentPlan({ ...newPlan, id: -1 });
        setPlanData({});
        setPreparationDate(today);
        setActiveTab('current');
    };
    
    const handleSelectPreviousPlan = (plan: LessonPlanRecord) => {
        setPreparationDate(plan.date);
        setSelectedHalaqaId(String(plan.halaqaId));
        setCurrentPlan(plan);
        setPlanData(plan.planData || {});
        setActiveTab('current');
    };

    const handleConfirmDelete = () => {
        if (planToDeleteId) {
            deleteLessonPlanRecord(planToDeleteId);
            refreshPreviousPlans();
            setPlanToDeleteId(null);
        }
    };
    
    if (!activeStudyPlan) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <h3 className="text-xl font-semibold text-slate-700">لا توجد خطة دراسية</h3>
                <p className="text-slate-500 mt-2">لم يقم المشرف بتعيين خطة دراسية لك بعد. يرجى التواصل مع المشرف المسؤول.</p>
            </div>
        );
    }
    
    const isFormDisabled = currentPlan?.status === 'pending' || currentPlan?.status === 'approved' || isReadOnly;

    const renderPreviousPlans = () => (
        <div className="space-y-4">
            {previousPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previousPlans.map(plan => (
                        <div key={`${plan.id}-${plan.lastModified}`} className="bg-white p-4 rounded-xl shadow-md border flex flex-col justify-between animate-fade-in">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold">{halaqat.find(h => h.id === plan.halaqaId)?.name}</h4>
                                        <p className="text-sm text-slate-500">ليوم: {formatDate(plan.date)}</p>
                                    </div>
                                    <StatusBadge status={plan.status} />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">آخر تعديل: {formatDate(plan.lastModified || plan.date)}</p>
                            </div>
                            <div className="flex justify-end items-center gap-2 mt-4 border-t pt-3">
                                <button onClick={() => setPlanToDeleteId(plan.id)} disabled={isReadOnly} className="text-red-500 hover:underline text-sm font-semibold disabled:text-slate-400 disabled:no-underline">حذف</button>
                                <button onClick={() => handleSelectPreviousPlan(plan)} className="px-4 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700">
                                    فتح وتعديل
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center p-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">لا توجد خطط محفوظة سابقاً.</p>
                </div>
            )}
        </div>
    );

    const renderCurrentPrep = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold">تحضير الدروس ليوم: {formatDate(preparationDate)}</h2>
                <div className="w-full md:w-1/3">
                    <label htmlFor="halaqa-select" className="sr-only">اختر الحلقة</label>
                    <select
                        id="halaqa-select"
                        value={selectedHalaqaId}
                        onChange={e => {
                            setSelectedHalaqaId(e.target.value);
                            setPreparationDate(today); // Reset to today when changing halaqa
                        }}
                        className="w-full p-2 border rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900"
                    >
                        {myHalaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
            </div>
            
            {currentPlan && <StatusIndicator status={currentPlan.status} notes={currentPlan.supervisorNotes} />}

            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-sky-500">
                <h3 className="font-bold text-lg mb-4 text-slate-700">محتوى التحضير ({activeStudyPlan.name})</h3>
                 {activeStudyPlan.groups.map(group => (
                    <div key={group.id} className="mb-6">
                        <p className="font-bold text-slate-800 text-xl border-b-2 border-sky-200 pb-2 mb-4">{group.label}</p>
                        {group.subGroups.map(sg => (
                            <div key={sg.id} className="pr-4 mt-4">
                                <p className="text-slate-700 font-semibold text-lg">{sg.label}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-3">
                                    {sg.fields.map(f => (
                                        <div key={f.id}>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">{f.label}</label>
                                            <input
                                                type="text"
                                                value={planData[f.id] || ''}
                                                onChange={e => handlePlanDataChange(f.id, e.target.value)}
                                                disabled={isFormDisabled}
                                                className="w-full p-2 border rounded-md bg-white text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md sticky bottom-4 flex flex-col sm:flex-row justify-end items-center gap-3">
                {feedbackMessage && <p className="text-teal-600 font-semibold text-sm mr-auto animate-fade-in">{feedbackMessage}</p>}
                
                {currentPlan?.status === 'approved' && (
                    <button 
                        onClick={handleDuplicatePlan}
                        disabled={isReadOnly}
                        className="w-full sm:w-auto px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-400"
                    >
                        تكرار الخطة
                    </button>
                )}

                <button 
                    onClick={() => handleSave('draft')}
                    disabled={isFormDisabled}
                    className="w-full sm:w-auto px-5 py-2 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 disabled:bg-slate-300"
                >
                    حفظ كمسودة
                </button>
                <button 
                    onClick={() => handleSave('pending')}
                    disabled={isFormDisabled}
                    className="w-full sm:w-auto px-5 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:bg-amber-300"
                >
                    {currentPlan?.status === 'rejected' ? 'إعادة الإرسال للاعتماد' : 'إرسال للاعتماد'}
                </button>
                 <button 
                    onClick={handleApplyToAll}
                    disabled={!currentPlan || isReadOnly}
                    className="w-full sm:w-auto px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400"
                >
                    تطبيق الدرس على الطلاب
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <ConfirmationModal 
                isOpen={!!planToDeleteId}
                onClose={() => setPlanToDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="تأكيد حذف الخطة"
                message="هل أنت متأكد من حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء."
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('current')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'current' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>
                        التحضير الحالي
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'history' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>
                        خططي السابقة
                    </button>
                </div>
                 <button 
                    onClick={handleCreateNewPrep}
                    disabled={isReadOnly}
                    className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 self-stretch md:self-auto disabled:bg-slate-400"
                >
                    إنشاء تحضير جديد
                </button>
            </div>
            
            {activeTab === 'current' ? renderCurrentPrep() : renderPreviousPlans()}
        </div>
    );
};

export default LessonPrep;