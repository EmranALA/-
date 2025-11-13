import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    importantDates as allImportantDates, 
    addImportantDate, 
    updateImportantDate, 
    deleteImportantDate, 
    users,
    teacherClassifications as allTeacherClassifications,
    halaqat,
    formatDate
} from '../data/mockData';
import { ImportantDate, ImportantDateType, Role, User, TeacherClassification } from '../types';
import ConfirmationModal from './ConfirmationModal';

// Helper to get the name of the month in Arabic
const getArabicMonthName = (monthIndex: number) => {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return months[monthIndex];
};

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const ImportantDates: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visibleDates, setVisibleDates] = useState<ImportantDate[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ImportantDate | null>(null);
    const [editingDate, setEditingDate] = useState<Partial<ImportantDate> | null>(null);
    const [dateToDeleteId, setDateToDeleteId] = useState<number | null>(null);
    const [isDateEditable, setIsDateEditable] = useState(false);

    const isPrivilegedUser = user && [Role.Admin, Role.DeputyManager, Role.Supervisor].includes(user.role);

    const supervisedTeachers = useMemo(() => {
        if (!user || !isPrivilegedUser) return [];
        if (user.role === Role.Supervisor) {
            const supervisedHalaqaIds = new Set(halaqat.filter(h => h.supervisorId === user.id).map(h => h.id));
            const teacherIds = new Set(halaqat.filter(h => supervisedHalaqaIds.has(h.id)).flatMap(h => h.teacherIds));
            return users.filter(u => u.role === Role.Teacher && teacherIds.has(u.id));
        }
        // Admin & Deputy see all teachers in subscriber
        return users.filter(u => u.role === Role.Teacher && u.subscriberId === user.subscriberId);
    }, [user, isPrivilegedUser]);

    const availableClassifications = useMemo(() => {
        if (!user) return [];
        return allTeacherClassifications.filter(tc => tc.subscriberId === user.subscriberId);
    }, [user]);


    useEffect(() => {
        if (user) {
            const allDates = allImportantDates.filter(d => d.subscriberId === user.subscriberId);
            if (isPrivilegedUser) {
                setVisibleDates(allDates);
            } else if (user.role === Role.Teacher) {
                const teacherDates = allDates.filter(event => {
                    return event.targetType === 'all' ||
                           (event.targetType === 'teacher' && event.targetId === user.id) ||
                           (event.targetType === 'classification' && user.classificationIds?.includes(event.targetId!));
                });
                setVisibleDates(teacherDates);
            }
        }
    }, [user, isPrivilegedUser]);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonthCount = new Date(year, month + 1, 0).getDate();
        
        const days: (Date | null)[] = Array.from({ length: firstDayOfMonth }, () => null); // Padding for first day
        for (let day = 1; day <= daysInMonthCount; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, ImportantDate[]>();
        visibleDates.forEach(event => {
            const dateStr = event.date;
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(event);
        });
        return map;
    }, [visibleDates]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const handleOpenEditModal = (date: Partial<ImportantDate> | null, day?: Date) => {
        if (day) { // Clicked on a calendar day
            setEditingDate({ title: '', date: day.toISOString().slice(0, 10), type: ImportantDateType.Other, targetType: 'all' });
            setIsDateEditable(false);
        } else { // Editing or clicking the main "Add" button
            if (date) { // Editing existing event
                setEditingDate({ ...date });
            } else { // Clicking main "Add" button
                setEditingDate({ title: '', date: new Date().toISOString().slice(0, 10), type: ImportantDateType.Other, targetType: 'all' });
            }
            setIsDateEditable(true);
        }
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingDate(null);
    };
    
    const handleOpenViewModal = (event: ImportantDate) => {
        setSelectedEvent(event);
        setIsViewModalOpen(true);
    };
    
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedEvent(null);
    };


    const handleSave = () => {
        if (!editingDate || !editingDate.title || !editingDate.date || !user) {
            alert('يرجى ملء عنوان الحدث.');
            return;
        }

        const dataToSave = { ...editingDate, type: ImportantDateType.Other };
        if (dataToSave.targetType === 'all') {
            delete dataToSave.targetId;
        }

        if (dataToSave.id) {
            updateImportantDate(dataToSave as ImportantDate);
        } else {
            addImportantDate({
                ...dataToSave,
                creatorId: user.id,
                subscriberId: user.subscriberId!,
            } as Omit<ImportantDate, 'id'>);
        }
        
        // Correct refresh logic
        const allDatesForSubscriber = allImportantDates.filter(d => d.subscriberId === user.subscriberId);
        if (isPrivilegedUser) {
            setVisibleDates(allDatesForSubscriber);
        } else if (user.role === Role.Teacher) {
            const teacherDates = allDatesForSubscriber.filter(event => {
                return event.targetType === 'all' ||
                       (event.targetType === 'teacher' && event.targetId === user.id) ||
                       (event.targetType === 'classification' && user.classificationIds?.includes(event.targetId!));
            });
            setVisibleDates(teacherDates);
        }

        handleCloseEditModal();
    };

    const handleDelete = (id: number) => {
        setDateToDeleteId(id);
    };
    
    const handleConfirmDelete = () => {
        if (dateToDeleteId && user) {
            deleteImportantDate(dateToDeleteId);
            const allDates = allImportantDates.filter(d => d.subscriberId === user.subscriberId);
            setVisibleDates(allDates);
        }
        setDateToDeleteId(null);
    };

    const getEventStyles = (event: ImportantDate): { bg: string, text: string, border: string } => {
        const creator = users.find(u => u.id === event.creatorId);
        if (creator && creator.role === Role.Supervisor) {
            return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500' };
        }
        switch (event.type) {
            case ImportantDateType.Exam: return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
            case ImportantDateType.Activity: return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' };
            case ImportantDateType.Holiday: return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-500' };
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <ConfirmationModal
                isOpen={!!dateToDeleteId}
                onClose={() => setDateToDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="تأكيد حذف الحدث"
                message="هل أنت متأكد من حذف هذا التاريخ الهام؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">التواريخ المهمة</h2>
                {isPrivilegedUser && (
                    <button onClick={() => handleOpenEditModal(null)} disabled={isReadOnly} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                        إضافة تاريخ جديد
                    </button>
                )}
            </div>

            <div className="bg-slate-50 rounded-lg border">
                <div className="flex justify-between items-center p-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-200">{"<"}</button>
                    <h3 className="text-xl font-bold">{getArabicMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</h3>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-200">{">"}</button>
                </div>
                <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-600 border-b">
                    {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => <div key={day} className="p-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {daysInMonth.map((day, index) => {
                        if (!day) return <div key={`pad-${index}`} className="border-r border-b h-28"></div>;
                        const dateStr = day.toISOString().slice(0, 10);
                        const events = eventsByDate.get(dateStr) || [];
                        
                        const today = new Date();
                        const isToday = day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() === today.getDate();
                        
                        return (
                            <div key={dateStr} className="border-r border-b p-2 h-32 md:h-40 flex flex-col relative group">
                                <span className={`font-bold ${isToday ? 'bg-sky-700 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>{day.getDate()}</span>
                                <div className="flex-grow overflow-y-auto mt-1 space-y-1">
                                    {events.map(event => {
                                        const styles = getEventStyles(event);
                                        return (
                                        <div key={event.id} onClick={() => handleOpenViewModal(event)} title={event.title} className={`text-xs p-1 rounded flex items-center cursor-pointer ${styles.bg} ${styles.text}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ml-1 ${styles.border.replace('border-','bg-')}`}></div>
                                            <span className="truncate flex-grow">{event.title}</span>
                                            {isPrivilegedUser && !isReadOnly && (
                                                <div className="flex-shrink-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(event); }} className="p-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }} className="p-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                                </div>
                                            )}
                                        </div>
                                    )})}
                                </div>
                                {isPrivilegedUser && !isReadOnly && (
                                    <button onClick={() => handleOpenEditModal(null, day)} className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-200 hover:bg-sky-200 text-sky-800 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* View Event Modal */}
            {isViewModalOpen && selectedEvent && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                            <p className="text-sm text-slate-500">{formatDate(selectedEvent.date)}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {selectedEvent.description && <p><strong>الوصف:</strong> {selectedEvent.description}</p>}
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3">
                            <button onClick={handleCloseViewModal} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Event Modal */}
            {isEditModalOpen && editingDate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">{editingDate.id ? 'تعديل التاريخ' : 'إضافة تاريخ جديد'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block mb-1 font-semibold">عنوان الحدث</label>
                                <input type="text" value={editingDate.title || ''} onChange={e => setEditingDate(p => ({...p, title: e.target.value}))} className="w-full p-2 border bg-white text-slate-900 rounded" required />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">التاريخ</label>
                                {isDateEditable ? (
                                    <input type="date" value={editingDate.date || ''} onChange={e => setEditingDate(p => ({...p, date: e.target.value}))} className="w-full p-2 border bg-white text-slate-900 rounded" required />
                                ) : (
                                    <p className="w-full p-2 border bg-slate-100 text-slate-700 rounded">{formatDate(editingDate.date || '')}</p>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">موجه إلى</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select value={editingDate.targetType} onChange={e => setEditingDate(p => ({...p, targetType: e.target.value as any, targetId: undefined }))} className="p-2 border bg-white text-slate-900 rounded-md">
                                        <option value="all">الكل</option>
                                        <option value="teacher">معلم محدد</option>
                                        <option value="classification">تصنيف محدد</option>
                                    </select>
                                    {editingDate.targetType === 'teacher' && (
                                        <select value={editingDate.targetId || ''} onChange={e => setEditingDate(p => ({...p, targetId: parseInt(e.target.value)}))} className="flex-1 p-2 border bg-white text-slate-900 rounded-md">
                                            <option value="">-- اختر معلماً --</option>
                                            {supervisedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    )}
                                     {editingDate.targetType === 'classification' && (
                                        <select value={editingDate.targetId || ''} onChange={e => setEditingDate(p => ({...p, targetId: parseInt(e.target.value)}))} className="flex-1 p-2 border bg-white text-slate-900 rounded-md">
                                            <option value="">-- اختر تصنيفاً --</option>
                                            {availableClassifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">الوصف (اختياري)</label>
                                <textarea value={editingDate.description || ''} onChange={e => setEditingDate(p => ({...p, description: e.target.value}))} className="w-full p-2 border bg-white text-slate-900 rounded" rows={3}></textarea>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3">
                            <button onClick={handleCloseEditModal} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportantDates;