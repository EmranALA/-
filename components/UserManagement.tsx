import React, { useState, useEffect } from 'react';
import { users as initialUsers, halaqat, addUser, updateUser, deleteUser, teacherClassifications as allTeacherClassifications, addTeacherClassification, updateTeacherClassification, deleteTeacherClassification } from '../data/mockData';
import { Role, User, Gender, TeacherClassification } from '../types';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';

const ALL_MANAGEABLE_PAGES = [
    { id: 'attendance', label: 'متابعة الطلاب' },
    { id: 'students', label: 'إدارة الطلاب' },
    { id: 'halaqat', label: 'إدارة الحلقات' },
    { id: 'users', label: 'إدارة المستخدمين' },
    { id: 'reports', label: 'التقارير' },
    { id: 'payments', label: 'المدفوعات' },
    { id: 'accountant', label: 'لوحة المحاسب' },
    { id: 'subscription', label: 'الاشتراك' },
];

const BASE_PERMISSIONS: { [key in Role]?: string[] } = {
    [Role.Teacher]: ['dashboard', 'chat', 'profile', 'attendance', 'reports'],
    [Role.Supervisor]: ['dashboard', 'chat', 'profile', 'attendance', 'reports', 'students', 'halaqat'],
    [Role.Accountant]: ['dashboard', 'chat', 'profile', 'payments', 'students'],
    [Role.DeputyManager]: ['dashboard', 'chat', 'profile', 'attendance', 'reports', 'students', 'halaqat', 'users', 'payments', 'accountant'],
    [Role.Admin]: ALL_MANAGEABLE_PAGES.map(p => p.id).concat(['dashboard', 'chat', 'profile']),
};

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const UserManagement: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        if (user) {
            setUsers(initialUsers.filter(u => u.role !== Role.AppManager && u.subscriberId === user.subscriberId));
        } else {
            setUsers([]);
        }
    }, [user]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<Omit<User, 'id' | 'extraPermissions'>>({ name: '', username: '', role: Role.Teacher, classificationIds: [] });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [error, setError] = useState('');

    const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
    const [classifications, setClassifications] = useState<TeacherClassification[]>([]);
    const [editingClassification, setEditingClassification] = useState<Partial<TeacherClassification> | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);


     useEffect(() => {
        if (user) {
            setClassifications(allTeacherClassifications.filter(tc => tc.subscriberId === user.subscriberId));
        }
    }, [user, isClassificationModalOpen]);


    const getRoleStyle = (role: Role) => {
        switch (role) {
            case Role.Admin: return 'bg-sky-100 text-sky-800';
            case Role.DeputyManager: return 'bg-fuchsia-100 text-fuchsia-800';
            case Role.Supervisor: return 'bg-teal-100 text-teal-800';
            case Role.Teacher: return 'bg-amber-100 text-amber-800';
            case Role.Accountant: return 'bg-indigo-100 text-indigo-800';
            case Role.AppManager: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const getAssignmentInfo = (user: User) => {
      if (user.role === Role.DeputyManager) {
        return 'صلاحيات إدارية';
      }
      if (user.role === Role.Supervisor) {
        return `يشرف على ${halaqat.filter(h => h.supervisorId === user.id).length} حلقات`;
      }
      if (user.role === Role.Teacher) {
        return `يدرّس في ${halaqat.filter(h => h.teacherIds.includes(user.id)).length} حلقات`;
      }
       if (user.role === Role.Accountant) {
        return `وصول لبيانات المدفوعات`;
      }
      return 'صلاحيات كاملة';
    };

    // Add User Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newUser.name || !newUser.username || !newUser.role) {
            setError('يرجى ملء جميع الحقول.');
            return;
        }
        if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
            setError('اسم المستخدم موجود بالفعل.');
            return;
        }
        const addedUser = addUser({ ...newUser, subscriberId: user?.subscriberId });
        if (addedUser) {
            setUsers(initialUsers.filter(u => u.role !== Role.AppManager && u.subscriberId === user?.subscriberId));
            setIsAddModalOpen(false);
            setNewUser({ name: '', username: '', role: Role.Teacher, classificationIds: [] });
        } else {
            setError('لا يمكن إضافة المزيد من المعلمين. لقد وصلت إلى الحد الأقصى المسموح به في باقة اشتراكك.');
        }
    };

    // Edit User Handlers
    const handleEditClick = (user: User) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
        setError('');
    };
    
    const handleDeleteUser = (id: number) => {
        setUserToDeleteId(id);
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDeleteUser = () => {
        if (userToDeleteId) {
            deleteUser(userToDeleteId);
            setUsers(prev => prev.filter(u => u.id !== userToDeleteId));
        }
        setIsConfirmModalOpen(false);
        setUserToDeleteId(null);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingUser(prev => prev ? { ...prev, [name]: value } as User : null);
    };

    const handleGenderPermissionChange = (gender: Gender) => {
        setEditingUser(prev => {
            if (!prev) return null;
            const currentPermissions = prev.viewableGenders || [];
            if (currentPermissions.includes(gender)) {
                return { ...prev, viewableGenders: currentPermissions.filter(g => g !== gender) };
            } else {
                return { ...prev, viewableGenders: [...currentPermissions, gender] };
            }
        });
    };
    
    const handleExtraPermissionChange = (pageId: string) => {
        setEditingUser(prev => {
            if (!prev) return null;
            const currentPermissions = prev.extraPermissions || [];
            if (currentPermissions.includes(pageId)) {
                return { ...prev, extraPermissions: currentPermissions.filter(p => p !== pageId) };
            } else {
                return { ...prev, extraPermissions: [...currentPermissions, pageId] };
            }
        });
    };

    const handleClassificationToggle = (classificationId: number) => {
        setEditingUser(prev => {
            if (!prev) return null;
            const currentIds = prev.classificationIds || [];
            const newIds = currentIds.includes(classificationId)
                ? currentIds.filter(id => id !== classificationId)
                : [...currentIds, classificationId];
            return { ...prev, classificationIds: newIds };
        });
    };


    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!editingUser) return;
        if (users.some(u => u.username.toLowerCase() === editingUser.username.toLowerCase() && u.id !== editingUser.id)) {
            setError('اسم المستخدم موجود بالفعل.');
            return;
        }
        updateUser(editingUser);
        setUsers(initialUsers.filter(u => u.role !== Role.AppManager && u.subscriberId === user?.subscriberId));
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    // Teacher Classification Handlers
    const handleOpenClassificationModal = (classification: Partial<TeacherClassification> | null) => {
        setEditingClassification(classification || { name: '' });
        setIsClassificationModalOpen(true);
    };

    const handleCloseClassificationModal = () => {
        setEditingClassification(null);
        setIsClassificationModalOpen(false);
    };
    
    const handleSaveClassification = () => {
        if (!editingClassification || !editingClassification.name || !user?.subscriberId) {
            alert('يرجى إدخال اسم التصنيف.');
            return;
        }
        if (editingClassification.id) {
            updateTeacherClassification(editingClassification as TeacherClassification);
        } else {
            addTeacherClassification({ ...editingClassification, subscriberId: user.subscriberId } as Omit<TeacherClassification, 'id'>);
        }
        setClassifications([...allTeacherClassifications.filter(tc => tc.subscriberId === user.subscriberId)]);
        handleCloseClassificationModal();
    };

    const handleDeleteClassification = (id: number) => {
        if (confirm(`هل أنت متأكد من حذف هذا التصنيف؟ سيتم إزالته من جميع المعلمين المرتبطين به.`)) {
            deleteTeacherClassification(id);
             setClassifications([...allTeacherClassifications.filter(tc => tc.subscriberId === user?.subscriberId)]);
        }
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDeleteUser}
                title="تأكيد حذف المستخدم"
                message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => setIsClassificationModalOpen(true)} disabled={isReadOnly} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                        إدارة تصنيفات المعلمين
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} disabled={isReadOnly} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-slate-400">
                        إضافة مستخدم جديد
                    </button>
                </div>
            </div>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3">الاسم</th>
                            <th className="p-3">اسم المستخدم</th>
                            <th className="p-3">الصلاحية</th>
                            <th className="p-3">المهام</th>
                            <th className="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="p-3 font-semibold">{user.name}</td>
                                <td className="p-3 font-mono text-slate-600">{user.username}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleStyle(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-3">{getAssignmentInfo(user)}</td>
                                <td className="p-3 space-x-4 space-x-reverse">
                                    <button onClick={() => handleEditClick(user)} className="text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline" disabled={[Role.Admin, Role.AppManager].includes(user.role) || isReadOnly}>
                                        تعديل
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:underline disabled:text-slate-400 disabled:no-underline" disabled={[Role.Admin, Role.AppManager].includes(user.role) || isReadOnly}>
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {users.map(user => (
                    <div key={user.id} className="bg-slate-50 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{user.name}</h3>
                                <p className="text-sm font-mono text-slate-600">{user.username}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleStyle(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">
                            <p>{getAssignmentInfo(user)}</p>
                        </div>
                        <div className="mt-3 text-right space-x-4 space-x-reverse">
                            <button onClick={() => handleEditClick(user)} className="text-sky-600 font-semibold text-sm disabled:text-slate-400" disabled={[Role.Admin, Role.AppManager].includes(user.role) || isReadOnly}>
                                تعديل
                            </button>
                             <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 font-semibold text-sm disabled:text-slate-400" disabled={[Role.Admin, Role.AppManager].includes(user.role) || isReadOnly}>
                                حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            {/* Add User Modal */}
            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                            <h3 className="text-xl font-bold">إضافة مستخدم جديد</h3>
                        </div>
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8">
                            <form id="add-user-form" onSubmit={handleSaveUser} className="space-y-4 py-6">
                                <div>
                                    <label className="block mb-2 font-semibold">الاسم الكامل</label>
                                    <input type="text" name="name" value={newUser.name} onChange={handleInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">اسم المستخدم (باللغة الإنجليزية)</label>
                                    <input type="text" name="username" value={newUser.username} onChange={handleInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">الصلاحية</label>
                                    <select name="role" value={newUser.role} onChange={handleInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required>
                                        <option value={Role.DeputyManager}>نائب مدير</option>
                                        <option value={Role.Supervisor}>مشرف</option>
                                        <option value={Role.Teacher}>معلم</option>
                                        <option value={Role.Accountant}>محاسب</option>
                                    </select>
                                </div>
                                 {error && <p className="text-red-500 text-sm">{error}</p>}
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                                <button type="submit" form="add-user-form" className="px-5 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800">حفظ المستخدم</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
            
            {/* Edit User Modal */}
            {isEditModalOpen && editingUser && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                             <h3 className="text-xl font-bold">تعديل المستخدم: {editingUser.name}</h3>
                        </div>
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8">
                            <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4 py-6">
                                <div>
                                    <label className="block mb-2 font-semibold">الاسم الكامل</label>
                                    <input type="text" name="name" value={editingUser.name} onChange={handleEditInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">اسم المستخدم</label>
                                    <input type="text" name="username" value={editingUser.username} onChange={handleEditInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required />
                                </div>
                                <div>
                                    <label className="block mb-2 font-semibold">الصلاحية</label>
                                    <select name="role" value={editingUser.role} onChange={handleEditInputChange} className="w-full p-2 border bg-white text-slate-900 rounded-md" required>
                                        <option value={Role.DeputyManager}>نائب مدير</option>
                                        <option value={Role.Supervisor}>مشرف</option>
                                        <option value={Role.Teacher}>معلم</option>
                                        <option value={Role.Accountant}>محاسب</option>
                                    </select>
                                </div>
                                {editingUser.role === Role.Teacher && (
                                    <div>
                                        <label className="block mb-2 font-semibold">تصنيفات المعلم</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md bg-white">
                                            {classifications.map(c => (
                                                <label key={c.id} className="flex items-center p-1 rounded-md hover:bg-slate-100">
                                                    <input 
                                                        type="checkbox"
                                                        checked={editingUser.classificationIds?.includes(c.id) ?? false}
                                                        onChange={() => handleClassificationToggle(c.id)}
                                                        className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                                    />
                                                    <span className="mr-2 text-slate-700">{c.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                 <hr/>
                                 <div>
                                    <label className="block mb-2 font-semibold">صلاحية الاطلاع على بيانات الطلاب</label>
                                    <div className="flex items-center space-x-4 space-x-reverse">
                                         <label className="flex items-center">
                                            <input type="checkbox"
                                                checked={editingUser.viewableGenders?.includes(Gender.Male) ?? false}
                                                onChange={() => handleGenderPermissionChange(Gender.Male)}
                                                className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                            />
                                            <span className="mr-2 text-slate-700">الطلاب (ذكور)</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox"
                                                checked={editingUser.viewableGenders?.includes(Gender.Female) ?? false}
                                                onChange={() => handleGenderPermissionChange(Gender.Female)}
                                                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                            />
                                            <span className="mr-2 text-slate-700">الطالبات (إناث)</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">إذا لم يتم تحديد أي خيار، فسيتمكن المستخدم من رؤية الجنسين.</p>
                                 </div>
                                 <hr/>
                                 <div>
                                    <label className="block mb-2 font-semibold">صلاحيات إضافية للصفحات</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {ALL_MANAGEABLE_PAGES
                                            .filter(page => !(BASE_PERMISSIONS[editingUser.role] || []).includes(page.id))
                                            .map(page => (
                                                <label key={page.id} className="flex items-center p-1 rounded-md hover:bg-slate-100">
                                                    <input type="checkbox"
                                                        checked={editingUser.extraPermissions?.includes(page.id) ?? false}
                                                        onChange={() => handleExtraPermissionChange(page.id)}
                                                        className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                                    />
                                                    <span className="mr-2 text-slate-700">{page.label}</span>
                                                </label>
                                            ))
                                        }
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        اختر الصفحات الإضافية التي يمكن لهذا المستخدم الوصول إليها.
                                    </p>
                                 </div>
                                 {error && <p className="text-red-500 text-sm">{error}</p>}
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                                <button type="submit" form="edit-user-form" className="px-5 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800">تحديث المستخدم</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {/* Teacher Classification Modal */}
            {isClassificationModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh] max-h-[750px]">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b flex-shrink-0">
                            <h3 className="text-xl font-bold">إدارة تصنيفات المعلمين</h3>
                        </div>
                        {/* Content */}
                        <div className="flex-grow overflow-y-auto px-8 py-6">
                            <div className="space-y-2 mb-4">
                               {classifications.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                        <p className="font-semibold">{c.name}</p>
                                        <div className="space-x-2 space-x-reverse">
                                            <button onClick={() => handleOpenClassificationModal(c)} className="text-sky-600 hover:underline text-sm">تعديل</button>
                                            <button onClick={() => handleDeleteClassification(c.id)} className="text-red-600 hover:underline text-sm">حذف</button>
                                        </div>
                                    </div>
                               ))}
                            </div>
                            <hr/>
                            <div className="mt-4">
                                <h4 className="font-bold mb-2">{editingClassification?.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h4>
                                 <div className="flex gap-2 items-center">
                                    <input 
                                        type="text"
                                        value={editingClassification?.name || ''}
                                        onChange={(e) => setEditingClassification(p => p ? {...p, name: e.target.value} : null)}
                                        placeholder="اسم التصنيف..."
                                        className="flex-grow p-2 border rounded-md bg-white text-slate-900"
                                    />
                                    <button onClick={handleSaveClassification} className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800">حفظ</button>
                                    {editingClassification?.id && <button onClick={() => setEditingClassification(null)} className="px-4 py-2 bg-slate-200 rounded-md">جديد</button>}
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-8 pt-4 border-t flex-shrink-0">
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsClassificationModalOpen(false)} className="px-5 py-2 bg-slate-300 rounded-lg hover:bg-slate-400">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;