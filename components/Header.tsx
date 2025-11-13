import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserAvatar: React.FC<{ name: string }> = ({ name }) => {
    const initial = name.charAt(0).toUpperCase();
    return (
        <div className="w-10 h-10 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
            {initial}
        </div>
    );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user, originalUser, logout, stopImpersonating, isReadOnly } = useAuth();

    return (
        <header id="app-header" className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/80 sticky top-0 z-10 flex flex-col">
            {originalUser && (
                <div className="bg-amber-400 text-black text-center py-1.5 px-4 text-sm font-bold w-full animate-fade-in-down">
                    أنت تتصفح كـ <span className="underline decoration-wavy">{user?.name}</span>
                    {isReadOnly && <span className="font-bold text-red-700 mx-2">(وضع القراءة فقط)</span>}. 
                    <button onClick={stopImpersonating} className="underline hover:text-slate-800 font-black mr-4">العودة إلى حسابي</button>
                </div>
            )}
            <div className="p-3 sm:p-4 flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden text-slate-600 hover:text-sky-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="flex items-center gap-3">
                        {user?.name && <UserAvatar name={user.name} />}
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-slate-800">مرحباً, {user?.name}</h1>
                            <p className="hidden md:block text-sm text-slate-500">صلاحيتك: {user?.role}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4 space-x-reverse">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                    >
                        <span className="hidden sm:inline">تسجيل الخروج</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;