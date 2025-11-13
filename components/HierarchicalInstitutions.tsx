import React, { useState, useMemo } from 'react';
import { 
    subscribers as initialSubscribers, 
    users, 
    students as allStudents
} from '../data/mockData';
import { Subscriber, User } from '../types';
import { useAuth } from '../context/AuthContext';

// Icons
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const StudentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 004.773-9.805A4 4 0 0012 12a4 4 0 00-4.773 2.195M15 21a6 6 0 00-9-5.197" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;

const HierarchicalInstitutions: React.FC = () => {
    const { impersonate } = useAuth();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const parentInstitutions = useMemo(() => {
        const childrenMap = new Map<number, Subscriber[]>();
        initialSubscribers.forEach(sub => {
            if (sub.parentId) {
                if (!childrenMap.has(sub.parentId)) {
                    childrenMap.set(sub.parentId, []);
                }
                childrenMap.get(sub.parentId)!.push(sub);
            }
        });

        return initialSubscribers
            .filter(s => !s.parentId && childrenMap.has(s.id))
            .map(parent => {
                const children = childrenMap.get(parent.id) || [];
                const allSubIds = [parent.id, ...children.map(c => c.id)];
                
                const totalUsers = users.filter(u => u.subscriberId && allSubIds.includes(u.subscriberId)).length;
                const totalStudents = allStudents.filter(s => s.subscriberId && allSubIds.includes(s.subscriberId)).length;
                const admin = users.find(u => u.id === parent.adminUserId);

                return {
                    ...parent,
                    children,
                    totalUsers,
                    totalStudents,
                    admin
                };
            });
    }, []);

    const handleToggle = (id: number) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">المؤسسات والفروع</h2>
            <p className="text-slate-500">عرض المؤسسات الرئيسية والمراكز أو الأفرع التابعة لها.</p>
            
            <div className="space-y-4">
                {parentInstitutions.map(parent => (
                    <div key={parent.id} className="border rounded-lg overflow-hidden transition-all duration-300">
                        <button onClick={() => handleToggle(parent.id)} className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center text-right">
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-sky-800">{parent.organizationName}</h3>
                                <div className="flex items-center gap-6 mt-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <UsersIcon />
                                        <span>{parent.totalUsers} مستخدم</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StudentsIcon />
                                        <span>{parent.totalStudents} طالب</span>
                                    </div>
                                    {parent.admin?.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                            <PhoneIcon />
                                            <span className="font-mono" dir="ltr">{parent.admin.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`transform transition-transform ${expandedId === parent.id ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon />
                            </div>
                        </button>

                        {expandedId === parent.id && (
                            <div className="p-4 bg-white border-t animate-fade-in">
                                <h4 className="font-semibold mb-3 text-slate-700">الأفرع والمراكز التابعة:</h4>
                                <div className="space-y-3">
                                    {parent.children.map(child => {
                                        const childAdmin = users.find(u => u.id === child.adminUserId);
                                        const childStudentCount = allStudents.filter(s => s.subscriberId === child.id).length;
                                        return (
                                            <div key={child.id} className="flex justify-between items-center p-3 bg-slate-100 rounded-md">
                                                <div>
                                                    <p className="font-semibold">{child.organizationName}</p>
                                                    <p className="text-xs text-slate-500">المدير: {childAdmin?.name || 'N/A'} | الطلاب: {childStudentCount}</p>
                                                </div>
                                                {childAdmin && (
                                                    <button onClick={() => impersonate(childAdmin)} className="px-3 py-1 bg-slate-600 text-white text-xs font-semibold rounded-md hover:bg-slate-700">
                                                        الدخول كمدير
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {parent.children.length === 0 && <p className="text-sm text-slate-500">لا توجد أفرع تابعة لهذه المؤسسة.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HierarchicalInstitutions;