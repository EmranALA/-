import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const testUsers = [
  { name: 'مدير عام', username: 'admin' },
  { name: 'نائب المدير', username: 'deputy_manager' },
  { name: 'مشرف', username: 'supervisor_khalid' },
  { name: 'معلم', username: 'teacher_saeed' },
  { name: 'محاسب', username: 'accountant' },
];

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleVisitorLogin = (visitorUsername: string) => {
    login(visitorUsername);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-sky-100/50 border animate-scale-in">
        <div>
          <h2 className="text-3xl font-bold text-center text-slate-800">تسجيل الدخول</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            مرحباً بك في نظام إدارة الحلقات القرآنية
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">اسم المستخدم</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              الدخول
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowRoleSelection(true)}
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              أو الدخول كزائر
            </button>
          </div>
        </form>
      </div>

      {showRoleSelection && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg p-8 sm:p-10 space-y-8 bg-white rounded-3xl shadow-2xl text-center animate-scale-in relative">
            <button onClick={() => setShowRoleSelection(false)} className="absolute top-4 right-4 text-slate-500 hover:text-sky-700 font-semibold flex items-center gap-1">
              <span>إغلاق</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h1 className="text-3xl font-bold text-slate-800 pt-8">الدخول كزائر</h1>
            <p className="text-slate-600 text-lg">اختر دورًا لتسجيل الدخول التجريبي</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {testUsers.map((testUser) => (
                <button
                  key={testUser.username}
                  onClick={() => handleVisitorLogin(testUser.username)}
                  className="w-full px-4 py-3 text-md font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-sky-100 hover:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg"
                >
                  {testUser.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;