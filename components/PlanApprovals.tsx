import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPendingApprovalsForSupervisor, updateApprovalStatus, users, halaqat, getStudyPlanConfigurationsForSubscriber, formatDate } from '../data/mockData';
import { LessonPlanRecord, StudyPlanConfiguration } from '../types';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const PlanApprovals: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [pendingApprovals, setPendingApprovals] = useState<LessonPlanRecord[]>([]);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [planConfigs, setPlanConfigs] = useState<StudyPlanConfiguration[]>([]);

    useEffect(() => {
        if (user && user.subscriberId) {
            setPendingApprovals(getPendingApprovalsForSupervisor(user.id));
            setPlanConfigs(getStudyPlanConfigurationsForSubscriber(user.subscriberId));
        }
    }, [user]);

    const handleApprovalAction = (id: number, status: 'approved' | 'rejected') => {
        if (status === 'rejected' && !notes[id]?.trim()) {
            alert('يرجى كتابة ملاحظات التصحيح قبل إرجاع الخطة.');
            return;
        }
        updateApprovalStatus(id, status, notes[id] || '');
        setPendingApprovals(prev => prev.filter(p => p.id !== id));
        setNotes(prev => {
            const newNotes = {...prev};
            delete newNotes[id];
            return newNotes;
        });
    };
    
    const getTeacherName = (id: number) => users.find(u => u.id === id)?.name || 'N/A';
    const getHalaqaName = (id: number) => halaqat.find(h => h.id === id)?.name || 'N/A';
    const getPlan = (id: number) => planConfigs.find(p => p.id === id);
    
    if (pendingApprovals.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <h2 className="text-2xl font-bold mb-4">خطط الدروس للاعتماد</h2>
                <p className="text-slate-500">لا توجد خطط مرسلة من المعلمين بانتظار الاعتماد حالياً.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">خطط الدروس للاعتماد ({pendingApprovals.length})</h2>
            {pendingApprovals.map(approval => {
                const plan = getPlan(approval.planConfigId);
                const planData = approval.planData || {};
                return (
                    <div key={approval.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{getHalaqaName(approval.halaqaId)}</h3>
                                <p className="text-sm text-slate-500">المعلم: {getTeacherName(approval.teacherId)} | التاريخ: {formatDate(approval.date)}</p>
                            </div>
                         </div>
                         {plan ? (
                             <div className="p-4 bg-slate-50 rounded-lg border">
                                <h4 className="font-bold text-lg mb-2 text-slate-700">محتوى التحضير ({plan.name})</h4>
                                {plan.groups.map(group => (
                                    <div key={group.id} className="mb-3">
                                        <p className="font-semibold text-slate-800">{group.label}:</p>
                                        {group.subGroups.map(sg => (
                                            <div key={sg.id} className="pr-4 mt-1">
                                                <p className="text-slate-600 font-medium">{sg.label}</p>
                                                <ul className="list-disc pr-5 text-sm text-slate-700">
                                                    {sg.fields.map(f => {
                                                        const value = planData[f.id];
                                                        return value ? <li key={f.id}>{f.label}: <span className="font-semibold">{value}</span></li> : null;
                                                    })}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-red-500">لم يتم العثور على الخطة الدراسية.</p>}

                         <div className="mt-4 border-t pt-4 space-y-3">
                             <textarea 
                                placeholder="اكتب ملاحظاتك هنا قبل إرجاع الخطة..." 
                                value={notes[approval.id] || ''}
                                onChange={e => setNotes(prev => ({...prev, [approval.id]: e.target.value}))}
                                className="w-full p-2 border rounded-md bg-white text-slate-900"
                                rows={3}
                                readOnly={isReadOnly}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => handleApprovalAction(approval.id, 'rejected')} disabled={isReadOnly} className="px-5 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-slate-400">إرجاع الخطة</button>
                                <button onClick={() => handleApprovalAction(approval.id, 'approved')} disabled={isReadOnly} className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400">تم الاعتماد</button>
                            </div>
                         </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PlanApprovals;