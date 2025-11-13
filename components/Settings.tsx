import React, { useState, useEffect } from 'react';
import { getSidebarConfig, saveSidebarConfig, getDateFormat, saveDateFormat, getLabels, saveLabels, initialLabels } from '../data/mockData';
import { Role, DateFormat, SidebarConfig } from '../types';
import { useAuth, useLabels } from '../context/AuthContext';


// Data and constants for the settings page
const ALL_MANAGEABLE_PAGES = [
    { id: 'attendance', label: 'متابعة الطلاب' },
    { id: 'lessonPrep', label: 'تحضير الدروس' },
    { id: 'studentRecords', label: 'سجلات الطلاب' },
    { id: 'teacherPayments', label: 'مدفوعات طلابي' },
    { id: 'reports', label: 'التقارير' },
    { id: 'students', label: 'إدارة الطلاب' },
    { id: 'halaqat', label: 'إدارة الحلقات' },
    { id: 'planApprovals', label: 'خطط للاعتماد' },
    { id: 'supervisoryVisits', label: 'الزيارات الإشرافية' },
    { id: 'studyPlans', label: 'إدارة الخطط الدراسية' },
    { id: 'users', label: 'إدارة المستخدمين' },
    { id: 'payments', label: 'المدفوعات' },
    { id: 'accountant', label: 'لوحة المحاسب' },
    { id: 'subscription', label: 'الاشتراك' },
    { id: 'settings', label: 'إعدادات النظام' },
];

// FIX: Add missing Role.ManagerOfInstitutions to satisfy Record<Role, string[]> type
const BASE_PERMISSIONS: Record<Role, string[]> = {
    [Role.Admin]: ALL_MANAGEABLE_PAGES.map(p => p.id),
    [Role.AppManager]: [], // Not configurable through this interface for itself
    [Role.ManagerOfInstitutions]: [], // Not configurable through this interface
    [Role.DeputyManager]: ['attendance', 'reports', 'students', 'halaqat', 'supervisoryVisits', 'studyPlans', 'users', 'payments', 'accountant', 'settings'],
    [Role.Supervisor]: ['attendance', 'reports', 'students', 'halaqat', 'planApprovals', 'supervisoryVisits', 'studyPlans'],
    [Role.Teacher]: ['attendance', 'lessonPrep', 'studentRecords', 'teacherPayments', 'reports', 'supervisoryVisits'],
    [Role.Accountant]: ['students', 'payments'],
};

const CONFIGURABLE_ROLES = [Role.DeputyManager, Role.Supervisor, Role.Teacher, Role.Accountant];

