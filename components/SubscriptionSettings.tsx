import React, { useState } from 'react';
import { subscriptionPlans as initialPlans, updateSubscriptionPlans } from '../data/mockData';
import { PlanDetails } from '../types';

const SubscriptionSettings: React.FC = () => {
    const [plans, setPlans] = useState<PlanDetails[]>(initialPlans);
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePlanChange = (index: number, field: keyof PlanDetails, value: string | boolean) => {
        setPlans(currentPlans =>
            currentPlans.map((plan, i) => (i === index ? { ...plan, [field]: value } : plan))
        );
    };

    const handleFeatureChange = (planIndex: number, featureIndex: number, value: string) => {
        setPlans(currentPlans =>
            currentPlans.map((plan, i) => {
                if (i === planIndex) {
                    const newFeatures = [...plan.features];
                    newFeatures[featureIndex] = value;
                    return { ...plan, features: newFeatures };
                }
                return plan;
            })
        );
    };
    
    const handleAddFeature = (planIndex: number) => {
         setPlans(currentPlans =>
            currentPlans.map((plan, i) => {
                if (i === planIndex) {
                    return { ...plan, features: [...plan.features, ''] };
                }
                return plan;
            })
        );
    };

    const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
         setPlans(currentPlans =>
            currentPlans.map((plan, i) => {
                if (i === planIndex) {
                    const newFeatures = plan.features.filter((_, idx) => idx !== featureIndex);
                    return { ...plan, features: newFeatures };
                }
                return plan;
            })
        );
    };

    const handleSave = () => {
        // Ensure only one plan is highlighted
        let highlighted = false;
        const sanitizedPlans = plans.map(p => {
            if (p.highlight && !highlighted) {
                highlighted = true;
                return p;
            }
            // Create a new object to avoid mutation issues
            const newPlan = {...p};
            delete newPlan.highlight; // Remove highlight if it's not the first one
            return newPlan;
        });

        updateSubscriptionPlans(sanitizedPlans);
        setPlans(sanitizedPlans); // Update local state too
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold">إدارة خطط الاشتراكات</h2>
                    <p className="text-slate-500 mt-1">التعديلات هنا ستظهر لجميع مدراء المؤسسات في صفحة الاشتراك الخاصة بهم.</p>
                </div>
                <div className="flex items-center self-end md:self-center">
                    {showSuccess && <p className="text-teal-600 font-semibold ml-4">تم حفظ التغييرات!</p>}
                    <button onClick={handleSave} className="px-6 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800">
                        حفظ كل التغييرات
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl border p-6 flex flex-col space-y-4">
                        <h3 className="text-lg font-bold text-center text-sky-800">{plan.name}</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">السعر</label>
                            <input type="text" value={plan.price} onChange={e => handlePlanChange(index, 'price', e.target.value)} className="w-full mt-1 p-2 border bg-white text-slate-900 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">الفترة</label>
                            <input type="text" value={plan.period} onChange={e => handlePlanChange(index, 'period', e.target.value)} className="w-full mt-1 p-2 border bg-white text-slate-900 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">الوصف</label>
                            <textarea value={plan.description} onChange={e => handlePlanChange(index, 'description', e.target.value)} className="w-full mt-1 p-2 border bg-white text-slate-900 rounded-md" rows={2}></textarea>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">الميزات</label>
                            <div className="space-y-2">
                            {plan.features.map((feature, fIndex) => (
                                <div key={fIndex} className="flex items-center gap-2">
                                    <input type="text" value={feature} onChange={e => handleFeatureChange(index, fIndex, e.target.value)} className="flex-grow p-2 border bg-white text-slate-900 rounded-md" />
                                    <button onClick={() => handleRemoveFeature(index, fIndex)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            </div>
                            <button onClick={() => handleAddFeature(index)} className="text-sm text-sky-600 hover:underline mt-2">+ إضافة ميزة</button>
                        </div>
                        <div className="border-t pt-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={plan.highlight || false}
                                    onChange={e => handlePlanChange(index, 'highlight', e.target.checked)}
                                    className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                />
                                <span className="mr-2 text-slate-700">تمييز هذه الخطة (الأكثر شيوعاً)</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SubscriptionSettings;
