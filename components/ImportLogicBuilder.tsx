import React from 'react';

const ImportLogicBuilder: React.FC = () => {
    return (
        <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 animate-fade-in">
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.363-.448c-.53-.1-1.03.153-1.293.635l-1.422 2.134a2 2 0 01-3.416.015l-1.422-2.134a2 2 0 00-1.293-.635l-2.363-.448a2 2 0 00-1.022.547m13.522 0l-3.522-3.522m-10 0l-3.522 3.522" />
                </svg>
                <h3 className="mt-4 text-xl font-bold text-slate-700">إنشاء منطق استيراد بيانات الطلاب</h3>
                <p className="mt-2 text-slate-500 max-w-lg mx-auto">
                    قريباً... ستتيح لك هذه الميزة إنشاء قوالب استيراد مخصصة. يمكنك تحديد أعمدة جدول البيانات الخاصة بك وربطها بحقول النظام (مثل اسم الطالب، الحلقة، رقم الهاتف، إلخ)، مما يجعل عملية استيراد البيانات أكثر مرونة وسهولة.
                </p>

                <div className="mt-8 opacity-50">
                    <h4 className="font-semibold text-slate-600">مثال على القوالب:</h4>
                    <div className="mt-4 p-4 border rounded-lg bg-white max-w-md mx-auto text-left space-y-2">
                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                            <span className="font-semibold">قالب مدارس الفرقان</span>
                            <span className="text-xs text-slate-500">تم إنشاؤه في 2024-05-20</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                            <span className="font-semibold">قالب دار الأترجة</span>
                            <span className="text-xs text-slate-500">تم إنشاؤه في 2024-04-15</span>
                        </div>
                        <button disabled className="w-full mt-2 py-2 border-2 border-dashed rounded-lg text-slate-400">
                            + إنشاء قالب جديد
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportLogicBuilder;