const getRoleName = (role: Role) => {
    // FIX: Add missing Role.ManagerOfInstitutions to satisfy Record<Role, string> type
    const names: Record<Role, string> = {
        [Role.Admin]: 'المدير العام',
        [Role.DeputyManager]: 'نائب المدير',
        [Role.Supervisor]: 'المشرف',
        [Role.Teacher]: 'المعلم',
        [Role.Accountant]: 'المحاسب',
        [Role.AppManager]: 'مدير التطبيق',
        [Role.ManagerOfInstitutions]: 'مدير مؤسسات',
    };
    return names[role] || role;
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
    id: string;
    label: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}> = ({ id, label, checked, onChange, disabled }) => (
    <label htmlFor={id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${disabled ? 'bg-slate-200 cursor-not-allowed' : 'bg-white hover:bg-sky-50'}`}>
        <span className={`font-medium ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
        <div className="relative">
            <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
            <div className={`block w-12 h-6 rounded-full transition-colors ${checked && !disabled ? 'bg-sky-600' : 'bg-slate-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const Settings: React.FC<{isReadOnly: boolean}> = ({isReadOnly}) => {
    const { user } = useAuth();
    const { getLabel } = useLabels();
    const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>(getSidebarConfig());
    const [dateFormat, setDateFormat] = useState<DateFormat>(getDateFormat());
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (role: Role, pageId: string) => {
        setSidebarConfig(prev => {
            const newConfig = { ...prev };
            const basePermissions = BASE_PERMISSIONS[role].filter(p => ALL_MANAGEABLE_PAGES.some(ap => ap.id === p));
            
            // If config is null, it means default is used. Start from base permissions.
            const currentPermissions = prev[role] === null ? [...basePermissions] : [...prev[role]!];
            
            const newPermissions = currentPermissions.includes(pageId)
                ? currentPermissions.filter(p => p !== pageId)
                : [...currentPermissions, pageId];
            
            newConfig[role] = newPermissions;
            return newConfig;
        });
    };

    const handleSave = () => {
        if(isReadOnly) {
            alert("أنت في وضع القراءة فقط. لا يمكن حفظ التغييرات.");
            return;
        }
        setIsSaving(true);
        saveSidebarConfig(sidebarConfig);
        saveDateFormat(dateFormat);

        window.dispatchEvent(new CustomEvent('settings-updated'));

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setIsSaving(false);
        }, 2500);
    };

    const renderRoleSettings = (role: Role) => {
        const currentPermissions = sidebarConfig[role];
        const basePermissions = BASE_PERMISSIONS[role].filter(p => ALL_MANAGEABLE_PAGES.some(ap => ap.id === p));
        const effectivePermissions = currentPermissions === null ? basePermissions : currentPermissions;
        const isFocusMode = role === Role.Admin && user?.role === Role.Admin;

        return (
            <div className="p-6">
                <p className="text-sm text-slate-500 mb-4">
                    {isFocusMode ? '✨ وضع التركيز: يمكنك إخفاء الصفحات لتبسيط واجهتك.' : 'اختر الصفحات التي ستظهر في القائمة الجانبية لهذا الدور.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-100 p-4 rounded-lg">
                    {ALL_MANAGEABLE_PAGES.map(page => {
                        const isBasePermission = BASE_PERMISSIONS[role].includes(page.id);
                        
                        // Disable settings toggle for:
                        // 1. Admin editing their own view (unless it's AppManager)
                        // 2. Deputy Manager editing their own view
                        const isDisabled = page.id === 'settings' && (
                            (role === Role.Admin && user?.role !== Role.AppManager) || 
                            (role === Role.DeputyManager && user?.role === Role.DeputyManager)
                        );
                        
                        if (!isBasePermission && !isFocusMode && user?.role !== Role.AppManager) {
                           return null;
                        }
                        
                        return (
                            <ToggleSwitch
                                key={page.id}
                                id={`${role}-${page.id}`}
                                label={page.label}
                                checked={effectivePermissions.includes(page.id) || isDisabled}
                                onChange={() => handlePermissionChange(role, page.id)}
                                disabled={isDisabled}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800">{getLabel('page.title.settings')}</h2>
                <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
                    تحكم في إعدادات التطبيق العامة وصلاحيات الوصول للقائمة الجانبية لكل دور.
                </p>
            </div>

            <details className="bg-white rounded-xl shadow-lg border-t-4 border-sky-500 open:shadow-xl transition-shadow" open>
                <summary className="p-6 cursor-pointer text-xl font-bold text-sky-800">الإعدادات العامة</summary>
                <div className="px-6 pb-6">
                    <label className="block font-semibold text-slate-700">نظام التاريخ المستخدم</label>
                    <div className="mt-3 flex items-center gap-2 p-1 rounded-lg bg-slate-100 max-w-xs">
                        <button
                            onClick={() => setDateFormat('gregorian')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${dateFormat === 'gregorian' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-600'}`}
                        >
                            ميلادي
                        </button>
                        <button
                            onClick={() => setDateFormat('hijri')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${dateFormat === 'hijri' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-600'}`}
                        >
                            هجري
                        </button>
                    </div>
                </div>
            </details>
            
            <h3 className="text-2xl font-bold text-center text-slate-800 pt-4">صلاحيات القائمة الجانبية</h3>

            {user?.role === Role.AppManager && (
                 <details className="bg-white rounded-xl shadow-lg border-t-4 border-indigo-500 transition-shadow" open>
                    <summary className="p-6 cursor-pointer text-xl font-bold text-indigo-800">{getRoleName(Role.Admin)}</summary>
                    {renderRoleSettings(Role.Admin)}
                </details>
            )}

            {CONFIGURABLE_ROLES.map((role) => (
                <details key={role} className="bg-white rounded-xl shadow-lg border-t-4 border-slate-200 transition-shadow">
                    <summary className="p-6 cursor-pointer text-xl font-bold text-slate-800">{getRoleName(role)}</summary>
                    {renderRoleSettings(role)}
                </details>
            ))}
            
            <div className="fixed bottom-0 right-0 left-0 md:left-64 p-4 bg-white/80 backdrop-blur-lg border-t z-20">
                <div className="max-w-7xl mx-auto flex justify-end items-center">
                    {showSuccess && (
                         <div className="flex items-center gap-2 text-teal-600 font-semibold animate-fade-in mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            <span>تم الحفظ بنجاح!</span>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isReadOnly}
                        className="px-8 py-3 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all transform hover:scale-105 shadow-lg disabled:bg-slate-400 disabled:cursor-wait"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ وتطبيق التغييرات'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

export const LabelCustomization: React.FC<{isReadOnly: boolean}> = ({isReadOnly}) => {
    const [labels, setLabels] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    
    useEffect(() => {
        setLabels(getLabels());
    }, []);

    const handleLabelChange = (key: string, value: string) => {
        setLabels(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
         if(isReadOnly) {
            alert("أنت في وضع القراءة فقط. لا يمكن حفظ التغييرات.");
            return;
        }
        saveLabels(labels);
        setSaveStatus('تم حفظ المسميات بنجاح!');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleReset = () => {
        if (confirm('هل أنت متأكد من رغبتك في استعادة جميع المسميات إلى حالتها الافتراضية؟')) {
            if(isReadOnly) {
                alert("أنت في وضع القراءة فقط. لا يمكن حفظ التغييرات.");
                return;
            }
            setLabels(initialLabels);
            saveLabels(initialLabels); // Also save the reset
            setSaveStatus('تمت استعادة المسميات الافتراضية.');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };
    
    // Group labels for better UI
    const groupedLabels = Object.keys(labels).reduce((acc, key) => {
        const group = key.split('.')[0] || 'general';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(key);
        return acc;
    }, {} as Record<string, string[]>);

    const filteredGroups = Object.keys(groupedLabels)
        .filter(group => 
            searchTerm === '' || 
            group.toLowerCase().includes(searchTerm.toLowerCase()) ||
            groupedLabels[group].some(key => 
                key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (labels[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold">تخصيص المسميات</h2>
            <p className="text-slate-500">تحكم في أسماء الصفحات، التبويبات، واللوحات التي تظهر في النظام.</p>
            
            <input 
                type="text"
                placeholder="ابحث عن مسمى أو مفتاح..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-md bg-white text-slate-900"
            />

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {filteredGroups.map(groupKey => (
                     <div key={groupKey} className="p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-bold capitalize text-lg text-sky-800 border-b pb-2 mb-3">{groupKey}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupedLabels[groupKey]
                                .filter(key => 
                                    searchTerm === '' ||
                                    key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (labels[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(key => (
                                <div key={key}>
                                    <label className="block text-xs text-slate-500 font-mono">{key}</label>
                                    <input 
                                        type="text"
                                        value={labels[key] || ''}
                                        onChange={e => handleLabelChange(key, e.target.value)}
                                        className="w-full p-2 border bg-white text-slate-900 rounded-md mt-1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                 {saveStatus && <p className="text-teal-600 font-semibold">{saveStatus}</p>}
                 <button onClick={handleReset} className="px-5 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-amber-400">
                    استعادة الافتراضي
                </button>
                <button onClick={handleSave} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-sky-400">
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
};
