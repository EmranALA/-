import React, { useState, useMemo, useEffect } from 'react';
import { 
    subscribers, 
    users, 
    students as allStudents, 
    subscriptionPlans,
    studentClassifications,
    updateSubscriber,
    addStudent,
    deleteStudent,
    formatDate,
} from '../data/mockData';
import { Subscriber, Student, Gender } from '../types';

interface SubscriberDetailsProps {
    subscriberId: number;
    onBack: () => void;
}

const SubscriberDetails: React.FC<SubscriberDetailsProps> = ({ subscriberId, onBack }) => {
    const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
    const [students, setStudents] = useState<Student[]>(() => allStudents.filter(s => s.subscriberId === subscriberId));
    const [customPrice, setCustomPrice] = useState<string>('');
    const [newStudentName, setNewStudentName] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        const sub = subscribers.find(s => s.id === subscriberId);
        if (sub) {
            setSubscriber(sub);
            setCustomPrice(sub.customPrice?.toString() || '');
        }
    }, [subscriberId]);

    const admin = useMemo(() => subscriber ? users.find(u => u.id === subscriber.adminUserId) : null, [subscriber]);
    
    const freeStudentClassification = useMemo(() => studentClassifications.find(sc => sc.defaultAmount === 0), []);

    const freeStudents = useMemo(() => {
        if (!freeStudentClassification) return [];
        return students.filter(s => s.classificationId === freeStudentClassification.id);
    }, [students, freeStudentClassification]);

    const planDetails = useMemo(() => {
        if (!subscriber) return null;
        return subscriptionPlans.find(p => p.name === subscriber.plan);
    }, [subscriber]);

    const handlePriceSave = () => {
        if (!subscriber) return;
        
        const priceValue = customPrice.trim() === '' ? undefined : Number(customPrice);

        if (priceValue !== undefined && isNaN(priceValue)) {
            setSaveStatus('السعر يجب أن يكون رقماً.');
            setTimeout(() => setSaveStatus(''), 3000);
            return;
        }

        const updatedSub: Subscriber = { ...subscriber, customPrice: priceValue };
        updateSubscriber(updatedSub);
        setSubscriber(updatedSub); // update local state
        setSaveStatus('تم حفظ السعر بنجاح!');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleAddFreeStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName.trim() || !subscriber || !freeStudentClassification) {
            alert('يرجى إدخال اسم الطالب.');
            return;
        }

        const newStudent = addStudent({
            name: newStudentName,
            gender: Gender.Male, // Default
            levelId: 1, // Default
            subscriberId: subscriber.id,
            classificationId: freeStudentClassification.id,
        });

        if (newStudent) {
            setStudents(prev => [...prev, newStudent]);
            alert(`تم إضافة الطالب "${newStudentName}" بنجاح.`);
            setNewStudentName('');
        } else {
            alert('فشل في إضافة الطالب. قد تكون وصلت للحد الأقصى.');
        }
    };
    
    if (!subscriber || !planDetails) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <button onClick={onBack} className="mb-4 px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">→ عودة</button>
                <p>جاري تحميل بيانات المؤسسة...</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
            <div>
                 <button onClick={onBack} className="mb-4 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    <span>عودة إلى القائمة</span>
                 </button>
                <h2 className="text-3xl font-bold text-slate-800">{subscriber.organizationName}</h2>
            </div>
            
            {/* Plan and Price Management */}
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold mb-4">إدارة الباقة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-slate-500">الباقة الحالية</p>
                        <p className="text-lg font-semibold">{subscriber.plan}</p>
                    </div>
                     <div>
                        <p className="text-sm text-slate-500">السعر الأساسي للباقة</p>
                        <p className="text-lg font-semibold">{planDetails.price}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">السعر المخصص لهذه المؤسسة (ريال)</label>
                        <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            placeholder="اترك الحقل فارغاً لاستخدام السعر الأساسي"
                            className="w-full p-2 border bg-white text-slate-900 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button onClick={handlePriceSave} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800">
                           حفظ السعر المخصص
                        </button>
                        {saveStatus && <p className="text-sm text-teal-600 mr-4 animate-fade-in">{saveStatus}</p>}
                    </div>
                </div>
            </div>

             {/* Free Students Management */}
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm border">
                 <h3 className="text-xl font-bold mb-4">طلاب المنحة (مجاناً)</h3>
                <div className="mb-6">
                    <form onSubmit={handleAddFreeStudent} className="flex flex-col sm:flex-row gap-2">
                         <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="اسم الطالب الجديد"
                            className="flex-grow p-2 border bg-white text-slate-900 rounded-md"
                        />
                        <button type="submit" className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700">
                           إضافة طالب منحة
                        </button>
                    </form>
                </div>
                
                <h4 className="font-semibold mb-2">قائمة طلاب المنحة ({freeStudents.length})</h4>
                 <div className="max-h-60 overflow-y-auto border rounded-md">
                     {freeStudents.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                            {freeStudents.map(student => (
                                <li key={student.id} className="p-3 flex justify-between items-center bg-white">
                                    <span className="font-medium">{student.name}</span>
                                    <span className="text-sm text-slate-500">{formatDate(new Date().toISOString())}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-slate-500">لا يوجد طلاب منحة مضافون حالياً.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default SubscriberDetails;
