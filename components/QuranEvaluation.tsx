import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { students as allStudents, halaqat as allHalaqat, getStudyPlanConfigurationsForTeacher, updateStudentProgressField } from '../data/mockData';
import { getVerses } from '../data/quranData';
import { Halaqa, Student, StudyPlanGroup } from '../types';

const QuranEvaluation: React.FC = () => {
    const { user } = useAuth();
    const today = new Date().toISOString().slice(0, 10);
    
    const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedEvaluationItem, setSelectedEvaluationItem] = useState<string>('');
    
    const [fromSurah, setFromSurah] = useState('');
    const [fromAyah, setFromAyah] = useState('');
    const [toSurah, setToSurah] = useState('');
    const [toAyah, setToAyah] = useState('');

    const [versesText, setVersesText] = useState('سيظهر النص القرآني هنا بعد تحديد النطاق والضغط على "عرض الآيات".');
    const [mistakeCount, setMistakeCount] = useState(0);
    const [lahnCount, setLahnCount] = useState(0);

    const myHalaqat = useMemo(() => {
        if (!user) return [];
        return allHalaqat.filter(h => h.teacherIds.includes(user.id));
    }, [user]);

    const studentsInHalaqa = useMemo(() => {
        if (!selectedHalaqaId) return [];
        return allStudents.filter(s => s.halaqaId === parseInt(selectedHalaqaId));
    }, [selectedHalaqaId]);

    const activeStudyPlan = useMemo(() => {
        if (!user) return null;
        const plans = getStudyPlanConfigurationsForTeacher(user.id);
        return plans.length > 0 ? plans[0] : null;
    }, [user]);

    const evaluationItems: StudyPlanGroup[] = useMemo(() => {
        return activeStudyPlan?.groups || [];
    }, [activeStudyPlan]);
    
    useEffect(() => {
        if (myHalaqat.length > 0 && !selectedHalaqaId) {
            setSelectedHalaqaId(String(myHalaqat[0].id));
        }
    }, [myHalaqat]);

    useEffect(() => {
        setSelectedStudentId('');
        setSelectedEvaluationItem('');
    }, [selectedHalaqaId]);

    // Auto-fetch verses based on student's plan
    useEffect(() => {
        const student = allStudents.find(s => s.id === parseInt(selectedStudentId));
        if (!student || !selectedEvaluationItem || !activeStudyPlan) return;

        const evalGroup = activeStudyPlan.groups.find(g => g.id === selectedEvaluationItem);
        if (!evalGroup) return;

        const recallFields = evalGroup.subGroups.flatMap(sg => sg.fields.filter(f => f.isRecallIdentifier));
        const studentRecallData = student.recallIdentifiers || {};
        const recallFieldIds = recallFields.map(f => f.id);
        const hasMatchingData = recallFieldIds.every(id => studentRecallData[id]);

        if (hasMatchingData) {
            const surahField = recallFields.find(f => f.label.includes('السورة'));
            const fromAyahField = recallFields.find(f => f.label.includes('من آية'));
            const toAyahField = recallFields.find(f => f.label.includes('إلى آية'));

            if (surahField && fromAyahField && toAyahField) {
                const fs = studentRecallData[surahField.id];
                const fa = studentRecallData[fromAyahField.id];
                const ta = studentRecallData[toAyahField.id];

                setFromSurah(fs);
                setFromAyah(fa);
                setToSurah(fs); // Assume same surah for simplicity in recall
                setToAyah(ta);

                const text = getVerses(fs, parseInt(fa), fs, parseInt(ta));
                setVersesText(text);
                setMistakeCount(0);
                setLahnCount(0);
            }
        }
    }, [selectedStudentId, selectedEvaluationItem, activeStudyPlan]);

    const handleFetchVerses = () => {
        if (!fromSurah || !fromAyah) {
            setVersesText("يرجى ملء حقلي 'من سورة' و 'من آية' على الأقل.");
            return;
        }
        
        const fSurah = fromSurah.trim();
        const fAyah = parseInt(fromAyah);
        const tSurah = toSurah.trim() || fSurah;
        const tAyah = toAyah ? parseInt(toAyah) : undefined;

        const text = getVerses(fSurah, fAyah, tSurah, tAyah);
        setVersesText(text);
        setMistakeCount(0);
        setLahnCount(0);
    };

    const handleMistake = () => {
        if (!selectedStudentId || !selectedEvaluationItem) return;
        const newCount = mistakeCount + 1;
        setMistakeCount(newCount);
        
        const fieldId = `mistakes_${selectedEvaluationItem}`;
        updateStudentProgressField(parseInt(selectedStudentId), today, fieldId, String(newCount));
    };

    const handleLahn = () => {
        if (!selectedStudentId || !selectedEvaluationItem) return;
        const newCount = lahnCount + 1;
        setLahnCount(newCount);

        const fieldId = `lahns_${selectedEvaluationItem}`;
        updateStudentProgressField(parseInt(selectedStudentId), today, fieldId, String(newCount));
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">مصحف تقييم الطالب</h2>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحلقة</label>
                    <select value={selectedHalaqaId} onChange={e => setSelectedHalaqaId(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                        <option value="">-- اختر حلقة --</option>
                        {myHalaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب</label>
                    <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md" disabled={!selectedHalaqaId}>
                        <option value="">-- اختر طالباً --</option>
                        {studentsInHalaqa.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">بند التقييم</label>
                    <select value={selectedEvaluationItem} onChange={e => setSelectedEvaluationItem(e.target.value)} className="w-full p-2 border bg-white text-slate-900 rounded-md">
                        <option value="">-- اختر بنداً --</option>
                        {evaluationItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Ayah Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-slate-50 rounded-lg border">
                 <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">من:</label>
                    <div className="flex gap-2">
                        <input type="text" value={fromSurah} onChange={e => setFromSurah(e.target.value)} placeholder="السورة" className="w-2/3 p-2 border bg-white text-slate-900 rounded-md" />
                        <input type="number" value={fromAyah} onChange={e => setFromAyah(e.target.value)} placeholder="الآية" className="w-1/3 p-2 border bg-white text-slate-900 rounded-md" />
                    </div>
                </div>
                 <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">إلى:</label>
                    <div className="flex gap-2">
                        <input type="text" value={toSurah} onChange={e => setToSurah(e.target.value)} placeholder="السورة (اختياري)" className="w-2/3 p-2 border bg-white text-slate-900 rounded-md" />
                        <input type="number" value={toAyah} onChange={e => setToAyah(e.target.value)} placeholder="الآية (اختياري)" className="w-1/3 p-2 border bg-white text-slate-900 rounded-md" />
                    </div>
                </div>
                <div className="md:col-span-1">
                     <button onClick={handleFetchVerses} className="w-full px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800">
                        عرض الآيات
                    </button>
                </div>
            </div>

            {/* Quran Display & Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-amber-50 p-6 rounded-lg border-2 border-amber-200 overflow-y-auto w-full max-w-3xl mx-auto aspect-[2/3]">
                    <p className="text-2xl leading-loose text-slate-800 whitespace-pre-wrap text-justify" style={{ fontFamily: "'Amiri', 'Cairo', serif" }}>
                        {versesText}
                    </p>
                </div>
                <div className="lg:col-span-1 flex flex-row lg:flex-col gap-4">
                    <div className="bg-red-100 border border-red-200 p-4 rounded-lg text-center flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-md font-bold text-red-800">الأخطاء</p>
                            <p className="text-4xl lg:text-5xl font-mono font-bold text-red-700 my-2 lg:my-4">{mistakeCount}</p>
                        </div>
                        <button onClick={handleMistake} className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">
                            + خطأ
                        </button>
                    </div>
                     <div className="bg-indigo-100 border border-indigo-200 p-4 rounded-lg text-center flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-md font-bold text-indigo-800">اللحن</p>
                            <p className="text-4xl lg:text-5xl font-mono font-bold text-indigo-700 my-2 lg:my-4">{lahnCount}</p>
                        </div>
                        <button onClick={handleLahn} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                            + لحن
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuranEvaluation;