import React, { useState, useMemo, useEffect } from 'react';
import { students as allStudents, halaqat as allHalaqat, users, paymentRecords, addPayment, getPaymentMessageTemplate, savePaymentMessageTemplate, studentClassifications as allClassifications, addStudentClassification, updateStudentClassification, deleteStudentClassification, formatDate, getHalaqaSetting, saveHalaqaSetting, getAccountantGroupMessageTemplate, saveAccountantGroupMessageTemplate } from '../data/mockData';
import { Student, PaymentStatus, PaymentRecord, StudentClassification, HalaqaSetting, Role, Halaqa, User } from '../types';
import { useAuth } from '../context/AuthContext';

// --- Icons ---
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.138l-.515 1.876 1.91.505z" />
    </svg>
);
const LogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M18 10a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const MessageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ClassificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const HalaqaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6" /></svg>;
const ChevronDownIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
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


const HalaqaFollowupTab: React.FC<{
    user: User | null;
    halaqat: Halaqa[];
    students: Student[];
    handleSendHalaqaMessage: (halaqaId: number) => void;
    copyStatus: string;
    isReadOnly?: boolean;
}> = ({ user, halaqat, students, handleSendHalaqaMessage, copyStatus, isReadOnly }) => {
    const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(null);

    const teachersWithHalaqat = useMemo(() => {
        if (!user) return [];
        const teacherIdsInHalaqat = new Set(halaqat.flatMap(h => h.teacherIds));
        return users.filter(u => u.subscriberId === user.subscriberId && u.role === Role.Teacher && teacherIdsInHalaqat.has(u.id));
    }, [halaqat, user]);

    return (
        <div className="space-y-4">
            {teachersWithHalaqat.map(teacher => {
                const teacherHalaqat = halaqat.filter(h => h.teacherIds.includes(teacher.id));
                const isExpanded = expandedTeacherId === teacher.id;
                return (
                    <div key={teacher.id} className="bg-slate-50 rounded-xl shadow-sm border overflow-hidden">
                        <button onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)} className="w-full flex justify-between items-center p-4 text-right hover:bg-slate-100">
                            <h3 className="text-xl font-bold text-sky-800">{teacher.name}</h3>
                            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon />
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="p-4 border-t space-y-3 bg-white">
                                {teacherHalaqat.map(halaqa => {
                                    const studentsInHalaqa = students.filter(s => s.halaqaId === halaqa.id);
                                    return (
                                        <div key={halaqa.id} className="bg-white p-4 rounded-xl shadow-sm border">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3 mb-3">
                                                <h3 className="text-lg font-bold text-sky-800">{halaqa.name}</h3>
                                                <button onClick={() => handleSendHalaqaMessage(halaqa.id)} className="px-3 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 flex items-center disabled:bg-slate-400" disabled={!!copyStatus || isReadOnly}>
                                                    <WhatsAppIcon/>
                                                    <span className="mr-1">{copyStatus || 'إرسال تذكير'}</span>
                                                </button>
                                            </div>
                                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                                                {studentsInHalaqa.map(student => (
                                                    <li key={student.id} className="text-sm p-2 bg-slate-50 rounded-md flex justify-between">
                                                        <span>{student.name}</span>
                                                        <span className={`font-bold ${student.paymentStatus === PaymentStatus.Paid ? 'text-teal-600' : 'text-amber-600'}`}>
                                                            {student.paymentStatus === PaymentStatus.Paid ? '✅ مدفوع' : '⏳ متأخر'}
                                                        </span>
                                                    </li>
                                                ))}
                                                {studentsInHalaqa.length === 0 && <li className="text-sm text-slate-500 text-center p-2">لا يوجد طلاب في هذه الحلقة.</li>}
                                            </ul>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    );
};

interface GroupSettingsTabProps {
    user: User | null;
    halaqat: Halaqa[];
    halaqaSettings: Record<number, HalaqaSetting>;
    setHalaqaSettings: React.Dispatch<React.SetStateAction<Record<number, HalaqaSetting>>>;
    handleFetchTeacherLinks: (teacherId: number) => void;
    handleSaveHalaqaLinks: () => void;
    saveStatus: string;
    setEditingTemplate: (template: { type: 'group' | 'late' | 'paid', data: { name: string, template: string } } | null) => void;
    setIsTemplateModalOpen: (isOpen: boolean) => void;
    isReadOnly?: boolean;
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({
    user,
    halaqat,
    halaqaSettings,
    setHalaqaSettings,
    handleFetchTeacherLinks,
    handleSaveHalaqaLinks,
    saveStatus,
    setEditingTemplate,
    setIsTemplateModalOpen,
    isReadOnly,
}) => {
    const groupTemplate = getAccountantGroupMessageTemplate();
    const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(null);

    const teachersInSubscriber = useMemo(() => {
        if (!user) return [];
        return users.filter(u => u.role === Role.Teacher && u.subscriberId === user.subscriberId);
    }, [user]);

    const halaqatByTeacher = useMemo(() => {
        const grouped = new Map<number, Halaqa[]>();
        teachersInSubscriber.forEach(teacher => {
            const teacherHalaqat = halaqat.filter(h => h.teacherIds.includes(teacher.id));
            if (teacherHalaqat.length > 0) {
                grouped.set(teacher.id, teacherHalaqat);
            }
        });
        return grouped;
    }, [teachersInSubscriber, halaqat]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h3 className="text-xl font-bold mb-4">نماذج الرسائل الجماعية</h3>
                <div className="bg-slate-100 p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold">{groupTemplate.name}</h4>
                        <button onClick={() => { setEditingTemplate({ type: 'group', data: groupTemplate }); setIsTemplateModalOpen(true); }} disabled={isReadOnly} className="text-sm font-semibold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline">تعديل</button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 p-2 bg-white rounded whitespace-pre-wrap">{groupTemplate.template}</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">روابط مجموعات الواتساب</h3>
                <div className="space-y-4">
                    {Array.from(halaqatByTeacher.entries()).map(([teacherId, teacherHalaqat]) => {
                        const teacher = teachersInSubscriber.find(t => t.id === teacherId);
                        if (!teacher) return null;
                        const isExpanded = expandedTeacherId === teacherId;
                        return (
                            <div key={teacherId} className="bg-slate-100 rounded-xl shadow-sm border overflow-hidden">
                                <button onClick={() => setExpandedTeacherId(isExpanded ? null : teacherId)} className="w-full flex justify-between items-center p-4 text-right hover:bg-slate-200 transition-colors">
                                    <h4 className="text-lg font-bold text-sky-800">{teacher.name}</h4>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleFetchTeacherLinks(teacherId); }} 
                                            disabled={isReadOnly}
                                            className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-md border border-sky-200 hover:bg-sky-200 disabled:bg-slate-200 disabled:text-slate-500"
                                        >
                                            جلب الروابط من المعلم
                                        </button>
                                        <ChevronDownIcon className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="p-4 border-t space-y-3 bg-white">
                                        {teacherHalaqat.map(halaqa => (
                                            <div key={halaqa.id}>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{halaqa.name}</label>
                                                <input
                                                    type="url"
                                                    value={halaqaSettings[halaqa.id]?.whatsAppGroupLink || ''}
                                                    onChange={e => {
                                                        const halaqaId = halaqa.id;
                                                        const link = e.target.value;
                                                        setHalaqaSettings(prev => ({
                                                            ...prev,
                                                            [halaqaId]: { ...(prev[halaqaId] || { halaqaId }), whatsAppGroupLink: link }
                                                        }));
                                                    }}
                                                    placeholder="https://chat.whatsapp.com/..."
                                                    className="w-full p-2 border rounded-md bg-white text-slate-900 read-only:bg-slate-100"
                                                    readOnly={isReadOnly}
                                                />
                                            </div>
                                        ))}
                                        {teacherHalaqat.length === 0 && <p className="text-sm text-slate-500">لا توجد حلقات لهذا المعلم.</p>}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex items-center justify-end">
                {saveStatus && <p className="text-sm text-teal-600 mr-4 animate-fade-in">{saveStatus}</p>}
                <button onClick={handleSaveHalaqaLinks} disabled={isReadOnly} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                    حفظ كل الروابط
                </button>
            </div>
        </div>
    );
};


// FIX: Add `isReadOnly` prop to fix compilation error in MainContent.tsx.
const Payments: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();

    const [mainTab, setMainTab] = useState<'student_payments' | 'halaqa_followup' | 'group_settings'>('student_payments');
    
    // States for 'student_payments' tab
    const [students, setStudents] = useState<Student[]>(() => {
        if (user?.viewableGenders && user.viewableGenders.length > 0) {
            return allStudents.filter(student => user.subscriberId === student.subscriberId && user.viewableGenders!.includes(student.gender));
        }
        return allStudents.filter(s => s.subscriberId === user?.subscriberId);
    });

    const [activeSubTab, setActiveSubTab] = useState<'log' | 'stats' | 'settings'>('log');
    const [logSubTab, setLogSubTab] = useState<'all' | 'late'>('all');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(100);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [paymentMonth, setPaymentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [dataVersion, setDataVersion] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const [classifications, setClassifications] = useState(allClassifications);
    const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
    const [editingClassification, setEditingClassification] = useState<Partial<StudentClassification> | null>(null);
    
    // States for 'halaqa_followup' and 'group_settings' tabs
    const [halaqat, setHalaqat] = useState(allHalaqat.filter(h => h.supervisorId && users.find(u=>u.id === h.supervisorId)?.subscriberId === user?.subscriberId));
    const [halaqaSettings, setHalaqaSettings] = useState<Record<number, HalaqaSetting>>({});
    const [copyStatus, setCopyStatus] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    // Template Management State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<{ type: 'group' | 'late' | 'paid', data: {name: string, template: string} } | null>(null);
    

    useEffect(() => {
        const settings: Record<number, HalaqaSetting> = {};
        halaqat.forEach(h => {
            settings[h.id] = getHalaqaSetting(h.id) || { halaqaId: h.id, whatsAppGroupLink: '' };
        });
        setHalaqaSettings(settings);
    }, [halaqat]);
    
    // --- 'student_payments' tab functions ---
    const handleOpenModal = (student: Student) => {
        setSelectedStudent(student);
        const classification = classifications.find(c => c.id === student.classificationId);
        setPaymentAmount(classification ? classification.defaultAmount : 100);
        setIsModalOpen(true);
    };

    const handleAddPayment = () => {
        if (!selectedStudent) return;
        addPayment({
            studentId: selectedStudent.id,
            amount: paymentAmount,
            paymentDate: paymentDate,
            paymentMonth: paymentMonth,
        });
        setIsModalOpen(false);
        setDataVersion(v => v + 1);
        
        const studentToUpdate = students.find(s => s.id === selectedStudent.id);
        if (studentToUpdate) {
            studentToUpdate.paymentStatus = PaymentStatus.Paid;
            setStudents([...students]);
        }
    };

    const handleSaveClassification = () => {
        if (!editingClassification || !editingClassification.name?.trim()) {
            alert('يرجى إدخال اسم التصنيف.');
            return;
        }
        if (editingClassification.id) {
            updateStudentClassification(editingClassification as StudentClassification);
        } else {
            addStudentClassification(editingClassification as Omit<StudentClassification, 'id'>);
        }
        setClassifications([...allClassifications]);
        setEditingClassification(null);
    };
    
    const handleDeleteClassification = (id: number) => {
        if(confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            deleteStudentClassification(id);
            setClassifications([...allClassifications]);
        }
    };
    
    const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'غير معروف';
    const recentPayments = useMemo(() => {
        const studentIds = students.map(s => s.id);
        return paymentRecords
            .filter(p => studentIds.includes(p.studentId))
            .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .slice(0, 10);
    }, [dataVersion, students]);
    
    const filteredStudents = useMemo(() => {
        let list = students;
        if (logSubTab === 'late') {
            list = list.filter(s => s.paymentStatus !== PaymentStatus.Paid);
        }
        if (searchTerm) {
            return list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list;
    }, [students, logSubTab, searchTerm, dataVersion]);

    const stats = useMemo(() => {
        const thisMonthStr = new Date().toISOString().slice(0, 7);
        const totalCollectedThisMonth = paymentRecords
            .filter(p => p.paymentMonth === thisMonthStr && students.some(s => s.id === p.studentId))
            .reduce((sum, p) => sum + p.amount, 0);

        const lateAndUnpaid = students.filter(s => s.paymentStatus !== PaymentStatus.Paid);
        const totalDue = lateAndUnpaid.reduce((sum, s) => {
            const classification = classifications.find(c => c.id === s.classificationId);
            return sum + (classification?.defaultAmount || 100);
        }, 0);
        
        return {
            totalCollectedThisMonth,
            totalDue,
            paidCount: students.length - lateAndUnpaid.length,
            lateCount: lateAndUnpaid.length,
        };
    }, [students, dataVersion, classifications]);
    
    // --- Functions for new tabs ---
    const handleSaveHalaqaLinks = () => {
        Object.values(halaqaSettings).forEach((setting: HalaqaSetting) => {
            if (setting.whatsAppGroupLink !== undefined) {
                 saveHalaqaSetting(setting);
            }
        });
        setSaveStatus('تم حفظ الروابط بنجاح!');
        setTimeout(() => setSaveStatus(''), 3000);
    };
    
    const handleSendHalaqaMessage = (halaqaId: number) => {
        const groupMessageTemplate = getAccountantGroupMessageTemplate();
        const halaqa = halaqat.find(h => h.id === halaqaId);
        if (!halaqa) return;

        const studentsInHalaqa = students.filter(s => s.halaqaId === halaqaId);
        const studentList = studentsInHalaqa
            .map(s => `- ${s.name} ${s.paymentStatus === PaymentStatus.Paid ? '✅' : '⏳'}`)
            .join('\n');
            
        const month = new Date().toLocaleString('ar-SA', { month: 'long' });
        
        const message = groupMessageTemplate.template
            .replace(/{halaqaName}/g, halaqa.name)
            .replace(/{month}/g, month)
            .replace(/{studentList}/g, studentList);

        navigator.clipboard.writeText(message).then(() => {
            const groupLink = halaqaSettings[halaqaId]?.whatsAppGroupLink;
            setCopyStatus('تم نسخ الرسالة!');
            if (groupLink) {
                window.open(groupLink, '_blank');
            } else {
                alert('تم نسخ الرسالة. لا يوجد رابط واتساب مسجل لهذه الحلقة.');
            }
            setTimeout(() => setCopyStatus(''), 3000);
        });
    };

    const handleSaveTemplate = (type: 'group' | 'late' | 'paid', data: { name: string, template: string }) => {
        if (type === 'group') {
            saveAccountantGroupMessageTemplate(data);
        } else {
            savePaymentMessageTemplate(type, data);
        }
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
        setDataVersion(v => v + 1); // Force re-render of settings tabs
    };

    const handleFetchTeacherLinks = (teacherId: number) => {
        const teacherHalaqat = halaqat.filter(h => h.teacherIds.includes(teacherId));
        setHalaqaSettings(prev => {
            const newSettings = { ...prev };
            teacherHalaqat.forEach(h => {
                const latestSetting = getHalaqaSetting(h.id);
                newSettings[h.id] = latestSetting || { halaqaId: h.id, whatsAppGroupLink: '' };
            });
            return newSettings;
        });
        setSaveStatus('تم تحديث روابط المعلم!');
        setTimeout(() => setSaveStatus(''), 2500);
    };


    const TemplateEditModal = () => {
        const [name, setName] = useState(editingTemplate?.data.name || '');
        const [template, setTemplate] = useState(editingTemplate?.data.template || '');

        if (!isTemplateModalOpen || !editingTemplate) return null;

        const handleSave = () => {
            handleSaveTemplate(editingTemplate.type, { name, template });
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold">تعديل نموذج الرسالة</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">اسم النموذج</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md bg-white text-slate-900 disabled:bg-slate-100"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">محتوى النموذج</label>
                            <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={8} disabled={isReadOnly} className="w-full p-2 border rounded-md bg-white text-slate-900 disabled:bg-slate-100" />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                        <button onClick={handleSave} disabled={isReadOnly} className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:bg-slate-400">حفظ</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderStudentPayments = () => (
        <>
            <TemplateEditModal />
            <div className="flex space-x-2 space-x-reverse border-b mb-4">
                <button onClick={() => setActiveSubTab('log')} className={`flex items-center px-4 py-2 text-lg font-semibold ${activeSubTab === 'log' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><LogIcon />سجل الدفع</button>
                <button onClick={() => setActiveSubTab('stats')} className={`flex items-center px-4 py-2 text-lg font-semibold ${activeSubTab === 'stats' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><StatsIcon />إحصائيات</button>
                <button onClick={() => setActiveSubTab('settings')} className={`flex items-center px-4 py-2 text-lg font-semibold ${activeSubTab === 'settings' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><SettingsIcon />إعدادات</button>
            </div>
            
            {activeSubTab === 'log' && (
                <div>
                     <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-grow">
                             <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pr-10 border rounded-md bg-white text-slate-900" />
                             <SearchIcon />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-md">
                            <button onClick={() => setLogSubTab('all')} className={`flex-1 px-3 py-1 text-sm rounded ${logSubTab === 'all' ? 'bg-white shadow' : ''}`}>كل الطلاب</button>
                            <button onClick={() => setLogSubTab('late')} className={`flex-1 px-3 py-1 text-sm rounded ${logSubTab === 'late' ? 'bg-white shadow' : ''}`}>المتأخرون</button>
                        </div>
                    </div>
                    {/* ... (existing log table JSX) ... */}
                </div>
            )}
            
            {activeSubTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="التحصيل هذا الشهر" value={`${stats.totalCollectedThisMonth.toLocaleString('ar-SA')} ريال`} icon={<MoneyIcon />} color="bg-sky-500" />
                    <StatCard title="إجمالي المستحقات" value={`${stats.totalDue.toLocaleString('ar-SA')} ريال`} icon={<ExclamationIcon />} color="bg-amber-500" />
                    <StatCard title="طلاب سددوا" value={stats.paidCount} icon={<CheckCircleIcon />} color="bg-teal-500" />
                    <StatCard title="طلاب متأخرون" value={stats.lateCount} icon={<ExclamationIcon />} color="bg-red-500" />
                </div>
            )}

            {activeSubTab === 'settings' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                    <div className="bg-slate-50 p-6 rounded-xl border">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><MessageIcon />نماذج رسائل التذكير الفردية</h3>
                        <div className="space-y-4">
                             {[
                                { type: 'late', data: getPaymentMessageTemplate('late') },
                                { type: 'paid', data: getPaymentMessageTemplate('paid') },
                            ].map(({ type, data }) => (
                                <div key={type} className="bg-white p-4 rounded-lg shadow-sm border">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold">{data.name}</h4>
                                        <button onClick={() => { setEditingTemplate({ type: type as 'late' | 'paid', data }); setIsTemplateModalOpen(true); }} disabled={isReadOnly} className="text-sm font-semibold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline">تعديل</button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded whitespace-pre-wrap">{data.template}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><ClassificationIcon />تصنيفات الطلاب</h3>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {classifications.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-2 bg-white rounded-md border">
                                    <p className="font-semibold">{c.name} <span className="text-slate-500 text-sm">({c.defaultAmount} ريال)</span></p>
                                    <div className="space-x-2 space-x-reverse">
                                        <button onClick={() => setEditingClassification(c)} disabled={isReadOnly} className="text-sky-600 hover:underline text-xs disabled:text-slate-400 disabled:no-underline">تعديل</button>
                                        <button onClick={() => handleDeleteClassification(c.id)} disabled={isReadOnly} className="text-red-600 hover:underline text-xs disabled:text-slate-400 disabled:no-underline">حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">{editingClassification?.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={editingClassification?.name || ''}
                                    onChange={(e) => setEditingClassification(p => ({ ...p, name: e.target.value }))}
                                    placeholder="اسم التصنيف (مثال: رسوم مخفضة)"
                                    className="flex-grow p-2 border rounded-md bg-white text-slate-900 read-only:bg-slate-100"
                                    readOnly={isReadOnly}
                                />
                                <input
                                    type="number"
                                    value={editingClassification?.defaultAmount === undefined ? '' : editingClassification.defaultAmount}
                                    onChange={(e) => setEditingClassification(p => ({ ...p, defaultAmount: e.target.value === '' ? undefined : Number(e.target.value) }))}
                                    placeholder="المبلغ"
                                    className="w-24 p-2 border rounded-md bg-white text-slate-900 read-only:bg-slate-100"
                                    readOnly={isReadOnly}
                                />
                            </div>
                             <div className="flex justify-end gap-2 mt-2">
                                {editingClassification && (
                                    <button onClick={() => setEditingClassification(null)} className="px-4 py-1.5 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300">
                                        إلغاء
                                    </button>
                                )}
                                <button onClick={handleSaveClassification} disabled={isReadOnly} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                                    {editingClassification?.id ? 'حفظ التعديل' : 'إضافة التصنيف'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && selectedStudent && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     {/* ... (existing modal JSX) ... */}
                 </div>
            )}
        </>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
             <TemplateEditModal />
            <div className="flex border-b mb-6">
                <button onClick={() => setMainTab('student_payments')} className={`flex items-center px-4 py-2 text-lg font-semibold ${mainTab === 'student_payments' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><LogIcon />سجل المدفوعات</button>
                <button onClick={() => setMainTab('halaqa_followup')} className={`flex items-center px-4 py-2 text-lg font-semibold ${mainTab === 'halaqa_followup' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><HalaqaIcon />متابعة الحلقات</button>
                <button onClick={() => setMainTab('group_settings')} className={`flex items-center px-4 py-2 text-lg font-semibold ${mainTab === 'group_settings' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}><SettingsIcon />إعدادات الرسائل</button>
            </div>

            {mainTab === 'student_payments' && renderStudentPayments()}
            {mainTab === 'halaqa_followup' && <HalaqaFollowupTab user={user} halaqat={halaqat} students={students} handleSendHalaqaMessage={handleSendHalaqaMessage} copyStatus={copyStatus} isReadOnly={isReadOnly} />}
            {mainTab === 'group_settings' && <GroupSettingsTab user={user} halaqat={halaqat} halaqaSettings={halaqaSettings} setHalaqaSettings={setHalaqaSettings} handleFetchTeacherLinks={handleFetchTeacherLinks} handleSaveHalaqaLinks={handleSaveHalaqaLinks} saveStatus={saveStatus} setEditingTemplate={setEditingTemplate} setIsTemplateModalOpen={setIsTemplateModalOpen} isReadOnly={isReadOnly} />}
        </div>
    );
};

export default Payments;