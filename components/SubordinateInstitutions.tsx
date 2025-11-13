import React, { useState, useMemo, useEffect } from 'react';
import { 
    subscribers as initialSubscribers, 
    users, 
    students as allStudents, 
    addSubscriber, 
    updateSubscriber, 
    deleteSubscriber, 
    addUser, 
    updateUser, 
    formatDate 
} from '../data/mockData';
import { Subscriber, Role, SubscriptionPlan, SubscriberStatus, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.138l-.515 1.876 1.91.505z" />
    </svg>
);


interface SubscriberFormData extends Partial<Subscriber> {
    adminName?: string;
    adminUsername?: string;
    adminPhoneNumber?: string;
}


const SubordinateInstitutions: React.FC = () => {
    const { user, impersonate } = useAuth();
    
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubscriber, setEditingSubscriber] = useState<SubscriberFormData | null>(null);
    const [formError, setFormError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [subscriberToDeleteId, setSubscriberToDeleteId] = useState<number | null>(null);
    const [dataVersion, setDataVersion] = useState(0);
    
    const refreshSubscribers = () => {
        if (!user || user.role !== Role.ManagerOfInstitutions) {
            setSubscribers([]);
            return;
        };
        const mySubordinates = initialSubscribers.filter(s => s.parentId === user.subscriberId);
        setSubscribers(mySubordinates);
    };

    useEffect(() => {
        refreshSubscribers();
    }, [user, dataVersion]);

    const getPlanBadge = (plan: SubscriptionPlan) => {
        switch (plan) {
            case 'الأساسية': return 'bg-amber-100 text-amber-800';
            case 'المتقدمة': return 'bg-sky-100 text-sky-800';
            case 'المؤسسات': return 'bg-indigo-100 text-indigo-800';
        }
    };

    const getStatusBadge = (status: SubscriberStatus) => {
        return status === 'نشط' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800';
    };
    
    const getAdminDetails = (adminId: number) => users.find(u => u.id === adminId);

    const handleAddNew = () => {
        setFormError('');
        setEditingSubscriber({
            organizationName: '',
            plan: 'الأساسية',
            status: 'نشط',
            joinDate: new Date().toISOString().slice(0, 10),
            adminName: '',
            adminUsername: '',
            adminPhoneNumber: '',
            parentId: user?.subscriberId,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (subscriber: Subscriber) => {
        setFormError('');
        const admin = getAdminDetails(subscriber.adminUserId);
        setEditingSubscriber({
            ...subscriber,
            adminPhoneNumber: admin?.phoneNumber || ''
        });
        setIsModalOpen(true);
    };
    
    const handleDelete = (subscriberId: number) => {
        setSubscriberToDeleteId(subscriberId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (subscriberToDeleteId !== null) {
            deleteSubscriber(subscriberToDeleteId);
            setDataVersion(v => v + 1);
        }
        setIsConfirmModalOpen(false);
        setSubscriberToDeleteId(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSubscriber(null);
        setFormError('');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingSubscriber(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!editingSubscriber) return;

        if (editingSubscriber.id) { // Editing
            const { adminName, adminUsername, adminPhoneNumber, ...subData } = editingSubscriber;
             if (!subData.organizationName) {
                setFormError('يرجى ملء كافة الحقول المطلوبة.');
                return;
            }
            updateSubscriber(subData as Subscriber);
            
            const adminToUpdate = users.find(u => u.id === subData.adminUserId);
            if (adminToUpdate) {
                const updatedAdmin: User = { ...adminToUpdate, phoneNumber: adminPhoneNumber };
                updateUser(updatedAdmin);
            }

        } else { // Adding
            const { organizationName, plan, status, joinDate, adminName, adminUsername, adminPhoneNumber, parentId } = editingSubscriber;
            if (!organizationName || !plan || !status || !joinDate || !adminName || !adminUsername) {
                setFormError('يرجى ملء كافة الحقول المطلوبة لإنشاء المؤسسة ومديرها.');
                return;
            }
            if (users.some(u => u.username.toLowerCase() === adminUsername.toLowerCase())) {
                setFormError('اسم مستخدم المدير موجود بالفعل. يرجى اختيار اسم مستخدم آخر.');
                return;
            }
            
            const newAdmin = addUser({
                name: adminName,
                username: adminUsername,
                role: Role.Admin,
                phoneNumber: adminPhoneNumber
            });

            if (!newAdmin) {
                setFormError('فشل إنشاء حساب المدير.');
                return;
            }

            const newSubscriber = addSubscriber({
                organizationName,
                plan: plan as SubscriptionPlan,
                status: status as SubscriberStatus,
                joinDate,
                adminUserId: newAdmin.id,
                parentId: parentId
            });
            
            const adminToUpdate = users.find(u => u.id === newAdmin.id);
            if(adminToUpdate) {
                const updatedAdmin: User = {...adminToUpdate, subscriberId: newSubscriber.id };
                updateUser(updatedAdmin);
            }
        }
        
        setDataVersion(v => v + 1);
        handleCloseModal();
    };

    const handleLoginAsAdmin = (admin: User) => {
        impersonate(admin, true);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="تأكيد حذف المؤسسة"
                message="هل أنت متأكد من حذف هذه المؤسسة؟ سيتم حذف بياناتها بشكل دائم. لا يمكن التراجع عن هذا الإجراء."
            />
            
            <div>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold">المؤسسات التابعة</h2>
                    <button onClick={handleAddNew} className="flex-1 md:flex-auto px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800">
                        إضافة مؤسسة جديدة
                    </button>
                </div>

                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3">اسم المؤسسة</th>
                                <th className="p-3">الخطة</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3">مدير المؤسسة</th>
                                <th className="p-3">عدد الطلاب</th>
                                <th className="p-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map(sub => {
                                const admin = getAdminDetails(sub.adminUserId);
                                const studentCount = allStudents.filter(s => s.subscriberId === sub.id).length;
                                return (
                                <tr key={sub.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-semibold">{sub.organizationName}</td>
                                    <td className="p-3"><span className={`px-3 py-1 text-sm font-bold rounded-full ${getPlanBadge(sub.plan)}`}>{sub.plan}</span></td>
                                    <td className="p-3"><span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(sub.status)}`}>{sub.status}</span></td>
                                    <td className="p-3">
                                        {admin?.name || 'غير محدد'}
                                        {admin?.phoneNumber && <span className="block text-xs text-slate-500 font-mono" dir="ltr">{admin.phoneNumber}</span>}
                                    </td>
                                    <td className="p-3 text-sm font-semibold">{studentCount}</td>
                                    <td className="p-3 flex items-center gap-2">
                                        {admin && <button onClick={() => handleLoginAsAdmin(admin)} className="px-2 py-1 bg-slate-600 text-white text-xs font-semibold rounded-md hover:bg-slate-700">دخول (قراءة)</button>}
                                        <button onClick={() => handleEdit(sub)} className="text-sky-600 hover:underline text-sm">تعديل</button>
                                        <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:underline text-sm">حذف</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                 <div className="md:hidden space-y-4">
                    {subscribers.map(sub => {
                        const admin = getAdminDetails(sub.adminUserId);
                        const studentCount = allStudents.filter(s => s.subscriberId === sub.id).length;
                        return (
                        <div key={sub.id} className="bg-slate-50 p-4 rounded-lg shadow-sm border">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{sub.organizationName}</h3>
                                 <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusBadge(sub.status)}`}>{sub.status}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                <div>
                                    <p className="text-slate-500">الخطة</p>
                                    <p><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getPlanBadge(sub.plan)}`}>{sub.plan}</span></p>
                                </div>
                                 <div>
                                    <p className="text-slate-500">عدد الطلاب</p>
                                    <p className="font-semibold">{studentCount}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500">مدير المؤسسة</p>
                                    <p className="font-semibold">{admin?.name || 'غير محدد'}</p>
                                </div>
                            </div>
                             <div className="flex justify-end items-center flex-wrap gap-2 mt-4 border-t pt-3">
                                {admin && <button onClick={() => handleLoginAsAdmin(admin)} className="px-3 py-1 bg-slate-600 text-white text-xs font-semibold rounded-md hover:bg-slate-700">دخول (قراءة)</button>}
                                <button onClick={() => handleEdit(sub)} className="text-sky-600 font-semibold text-sm">تعديل</button>
                                <button onClick={() => handleDelete(sub.id)} className="text-red-600 font-semibold text-sm">حذف</button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {isModalOpen && editingSubscriber && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                            <h3 className="text-xl font-bold">{editingSubscriber.id ? 'تعديل بيانات المؤسسة' : 'إضافة مؤسسة جديدة'}</h3>
                        </div>
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8">
                            <form id="subscriber-form" onSubmit={handleSave} className="space-y-4 py-6">
                                <div>
                                    <label className="block mb-2 font-semibold">اسم المؤسسة</label>
                                    <input type="text" name="organizationName" value={editingSubscriber.organizationName || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">خطة الاشتراك</label>
                                    <select name="plan" value={editingSubscriber.plan} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required>
                                        <option value="الأساسية">الأساسية</option>
                                        <option value="المتقدمة">المتقدمة</option>
                                        <option value="المؤسسات">المؤسسات</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="block mb-2 font-semibold">حالة الاشتراك</label>
                                    <select name="status" value={editingSubscriber.status} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required>
                                        <option value="نشط">نشط</option>
                                        <option value="غير نشط">غير نشط</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="block mb-2 font-semibold">تاريخ الانضمام</label>
                                    <input type="date" name="joinDate" value={editingSubscriber.joinDate || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required />
                                </div>

                                <hr className="my-4"/>

                                {editingSubscriber.id ? (
                                    <>
                                        <div>
                                            <label className="block mb-2 font-semibold">مدير المؤسسة الحالي</label>
                                            <input type="text" value={getAdminDetails(editingSubscriber.adminUserId!)?.name || ''} className="w-full p-2 border rounded bg-slate-100" readOnly />
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-semibold">رقم هاتف المدير (مع رمز الدولة)</label>
                                            <input type="tel" name="adminPhoneNumber" value={editingSubscriber.adminPhoneNumber || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" placeholder="966501234567" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-bold text-lg text-slate-700">إنشاء حساب المدير</h4>
                                        <div>
                                            <label className="block mb-2 font-semibold">اسم مدير المؤسسة</label>
                                            <input type="text" name="adminName" value={editingSubscriber.adminName || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required />
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-semibold">اسم المستخدم للمدير (انجليزي)</label>
                                            <input type="text" name="adminUsername" value={editingSubscriber.adminUsername || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" required />
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-semibold">رقم هاتف المدير (مع رمز الدولة)</label>
                                            <input type="tel" name="adminPhoneNumber" value={editingSubscriber.adminPhoneNumber || ''} onChange={handleFormChange} className="w-full p-2 border rounded bg-white text-slate-900" placeholder="966501234567" />
                                        </div>
                                    </>
                                )}
                               
                                {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-300 rounded-lg hover:bg-slate-400">إلغاء</button>
                                <button type="submit" form="subscriber-form" className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800">حفظ</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default SubordinateInstitutions;