import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    teacherClassifications as allTeacherClassifications, 
    saveStudyPlanConfiguration, 
    getStudyPlanConfigurationsForSubscriber, 
    getStudyPlanDataForPlan, 
    saveStudyPlanDataForPlan,
    addTeacherClassification,
    updateTeacherClassification,
    deleteTeacherClassification,
    users as allUsers,
    updateUser,
    halaqat,
    deleteStudyPlanConfiguration
} from '../data/mockData';
import { StudyPlanConfiguration, StudyPlanGroup, StudyPlanSubGroup, StudyPlanField, StudyPlanDataRecord, TeacherClassification, User, Role } from '../types';
import ConfirmationModal from './ConfirmationModal';

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Icons ---
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 hover:text-sky-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;

// --- Plan Templates ---
const PLAN_TEMPLATES: { name: string, description: string, config: Partial<StudyPlanConfiguration> }[] = [
    {
        name: 'خطة الحفظ والمراجعة',
        description: 'قالب معياري لمتابعة الحفظ الجديد، المراجعة القريبة، والمراجعة البعيدة للطالب.',
        config: {
            name: 'خطة الحفظ والمراجعة',
            groups: [
              { id: 'g1', label: 'الحفظ الجديد (السبق)', subGroups: [
                  { id: 'sg1', label: 'بيانات الدرس', fields: [
                      { id: 'f1', label: 'السورة', isRecallIdentifier: true },
                      { id: 'f2', label: 'من آية', isRecallIdentifier: true },
                      { id: 'f3', label: 'إلى آية', isRecallIdentifier: true },
                  ]},
                  { id: 'sg2', label: 'تقييم الحفظ', fields: [ { id: 'f4', label: 'التقييم' }, { id: 'f5', label: 'عدد الأخطاء' } ]}
              ]},
              { id: 'g2', label: 'المراجعة', subGroups: [
                  { id: 'sg3', label: 'المراجعة القريبة', fields: [ { id: 'f6', label: 'المقدار' }, { id: 'f7', label: 'التقييم' } ]},
                  { id: 'sg4', label: 'المراجعة البعيدة', fields: [ { id: 'f8', label: 'المقدار' }, { id: 'f9', label: 'التقييم' } ]}
              ]}
            ],
        },
    },
    {
        name: 'خطة التقييم المبسطة',
        description: 'قالب بسيط ومباشر لتقييم الدرس اليومي فقط، مناسب للحلقات التمهيدية.',
        config: {
            name: 'خطة التقييم المبسطة',
            groups: [
                { id: 'g1', label: 'درس اليوم', subGroups: [
                    { id: 'sg1', label: 'بيانات الدرس', fields: [
                        { id: 'f1', label: 'السورة' }, { id: 'f2', label: 'المقدار' }
                    ]},
                    { id: 'sg2', label: 'التقييم', fields: [
                        { id: 'f3', label: 'التقييم العام' }, { id: 'f4', label: 'ملاحظات' }
                    ]}
                ]}
            ]
        },
    },
    {
        name: 'خطة تقييم التجويد والأداء',
        description: 'قالب يركز على تقييم جوانب التجويد والأداء الصوتي أثناء التلاوة.',
        config: {
            name: 'خطة تقييم التجويد والأداء',
            groups: [
                { id: 'g1', label: 'تلاوة الدرس', subGroups: [
                    { id: 'sg1', label: '', fields: [
                        { id: 'f1', label: 'المقدار المتلو' }, { id: 'f2', label: 'تقييم التلاوة' }
                    ]}
                ]},
                { id: 'g2', label: 'ملاحظات الأداء', subGroups: [
                    { id: 'sg2', label: '', fields: [
                        { id: 'f3', label: 'ملاحظة تجويدية' }, { id: 'f4', label: 'ملاحظة على الأداء الصوتي' }
                    ]}
                ]}
            ]
        }
    }
];

const cloneWithNewIds = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(cloneWithNewIds);
    }
    if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (key === 'id' && typeof obj[key] === 'string' && obj[key].startsWith('id_')) {
                newObj[key] = generateId();
            } else {
                newObj[key] = cloneWithNewIds(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

// --- Modals ---
const TemplateSelectionModal: React.FC<{onSelect: (template: Partial<StudyPlanConfiguration> | null) => void, onClose: () => void}> = ({ onSelect, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all animate-scale-in">
            <div className="p-6 text-center border-b">
                <h3 className="text-2xl font-bold text-slate-800">إنشاء خطة دراسية جديدة</h3>
                <p className="text-slate-500 mt-1">اختر قالبًا كنقطة انطلاق، أو ابدأ من الصفر.</p>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <button onClick={() => onSelect(null)} className="p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-slate-600 hover:bg-slate-50 hover:border-sky-500 hover:text-sky-700 transition-colors">
                    <AddIcon />
                    <span className="font-bold mt-2">خطة فارغة</span>
                    <span className="text-sm">ابدأ من الصفر</span>
                </button>
                {PLAN_TEMPLATES.map(template => (
                    <button key={template.name} onClick={() => onSelect(template.config)} className="p-6 border rounded-lg text-right hover:border-sky-500 hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <h4 className="font-bold text-slate-800">{template.name}</h4>
                        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
             <div className="p-4 bg-slate-50 text-left border-t">
                <button onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">إلغاء</button>
            </div>
        </div>
    </div>
);

// FIX: Add `isReadOnly` prop to fix compilation error in MainContent.tsx.
const StudyPlanManagement: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'design' | 'data' | 'classifications'>('design');
    
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [currentConfig, setCurrentConfig] = useState<Partial<StudyPlanConfiguration> | null>(null);
    const [planConfigs, setPlanConfigs] = useState<StudyPlanConfiguration[]>([]);
    
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    
    // State for Data Entry Tab
    const [selectedPlanIdForData, setSelectedPlanIdForData] = useState<number | null>(null);
    const [planData, setPlanData] = useState<StudyPlanDataRecord[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState('');
    const [importStatus, setImportStatus] = useState('');
    const [failedImports, setFailedImports] = useState<{ rowData: string; reason: string }[]>([]);


    // State for Teacher Classifications Tab
    const [teacherClassifications, setTeacherClassifications] = useState<TeacherClassification[]>([]);
    const [supervisedTeachers, setSupervisedTeachers] = useState<User[]>([]);
    const [teacherAssignments, setTeacherAssignments] = useState<Record<number, number[]>>({});
    const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
    const [editingClassification, setEditingClassification] = useState<Partial<TeacherClassification> | null>(null);
    
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);

    const isSupervisor = user?.role === Role.Supervisor;
    
    const refreshData = () => {
         if (user?.subscriberId) {
            const subId = user.subscriberId;
            const configs = getStudyPlanConfigurationsForSubscriber(subId);
            setPlanConfigs(configs);

            // For classification tab
            setTeacherClassifications(allTeacherClassifications.filter(c => c.subscriberId === subId));
            
            let teachersForSupervisor = allUsers.filter(u => u.role === Role.Teacher && u.subscriberId === subId);
            if (isSupervisor) {
                const supervisedHalaqaIds = new Set(halaqat.filter(h => h.supervisorId === user.id).map(h => h.id));
                const supervisedTeacherIds = new Set(halaqat.filter(h => supervisedHalaqaIds.has(h.id)).flatMap(h => h.teacherIds));
                teachersForSupervisor = teachersForSupervisor.filter(t => supervisedTeacherIds.has(t.id));
            }
            setSupervisedTeachers(teachersForSupervisor);

            const initialAssignments: Record<number, number[]> = {};
            teachersForSupervisor.forEach(t => {
                initialAssignments[t.id] = t.classificationIds || [];
            });
            setTeacherAssignments(initialAssignments);

        } else {
            setPlanConfigs([]);
            setTeacherClassifications([]);
            setSupervisedTeachers([]);
            setTeacherAssignments({});
        }
    }

    useEffect(() => {
        refreshData();
    }, [user, isClassificationModalOpen]);

     useEffect(() => {
        if (selectedPlanIdForData) {
            setPlanData(getStudyPlanDataForPlan(selectedPlanIdForData));
        } else {
            setPlanData([]);
        }
    }, [selectedPlanIdForData]);
    
    const selectedPlanForData = useMemo(() => {
        return planConfigs.find(p => p.id === selectedPlanIdForData);
    }, [planConfigs, selectedPlanIdForData]);

    const recallIdentifierFields = useMemo(() => {
        if (!selectedPlanForData) return [];
        return selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields.filter(f => f.isRecallIdentifier)));
    }, [selectedPlanForData]);
    
    const dataFields = useMemo(() => {
        if (!selectedPlanForData) return [];
        const recallIds = new Set(recallIdentifierFields.map(f => f.id));
        return selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields.filter(f => !recallIds.has(f.id))));
    }, [selectedPlanForData, recallIdentifierFields]);

    const handleCreateNewPlan = () => {
        setIsTemplateModalOpen(true);
    };

    const handleSelectTemplate = (template: Partial<StudyPlanConfiguration> | null) => {
        let baseConfig: Partial<StudyPlanConfiguration>;
        if (template) {
            baseConfig = cloneWithNewIds(template);
        } else {
            baseConfig = { name: '', groups: [] };
        }

        setCurrentConfig({
            ...baseConfig,
            subscriberId: user?.subscriberId,
            targetClassificationIds: [],
        });
        
        setIsTemplateModalOpen(false);
        setView('edit');
    };
    
    const handleEditPlan = (config: StudyPlanConfiguration) => {
        setCurrentConfig(JSON.parse(JSON.stringify(config)));
        setView('edit');
    };

    const handleDuplicatePlan = (configToDuplicate: StudyPlanConfiguration) => {
        const newConfig = cloneWithNewIds(configToDuplicate);
        newConfig.name = `${newConfig.name} - نسخة`;
        delete newConfig.id; // Remove ID to ensure it's treated as a new plan on save
        setCurrentConfig(newConfig);
        setView('edit');
    };

    const handleDeletePlan = (id: number) => {
        setPlanToDeleteId(id);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDeletePlan = () => {
        if (planToDeleteId) {
            deleteStudyPlanConfiguration(planToDeleteId);
            refreshData();
        }
        setIsConfirmDeleteOpen(false);
        setPlanToDeleteId(null);
    };
    
    const handleConfigChange = (field: keyof StudyPlanConfiguration, value: any) => {
        setCurrentConfig(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleClassificationToggle = (id: number) => {
        const currentIds = currentConfig?.targetClassificationIds || [];
        const newIds = currentIds.includes(id) ? currentIds.filter(cid => cid !== id) : [...currentIds, id];
        handleConfigChange('targetClassificationIds', newIds);
    };

    const handleSaveConfiguration = () => {
        if (!currentConfig || !currentConfig.name || !currentConfig.subscriberId) {
            alert('يرجى ملء اسم الخطة.');
            return;
        }
        saveStudyPlanConfiguration(currentConfig as StudyPlanConfiguration);
        alert('تم حفظ إعدادات الخطة بنجاح.');
        setView('list');
        refreshData();
    };
    
    const handleGroupChange = (groupIndex: number, newLabel: string) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        newGroups[groupIndex].label = newLabel;
        handleConfigChange('groups', newGroups);
    }
    const handleAddGroup = () => {
        const newGroup: StudyPlanGroup = { id: generateId(), label: 'مجموعة جديدة', subGroups: [] };
        handleConfigChange('groups', [...(currentConfig?.groups || []), newGroup]);
    }
    const handleRemoveGroup = (groupIndex: number) => {
        handleConfigChange('groups', currentConfig?.groups?.filter((_, i) => i !== groupIndex));
    }
     const handleDuplicateGroup = (groupIndex: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        
        const groupToClone = currentConfig.groups[groupIndex];
        const newGroup = cloneWithNewIds(groupToClone);
        newGroup.label = `${newGroup.label} - نسخة`;

        const newGroups = [...currentConfig.groups];
        newGroups.splice(groupIndex + 1, 0, newGroup);
        handleConfigChange('groups', newGroups);
    };

    
    const handleSubGroupChange = (gIdx: number, sgIdx: number, newLabel: string) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        newGroups[gIdx].subGroups[sgIdx].label = newLabel;
        handleConfigChange('groups', newGroups);
    }
    const handleAddSubGroup = (gIdx: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        const newSubGroup: StudyPlanSubGroup = { id: generateId(), label: 'مجموعة فرعية جديدة', fields: [] };
        newGroups[gIdx].subGroups.push(newSubGroup);
        handleConfigChange('groups', newGroups);
    }
    const handleRemoveSubGroup = (gIdx: number, sgIdx: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        newGroups[gIdx].subGroups = newGroups[gIdx].subGroups.filter((_, i) => i !== sgIdx);
        handleConfigChange('groups', newGroups);
    }

    const handleFieldChange = (gIdx: number, sgIdx: number, fIdx: number, newLabel: string) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        newGroups[gIdx].subGroups[sgIdx].fields[fIdx].label = newLabel;
        handleConfigChange('groups', newGroups);
    }
    const handleFieldIdentifierToggle = (gIdx: number, sgIdx: number, fIdx: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        const field = newGroups[gIdx].subGroups[sgIdx].fields[fIdx];
        field.isRecallIdentifier = !field.isRecallIdentifier;
        handleConfigChange('groups', newGroups);
    };
    const handleAddField = (gIdx: number, sgIdx: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        const newField: StudyPlanField = { id: generateId(), label: 'حقل جديد' };
        newGroups[gIdx].subGroups[sgIdx].fields.push(newField);
        handleConfigChange('groups', newGroups);
    }
    const handleRemoveField = (gIdx: number, sgIdx: number, fIdx: number) => {
        if (!currentConfig || !currentConfig.groups) return;
        const newGroups = [...currentConfig.groups];
        newGroups[gIdx].subGroups[sgIdx].fields = newGroups[gIdx].subGroups[sgIdx].fields.filter((_, i) => i !== fIdx);
        handleConfigChange('groups', newGroups);
    }

    const handleAddDataRow = () => {
        if (!selectedPlanIdForData) return;
        const newRow: StudyPlanDataRecord = { id: generateId(), planConfigId: selectedPlanIdForData, recallIdentifiers: {}, data: {} };
        setPlanData(prev => [...prev, newRow]);
    }
    const handleDataChange = (rowIndex: number, fieldId: string, value: string) => {
        setPlanData(prev => {
            const isIdentifier = recallIdentifierFields.some(f => f.id === fieldId);
            return prev.map((row, i) => {
                if (i !== rowIndex) return row;
                const newRow = { ...row };
                if (isIdentifier) {
                    newRow.recallIdentifiers = { ...newRow.recallIdentifiers, [fieldId]: value };
                } else {
                    newRow.data = { ...newRow.data, [fieldId]: value };
                }
                return newRow;
            });
        });
    };
    const handleRemoveDataRow = (rowIndex: number) => {
        setPlanData(prev => prev.filter((_, i) => i !== rowIndex));
    };
    const handleSaveData = () => {
        if (!selectedPlanIdForData) return;
        saveStudyPlanDataForPlan(selectedPlanIdForData, planData);
        alert('تم حفظ قاعدة الاستدعاء بنجاح.');
    };
    const handleProcessImport = () => {
        if (!selectedPlanForData) return;

        setFailedImports([]);
        setImportStatus('جاري المعالجة...');

        const allHeaders = selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields));
        
        const rows = importData.trim().split('\n').filter(r => r.trim());
        const newRecords: StudyPlanDataRecord[] = [];
        const localFailedImports: { rowData: string; reason: string }[] = [];
        
        rows.forEach(row => {
            const columns = row.split('\t');
            if (columns.length !== allHeaders.length) {
                localFailedImports.push({ rowData: row, reason: `عدد الأعمدة غير مطابق. المتوقع ${allHeaders.length} وحصلنا على ${columns.length}.` });
                return;
            }
    
            const newRecord: StudyPlanDataRecord = {
                id: generateId(),
                planConfigId: selectedPlanForData.id,
                recallIdentifiers: {},
                data: {},
            };
            
            allHeaders.forEach((header, index) => {
                const value = columns[index]?.trim() || '';
                if (header.isRecallIdentifier) {
                    newRecord.recallIdentifiers[header.id] = value;
                } else {
                    newRecord.data[header.id] = value;
                }
            });
    
            const hasAllIdentifiers = recallIdentifierFields.every(field => newRecord.recallIdentifiers[field.id] && newRecord.recallIdentifiers[field.id].trim());
            if (hasAllIdentifiers) {
                newRecords.push(newRecord);
            } else {
                localFailedImports.push({ rowData: row, reason: 'بيانات التعريف الأساسية (الحقول المميزة) فارغة.' });
            }
        });
    
        setPlanData(prev => [...prev, ...newRecords]);
        setFailedImports(localFailedImports);
        setImportStatus(`اكتمل الاستيراد. ${newRecords.length} سجل ناجح، ${localFailedImports.length} سجل فاشل.`);
    };
    
    // Functions for Classification Manager Tab
    const handleAssignmentChange = (teacherId: number, classificationId: number) => {
        setTeacherAssignments(prev => {
            const currentIds = prev[teacherId] || [];
            const newIds = currentIds.includes(classificationId)
                ? currentIds.filter(id => id !== classificationId)
                : [...currentIds, classificationId];
            return { ...prev, [teacherId]: newIds };
        });
    };

    const handleSaveAssignments = () => {
        Object.keys(teacherAssignments).forEach(teacherIdStr => {
            const teacherId = parseInt(teacherIdStr, 10);
            const teacher = allUsers.find(u => u.id === teacherId);
            if (teacher) {
                const updatedTeacher: User = { ...teacher, classificationIds: teacherAssignments[teacherId] };
                updateUser(updatedTeacher);
            }
        });
        alert('تم حفظ تصنيفات المعلمين بنجاح!');
    };
    
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
        handleCloseClassificationModal();
    };

    const handleDeleteClassification = (id: number) => {
        if (confirm(`هل أنت متأكد من حذف هذا التصنيف؟ سيتم إزالته من جميع المعلمين المرتبطين به.`)) {
            deleteTeacherClassification(id);
             refreshData();
             setIsClassificationModalOpen(false);
             setEditingClassification(null);
        }
    };


    const renderPlanEditor = () => {
         if (!currentConfig) return null;

         return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center gap-4">
                     <button onClick={() => setView('list')} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">
                       → العودة للائحة
                     </button>
                     <h3 className="text-2xl font-bold">{currentConfig.id ? 'تعديل الخطة الدراسية' : 'إنشاء خطة دراسية جديدة'}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-sky-500">
                    <h4 className="text-xl font-bold mb-4 text-sky-800">1. المعلومات الأساسية</h4>
                    <div className="space-y-4">
                         <div>
                            <label className="block font-semibold mb-1">اسم الخطة</label>
                            <input type="text" value={currentConfig.name || ''} onChange={(e) => handleConfigChange('name', e.target.value)} className="w-full p-2 border rounded-md bg-white text-slate-900" placeholder="مثال: منهجية الفترة الصباحية" readOnly={isReadOnly}/>
                        </div>
                         <div>
                            <label className="block font-semibold mb-2">من يمكنه استخدام هذه الخطة؟</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {teacherClassifications.map(tc => (
                                    <label key={tc.id} className="flex items-center p-2 rounded-md bg-slate-50 border cursor-pointer hover:bg-sky-50 hover:border-sky-300">
                                        <input type="checkbox" checked={(currentConfig.targetClassificationIds || []).includes(tc.id)} onChange={() => handleClassificationToggle(tc.id)} disabled={isReadOnly} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                                        <span className="mr-2">{tc.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-sky-500">
                     <h4 className="text-xl font-bold mb-4 text-sky-800">2. تصميم جدول المتابعة</h4>
                     <div className="space-y-4">
                        {(currentConfig.groups || []).map((group, gIdx) => (
                            <div key={group.id} className="bg-slate-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-center mb-3">
                                    <input type="text" value={group.label} onChange={e => handleGroupChange(gIdx, e.target.value)} placeholder="اسم المجموعة الرئيسية" className="font-bold text-lg p-1 border-b-2 bg-transparent text-slate-900 focus:outline-none focus:border-sky-500 read-only:bg-slate-100" readOnly={isReadOnly} />
                                    <div className="flex items-center gap-2">
                                        <button title="تكرار المجموعة" onClick={() => handleDuplicateGroup(gIdx)} disabled={isReadOnly} className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-md disabled:text-slate-300 disabled:hover:bg-transparent"><DuplicateIcon /></button>
                                        <button title="حذف المجموعة" onClick={() => handleRemoveGroup(gIdx)} disabled={isReadOnly} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md disabled:text-slate-300 disabled:hover:bg-transparent"><TrashIcon /></button>
                                    </div>
                                </div>
                                <div className="space-y-3 pl-4 border-r-2 pr-4">
                                    {group.subGroups.map((sg, sgIdx) => (
                                        <div key={sg.id} className="bg-white p-3 rounded-md border">
                                            <div className="flex justify-between items-center mb-2">
                                                <input type="text" value={sg.label} onChange={e => handleSubGroupChange(gIdx, sgIdx, e.target.value)} placeholder="اسم المجموعة الفرعية" className="font-semibold p-1 border-b bg-transparent text-slate-900 focus:outline-none focus:border-sky-500 read-only:bg-slate-100" readOnly={isReadOnly} />
                                                <button title="حذف المجموعة الفرعية" onClick={() => handleRemoveSubGroup(gIdx, sgIdx)} disabled={isReadOnly} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full disabled:text-slate-300 disabled:hover:bg-transparent"><TrashIcon /></button>
                                            </div>
                                             <div className="space-y-2">
                                                {sg.fields.map((field, fIdx) => (
                                                    <div key={field.id} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border">
                                                        <input type="text" value={field.label} onChange={e => handleFieldChange(gIdx, sgIdx, fIdx, e.target.value)} placeholder="اسم الحقل" className="flex-1 p-1 rounded-md text-sm border-0 bg-transparent text-slate-900 focus:ring-1 focus:ring-sky-500 read-only:bg-slate-100" readOnly={isReadOnly} />
                                                        <div className="relative group flex items-center">
                                                            <label title="تحديد كمعرّف للاستدعاء" className="flex items-center text-xs text-slate-600 cursor-pointer p-1 rounded-md hover:bg-sky-100">
                                                                <input type="checkbox" checked={!!field.isRecallIdentifier} onChange={() => handleFieldIdentifierToggle(gIdx, sgIdx, fIdx)} disabled={isReadOnly} className="ml-1 h-4 w-4 text-sky-600 rounded" />
                                                                معرّف
                                                            </label>
                                                            <InfoIcon />
                                                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                يُستخدم لجلب البيانات المحفوظة سابقاً تلقائياً. مثال: عند إدخال السورة والآية، يتم جلب التقييمات السابقة.
                                                                <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                                            </div>
                                                        </div>
                                                        <button title="حذف الحقل" onClick={() => handleRemoveField(gIdx, sgIdx, fIdx)} disabled={isReadOnly} className="p-1 text-slate-400 hover:text-red-500 rounded-full disabled:text-slate-300"><TrashIcon /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => handleAddField(gIdx, sgIdx)} disabled={isReadOnly} className="text-sm text-sky-600 border-2 border-dashed rounded py-1 w-full flex items-center justify-center gap-1 hover:bg-sky-50 transition-colors disabled:text-slate-400 disabled:border-slate-300 disabled:hover:bg-transparent">
                                                    <AddIcon /> حقل
                                                </button>
                                             </div>
                                        </div>
                                    ))}
                                     <button onClick={() => handleAddSubGroup(gIdx)} disabled={isReadOnly} className="text-sm text-sky-700 hover:underline mt-2 flex items-center gap-1 disabled:text-slate-400 disabled:no-underline"><AddIcon /> مجموعة فرعية</button>
                                </div>
                            </div>
                        ))}
                         <button onClick={handleAddGroup} disabled={isReadOnly} className="w-full py-2 border-2 border-dashed rounded-lg text-slate-600 hover:bg-slate-100 hover:border-sky-500 flex items-center justify-center gap-2 disabled:text-slate-400 disabled:border-slate-300 disabled:hover:bg-transparent">
                           <AddIcon /> إضافة مجموعة رئيسية
                         </button>
                     </div>
                </div>
                
                <div className="fixed bottom-0 right-0 left-0 md:left-64 p-4 bg-white/80 backdrop-blur-lg border-t z-10">
                    <div className="max-w-7xl mx-auto flex justify-end">
                        <button onClick={handleSaveConfiguration} disabled={isReadOnly} className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 text-lg shadow-lg transform hover:scale-105 transition-all disabled:bg-slate-400">
                            حفظ الخطة الدراسية
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderPlanList = () => {
         return (
            <div className="space-y-6">
                 <ConfirmationModal
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setIsConfirmDeleteOpen(false)}
                    onConfirm={handleConfirmDeletePlan}
                    title="تأكيد حذف الخطة الدراسية"
                    message="هل أنت متأكد من حذف هذه الخطة؟ سيتم حذف جميع بيانات الاستدعاء المرتبطة بها بشكل دائم."
                />
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">الخطط الدراسية</h3>
                    <button onClick={handleCreateNewPlan} disabled={isReadOnly} className="px-5 py-2 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 flex items-center gap-2 disabled:bg-slate-400">
                        <AddIcon /> إنشاء خطة جديدة
                    </button>
                </div>

                {planConfigs.length > 0 ? planConfigs.map(config => (
                    <div key={config.id} className="bg-slate-50 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                             <h4 className="font-bold text-lg">{config.name}</h4>
                             <p className="text-sm text-slate-500">
                                مخصصة لـ: {config.targetClassificationIds.map(id => teacherClassifications.find(tc => tc.id === id)?.name).join(', ') || 'غير محدد'}
                             </p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                            <button onClick={() => handleDuplicatePlan(config)} disabled={isReadOnly} className="p-2 text-slate-600 hover:bg-slate-200 rounded-md disabled:text-slate-300" title="تكرار الخطة"><DuplicateIcon/></button>
                            <button onClick={() => handleEditPlan(config)} disabled={isReadOnly} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-500">
                                تعديل
                            </button>
                             <button onClick={() => handleDeletePlan(config.id)} disabled={isReadOnly} className="px-4 py-1.5 bg-red-50 text-red-700 border border-red-200 text-sm font-semibold rounded-md hover:bg-red-100 disabled:bg-slate-200 disabled:text-slate-500">
                                حذف
                            </button>
                        </div>
                    </div>
                )) : (
                     <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg">
                        <p>لم يتم إنشاء أي خطط دراسية بعد. انقر على "إنشاء خطة جديدة" للبدء.</p>
                    </div>
                )}
            </div>
        );
    }
    
    const renderDataEntry = () => {
        return (
            <div>
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div>
                         <h3 className="text-2xl font-bold">بناء قاعدة الاستدعاء</h3>
                         <p className="text-sm text-slate-500 mt-1">أضف البيانات هنا ليتم استدعاؤها تلقائياً في شاشة متابعة الطلاب.</p>
                    </div>
                    {selectedPlanIdForData && (
                        <div className="flex gap-2">
                             <button onClick={() => setIsImportModalOpen(true)} disabled={isReadOnly} className="px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-400">
                                استيراد بيانات
                            </button>
                            <button onClick={handleSaveData} disabled={isReadOnly} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                                حفظ القاعدة
                            </button>
                        </div>
                    )}
                 </div>
                 <div className="mb-4">
                     <label className="block font-semibold mb-1">اختر الخطة الدراسية:</label>
                     <select 
                        value={selectedPlanIdForData || ''} 
                        onChange={e => setSelectedPlanIdForData(Number(e.target.value))}
                        className="w-full md:w-1/2 p-2 border rounded-md bg-white text-slate-900"
                    >
                         <option value="">-- اختر خطة --</option>
                         {planConfigs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                 </div>
                 
                 {selectedPlanForData && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                    {selectedPlanForData.groups.map(group => {
                                        const groupFieldCount = group.subGroups.reduce((sum, sg) => sum + sg.fields.length, 0);
                                        if (groupFieldCount === 0) return null;
                                        return <th key={group.id} colSpan={groupFieldCount} className="p-1 border bg-yellow-100 text-yellow-800 font-bold">{group.label}</th>
                                    })}
                                    <th rowSpan={3} className="p-2 border w-16"></th>
                                </tr>
                                <tr>
                                    {selectedPlanForData.groups.map(group => (
                                        group.subGroups.map(sg => {
                                            if (sg.fields.length === 0) return null;
                                            return <th key={sg.id} colSpan={sg.fields.length} className="p-1 border bg-yellow-50 font-semibold">{sg.label}</th>
                                        })
                                    ))}
                                </tr>
                                <tr>
                                    {selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields)).map(field => (
                                        <th key={field.id} className={`p-2 border text-xs ${field.isRecallIdentifier ? 'bg-sky-100 text-sky-800' : ''}`}>{field.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {planData.map((row, rIdx) => (
                                    <tr key={row.id}>
                                        {selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields)).map(field => (
                                            <td key={field.id} className={`p-1 border ${field.isRecallIdentifier ? 'bg-sky-50' : ''}`}>
                                                <input 
                                                    type="text" 
                                                    value={(field.isRecallIdentifier ? row.recallIdentifiers[field.id] : row.data[field.id]) || ''}
                                                    onChange={e => handleDataChange(rIdx, field.id, e.target.value)} 
                                                    className="w-full p-1 border rounded-md bg-white text-slate-900 read-only:bg-slate-100" 
                                                    readOnly={isReadOnly}
                                                />
                                            </td>
                                        ))}
                                        <td className="p-1 border text-center">
                                            <button onClick={() => handleRemoveDataRow(rIdx)} disabled={isReadOnly} className="text-red-500 hover:bg-red-100 p-1 rounded-full text-xs disabled:text-slate-400 disabled:hover:bg-transparent">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         <button onClick={handleAddDataRow} disabled={isReadOnly} className="mt-4 px-4 py-2 border-2 border-dashed rounded-lg text-slate-600 hover:bg-slate-100 w-full disabled:text-slate-400 disabled:border-slate-300 disabled:hover:bg-transparent">
                            + إضافة صف جديد
                        </button>
                    </div>
                 )}
                 {isImportModalOpen && selectedPlanForData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[90vh] max-h-[750px]">
                            <div className="p-6 border-b flex-shrink-0">
                                <h3 className="text-xl font-bold">استيراد بيانات لخطة: {selectedPlanForData.name}</h3>
                            </div>
                            <div className="flex-grow overflow-y-auto px-6 py-4">
                                {(importStatus || failedImports.length > 0) ? (
                                    <div>
                                        <div className={`p-3 mb-4 rounded-lg text-center ${failedImports.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                                            {importStatus}
                                        </div>
                                        {failedImports.length > 0 && (
                                            <div>
                                                <h4 className="font-bold mb-2">السجلات التي فشل استيرادها:</h4>
                                                <textarea 
                                                    readOnly
                                                    className="w-full h-32 p-2 border rounded-md font-mono bg-slate-100 text-slate-900 text-sm"
                                                    value={failedImports.map(f => `${f.rowData}\n--- السبب: ${f.reason}`).join('\n\n')}
                                                />
                                                <p className="text-xs text-slate-500 mt-1">يمكنك نسخ هذه البيانات، تصحيحها، ثم محاولة استيرادها مرة أخرى.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-slate-600 mb-2 text-sm">
                                            انسخ البيانات من جدول (مثل Excel أو Google Sheets) وألصقها هنا. تأكد من أن الأعمدة بنفس الترتيب تماماً.
                                        </p>
                                        <div className="mb-4 text-xs overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        {selectedPlanForData.groups.flatMap(g => g.subGroups.flatMap(sg => sg.fields)).map(field => (
                                                            <th key={field.id} className={`p-1 border whitespace-nowrap ${field.isRecallIdentifier ? 'bg-sky-100 text-sky-800' : ''}`}>{field.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>
                                        <textarea 
                                            value={importData}
                                            onChange={(e) => setImportData(e.target.value)}
                                            className="w-full h-48 p-2 border rounded-md font-mono bg-white text-slate-900"
                                            placeholder="ألصق بياناتك هنا..."
                                            readOnly={isReadOnly}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end space-x-4 space-x-reverse">
                                <button type="button" onClick={() => { setIsImportModalOpen(false); setImportData(''); setImportStatus(''); setFailedImports([]); }} className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إغلاق</button>
                                <button type="button" onClick={handleProcessImport} disabled={isReadOnly} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400">استيراد الآن</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderClassificationManager = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl shadow-sm border">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">توزيع المعلمين على التصنيفات</h3>
                    <button onClick={handleSaveAssignments} disabled={isReadOnly} className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 text-sm disabled:bg-slate-400">
                        حفظ التغييرات
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {supervisedTeachers.map(teacher => (
                        <div key={teacher.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="font-bold text-slate-800 mb-2">{teacher.name}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {teacherClassifications.map(cls => (
                                    <label key={cls.id} className="flex items-center p-1.5 rounded-md hover:bg-slate-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={teacherAssignments[teacher.id]?.includes(cls.id) ?? false}
                                            onChange={() => handleAssignmentChange(teacher.id, cls.id)}
                                            disabled={isReadOnly}
                                            className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                        />
                                        <span className="mr-2 text-sm text-slate-700">{cls.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="bg-slate-50 p-4 rounded-xl shadow-sm border">
                 <h3 className="text-xl font-bold mb-4">إدارة التصنيفات</h3>
                 <div className="space-y-2 mb-4">
                   {teacherClassifications.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-2 bg-white rounded-md border">
                            <p className="font-semibold text-sm">{c.name}</p>
                            <div className="space-x-1 space-x-reverse">
                                <button onClick={() => handleOpenClassificationModal(c)} disabled={isReadOnly} className="text-sky-600 hover:underline text-xs disabled:text-slate-400 disabled:no-underline">تعديل</button>
                                <button onClick={() => handleDeleteClassification(c.id)} disabled={isReadOnly} className="text-red-600 hover:underline text-xs disabled:text-slate-400 disabled:no-underline">حذف</button>
                            </div>
                        </div>
                   ))}
                </div>
                <button onClick={() => handleOpenClassificationModal(null)} disabled={isReadOnly} className="w-full py-2 border-2 border-dashed rounded-lg text-slate-600 hover:bg-slate-100 hover:border-sky-500 text-sm disabled:text-slate-400 disabled:border-slate-300">
                    + إضافة تصنيف جديد
                </button>
            </div>
            {isClassificationModalOpen && editingClassification && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">{editingClassification.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
                            <input 
                                type="text"
                                value={editingClassification?.name || ''}
                                onChange={(e) => setEditingClassification(p => p ? {...p, name: e.target.value} : null)}
                                placeholder="اسم التصنيف..."
                                className="w-full p-2 border rounded-md bg-white text-slate-900 read-only:bg-slate-100"
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end space-x-3 space-x-reverse">
                            <button type="button" onClick={handleCloseClassificationModal} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">إلغاء</button>
                            <button type="button" onClick={handleSaveClassification} disabled={isReadOnly} className="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:bg-slate-400">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {isTemplateModalOpen && <TemplateSelectionModal onClose={() => setIsTemplateModalOpen(false)} onSelect={handleSelectTemplate} />}
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('design')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'design' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>
                    تصميم الخطط
                </button>
                <button onClick={() => setActiveTab('data')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'data' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>
                    بناء قاعدة الاستدعاء
                </button>
                 {isSupervisor && (
                    <button onClick={() => setActiveTab('classifications')} className={`px-4 py-2 text-lg font-semibold ${activeTab === 'classifications' ? 'border-b-2 border-sky-700 text-sky-700' : 'text-slate-500'}`}>
                        تصنيفات المعلمين
                    </button>
                )}
            </div>
             
             {activeTab === 'design' && (view === 'list' ? renderPlanList() : renderPlanEditor())}
             {activeTab === 'data' && renderDataEntry()}
             {activeTab === 'classifications' && isSupervisor && renderClassificationManager()}
        </div>
    );
};

export default StudyPlanManagement;