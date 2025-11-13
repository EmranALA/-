import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
// FIX: Moved Role import to ../types as it is not exported from mockData.
import { subscriptionPlans as allPlans, subscribers, students, users, getPlanLimits, updateSubscriber } from '../data/mockData';
import { PlanDetails, Subscriber, SubscriptionPlan, Role } from '../types';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const PlanFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-center space-x-2 space-x-reverse">
        <CheckIcon />
        <span className="text-slate-600">{children}</span>
    </li>
);

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const Subscription: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);

    const mySubscription = useMemo(() => {
        return subscribers.find(s => s.id === user?.subscriberId);
    }, [user, dataVersion]);

    const plans = useMemo(() => allPlans.map(plan => ({
        ...plan,
        isCurrent: mySubscription?.plan === plan.name,
    })), [mySubscription]);

    const handleChoosePlan = (plan: PlanDetails) => {
        if (!user || !user.subscriberId || !mySubscription) return;

        const currentStudentCount = students.filter(s => s.subscriberId === user.subscriberId).length;
        const currentTeacherCount = users.filter(u => u.subscriberId === user.subscriberId && u.role === Role.Teacher).length;
        const targetPlanLimits = getPlanLimits(plan.name);

        if (currentStudentCount > targetPlanLimits.studentLimit || currentTeacherCount > targetPlanLimits.teacherLimit) {
            alert(`لا يمكنك التحويل إلى باقة "${plan.name}" لأن استخدامك الحالي (${currentStudentCount} طالب, ${currentTeacherCount} معلم) يتجاوز حدود الباقة (${targetPlanLimits.studentLimit} طالب, ${targetPlanLimits.teacherLimit} معلم).`);
            return;
        }

        const currentPlanIndex = allPlans.findIndex(p => p.name === mySubscription.plan);
        const targetPlanIndex = allPlans.findIndex(p => p.name === plan.name);

        if (targetPlanIndex > currentPlanIndex) { // Upgrade
            setSelectedPlan(plan);
            setIsConfirmModalOpen(true);
        } else if (targetPlanIndex < currentPlanIndex) { // Downgrade
            alert(`لتخفيض باقتك، يرجى التواصل مع الدعم الفني.`);
        }
    };

    const handleConfirmUpgrade = () => {
        if (!mySubscription || !selectedPlan) return;

        const updatedSub: Subscriber = { ...mySubscription, plan: selectedPlan.name as SubscriptionPlan };
        updateSubscriber(updatedSub);
        
        setDataVersion(v => v + 1);
        setIsConfirmModalOpen(false);
        setSelectedPlan(null);
        alert('تمت ترقية باقتك بنجاح!');
    };
    
    const UpgradeConfirmationModal = () => {
        if (!isConfirmModalOpen || !selectedPlan) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                    {/* Header */}
                    <div className="p-6 pb-4 border-b flex-shrink-0">
                        <h3 className="text-xl font-bold">تأكيد ترقية الباقة</h3>
                    </div>
                    {/* Content */}
                    <div className="flex-grow overflow-y-auto px-6 py-4">
                        <p className="mb-4 text-slate-600">
                            هل أنت متأكد من رغبتك في الترقية إلى باقة <span className="font-bold text-slate-800">{selectedPlan.name}</span>؟
                        </p>
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                             <h4 className="font-semibold mb-2 text-slate-800">مميزات الباقة الجديدة:</h4>
                             <ul className="space-y-2">
                                 {selectedPlan.features.map((feature, index) => (
                                     <li key={index} className="flex items-center space-x-2 space-x-reverse text-sm">
                                         <CheckIcon />
                                         <span className="text-slate-700">{feature}</span>
                                     </li>
                                 ))}
                             </ul>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-6 pt-4 border-t flex-shrink-0">
                        <div className="flex justify-start space-x-3 space-x-reverse">
                            <button onClick={handleConfirmUpgrade} className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700">نعم، قم بالترقية</button>
                            <button onClick={() => setIsConfirmModalOpen(false)} className="px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">إلغاء</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <UpgradeConfirmationModal />
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800">إدارة الاشتراك والفوترة</h2>
                <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
                    اختر الخطة المناسبة لمؤسستكم لإدارة حلقاتكم وبياناتكم بشكل مستقل.
                    تتيح لك الاشتراكات المدفوعة استخدام النظام ببيانات خاصة بمؤسستكم معزولة تماماً.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div key={plan.name} className={`rounded-xl border p-6 flex flex-col ${plan.isCurrent || plan.highlight ? 'border-sky-500 border-2 shadow-2xl scale-105' : 'border-slate-200'}`}>
                        {plan.isCurrent && (
                            <div className="text-center mb-4">
                                <span className="bg-sky-500 text-white px-4 py-1 rounded-full text-sm font-semibold">خطتك الحالية</span>
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-slate-800 text-center">{plan.name}</h3>
                        <div className="mt-4 text-center">
                            <span className="text-4xl font-extrabold">{plan.price}</span>
                            <span className="text-slate-500">{plan.period}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 text-center h-10">{plan.description}</p>
                        
                        <ul className="mt-6 space-y-3 flex-grow">
                            {plan.features.map(feature => <PlanFeature key={feature}>{feature}</PlanFeature>)}
                        </ul>

                        <button 
                            onClick={() => handleChoosePlan(plan)}
                            disabled={plan.isCurrent || isReadOnly}
                            className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105 ${plan.isCurrent ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-sky-700 text-white hover:bg-sky-800 disabled:bg-slate-400 disabled:cursor-not-allowed'}`}>
                            {plan.isCurrent ? 'أنت على هذه الخطة' : 'اختر الخطة'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Subscription;