import React, { useState, useMemo, useEffect } from 'react';
import { students as initialAllStudents, levels as allLevels, users, halaqat, addStudent, updateStudent, deleteStudent, studentClassifications, paymentRecords, formatDate, addLevel, updateLevel, deleteLevel, addUser, addHalaqa, updateHalaqa, addStudentClassification } from '../data/mockData';
import { Student, Role, PaymentStatus, User, Halaqa, Gender, Level, StudentClassification } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import ImportLogicBuilder from './ImportLogicBuilder';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const StudentManagement: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [allStudents, setAllStudents] = useState<Student[]>(initialAllStudents);
    const [activeTab, setActiveTab] = useState<'students' | 'levels' | 'importLogic'>('students');
    const [dataVersion, setDataVersion] = useState(0); // To force re-renders
    
    const isAccountant = user?.role === Role.Accountant;
    
    const students = useMemo(() => {
        let visibleStudents = allStudents;
        // Filter by subscriber for non-AppManager roles
        if (user && user.role !== Role.AppManager) {
            visibleStudents = visibleStudents.filter(student => student.subscriberId === user.subscriberId);
        }
        
        if (user?.viewableGenders && user.viewableGenders.length > 0) {
            return visibleStudents.filter(student => user.viewableGenders!.includes(student.gender));
        }
        return visibleStudents;
    }, [allStudents, user]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState('');
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
    const [failedImports, setFailedImports] = useState<{ rowData: string; reason: string }[]>([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [studentToDeleteId, setStudentToDeleteId] = useState<number | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'info' | 'payments'>('info');
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');

    const teachers = useMemo(() => {
        let availableTeachers = users.filter(u => u.role === Role.Teacher && u.subscriberId === user?.subscriberId);
        if (user?.role === Role.Supervisor) {
            const supervisedHalaqat = halaqat.filter(h => h.supervisorId === user.id);
            const supervisedTeacherIds = new Set(supervisedHalaqat.flatMap(h => h.teacherIds));
            availableTeachers = availableTeachers.filter(t => supervisedTeacherIds.has(t.id));
        }
        return availableTeachers;
    }, [user]);

    const availableHalaqat = useMemo(() => {
        let relevantHalaqat = (user?.role === Role.Supervisor)
            ? halaqat.filter(h => h.supervisorId === user.id)
            : halaqat.filter(h => {
                const supervisor = users.find(u => u.id === h.supervisorId);
                return supervisor?.subscriberId === user?.subscriberId;
            });
    
        if (editingStudent?.teacherId) {
            return relevantHalaqat.filter(h => h.teacherIds.includes(editingStudent.teacherId!));
        }
        return relevantHalaqat;
    }, [editingStudent, user]);
    
    const availableLevels = useMemo(() => {
        if (!user) return [];
        if (user.role === Role.Supervisor) {
            return allLevels.filter(l => l.creatorId === user.id);
        }
        // Admin, DeputyManager, Accountant can see all levels in the subscription
        return allLevels.filter(l => l.subscriberId === user.subscriberId);
    }, [user, dataVersion]);

    const studentPaymentHistory = useMemo(() => {
        if (!editingStudent || !editingStudent.id) return [];
        return paymentRecords
            .filter(p => p.studentId === editingStudent.id)
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [editingStudent]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        const lowercasedTerm = searchTerm.toLowerCase();
        return students.filter(student =>
            student.name.toLowerCase().includes(lowercasedTerm) ||
            (student.phoneNumber && student.phoneNumber.includes(searchTerm))
        );
    }, [students, searchTerm]);

    const getLevelName = (levelId: number) => allLevels.find(l => l.id === levelId)?.name || 'N/A';
    const getTeacherName = (teacherId?: number) => teacherId !== undefined ? users.find(u => u.id === teacherId)?.name || 'N/A' : 'غير معين';
    const getHalaqaName = (halaqaId?: number) => halaqaId !== undefined ? halaqat.find(h => h.id === halaqaId)?.name || 'N/A' : 'غير معين';

    const handleAddNew = () => {
        setFormError('');
        setActiveModalTab('info');
        setEditingStudent({
            name: '',
            gender: Gender.Male,
            levelId: availableLevels[0]?.id,
            teacherId: teachers[0]?.id,
            halaqaId: availableHalaqat.filter(h => h.teacherIds.includes(teachers[0]?.id))[0]?.id,
            phoneNumber: '',
            notes: '',
            classificationId: undefined,
            subscriberId: user?.subscriberId, // Assign current user's subscriberId
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = (student: Student) => {
        setFormError('');
        setActiveModalTab('info');
        setEditingStudent({ ...student });
        setIsEditModalOpen(true);
    };
    
    const handleDelete = (studentId: number) => {
        setStudentToDeleteId(studentId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (studentToDeleteId !== null) {
            deleteStudent(studentToDeleteId);
            setAllStudents(prev => prev.filter(s => s.id !== studentToDeleteId));
        }
        setIsConfirmModalOpen(false);
        setStudentToDeleteId(null);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditingStudent(null);
        setFormError('');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setEditingStudent(prev => {
            if (!prev) return null;

            let finalValue: any = value;
             if (['levelId', 'teacherId', 'halaqaId'].includes(name)) {
                finalValue = value ? parseInt(value) : undefined;
            } else if (name === 'classificationId') {
                finalValue = value ? parseInt(value) : undefined;
            }

            const updatedStudent = { ...prev, [name]: finalValue };

            if (name === 'teacherId') {
                const newTeacherId = value ? parseInt(value) : undefined;
                let relevantHalaqat = (user?.role === Role.Supervisor)
                    ? halaqat.filter(h => h.supervisorId === user.id)
                    : halaqat.filter(h => {
                        const supervisor = users.find(u => u.id === h.supervisorId);
                        return supervisor?.subscriberId === user?.subscriberId;
                    });

                const halaqatForNewTeacher = newTeacherId ? relevantHalaqat.filter(h => h.teacherIds.includes(newTeacherId)) : [];
                updatedStudent.halaqaId = halaqatForNewTeacher[0]?.id;
            }

            return updatedStudent;
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!editingStudent || !editingStudent.name) {
            setFormError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }

        if (editingStudent.id) { // Editing
            updateStudent(editingStudent as Student);
            setAllStudents([...initialAllStudents]);
            handleCloseModal();
        } else { // Adding
            const newStudentResult = addStudent(editingStudent as Omit<Student, 'id' | 'paymentStatus'>);
            if (newStudentResult) {
                setAllStudents([...initialAllStudents]); // Refresh list from source
                handleCloseModal();
            } else {
                setFormError('لا يمكن إضافة المزيد من الطلاب. لقد وصلت إلى الحد الأقصى المسموح به في باقة اشتراكك.');
            }
        }
    };

    const handleImport = () => {
        // Caches to avoid redundant lookups and creations within the same import batch
        const newTeachersCache: Map<string, User> = new Map();
        const newHalaqatCache: Map<string, Halaqa> = new Map();
        const newClassificationCache: Map<string, StudentClassification> = new Map();
        const newSupervisorsCache: Map<string, User> = new Map();


        const rows = importData.trim().split('\n').filter(r => r.trim());
        let success = 0;
        const failed: { rowData: string, reason: string }[] = [];

        const subscriberAdmin = users.find(u => u.subscriberId === user?.subscriberId && u.role === Role.Admin);
        const defaultSupervisorId = user?.role === Role.Supervisor ? user.id : subscriberAdmin?.id;

        rows.forEach(row => {
            const [name, phoneNumber, teacherName, halaqaName, supervisorName, classificationName, amountStr, notes] = row.split('\t').map(s => s.trim());
            
            if (!name) {
                failed.push({ rowData: row, reason: 'اسم الطالب حقل إجباري.' });
                return;
            }

            let teacher: User | undefined | null = null;
            let halaqa: Halaqa | undefined | null = null;
            
            // --- Find or Create Supervisor ---
            let supervisorIdForHalaqa = defaultSupervisorId;
            if (supervisorName) {
                const supervisorCacheKey = supervisorName.toLowerCase();
                let foundSupervisor: User | undefined | null = null;

                if (newSupervisorsCache.has(supervisorCacheKey)) {
                    foundSupervisor = newSupervisorsCache.get(supervisorCacheKey)!;
                } else {
                    foundSupervisor = users.find(u => 
                        u.name.trim().toLowerCase() === supervisorName.toLowerCase() && 
                        u.role === Role.Supervisor && 
                        u.subscriberId === user?.subscriberId
                    );
                }

                if (foundSupervisor) {
                    supervisorIdForHalaqa = foundSupervisor.id;
                } else {
                    // Create new supervisor
                    const username = `supervisor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    const newSupervisorData: Omit<User, 'id'> = { name: supervisorName, username: username, role: Role.Supervisor, subscriberId: user?.subscriberId };
                    const createdSupervisor = addUser(newSupervisorData);
                    
                    if (createdSupervisor) {
                        supervisorIdForHalaqa = createdSupervisor.id;
                        newSupervisorsCache.set(supervisorCacheKey, createdSupervisor);
                    } else {
                        failed.push({ rowData: row, reason: `فشل إنشاء مشرف جديد: ${supervisorName}.` });
                        return; // Skip to next row
                    }
                }
            }

            // --- 1. Find or Create Teacher ---
            if (teacherName) {
                const teacherCacheKey = teacherName.toLowerCase();
                if (newTeachersCache.has(teacherCacheKey)) {
                    teacher = newTeachersCache.get(teacherCacheKey);
                } else {
                    teacher = users.find(u => u.name.trim().toLowerCase() === teacherName.toLowerCase() && u.role === Role.Teacher && u.subscriberId === user?.subscriberId);
                    if (!teacher) {
                        const username = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        const newTeacherData: Omit<User, 'id'> = { name: teacherName, username: username, role: Role.Teacher, subscriberId: user?.subscriberId };
                        const createdUser = addUser(newTeacherData);
                        if (createdUser) {
                            teacher = createdUser;
                            newTeachersCache.set(teacherCacheKey, teacher);
                        } else {
                             failed.push({ rowData: row, reason: `فشل إنشاء معلم جديد: ${teacherName}. قد يكون بسبب حدود الاشتراك.` });
                             return;
                        }
                    }
                }
            }

            // --- 2. Find or Create Halaqa ---
            if (halaqaName && teacher) {
                const halaqaCacheKey = `${halaqaName.toLowerCase()}_${teacher.id}`;
                if (newHalaqatCache.has(halaqaCacheKey)) {
                    halaqa = newHalaqatCache.get(halaqaCacheKey);
                } else {
                    const subscriberHalaqat = halaqat.filter(h => {
                        const supervisor = users.find(u => u.id === h.supervisorId);
                        return supervisor?.subscriberId === user?.subscriberId;
                    });
                    halaqa = subscriberHalaqat.find(h => h.name.trim().toLowerCase() === halaqaName.toLowerCase() && h.teacherIds.includes(teacher!.id));

                    if (!halaqa) {
                        if (!supervisorIdForHalaqa) {
                            failed.push({ rowData: row, reason: `لم يتم العثور على مشرف لإنشاء حلقة جديدة: ${halaqaName}.` });
                            return;
                        }
                        const newHalaqaData: Omit<Halaqa, 'id'> = { name: halaqaName, supervisorId: supervisorIdForHalaqa, teacherIds: [teacher.id] };
                        const createdHalaqa = addHalaqa(newHalaqaData);
                        if (createdHalaqa) {
                            halaqa = createdHalaqa;
                            newHalaqatCache.set(halaqaCacheKey, halaqa);
                        } else {
                             failed.push({ rowData: row, reason: `فشل إنشاء حلقة جديدة: ${halaqaName}.` });
                             return;
                        }
                    }
                }
            }
            
            // --- 3. Find or Create Classification ---
            let classificationId: number | undefined = undefined;
            if (classificationName) {
                const classificationCacheKey = classificationName.toLowerCase();
                if (newClassificationCache.has(classificationCacheKey)) {
                    classificationId = newClassificationCache.get(classificationCacheKey)!.id;
                } else {
                    let classification = studentClassifications.find(c => c.name.trim().toLowerCase() === classificationName.toLowerCase());
                    if (!classification) {
                        const amount = amountStr ? parseInt(amountStr, 10) : 0;
                        if (!isNaN(amount)) {
                            const newClassification = addStudentClassification({ name: classificationName, defaultAmount: amount });
                            classification = newClassification;
                            newClassificationCache.set(classificationCacheKey, newClassification);
                        } else {
                            failed.push({ rowData: row, reason: `المبلغ "${amountStr}" غير صالح للتصنيف "${classificationName}".` });
                            // continue to next row
                        }
                    }
                    if (classification) {
                        classificationId = classification.id;
                    }
                }
            }

            // --- 4. Add Student ---
            const result = addStudent({
                name: name,
                gender: Gender.Male,
                levelId: availableLevels[0]?.id || 1,
                teacherId: teacher?.id,
                halaqaId: halaqa?.id,
                phoneNumber: phoneNumber || undefined,
                notes: notes || undefined,
                subscriberId: user?.subscriberId,
                classificationId: classificationId,
            });
    
            if (result) {
                success++;
            } else {
                failed.push({ rowData: row, reason: 'تم تجاوز الحد الأقصى للطلاب في الاشتراك.' });
            }
        });
    
        setImportResult({ success, failed: failed.length });
        setFailedImports(failed);
        setAllStudents([...initialAllStudents]); // Refresh from global mock data source
    };

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-teal-100 text-teal-800';
            case PaymentStatus.Late: return 'bg-amber-100 text-amber-800';
            case PaymentStatus.Unpaid: return 'bg-red-100 text-red-800';
        }
    };

    const StudentLevelsManager = () => {
        const myLevels = useMemo(() => {
            if (!user) return [];
            if (user.role === Role.Supervisor) {
                return allLevels.filter(l => l.creatorId === user.id);
            }
            // Admin/DeputyManager can see all levels in the subscription
            return allLevels.filter(l => l.subscriberId === user.subscriberId);
        }, [user, dataVersion]);

        const [editingLevel, setEditingLevel] = useState<Partial<Level> | null>(null);

        const handleSaveLevel = () => {
            if (!editingLevel || !editingLevel.name?.trim() || !user) return;

            if (editingLevel.id) { // Update
                updateLevel(editingLevel as Level);
            } else { // Add
                addLevel({
                    name: editingLevel.name,
                    creatorId: user.id,
                    subscriberId: user.subscriberId!,
                });
            }
            setEditingLevel(null);
            setDataVersion(v => v + 1); // Trigger re-render
        };

        const handleDeleteLevel = (levelId: number) => {
            if (confirm('هل أنت متأكد من حذف هذا المستوى؟')) {
                deleteLevel(levelId);
                setDataVersion(v => v + 1); // Trigger re-render
            }
        };

        return (
            <div className="max-w-2xl mx-auto">
                <div className="space-y-3 mb-6">
                    {myLevels.map(level => (
                        <div key={level.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <p className="font-semibold">{level.name}</p>
                            <div className="space-x-2 space-x-reverse">
                                <button onClick={() => setEditingLevel(level)} disabled={isReadOnly} className="text-sky-600 hover:underline text-sm disabled:text-slate-400 disabled:no-underline">تعديل</button>
                                <button onClick={() => handleDeleteLevel(level.id)} disabled={isReadOnly} className="text-red-600 hover:underline text-sm disabled:text-slate-400 disabled:no-underline">حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <h4 className="font-bold mb-2">{editingLevel?.id ? 'تعديل المستوى' : 'إضافة مستوى جديد'}</h4>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={editingLevel?.name || ''}
                            onChange={(e) => setEditingLevel(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="اسم المستوى..."
                            className="flex-grow p-2 border rounded-md bg-white text-slate-900"
                            readOnly={isReadOnly}
                        />
                        <button onClick={handleSaveLevel} disabled={isReadOnly} className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800 disabled:bg-slate-400">حفظ</button>
                        {editingLevel && <button onClick={() => setEditingLevel(null)} className="px-4 py-2 bg-slate-200 rounded-md">إلغاء</button>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="تأكيد حذف الطالب"
                message="هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع سجلات الحضور والتقدم والمدفوعات المرتبطة به بشكل دائم. لا يمكن التراجع عن هذا الإجراء."
            />
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('students')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'students' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>إدارة الطلاب</button>
                {!isAccountant && (
                    <button onClick={() => setActiveTab('levels')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'levels' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>مستويات الطلاب</button>
                )}
                 {user?.role === Role.Admin && (
                    <button onClick={() => setActiveTab('importLogic')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'importLogic' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>إنشاء منطق استيراد</button>
                )}
            </div>

            {activeTab === 'students' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold">إدارة الطلاب</h2>
                        <div className="flex space-x-2 space-x-reverse self-stretch md:self-auto">
                            <button onClick={() => setIsImportModalOpen(true)} disabled={isReadOnly} className="flex-1 md:flex-auto px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                                استيراد
                            </button>
                            <button onClick={handleAddNew} disabled={isReadOnly} className="flex-1 md:flex-auto px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                                إضافة طالب
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            className="w-full md:w-1/2 p-3 border-2 border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
                        />
                    </div>


                    {/* Desktop Table */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-right">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3">الطالب</th>
                                    <th className="p-3">الجنس</th>
                                    <th className="p-3">المستوى</th>
                                    <th className="p-3">الحلقة</th>
                                    <th className="p-3">المعلم</th>
                                    <th className="p-3">حالة الدفع</th>
                                    <th className="p-3">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="border-b">
                                        <td className="p-3 font-semibold">{student.name}</td>
                                        <td className="p-3">{student.gender}</td>
                                        <td className="p-3">{getLevelName(student.levelId)}</td>
                                        <td className="p-3">{getHalaqaName(student.halaqaId)}</td>
                                        <td className="p-3">{getTeacherName(student.teacherId)}</td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(student.paymentStatus)}`}>
                                                {student.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => handleEdit(student)} className="text-sky-600 hover:underline">تعديل</button>
                                            <button onClick={() => handleDelete(student.id)} disabled={isReadOnly} className="text-red-600 hover:underline mr-4 disabled:text-slate-400 disabled:no-underline">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredStudents.map(student => (
                            <div key={student.id} className="bg-slate-50 p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{student.name}</h3>
                                        <p className="text-sm text-slate-500">{student.gender}</p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <button onClick={() => handleEdit(student)} className="text-sky-600 font-semibold text-sm">تعديل</button>
                                        <button onClick={() => handleDelete(student.id)} disabled={isReadOnly} className="text-red-600 font-semibold text-sm disabled:text-slate-400">حذف</button>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-slate-500">المستوى</p>
                                        <p className="font-semibold">{getLevelName(student.levelId)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">الحلقة</p>
                                        <p className="font-semibold">{getHalaqaName(student.halaqaId)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">المعلم</p>
                                        <p className="font-semibold">{getTeacherName(student.teacherId)}</p>
                                    </div>
                                    <div>
                                    <p className="text-slate-500">حالة الدفع</p>
                                        <p><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusBadge(student.paymentStatus)}`}>
                                            {student.paymentStatus}
                                        </span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'levels' && !isAccountant && <StudentLevelsManager />}
            {activeTab === 'importLogic' && <ImportLogicBuilder />}


            {isEditModalOpen && editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 flex-shrink-0">
                            <h3 className="text-xl font-bold mb-4">{editingStudent.id ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                            {editingStudent.id && (
                                 <div className="flex border-b">
                                    <button onClick={() => setActiveModalTab('info')} className={`px-4 py-2 font-semibold ${activeModalTab === 'info' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>بيانات الطالب</button>
                                    <button onClick={() => setActiveModalTab('payments')} className={`px-4 py-2 font-semibold ${activeModalTab === 'payments' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>سجلات الدفع</button>
                                </div>
                            )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8">
                           {activeModalTab === 'info' ? (
                                <form id="student-edit-form" onSubmit={handleSave} className="space-y-4 py-6">
                                    <div>
                                        <label className="block mb-2 font-semibold">اسم الطالب</label>
                                        <input type="text" name="name" value={editingStudent.name || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded" required />
                                    </div>
                                    
                                    {/* Fields hidden for Supervisor */}
                                    {user?.role !== Role.Supervisor && (
                                        <>
                                            <div>
                                                <label className="block mb-2 font-semibold">الجنس</label>
                                                <select 
                                                    name="gender" 
                                                    value={editingStudent.gender || ''} 
                                                    onChange={handleFormChange} 
                                                    className="w-full p-2 border bg-white text-slate-900 rounded disabled:bg-slate-100" 
                                                    required 
                                                    disabled={user?.role === Role.Accountant}
                                                >
                                                    <option value={Gender.Male}>ذكر</option>
                                                    <option value={Gender.Female}>أنثى</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block mb-2 font-semibold">تصنيف الطالب (للمدفوعات)</label>
                                                <select name="classificationId" value={editingStudent.classificationId || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded">
                                                    <option value="">بدون تصنيف</option>
                                                    {studentClassifications.map(c => <option key={c.id} value={c.id}>{c.name} ({c.defaultAmount} ريال)</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Fields hidden for Accountant */}
                                    {user?.role !== Role.Accountant && (
                                        <>
                                            <div>
                                                <label className="block mb-2 font-semibold">المستوى</label>
                                                <select name="levelId" value={editingStudent.levelId || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded" required>
                                                    {availableLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 font-semibold">المعلم</label>
                                                <select name="teacherId" value={editingStudent.teacherId || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded">
                                                    <option value="">-- غير معين --</option>
                                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 font-semibold">الحلقة</label>
                                                <select name="halaqaId" value={editingStudent.halaqaId || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded" disabled={!editingStudent.teacherId}>
                                                    <option value="">-- غير معين --</option>
                                                    {availableHalaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block mb-2 font-semibold">رقم الهاتف (اختياري)</label>
                                        <input type="tel" name="phoneNumber" value={editingStudent.phoneNumber || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">ملاحظات (اختياري)</label>
                                        <textarea name="notes" value={editingStudent.notes || ''} onChange={handleFormChange} className="w-full p-2 border bg-white text-slate-900 rounded" />
                                    </div>
                                    {formError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">{formError}</p>}
                                </form>
                            ) : (
                                <div className="py-6">
                                    {studentPaymentHistory.length > 0 ? (
                                        <div>
                                            <table className="w-full text-right">
                                                <thead className="bg-sky-800 text-white sticky top-0">
                                                    <tr>
                                                        <th className="p-3 font-semibold">تاريخ الدفع</th>
                                                        <th className="p-3 font-semibold">شهر الدفع</th>
                                                        <th className="p-3 font-semibold">المبلغ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentPaymentHistory.map((record, index) => (
                                                        <tr key={record.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                                            <td className="p-3 text-slate-800">{formatDate(record.paymentDate)}</td>
                                                            <td className="p-3 text-slate-800">{record.paymentMonth || 'غير محدد'}</td>
                                                            <td className="p-3 font-semibold text-slate-900">{record.amount} ريال</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-500 p-8">لا توجد سجلات دفع لهذا الطالب.</p>
                                    )}
                                </div>
                            )}
                        </div>
                         
                        {/* Footer */}
                        <div className="p-8 pt-4 mt-auto flex-shrink-0 border-t">
                             {activeModalTab === 'info' ? (
                                <div className="flex justify-end space-x-4 space-x-reverse">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">إلغاء</button>
                                    <button type="submit" form="student-edit-form" disabled={isReadOnly} className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:bg-slate-400">حفظ</button>
                                </div>
                             ) : (
                                <div className="flex justify-end">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">إغلاق</button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {isImportModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                             <h3 className="text-xl font-bold">استيراد الطلاب من جدول بيانات</h3>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8 py-6">
                            {importResult ? (
                                <div>
                                    <div className={`p-4 mb-4 rounded-lg text-center ${importResult.failed > 0 ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                                        تم استيراد {importResult.success} طالب بنجاح.
                                        <br/>
                                        فشل استيراد {importResult.failed} سجل.
                                    </div>
                                    {failedImports.length > 0 && (
                                        <div>
                                            <h4 className="font-bold mb-2">السجلات التي فشلت وتحتاج مراجعة:</h4>
                                            <textarea 
                                                readOnly
                                                className="w-full h-48 p-2 border rounded-md font-mono bg-slate-100 text-slate-900 text-sm"
                                                value={failedImports.map(f => `${f.rowData}\n--- السبب: ${f.reason}`).join('\n\n')}
                                            />
                                            <p className="text-xs text-slate-500 mt-1">يمكنك نسخ هذه البيانات، تصحيحها في محرر نصوص، ثم محاولة استيرادها مرة أخرى.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-600 mb-4">
                                        انسخ البيانات من جدول وألصقها هنا. تأكد من أن الأعمدة بالترتيب التالي (يفصل بينها مسافة Tab):
                                        <br/>
                                        <code className="bg-slate-100 p-1 rounded text-sm block my-2 text-right tracking-wider">الاسم (إجباري)	رقم الهاتف	المعلم	الحلقة	المشرف	تصنيف الطالب	المبلغ	ملاحظات</code>
                                        <span className="text-xs text-slate-500">سيتم إنشاء معلم أو حلقة أو تصنيف جديد تلقائياً إذا لم يكن موجوداً.</span>
                                    </p>
                                    <textarea 
                                        value={importData}
                                        onChange={(e) => setImportData(e.target.value)}
                                        className="w-full h-48 p-2 border rounded-md font-mono bg-white text-slate-900"
                                        placeholder="مثال:&#10;أحمد محمود	551234567	سعيد محمد	حلقة الأترجة	خالد الأحمد	رسوم عادية	100	طالب مستجد&#10;فهد عبدالله		سعيد محمد	حلقة الأترجة		طالب منحة	0	"
                                    />
                                </>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={() => { setIsImportModalOpen(false); setImportResult(null); setImportData(''); setFailedImports([]); }} className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إغلاق</button>
                                <button type="button" onClick={handleImport} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700" disabled={!!importResult}>استيراد</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default StudentManagement;