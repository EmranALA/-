import React, { useState, useRef } from 'react';
import { promotionFeatures as initialFeaturesData, updatePromotionFeatures } from '../data/mockData';
import { PromotionFeature } from '../types';
import { GoogleGenAI, Type } from "@google/genai";


// Icons for categories
const MgmtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const FollowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PaymentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const CustomizationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const featureVisuals = [
  { icon: <MgmtIcon />, color: 'bg-sky-500' },
  { icon: <FollowUpIcon />, color: 'bg-teal-500' },
  { icon: <ReportsIcon />, color: 'bg-amber-500' },
  { icon: <PaymentsIcon />, color: 'bg-indigo-500' },
  { icon: <CustomizationIcon />, color: 'bg-fuchsia-500' }
];

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const PromotionPage: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const [features, setFeatures] = useState<PromotionFeature[]>(initialFeaturesData);
    const [copySuccess, setCopySuccess] = useState('');
    const [updateStatus, setUpdateStatus] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleCopy = () => {
        const textToCopy = features.map(cat => {
            const points = cat.points.map(p => `- ${p}`).join('\n');
            return `*${cat.category}*\n${points}`;
        }).join('\n\n');
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess('تم النسخ بنجاح!');
            setTimeout(() => setCopySuccess(''), 2000);
        }).catch(err => {
            setCopySuccess('فشل النسخ!');
            console.error('Failed to copy: ', err);
        });
    };
    
    const handleGenerateFeatures = async () => {
        setIsGenerating(true);
        setUpdateStatus('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const prompt = `
أنت خبير تسويق متخصص في الترويج للبرامج التعليمية. لديك تطبيق ويب متكامل لإدارة حلقات تحفيظ القرآن الكريم. مهمتك هي إعادة صياغة الميزات الحالية للتطبيق وتحويلها إلى نقاط تسويقية قوية وجذابة باللغة العربية. يجب أن تكون الميزات صادقة وتعكس الوظائف الفعلية للتطبيق.

الوظائف والميزات الحالية للتطبيق هي:
- إدارة المستخدمين بصلاحيات مختلفة (مدير عام، مشرف، معلم، محاسب).
- إدارة الحلقات الدراسية وربطها بالمعلمين والمشرفين.
- إدارة الطلاب (إضافة، تعديل، حذف، استيراد من جداول البيانات).
- متابعة الحضور والغياب اليومي للطلاب.
- تسجيل المحفوظات والمراجعات اليومية لكل طالب.
- نظام نقاط تحفيزي لزيادة المنافسة بين الطلاب.
- إدارة مالية لتتبع حالة السداد (مدفوع، متأخر، غير مدفوع) وتسجيل الدفعات.
- إنشاء تقارير أداء شاملة وتصديرها بصيغة CSV.
- إرسال إشعارات وتنبيهات من المحاسب للمعلمين.
- إمكانية تخصيص الصفحات التي تظهر في القائمة الجانبية لكل دور.
- إمكانية تحديد صلاحية الاطلاع على بيانات الطلاب حسب الجنس (طلاب/طالبات).
- واجهة باللغة العربية ومتجاوبة مع جميع الأجهزة.
- نظام متعدد المؤسسات (كل مؤسسة لها بياناتها الخاصة).

المطلوب:
قم بتوليد قائمة من الميزات التسويقية مقسمة إلى 5 فئات جذابة. يجب أن يكون الناتج بصيغة JSON حصرًا.
`;

            const schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            description: 'اسم الفئة التسويقية (مثال: إدارة شاملة ومتكاملة).',
                        },
                        points: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                            },
                            description: 'قائمة بنقاط الميزات التسويقية لهذه الفئة (3 إلى 5 نقاط).',
                        },
                    },
                    required: ["category", "points"],
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const jsonStr = response.text.trim();
            const generatedFeatures = JSON.parse(jsonStr);
            
            if (Array.isArray(generatedFeatures) && generatedFeatures.length > 0) {
                setFeatures(generatedFeatures);
                setUpdateStatus('تم توليد الميزات! اضغط "تحديث" لحفظها.');
            } else {
                throw new Error("Invalid format received from API.");
            }
        } catch (error) {
            console.error("Error generating features:", error);
            setUpdateStatus('حدث خطأ أثناء توليد الميزات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCategoryChange = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index].category = value;
        setFeatures(newFeatures);
    };

    const handlePointChange = (catIndex: number, pointIndex: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[catIndex].points[pointIndex] = value;
        setFeatures(newFeatures);
    };

    const handleAddPoint = (catIndex: number) => {
        const newFeatures = [...features];
        newFeatures[catIndex].points.push('');
        setFeatures(newFeatures);
    };

    const handleRemovePoint = (catIndex: number, pointIndex: number) => {
        const newFeatures = [...features];
        newFeatures[catIndex].points.splice(pointIndex, 1);
        setFeatures(newFeatures);
    };

    const handleUpdateFeatures = () => {
        setUpdateStatus('جاري الحفظ...');
        updatePromotionFeatures(features);
        setTimeout(() => {
            setUpdateStatus('تم تحديث الميزات بنجاح!');
            setTimeout(() => setUpdateStatus(''), 2500);
        }, 500);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800">صفحة الترويج والتسويق</h2>
                <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
                    استخدم هذا المحتوى لتقديمه للمؤسسات القرآنية والتعليمية لترغيبهم بالاشتراك في النظام.
                </p>
            </div>
            <div className="my-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={handleCopy}
                    className="w-full sm:w-auto px-6 py-3 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all flex items-center justify-center space-x-2 space-x-reverse"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span>{copySuccess ? copySuccess : 'نسخ المحتوى'}</span>
                </button>
                 <button 
                    onClick={handleUpdateFeatures}
                    disabled={isReadOnly}
                    className="w-full sm:w-auto px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:bg-slate-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 11a8.1 8.1 0 00-15.5-2L8.5 12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20v-5h-5M4 13a8.1 8.1 0 0015.5 2L15.5 12" /></svg>
                    <span>{updateStatus || 'تحديث الميزات'}</span>
                </button>
                <button 
                    onClick={handleGenerateFeatures}
                    disabled={isGenerating || isReadOnly}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isGenerating ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    )}
                    <span>{isGenerating ? 'جاري التوليد...' : 'توليد المميزات'}</span>
                </button>
            </div>

            <div ref={contentRef} className="mt-8 space-y-6">
                {features.map((category, catIndex) => (
                    <div key={catIndex} className="bg-slate-50 rounded-xl p-6 flex items-start space-x-4 space-x-reverse border border-slate-200">
                        <div className={`flex-shrink-0 p-3 rounded-full ${featureVisuals[catIndex]?.color}`}>
                            {featureVisuals[catIndex]?.icon}
                        </div>
                        <div className="flex-grow">
                             <input
                                type="text"
                                value={category.category}
                                onChange={(e) => handleCategoryChange(catIndex, e.target.value)}
                                placeholder="عنوان الفئة"
                                readOnly={isReadOnly}
                                className="text-xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-sky-500 focus:outline-none w-full p-1 read-only:bg-slate-100 read-only:border-slate-300"
                            />
                            <ul className="mt-3 space-y-2 text-slate-600">
                                {category.points.map((point, pointIndex) => (
                                    <li key={pointIndex} className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 ml-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <input
                                            value={point}
                                            onChange={(e) => handlePointChange(catIndex, pointIndex, e.target.value)}
                                            placeholder="اكتب الميزة هنا..."
                                            readOnly={isReadOnly}
                                            className="flex-grow bg-white text-slate-900 border rounded-md focus:outline-none w-full p-1 read-only:bg-slate-100"
                                        />
                                        <button onClick={() => !isReadOnly && handleRemovePoint(catIndex, pointIndex)} disabled={isReadOnly} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full disabled:text-slate-400 disabled:hover:bg-transparent">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                             <button onClick={() => !isReadOnly && handleAddPoint(catIndex)} disabled={isReadOnly} className="text-sm text-sky-600 hover:underline mt-3 font-semibold disabled:text-slate-400 disabled:no-underline">
                                + إضافة ميزة جديدة
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromotionPage;