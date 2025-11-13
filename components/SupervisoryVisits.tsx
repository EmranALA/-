import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    users, 
    halaqat as allHalaqat, 
    addSupervisoryVisit, 
    supervisoryVisits as allVisits,
    visitItems as allVisitItems,
    addVisitItem,
    updateVisitItem,
    deleteVisitItem,
    formatDate,
    deleteSupervisoryVisit
} from '../data/mockData';
import { User, Halaqa, Role, VisitType, SupervisoryVisit, VisitItem } from '../types';
import ConfirmationModal from './ConfirmationModal';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const SupervisoryVisits: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();

    const isSupervisor = user?.role === Role.Supervisor;
    const isTeacher = user?.role === Role.Teacher;
    const isAdmin = user && [Role.Admin, Role.DeputyManager].includes(user.role);

    const [activeTab, setActiveTab] = useState<'form' | 'log' | 'items'>(isSupervisor ? 'form' : 'log');

    // Form State
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>('');
    const [visitType, setVisitType] = useState<VisitType>(VisitType.Evaluation);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [strengths, setStrengths] = useState('');
    const [developmentAreas, setDevelopmentAreas] = useState('');
    const [notes, setNotes] = useState('');
    const [formStatus, setFormStatus] = useState('');

    // Log State
    const [visits, setVisits] = useState<SupervisoryVisit[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<SupervisoryVisit | null>(null);
    const [visitToDeleteId, setVisitToDeleteId] = useState<number | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Items State
    const [visitItems, setVisitItems] = useState<VisitItem[]>([]);
    const [newItemText, setNewItemText] = useState('');

    useEffect(() => {
        if (user) {
            setVisitItems(allVisitItems.filter(item => item.subscriberId === user.subscriberId));

            let userVisits: SupervisoryVisit[] = [];
            if (isSupervisor) {
                userVisits = allVisits.filter(v => v.supervisorId === user.id);
            } else if (isTeacher) {
                userVisits = allVisits.filter(v => v.teacherId === user.id);
            } else if (isAdmin) {
                const subscriberUserIds = new Set(users.filter(u => u.subscriberId === user.subscriberId).map(u => u.id));
                userVisits = allVisits.filter(v => subscriberUserIds.has(v.supervisorId));
            }
            setVisits(userVisits);
        }
    }, [user, isSupervisor, isTeacher, isAdmin, activeTab, formStatus]);

    const supervisedTeachers = useMemo(() => {
        if (!user || !isSupervisor) return [];
        const supervisedHalaqaIds = new Set(allHalaqat.filter(h => h.supervisorId === user.id).map(h => h.id));
        const teacherIds = new Set(allHalaqat.filter(h => supervisedHalaqaIds.has(h.id)).flatMap(h => h.teacherIds));
        return users.filter(u => u.role === Role.Teacher && teacherIds.has(u.id));
    }, [user, isSupervisor]);

    const filteredHalaqat = useMemo(() => {
        if (!selectedTeacherId) return [];
        return allHalaqat.filter(h => h.teacherIds.includes(Number(selectedTeacherId)));
    }, [selectedTeacherId]);

    const handleRatingChange = (itemId: number, rating: number) => {
        setRatings(prev => ({ ...prev, [itemId]: rating }));
    };

    const resetForm = () => {
        setSelectedTeacherId('');
        setSelectedHalaqaId('');
        setVisitType(VisitType.Evaluation);
        setVisitDate(new Date().toISOString().slice(0, 10));
        setRatings({});
        setStrengths('');
        setDevelopmentAreas('');
        setNotes('');
        setFormStatus('');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedTeacherId || !selectedHalaqaId) {
            setFormStatus('يرجى اختيار المعلم والحلقة.');
            return;
        }
        
        addSupervisoryVisit({
            supervisorId: user.id,
            teacherId: Number(selectedTeacherId),
            halaqaId: Number(selectedHalaqaId),
            visitType,
            date: visitDate,
            ratings,
            strengths,
            developmentAreas,
            notes,
        });

        setFormStatus('تم حفظ الزيارة بنجاح!');
        setTimeout(() => resetForm(), 3000);
    };

    const handleAddItem = () => {
        if (!newItemText.trim() || !user?.subscriberId) return;
        const newItem = addVisitItem({ text: newItemText, subscriberId: user.subscriberId });
        setVisitItems(prev => [...prev, newItem]);
        setNewItemText('');
    };

    const handleUpdateItem = (id: number, text: string) => {
        const itemToUpdate = visitItems.find(i => i.id === id);
        if (itemToUpdate) {
            const updatedItem = { ...itemToUpdate, text };
            updateVisitItem(updatedItem);
            setVisitItems(prev => prev.map(i => i.id === id ? updatedItem : i));
        }
    };

    const handleDeleteItem = (itemId: number) => {
        if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
            deleteVisitItem(itemId);
            setVisitItems(prev => prev.filter(i => i.id !== itemId));
        }
    };
    
    const handleDeleteVisit = (id: number) => {
        setVisitToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDeleteVisit = () => {
        if (visitToDeleteId) {
            deleteSupervisoryVisit(visitToDeleteId);
            setVisits(prev => prev.filter(v => v.id !== visitToDeleteId));
        }
        setIsConfirmModalOpen(false);
        setVisitToDeleteId(null);
    };

    const getTeacherName = (id: number) => users.find(u => u.id === id)?.name || 'N/A';
    const getSupervisorName = (id: number) => users.find(u => u.id === id)?.name || 'N/A';
    const getHalaqaName = (id: number) => allHalaqat.find(h => h.id === id)?.name || 'N/A';

    const renderVisitForm = () => (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المعلم</label>
                    <select value={selectedTeacherId} onChange={e => { setSelectedTeacherId(e.target.value); setSelectedHalaqaId(''); }} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                        <option value="">-- اختر معلم --</option>
                        {supervisedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحلقة</label>
                    <select value={selectedHalaqaId} onChange={e => setSelectedHalaqaId(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md" disabled={!selectedTeacherId}>
                        <option value="">-- اختر حلقة --</option>
                        {filteredHalaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع الزيارة</label>
                    <select value={visitType} onChange={e => setVisitType(e.target.value as VisitType)} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                        <option value={VisitType.Evaluation}>تقييم</option>
                        <option value={VisitType.Survey}>استطلاع</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الزيارة</label>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md"/>
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border">
                <h3 className="text-lg font-bold mb-2">بنود التقييم</h3>
                <div className="flex justify-between text-xs text-slate-500 mb-4 px-2">
                    <span>ضعيف جداً</span>
                    <span>ممتاز</span>
                </div>
                <div className="space-y-4">
                    {visitItems.map(item => (
                        <div key={item.id} className="p-3 bg-white rounded-md shadow-sm">
                            <label className="block font-semibold text-slate-800 mb-2">{item.text}</label>
                            <div className="flex justify-between items-center space-x-2 space-x-reverse">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        type="button"
                                        key={rating}
                                        onClick={() => handleRatingChange(item.id, rating)}
                                        disabled={isReadOnly}
                                        className={`w-10 h-10 rounded-md font-bold text-lg transition-colors ${ratings[item.id] === rating ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                    >
                                        {rating}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <textarea value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="جوانب القوة والإبداع..." rows={4} className="w-full p-3 border rounded-md bg-white text-slate-900" readOnly={isReadOnly}/>
                <textarea value={developmentAreas} onChange={e => setDevelopmentAreas(e.target.value)} placeholder="جوانب التطوير..." rows={4} className="w-full p-3 border rounded-md bg-white text-slate-900" readOnly={isReadOnly}/>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات أخرى..." rows={4} className="w-full p-3 border rounded-md bg-white text-slate-900" readOnly={isReadOnly}/>
            </div>
            
            <div className="text-left flex items-center justify-end">
                {formStatus && <p className="text-teal-600 font-semibold mr-4">{formStatus}</p>}
                <button type="submit" disabled={isReadOnly} className="px-8 py-3 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">حفظ استمارة الزيارة</button>
            </div>
        </form>
    );

    const renderVisitLog = () => (
        <div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visits.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(visit => (
                    <div key={visit.id} className="relative">
                        <button onClick={() => setSelectedVisit(visit)} className="block w-full text-right bg-slate-50 p-4 rounded-lg border hover:border-sky-500 hover:bg-white shadow-sm transition-all">
                            {isAdmin && <p className="text-xs text-slate-500 mb-1">المشرف: {getSupervisorName(visit.supervisorId)}</p>}
                            <p className="font-bold text-slate-800">المعلم: {getTeacherName(visit.teacherId)}</p>
                            <p className="text-sm text-slate-600">الحلقة: {getHalaqaName(visit.halaqaId)}</p>
                            <div className="mt-2 text-xs flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full font-semibold">{visit.visitType}</span>
                                <span className="text-slate-500">{formatDate(visit.date)}</span>
                            </div>
                        </button>
                        {isSupervisor && !isReadOnly && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteVisit(visit.id); }} 
                                className="absolute top-2 left-2 p-1.5 text-red-400 hover:text-red-600 bg-slate-50 hover:bg-red-100 rounded-full"
                                aria-label="حذف الزيارة"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {visits.length === 0 && <p className="text-center text-slate-500 p-8">لا يوجد سجلات زيارة حتى الآن.</p>}
        </div>
    );
    
    const renderVisitItemsManager = () => (
        <div className="max-w-3xl mx-auto space-y-4">
            {visitItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={item.text}
                        onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-slate-900"
                        readOnly={isReadOnly}
                    />
                    <button onClick={() => !isReadOnly && handleDeleteItem(item.id)} disabled={isReadOnly} className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:text-slate-400 disabled:hover:bg-transparent">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
            <div className="flex items-center gap-2 pt-4 border-t">
                <input 
                    type="text" 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="اكتب نص البند الجديد هنا..."
                    className="w-full p-2 border rounded-md bg-white text-slate-900"
                    readOnly={isReadOnly}
                />
                <button onClick={handleAddItem} disabled={isReadOnly} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 whitespace-nowrap disabled:bg-slate-400">إضافة بند</button>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDeleteVisit}
                title="تأكيد حذف الزيارة"
                message="هل أنت متأكد من حذف سجل هذه الزيارة؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <h2 className="text-2xl font-bold mb-4">
                {isTeacher ? 'سجل زياراتي الإشرافية' : 'الزيارات الإشرافية'}
            </h2>
            
            {isSupervisor && (
                <div className="flex border-b mb-6">
                    <button onClick={() => setActiveTab('form')} className={`px-4 py-2 font-semibold ${activeTab === 'form' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>استمارة زيارة</button>
                    <button onClick={() => setActiveTab('log')} className={`px-4 py-2 font-semibold ${activeTab === 'log' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>سجل الزيارات</button>
                    <button onClick={() => setActiveTab('items')} className={`px-4 py-2 font-semibold ${activeTab === 'items' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>بنود الزيارات</button>
                </div>
            )}

            {isSupervisor && activeTab === 'form' && renderVisitForm()}
            {(isSupervisor && activeTab === 'log') || isTeacher || isAdmin ? renderVisitLog() : null}
            {isSupervisor && activeTab === 'items' && renderVisitItemsManager()}

            {selectedVisit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[90vh] max-h-[750px]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">تفاصيل الزيارة</h3>
                            <button onClick={() => setSelectedVisit(null)} className="p-2 rounded-full hover:bg-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {isAdmin && <p><strong>المشرف:</strong> {getSupervisorName(selectedVisit.supervisorId)}</p>}
                                <p><strong>المعلم:</strong> {getTeacherName(selectedVisit.teacherId)}</p>
                                <p><strong>الحلقة:</strong> {getHalaqaName(selectedVisit.halaqaId)}</p>
                                <p><strong>التاريخ:</strong> {formatDate(selectedVisit.date)}</p>
                                <p><strong>النوع:</strong> {selectedVisit.visitType}</p>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-2">التقييمات</h4>
                                <ul className="space-y-1 text-sm">
                                    {Object.keys(selectedVisit.ratings).length > 0 ? Object.entries(selectedVisit.ratings).map(([itemId, rating]) => (
                                        <li key={itemId} className="flex justify-between p-1 bg-slate-50 rounded">
                                            <span>{visitItems.find(i => i.id === Number(itemId))?.text || 'بند محذوف'}</span>
                                            <span className="font-bold">{rating} / 5</span>
                                        </li>
                                    )) : <li className="text-slate-500">لا يوجد تقييم لهذه الزيارة.</li>}
                                </ul>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-1">جوانب القوة والإبداع</h4>
                                <p className="text-sm p-2 bg-slate-50 rounded">{selectedVisit.strengths || 'لم تسجل'}</p>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-1">جوانب التطوير</h4>
                                <p className="text-sm p-2 bg-slate-50 rounded">{selectedVisit.developmentAreas || 'لم تسجل'}</p>
                            </div>
                             <div className="border-t pt-4">
                                <h4 className="font-bold mb-1">ملاحظات أخرى</h4>
                                <p className="text-sm p-2 bg-slate-50 rounded">{selectedVisit.notes || 'لم تسجل'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisoryVisits;