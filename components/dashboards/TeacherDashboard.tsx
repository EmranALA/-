import React, { useState, useEffect } from 'react';
import { useAuth, useLabels } from '../../context/AuthContext';
import { students, levels as allLevels, attendanceRecords, accountantAlerts, markAlertAsRead, users, formatDate } from '../../data/mockData';
import { AttendanceStatus, AccountantAlert, Level } from '../../types';

const AlertCard: React.FC<{ 
    alert: AccountantAlert; 
    onDismiss: (id: number) => void; 
    onRemindLater: (id: number) => void;
}> = ({ alert, onDismiss, onRemindLater }) => {
    const senderName = users.find(u => u.id === alert.senderId)?.name || 'النظام';
    
    const handleActionClick = (label: string) => {
        if (label === 'تم الاطلاع') {
            onDismiss(alert.id);
        } else if (label === 'ذكرني لاحقا') {
            onRemindLater(alert.id);
        }
    };

    return (
        <div className="bg-sky-50 border-r-4 border-sky-500 p-4 rounded-lg shadow-lg shadow-sky-100 mb-6 relative animate-fade-in-down">
             <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 left-2 text-slate-400 hover:text-slate-600"
                aria-label="إغلاق الإشعار"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-sky-200/50 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="mr-3 flex-1">
                    <p className="text-sm text-slate-500">
                        <span className="font-semibold">{senderName}</span>
                        <span className="mx-1">•</span>
                        <span>{formatDate(alert.timestamp)}</span>
                    </p>
                    <p className="mt-1 text-slate-800">{alert.message}</p>
                    {alert.actions && alert.actions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {alert.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action.label)}
                                    className="px-4 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 transition-colors shadow-sm"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const { getLabel } = useLabels();
    const myStudents = students.filter(s => s.teacherId === user?.id);
    const today = new Date().toISOString().slice(0, 10);
    const presentToday = attendanceRecords.filter(a => a.date === today && a.status === AttendanceStatus.Present && myStudents.some(s => s.id === a.studentId)).length;
    
    const [myAlerts, setMyAlerts] = useState<AccountantAlert[]>([]);
    const [temporarilyDismissedAlerts, setTemporarilyDismissedAlerts] = useState<number[]>([]);
    const [levels] = useState<Level[]>(allLevels);

    useEffect(() => {
        if(user) {
            const unreadAlerts = accountantAlerts
                .filter(a => a.targetUserIds.includes(user.id) && !a.readByUserIds.includes(user.id))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setMyAlerts(unreadAlerts);
        }
    }, [user]);

    const handleDismissAlert = (alertId: number) => {
        if(user) {
            markAlertAsRead(alertId, user.id);
            setMyAlerts(prevAlerts => prevAlerts.filter(a => a.id !== alertId));
        }
    };

    const handleRemindLater = (alertId: number) => {
        setTemporarilyDismissedAlerts(prev => [...prev, alertId]);
    };

    const visibleAlerts = myAlerts.filter(a => !temporarilyDismissedAlerts.includes(a.id));

    return (
        <div>
            {visibleAlerts.map(alert => (
                <AlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onDismiss={handleDismissAlert} 
                    onRemindLater={handleRemindLater} 
                />
            ))}

            <h2 className="text-3xl font-bold mb-6">{getLabel('dashboard.title.teacher')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50 text-center border-t-4 border-sky-500">
                    <p className="text-slate-500 font-semibold">عدد طلابي</p>
                    <p className="text-5xl font-bold text-sky-700 mt-2">{myStudents.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50 text-center border-t-4 border-teal-500">
                    <p className="text-slate-500 font-semibold">الحضور اليوم</p>
                    <p className="text-5xl font-bold text-teal-600 mt-2">{presentToday}</p>
                </div>
            </div>

        </div>
    );
};

export default TeacherDashboard;
