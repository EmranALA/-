import React, { useState, useMemo } from 'react';
import { students, progressRecords, attendanceRecords, levels, studyPlanConfigurations } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const Reports: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

    const getVisibleStudents = () => {
        let visible = students;

        if (user?.role === Role.Teacher) {
            visible = students.filter(s => s.teacherId === user.id);
        } else if(user?.subscriberId) {
             visible = students.filter(s => s.subscriberId === user.subscriberId);
        }
        
        if (user?.viewableGenders && user.viewableGenders.length > 0) {
            visible = visible.filter(student => user.viewableGenders!.includes(student.gender));
        }

        return visible;
    };
    
    const visibleStudents = getVisibleStudents();

    const getLevelName = (levelId: number) => levels.find(l => l.id === levelId)?.name || 'غير محدد';

    const getFilteredRecords = (records: any[], studentId: number) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure the end day is inclusive

        return records.filter(r => {
            const rDate = new Date(r.date);
            return r.studentId === studentId && rDate >= start && rDate <= end;
        });
    };
    
    const escapeCsvCell = (cell: any): string => {
        const cellStr = String(cell ?? '').replace(/"/g, '""');
        return `"${cellStr}"`;
    };

    const exportToCSV = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Dynamically determine headers from progress data
        const allFields = new Map<string, string>(); // id -> label
        const recordsInRange = progressRecords.filter(r => {
            const rDate = new Date(r.date);
            return visibleStudents.some(s => s.id === r.studentId) && rDate >= start && rDate <= end;
        });

        recordsInRange.forEach(record => {
            if (record.progressData) {
                try {
                    const data = JSON.parse(record.progressData);
                    const plan = studyPlanConfigurations.find(p => p.id === record.planConfigId);
                    const planFields = plan?.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields)) || [];
                    
                    Object.keys(data).forEach(fieldId => {
                        if (!allFields.has(fieldId)) {
                            const field = planFields.find(f => f.id === fieldId);
                            allFields.set(fieldId, field?.label || fieldId);
                        }
                    });
                } catch (e) {}
            }
        });

        const sortedFields = Array.from(allFields.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        const fieldHeaders = sortedFields.map(f => f[1]);
        const fieldIds = sortedFields.map(f => f[0]);
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        csvContent += ["التاريخ", "اسم الطالب", "حالة الحضور", ...fieldHeaders, "حفظ (قديم)", "مراجعة (قديم)"].map(escapeCsvCell).join(',') + "\n";
        
        const activities = new Map<string, { date: string; studentName: string; attendance: string; progressData?: Record<string, any>; legacyMemorized?: string; legacyRevised?: string }>();

        const allRecords = [
            ...progressRecords.map(p => ({...p, type: 'progress'})),
            ...attendanceRecords.map(a => ({...a, type: 'attendance'}))
        ];

        allRecords.forEach(record => {
             const pDate = new Date(record.date);
             if (pDate >= start && pDate <= end) {
                const student = visibleStudents.find(s => s.id === record.studentId);
                if (student) {
                    const key = `${record.date}-${record.studentId}`;
                    if (!activities.has(key)) {
                        activities.set(key, { date: record.date, studentName: student.name, attendance: 'لم يسجل' });
                    }
                    const activity = activities.get(key)!;

                    if (record.type === 'attendance') {
                        activity.attendance = (record as any).status;
                    } else if (record.type === 'progress') {
                        let progressData: Record<string, any> = {};
                        if ((record as any).progressData) {
                            try {
                                progressData = JSON.parse((record as any).progressData);
                            } catch (e) {}
                        }
                        activity.progressData = progressData;
                        activity.legacyMemorized = (record as any).memorized;
                        activity.legacyRevised = (record as any).revised;
                    }
                }
            }
        });

        const sortedActivities = Array.from(activities.values()).sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            if (a.studentName < b.studentName) return -1;
            if (a.studentName > b.studentName) return 1;
            return 0;
        });

        sortedActivities.forEach(activity => {
            const progressValues = fieldIds.map(id => activity.progressData?.[id] || '');
            const row = [
                activity.date,
                activity.studentName,
                activity.attendance,
                ...progressValues,
                activity.legacyMemorized,
                activity.legacyRevised,
            ].map(escapeCsvCell).join(',');
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">إنشاء التقارير</h2>
            <p className="mb-6 text-slate-600">
                حدد المدة الزمنية ثم قم بإنشاء تقارير لأداء الطلاب وتصديرها.
            </p>
             <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-slate-50">
                <div className="flex-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white text-slate-900" />
                </div>
                <div className="flex-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md bg-white text-slate-900" />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={exportToCSV}
                        className="w-full md:w-auto px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        تصدير لـ Google Sheets (CSV)
                    </button>
                </div>
            </div>
            
            <div className="mt-8">
                 <h3 className="text-xl font-bold mb-4">ملخص التقرير للفترة المحددة</h3>
                {/* Desktop Table */}
                 <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3">الطالب</th>
                                <th className="p-3">المستوى</th>
                                <th className="p-3">أيام الحضور</th>
                                <th className="p-3">أيام التسميع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map(student => (
                                <tr key={student.id} className="border-b">
                                    <td className="p-3 font-semibold">{student.name}</td>
                                    <td className="p-3 text-slate-600">{getLevelName(student.levelId)}</td>
                                    <td className="p-3">{getFilteredRecords(attendanceRecords, student.id).filter(r => r.status === 'حاضر').length}</td>
                                    <td className="p-3">{getFilteredRecords(progressRecords, student.id).length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {visibleStudents.map(student => (
                        <div key={student.id} className="bg-slate-50 p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-lg">{student.name}</h3>
                            <p className="text-sm text-slate-500">{getLevelName(student.levelId)}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <p className="text-slate-500 text-xs">حضور</p>
                                    <p className="font-semibold">{getFilteredRecords(attendanceRecords, student.id).filter(r => r.status === 'حاضر').length}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">تسميع</p>
                                    <p className="font-semibold">{getFilteredRecords(progressRecords, student.id).length}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;