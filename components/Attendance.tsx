import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useLabels } from '../context/AuthContext';
import { 
    students as allStudents, 
    attendanceRecords as initialAttendance, 
    progressRecords as initialProgress, 
    halaqat as allHalaqat, 
    formatDate, 
    getStudyPlanConfigurationsForTeacher, 
    findStudyPlanDataRecord, 
    getUniqueRecallValuesForField, 
    updateStudentRecallIdentifier, 
    users as allUsers,
    saveBatchData
} from '../data/mockData';
import { Student, AttendanceStatus, StudyPlanConfiguration, Halaqa, ProgressRecord, StudyPlanField, Role } from '../types';

// Icons
const PresentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const AbsentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ExcusedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;

const Attendance: React.FC<{isReadOnly?: boolean}> = ({isReadOnly}) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();
    const isSupervisor = user?.role === Role.Supervisor;
    const isAdmin = user?.role === Role.Admin || user?.role === Role.DeputyManager;
    
    const [myHalaqat, setMyHalaqat] = useState<Halaqa[]>([]);
    const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dataVersion, setDataVersion] = useState(0);
    const [openStudentId, setOpenStudentId] = useState<number | null>(null);

    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [progress, setProgress] = useState<Record<number, Record<string, string>>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const today = new Date().toISOString().slice(0, 10);

    const myStudents = useMemo(() => {
        if (!user) return [];
        let studentsForUser: Student[];

        if (isAdmin) {
            studentsForUser = allStudents.filter(s => s.subscriberId === user.subscriberId);
        } else if (isSupervisor) {
            const supervisedHalaqaIds = new Set(allHalaqat.filter(h => h.supervisorId === user.id).map(h => h.id));
            studentsForUser = allStudents.filter(s => s.halaqaId && supervisedHalaqaIds.has(s.halaqaId));
        } else { // Teacher
            studentsForUser = allStudents.filter(s => s.teacherId === user.id);
        }

        if (user.viewableGenders && user.viewableGenders.length > 0) {
            studentsForUser = studentsForUser.filter(student => user.viewableGenders!.includes(student.gender));
        }
        return studentsForUser;
    }, [user, isSupervisor, isAdmin, dataVersion]);
    
    useEffect(() => {
        const relevantHalaqat = allHalaqat.filter(h => {
            const teacherIds = new Set(myStudents.map(s => s.teacherId));
            return h.teacherIds.some(tid => teacherIds.has(tid));
        });
        setMyHalaqat(relevantHalaqat);
        if(relevantHalaqat.length > 0 && selectedHalaqaId === 'all') {
            setSelectedHalaqaId(String(relevantHalaqat[0].id));
        }
    }, [myStudents, selectedHalaqaId]);

    useEffect(() => {
        const initialAtt: Record<number, AttendanceStatus> = {};
        const initialProg: Record<number, Record<string, string>> = {};
        initialAttendance.forEach(a => {
            if (a.date === today) {
                initialAtt[a.studentId] = a.status;
            }
        });
        initialProgress.forEach(p => {
             if (p.date === today && p.progressData) {
                try {
                    initialProg[p.studentId] = JSON.parse(p.progressData);
                } catch(e) {
                    console.error("Failed to parse progress data", e);
                }
            }
        });
        setAttendance(initialAtt);
        setProgress(initialProg);
        setHasUnsavedChanges(false);
    }, [today, selectedHalaqaId]);


    const filteredStudents = useMemo(() => {
        let studentsToList = myStudents;
        if (selectedHalaqaId !== 'all') {
            studentsToList = studentsToList.filter(s => s.halaqaId === parseInt(selectedHalaqaId));
        }
        if (searchTerm) {
            return studentsToList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return studentsToList;
    }, [myStudents, selectedHalaqaId, searchTerm]);

    const activeStudyPlan = useMemo(() => {
        if (!user) return null;
        // This is a simplification. A more complex app might need to find the plan based on student/halaqa.
        const plans = getStudyPlanConfigurationsForTeacher(user.id);
        return plans.length > 0 ? plans[0] : null;
    }, [user]);

    const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
        setAttendance(prev => ({...prev, [studentId]: status}));
        setHasUnsavedChanges(true);
    };
    
    const handleProgressChange = (studentId: number, fieldId: string, value: string) => {
        setProgress(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [fieldId]: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveChanges = () => {
        saveBatchData(attendance, progress, today);
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    const getAttendanceButtonClass = (studentId: number, status: AttendanceStatus) => {
        const base = 'px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors text-sm font-semibold';
        const isActive = attendance[studentId] === status;
        switch (status) {
            case AttendanceStatus.Present: return `${base} ${isActive ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-teal-100'}`;
            case AttendanceStatus.Absent: return `${base} ${isActive ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-red-100'}`;
            case AttendanceStatus.Excused: return `${base} ${isActive ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-amber-100'}`;
        }
    };
    
    if (!activeStudyPlan) {
        return (
             <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <h3 className="text-xl font-semibold text-slate-700">لا توجد خطة دراسية</h3>
                <p className="text-slate-500 mt-2">لم يقم المشرف بتعيين خطة دراسية لك بعد. يرجى التواصل مع المشرف المسؤول.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold">{getLabel('page.title.attendance')}</h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <select value={selectedHalaqaId} onChange={e => setSelectedHalaqaId(e.target.value)} className="w-full p-2 border rounded-md shadow-sm bg-white text-slate-900">
                        {myHalaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
            </div>

            <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md bg-white text-slate-900" />
            
            <div className="space-y-3">
                {filteredStudents.map(student => (
                    <div key={student.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                         <div className="p-4 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setOpenStudentId(openStudentId === student.id ? null : student.id)}>
                            <span className="font-bold text-lg">{student.name}</span>
                            <div className="flex items-center gap-2 mt-3 md:mt-0">
                                <button className={getAttendanceButtonClass(student.id, AttendanceStatus.Present)} onClick={(e) => {e.stopPropagation(); handleAttendanceChange(student.id, AttendanceStatus.Present)}} disabled={isReadOnly}><PresentIcon /> <span>حاضر</span></button>
                                <button className={getAttendanceButtonClass(student.id, AttendanceStatus.Absent)} onClick={(e) => {e.stopPropagation(); handleAttendanceChange(student.id, AttendanceStatus.Absent)}} disabled={isReadOnly}><AbsentIcon /> <span>غائب</span></button>
                                <button className={getAttendanceButtonClass(student.id, AttendanceStatus.Excused)} onClick={(e) => {e.stopPropagation(); handleAttendanceChange(student.id, AttendanceStatus.Excused)}} disabled={isReadOnly}><ExcusedIcon /> <span>معذور</span></button>
                            </div>
                        </div>
                        {openStudentId === student.id && (
                             <div className="p-4 border-t bg-slate-50 animate-fade-in">
                                 {activeStudyPlan.groups.map(group => (
                                    <div key={group.id} className="mb-4">
                                        <p className="font-bold text-slate-700 border-b pb-1 mb-2">{group.label}</p>
                                        {group.subGroups.map(sg => (
                                            <div key={sg.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2 pl-2">
                                                {sg.fields.map(field => (
                                                    <div key={field.id}>
                                                        <label className="text-sm text-slate-600">{field.label}</label>
                                                        <input 
                                                            type="text" 
                                                            value={progress[student.id]?.[field.id] || ''}
                                                            onChange={e => handleProgressChange(student.id, field.id, e.target.value)}
                                                            className="w-full p-1.5 border rounded-md text-sm bg-white text-slate-900"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasUnsavedChanges && !isReadOnly && (
                <div className="fixed bottom-0 right-0 left-0 md:left-64 p-4 bg-white/80 backdrop-blur-lg border-t z-10 animate-fade-in-up">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        {saveSuccess ? (
                            <p className="font-semibold text-teal-600">تم الحفظ بنجاح!</p>
                        ) : (
                            <p className="font-semibold text-sky-800">لديك تغييرات غير محفوظة.</p>
                        )}
                        <button
                            onClick={handleSaveChanges}
                            className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 shadow-md transform hover:scale-105 transition-all"
                        >
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;