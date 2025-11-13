

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, updateUser } from '../data/mockData';

// FIX: Add `isReadOnly` prop to fix compilation errors in MainContent.tsx.
const Profile: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!user) {
        return <div>لم يتم العثور على المستخدم.</div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password && password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        
        const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== user.id);
        if (usernameExists) {
             setError('اسم المستخدم هذا مستخدم بالفعل.');
            return;
        }

        const updatedUser = {
            ...user,
            name,
            username
        };
        
        updateUser(updatedUser);

        // To reflect changes in the auth context, we can re-login the user.
        // In a real app, you might get a new token or just update the context directly.
        login(username); 

        if (password) {
            // Password change logic would go here. For mock data, we just show a message.
             setMessage('تم تحديث البيانات وكلمة المرور بنجاح.');
        } else {
             setMessage('تم تحديث البيانات بنجاح.');
        }

        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">الملف الشخصي</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm read-only:bg-slate-100"
                        required
                        readOnly={isReadOnly}
                    />
                </div>
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">اسم المستخدم</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm read-only:bg-slate-100"
                        required
                        readOnly={isReadOnly}
                    />
                </div>
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700">الصلاحية</label>
                    <input
                        type="text"
                        id="role"
                        value={user.role}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm"
                    />
                </div>

                <hr/>
                
                <h3 className="text-lg font-semibold text-slate-700">تغيير كلمة المرور (اختياري)</h3>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">كلمة المرور الجديدة</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm read-only:bg-slate-100"
                        readOnly={isReadOnly}
                    />
                </div>
                 <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">تأكيد كلمة المرور الجديدة</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm read-only:bg-slate-100"
                        readOnly={isReadOnly}
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {message && <p className="text-green-600 text-sm">{message}</p>}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isReadOnly}
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
                    >
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;