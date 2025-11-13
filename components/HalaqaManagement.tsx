import React, { useState, useMemo } from 'react';
import { halaqat as initialHalaqat, users, addHalaqa, updateHalaqa, deleteHalaqa } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Role, Halaqa, User } from '../types';
import ConfirmationModal from './ConfirmationModal';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const HalaqaManagement: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    
    const visibleHalaqat = useMemo(() => {
        if (user?.role === Role.Supervisor) {
            return initialHalaqat.filter(h => h.supervisorId === user.id);
        }
        return initialHalaqat.filter(h => h.supervisorId && users.find(u => u.id === h.supervisorId)?.subscriberId === user?.subscriberId);
    }, [user]);

    const [halaqatList, setHalaqatList] = useState(visibleHalaqat);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentHalaqa, setCurrentHalaqa] = useState<Partial<Halaqa> | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [halaqaToDeleteId, setHalaqaToDeleteId] = useState<number | null>(null);

    const supervisors = useMemo(() => users.filter(u => u.role === Role.Supervisor), []);
    const teachers = useMemo(() => users.filter(u => u.role === Role.Teacher), []);
    
    const getSupervisorName = (supervisorId: number) => users.find(u => u.id === supervisorId)?.name || 'N/A';
    const getTeacherCount = (teacherIds: number[]) => teacherIds.length;

    const handleAddNew = () => {
        setCurrentHalaqa({ name: '', supervisorId: supervisors[0]?.id, teacherIds: [] });
        setIsModalOpen(true);
    };

    const handleEdit = (halaqa: Halaqa) => {
        setCurrentHalaqa({ ...halaqa });
        setIsModalOpen(true);
    };

    const handleDeleteHalaqa = (id: number) => {
        setHalaqaToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDeleteHalaqa = () => {
        if (halaqaToDeleteId) {
            deleteHalaqa(halaqaToDeleteId);
            setHalaqatList(prev => prev.filter(h => h.id !== halaqaToDeleteId));
        }
        setIsConfirmModalOpen(false);
        setHalaqaToDeleteId(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentHalaqa(prev => prev ? { ...prev, [name]: name === 'supervisorId' ? parseInt(value) : value } : null);
    };

    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value ? parseInt(e.target.value, 10) : undefined;
        setCurrentHalaqa(prev => prev ? { ...prev, teacherIds: selectedId ? [selectedId] : [] } : null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentHalaqa || !currentHalaqa.name || !currentHalaqa.supervisorId || !currentHalaqa.teacherIds || currentHalaqa.teacherIds.length === 0) {
            alert('يرجى ملء الاسم واختيار مشرف ومعلم.');
            return;
        }

        if (currentHalaqa.id) { // Editing
            updateHalaqa(currentHalaqa as Halaqa);
        } else { // Adding
            addHalaqa(currentHalaqa as Omit<Halaqa, 'id'>);
        }

        setHalaqatList([...initialHalaqat].filter(h => visibleHalaqat.some(vh => vh.id === h.id)));
        setIsModalOpen(false);
        setCurrentHalaqa(null);
    };

    const TeacherView = () => (
        <div>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">إدارة الحلقات (حسب المعلم)</h2>
                <button onClick={handleAddNew} disabled={isReadOnly} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 self-stretch md:self-auto disabled:bg-slate-400">
                    إضافة حلقة جديدة
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map(teacher => {
                    const teacherHalaqatCount = initialHalaqat.filter(h => h.teacherIds.includes(teacher.id)).length;
                    return (
                        <div key={teacher.id} onClick={() => setSelectedTeacher(teacher)} className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md hover:bg-white transition-all cursor-pointer border border-transparent hover:border-sky-500">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="bg-amber-100 text-amber-800 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{teacher.name}</h3>
                                    <p className="text-slate-500">{teacherHalaqatCount} حلقات</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
    
    const HalaqaTableView = () => {
        if (!selectedTeacher) return null;
        const teacherHalaqat = halaqatList.filter(h => h.teacherIds.includes(selectedTeacher.id));

        return (
            <div>
                 <div className="flex items-center mb-6">
                    <button onClick={() => setSelectedTeacher(null)} className="ml-4 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 flex items-center space-x-2 space-x-reverse">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                       <span>العودة للمعلمين</span>
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold">حلقات: {selectedTeacher.name}</h2>
                </div>

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3">اسم الحلقة</th>
                                <th className="p-3">المشرف</th>
                                <th className="p-3">عدد المعلمين</th>
                                <th className="p-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherHalaqat.map(halaqa => (
                                <tr key={halaqa.id} className="border-b">
                                    <td className="p-3 font-semibold">{halaqa.name}</td>
                                    <td className="p-3">{getSupervisorName(halaqa.supervisorId)}</td>
                                    <td className="p-3">{getTeacherCount(halaqa.teacherIds)}</td>
                                    <td className="p-3 space-x-4 space-x-reverse">
                                        <button onClick={() => handleEdit(halaqa)} disabled={isReadOnly} className="text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline">تعديل</button>
                                        <button onClick={() => handleDeleteHalaqa(halaqa.id)} disabled={isReadOnly} className="text-red-600 hover:underline disabled:text-slate-400 disabled:no-underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {teacherHalaqat.map(halaqa => (
                        <div key={halaqa.id} className="bg-slate-50 p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{halaqa.name}</h3>
                                <div className="flex space-x-2 space-x-reverse">
                                    <button onClick={() => handleEdit(halaqa)} disabled={isReadOnly} className="text-sky-600 font-semibold disabled:text-slate-400">تعديل</button>
                                    <button onClick={() => handleDeleteHalaqa(halaqa.id)} disabled={isReadOnly} className="text-red-600 font-semibold disabled:text-slate-400">حذف</button>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                                <p><strong>المشرف:</strong> {getSupervisorName(halaqa.supervisorId)}</p>
                                <p><strong>عدد المعلمين:</strong> {getTeacherCount(halaqa.teacherIds)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDeleteHalaqa}
                title="تأكيد حذف الحلقة"
                message="هل أنت متأكد من حذف هذه الحلقة؟ سيتم إلغاء تعيين الطلاب المرتبطين بها."
            />
            
            {selectedTeacher ? <HalaqaTableView /> : <TeacherView />}

            {isModalOpen && currentHalaqa && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                             <h3 className="text-xl font-bold">{currentHalaqa.id ? 'تعديل الحلقة' : 'إضافة حلقة جديدة'}</h3>
                        </div>
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8">
                            <form id="halaqa-form" onSubmit={handleSave} className="space-y-4 py-6">
                                <div>
                                    <label className="block mb-2 font-semibold">اسم الحلقة</label>
                                    <input type="text" name="name" value={currentHalaqa.name || ''} onChange={handleFormChange} placeholder="مثال: حلقة الإمام الشاطبي" className="w-full p-2 border rounded bg-white text-slate-900" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">المشرف</label>
                                    <select name="supervisorId" value={currentHalaqa.supervisorId} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required>
                                        {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">المعلم</label>
                                    <select name="teacherIds" value={currentHalaqa.teacherIds?.[0] || ''} onChange={handleTeacherChange} className="w-full p-2 border rounded bg-white text-slate-900">
                                        <option value="">-- اختر معلماً --</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-300 rounded-lg hover:bg-slate-400">إلغاء</button>
                                <button type="submit" form="halaqa-form" disabled={isReadOnly} className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:bg-slate-400">حفظ</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default HalaqaManagement;