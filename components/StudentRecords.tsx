import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { students as allStudents, progressRecords, attendanceRecords, formatDate, getStudyPlanConfigurationsForTeacher, getTeacherSettings, halaqat } from '../data/mockData';
import { Student, ProgressRecord, AttendanceStatus } from '../types';

const StudentRecords: React.FC = () => {
    const { user } = useAuth();
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    const [studentForReport, setStudentForReport] = useState<Student | null>(null);
    const [reportStartDate, setReportStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7); // Default to a week ago
        return d.toISOString().slice(0, 10);
    });
    const [reportEndDate, setReportEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

    const myStudents = useMemo(() => {
        if (!user) return [];
        return allStudents.filter(s => s.teacherId === user.id);
    }, [user]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return myStudents.find(s => s.id === selectedStudentId);
    }, [selectedStudentId, myStudents]);

    const studentProgress = useMemo(() => {
        if (!selectedStudentId) return [];
        return progressRecords.filter(p => p.studentId === selectedStudentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedStudentId]);
    
    const activePlan = useMemo(() => {
        if (!user) return null;
        const plans = getStudyPlanConfigurationsForTeacher(user.id);
        return plans.length > 0 ? plans[0] : null;
    }, [user]);
    
    const getHalaqaName = (halaqaId?: number) => halaqat.find(h => h.id === halaqaId)?.name || 'غير محددة';

    const handleOpenReportModal = (student: Student) => {
        if (!student.phoneNumber) {
            alert('لا يوجد رقم هاتف مسجل لهذا الطالب.');
            return;
        }
        setStudentForReport(student);
        setIsReportModalOpen(true);
    };

    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
        setStudentForReport(null);
    };
    
    const handleSendDailyReport = (student: Student) => {
        if (!student.phoneNumber) {
            alert('لا يوجد رقم هاتف مسجل لهذا الطالب.');
            return;
        }
        if (!student.teacherId) {
            alert('الطالب غير مسجل مع معلم.');
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const attendance = attendanceRecords.find(a => a.studentId === student.id && a.date === today);
        
        const teacherSettings = getTeacherSettings(student.teacherId);
        const absenceTemplate = teacherSettings?.absenceMessageTemplate || 'عزيزي ولي الأمر، نود إعلامكم بأن الطالبـ/ـة {studentName} كان غائباً اليوم {date} عن حلقة {halaqaName}.';
        const attendanceTemplate = teacherSettings?.attendanceMessageTemplate || 'تقرير الطالبـ/ـة {studentName} ليوم {date} في حلقة {halaqaName}:\n\n*الإنجاز:*\n{progressSummary}\n\n*ملاحظات:*\n{notes}';

        let message = '';

        if (!attendance) {
            alert('لم يتم تسجيل حضور أو غياب لهذا الطالب اليوم.');
            return;
        }

        const halaqaName = getHalaqaName(student.halaqaId);

        if (attendance.status === AttendanceStatus.Present) {
            const progress = progressRecords.find(p => p.studentId === student.id && p.date === today);
            
            let progressSummary = 'لم يسجل إنجاز.';
            let notes = 'لا يوجد.';

            if (progress) {
                const plans = getStudyPlanConfigurationsForTeacher(student.teacherId);
                const planForProgress = plans.find(p => p.id === progress.planConfigId) || (plans.length > 0 ? plans[0] : null);
                
                let summaryParts: string[] = [];
                if (progress.progressData && planForProgress) {
                    try {
                        const data = JSON.parse(progress.progressData);
                        const allFields = planForProgress.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields));
                        
                        Object.entries(data).forEach(([fieldId, value]) => {
                            if (fieldId === 'notes') {
                                notes = String(value) || 'لا يوجد.';
                            } else {
                                const field = allFields.find(f => f.id === fieldId);
                                if (value && field) {
                                    summaryParts.push(`- ${field.label}: ${String(value)}`);
                                }
                            }
                        });
                    } catch (e) { console.error('Error parsing progress data for report'); }
                }

                if (summaryParts.length > 0) {
                    progressSummary = summaryParts.join('\n');
                } else if(progress.memorized || progress.revised) {
                    // Fallback to legacy
                    if(progress.memorized) summaryParts.push(`- حفظ: ${progress.memorized}`);
                    if(progress.revised) summaryParts.push(`- مراجعة: ${progress.revised}`);
                    progressSummary = summaryParts.join('\n');
                }
            }

            message = attendanceTemplate
                .replace(/{studentName}/g, student.name)
                .replace(/{halaqaName}/g, halaqaName)
                .replace(/{date}/g, formatDate(today))
                .replace(/{progressSummary}/g, progressSummary)
                .replace(/{notes}/g, notes);

        } else { // Absent or Excused
            message = absenceTemplate
                .replace(/{studentName}/g, student.name)
                .replace(/{halaqaName}/g, halaqaName)
                .replace(/{date}/g, formatDate(today));
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${student.phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    const handleSendReport = () => {
        if (!studentForReport || !studentForReport.phoneNumber) return;

        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        end.setHours(23, 59, 59, 999); // Make end date inclusive

        const relevantProgress = progressRecords
            .filter(p => {
                const pDate = new Date(p.date);
                return p.studentId === studentForReport.id && 
                       pDate >= start && 
                       pDate <= end;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (relevantProgress.length === 0) {
            alert('لا توجد سجلات إنجاز لهذا الطالب في الفترة المحددة.');
            return;
        }

        let reportText = `*تقرير إنجاز الطالب: ${studentForReport.name}*\n\n`;
        reportText += `*الفترة من:* ${formatDate(reportStartDate)}\n*إلى:* ${formatDate(reportEndDate)}\n`;
        reportText += `--------------------------\n\n`;


        relevantProgress.forEach(record => {
            reportText += `*التاريخ: ${formatDate(record.date)}*\n`;
            let hasData = false;
            if (record.progressData && activePlan) {
                 try {
                    const data = JSON.parse(record.progressData);
                    const allFields = activePlan.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields));
                     Object.entries(data).forEach(([fieldId, value]) => {
                        const field = allFields.find(f => f.id === fieldId);
                        if (value && fieldId !== 'notes') {
                            reportText += `- ${field?.label || fieldId}: ${String(value)}\n`;
                             hasData = true;
                        }
                    });
                 } catch(e) { /* fallback */ }
            } 
            
            if (!hasData) { // Fallback for old data or if parsing fails
                if (record.memorized) {
                    reportText += `- حفظ: ${record.memorized}\n`;
                    hasData = true;
                }
                if (record.revised) {
                    reportText += `- مراجعة: ${record.revised}\n`;
                    hasData = true;
                }
            }

            if (!hasData) {
                 reportText += `- لا توجد بيانات مسجلة لهذا اليوم.\n`;
            }

            reportText += '\n';
        });

        const encodedMessage = encodeURIComponent(reportText);
        window.open(`https://wa.me/${studentForReport.phoneNumber}?text=${encodedMessage}`, '_blank');
        handleCloseReportModal();
    };

    const renderProgressData = (record: ProgressRecord) => {
        if (!record.progressData || !activePlan) {
            return (
                <>
                    <p><strong>حفظ:</strong> {record.memorized || '-'}</p>
                    <p><strong>مراجعة:</strong> {record.revised || '-'}</p>
                </>
            );
        }
        try {
            const data = JSON.parse(record.progressData);
            const allFields = activePlan.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields));
            return (
                <ul className="list-disc pr-4">
                    {Object.entries(data).map(([fieldId, value]) => {
                        const field = allFields.find(f => f.id === fieldId);
                         if (!value || fieldId === 'notes') return null;
                        return <li key={fieldId}><strong>{field?.label || fieldId}:</strong> {String(value)}</li>;
                    })}
                </ul>
            );
        } catch (e) {
            return <p className="text-red-500">خطأ في عرض البيانات.</p>;
        }
    };
    
    return (
        <>
            <div className="flex h-full bg-white rounded-xl shadow-md overflow-hidden">
                <div className={`w-full md:w-1/3 border-l ${selectedStudentId ? 'hidden md:flex' : 'flex'} flex-col`}>
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold">طلاب الحلقة</h2>
                    </div>
                    <ul className="overflow-y-auto flex-1">
                        {myStudents.map(student => (
                            <li key={student.id}>
                               <div className={`w-full flex justify-between items-center border-b ${selectedStudentId === student.id ? 'bg-sky-100' : ''}`}>
                                     <button 
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className="flex-grow text-right p-4 hover:bg-sky-50"
                                    >
                                        {student.name}
                                    </button>
                                     <div className="pl-2 pr-4 flex items-center gap-2">
                                        <button
                                            onClick={() => handleSendDailyReport(student)}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                            disabled={!student.phoneNumber}
                                            title="إرسال تقرير اليوم"
                                        >
                                            تقرير اليوم
                                        </button>
                                        <button
                                            onClick={() => handleOpenReportModal(student)}
                                            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                            disabled={!student.phoneNumber}
                                            title="إرسال تقرير مخصص"
                                        >
                                            تقرير مخصص
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={`w-full md:w-2/3 ${selectedStudentId ? 'flex' : 'hidden'} md:flex flex-col`}>
                    {selectedStudent ? (
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b bg-slate-50 flex items-center">
                                <button onClick={() => setSelectedStudentId(null)} className="md:hidden ml-4 text-slate-600 hover:text-sky-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h14" /></svg>
                                </button>
                                <h3 className="font-bold text-lg">سجل إنجاز: {selectedStudent.name}</h3>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto bg-slate-100 space-y-4">
                                {studentProgress.length > 0 ? studentProgress.map(record => (
                                    <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm">
                                        <p className="font-bold text-sky-800 mb-2">{formatDate(record.date)}</p>
                                        <div className="text-sm text-slate-700">
                                            {renderProgressData(record)}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-center p-8">لا يوجد سجل إنجاز لهذا الطالب.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                            <p>اختر طالباً من القائمة لعرض سجله.</p>
                        </div>
                    )}
                </div>
            </div>
             {isReportModalOpen && studentForReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">إرسال تقرير مخصص عن {studentForReport.name}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p>حدد نطاق التاريخ لتجميع التقارير:</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">من تاريخ</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={reportStartDate}
                                        onChange={(e) => setReportStartDate(e.target.value)}
                                        className="mt-1 w-full p-2 border rounded-md bg-white text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={reportEndDate}
                                        onChange={(e) => setReportEndDate(e.target.value)}
                                        className="mt-1 w-full p-2 border rounded-md bg-white text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3">
                            <button onClick={handleCloseReportModal} className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                            <button onClick={handleSendReport} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                                إرسال عبر واتساب
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentRecords;