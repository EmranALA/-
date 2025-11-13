// FIX: Replaced data logic with type definitions to fix circular dependency errors.
export enum Role {
    AppManager = 'مدير التطبيق',
    ManagerOfInstitutions = 'مدير مؤسسات',
    Admin = 'مدير عام',
    DeputyManager = 'نائب مدير',
    Supervisor = 'مشرف',
    Teacher = 'معلم',
    Accountant = 'محاسب',
}

export enum Gender {
    Male = 'ذكر',
    Female = 'أنثى',
}

export enum PaymentStatus {
    Paid = 'مدفوع',
    Late = 'متأخر',
    Unpaid = 'غير مدفوع',
}

export enum AttendanceStatus {
    Present = 'حاضر',
    Absent = 'غائب',
    Excused = 'معذور',
}

export type SubscriptionPlan = 'الأساسية' | 'المتقدمة' | 'المؤسسات';

export type SubscriberStatus = 'نشط' | 'غير نشط';

// FIX: Add missing types for Settings component to resolve import errors.
export type DateFormat = 'gregorian' | 'hijri';
export type SidebarConfig = Record<Role, string[] | null>;

export interface ActionButton {
    label: string;
}

export interface User {
    id: number;
    name: string;
    username: string;
    role: Role;
    subscriberId?: number;
    viewableGenders?: Gender[];
    classificationIds?: number[];
    extraPermissions?: string[];
    phoneNumber?: string;
}

export interface Subscriber {
    id: number;
    organizationName: string;
    plan: SubscriptionPlan;
    status: SubscriberStatus;
    joinDate: string;
    adminUserId: number;
    customPrice?: number;
    parentId?: number;
}

export interface Halaqa {
    id: number;
    name: string;
    supervisorId: number;
    teacherIds: number[];
}

export interface Student {
    id: number;
    name: string;
    gender: Gender;
    levelId: number;
    teacherId?: number;
    halaqaId?: number;
    paymentStatus: PaymentStatus;
    phoneNumber?: string;
    notes?: string;
    classificationId?: number;
    subscriberId?: number;
    recallIdentifiers?: Record<string, string>; // To store default recall values
}

export interface StudentClassification {
    id: number;
    name: string;
    defaultAmount: number;
}

export interface TeacherClassification {
    id: number;
    name: string;
    subscriberId: number;
}

export interface Level {
    id: number;
    name: string;
    creatorId: number; // ID of the Supervisor or Admin who created it
    subscriberId: number;
}

export interface AttendanceRecord {
    id: number;
    studentId: number;
    date: string;
    status: AttendanceStatus;
}

export interface ProgressRecord {
    id: number;
    studentId: number;
    date: string;
    memorized: string; // Legacy
    revised: string; // Legacy
    progressData?: string; // JSON of Record<string, string>
    planConfigId?: number;
}

export interface PaymentRecord {
    id: number;
    studentId: number;
    amount: number;
    paymentDate: string;
    paymentMonth: string;
}

export interface Notification {
    id: number;
    text: string;
    timestamp: string;
    read: boolean;
}

export interface AccountantAlert {
    id: number;
    message: string;
    targetUserIds: number[];
    senderId: number;
    timestamp: string;
    actions?: ActionButton[];
    readByUserIds: number[];
}

export interface ScheduledAlert {
    id: number;
    message: string;
    targetType: 'teacher' | 'supervisor' | 'classification';
    targetId: number;
    scheduleType: 'once' | 'weekly' | 'monthly';
    scheduleValue: string; // "YYYY-MM-DD" for once, "0-6" for weekly (Sun-Sat), "1-31" for monthly
    senderId: number;
    subscriberId: number;
}

export interface TeacherSettings {
    teacherId: number;
    groupMessageTemplate: string;
    latePaymentMessageTemplate: string;
    attendanceMessageTemplate?: string;
    absenceMessageTemplate?: string;
}

export interface HalaqaSetting {
    halaqaId: number;
    whatsAppGroupLink?: string;
}

export interface PlanDetails {
    name: SubscriptionPlan;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlight?: boolean;
}

export interface PromotionFeature {
    category: string;
    points: string[];
}
// FIX: Add missing ChatRoom and ChatMessage types to resolve import errors in Chat.tsx.
export interface ChatRoom {
    id: string;
    name: string;
    participantIds: number[];
}

export interface ChatMessage {
    id: number;
    roomId: string;
    senderId: number;
    text: string;
    timestamp: string;
}

// New types for the dynamic study plan form builder
export interface StudyPlanField {
    id: string;
    label: string;
    isRecallIdentifier?: boolean;
}

export interface StudyPlanSubGroup {
    id: string;
    label: string;
    fields: StudyPlanField[];
}

export interface StudyPlanGroup {
    id: string;
    label: string;
    subGroups: StudyPlanSubGroup[];
}

export interface StudyPlanConfiguration {
    id: number;
    subscriberId: number;
    name: string; 
    targetClassificationIds: number[];
    groups: StudyPlanGroup[];
}

export interface StudyPlanDataRecord {
    id: string; // Using string to match field IDs
    planConfigId: number;
    recallIdentifiers: Record<string, string>; // { [fieldId]: value }
    data: Record<string, string>; // { [fieldId]: value }
}

export type LessonPlanStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface LessonPlanRecord {
    id: number;
    teacherId: number;
    halaqaId: number;
    planConfigId: number;
    date: string;
    planData: Record<string, string>;
    status: LessonPlanStatus;
    supervisorId: number;
    supervisorNotes?: string;
    lastModified?: string;
}

// Types for Supervisory Visits
export enum VisitType {
    Survey = 'استطلاع',
    Evaluation = 'تقييم',
}

export interface VisitItem {
    id: number;
    text: string;
    subscriberId: number;
}

export interface SupervisoryVisit {
    id: number;
    supervisorId: number;
    teacherId: number;
    halaqaId: number;
    visitType: VisitType;
    date: string;
    ratings: Record<number, number>; // { visitItemId: rating (1-5) }
    strengths: string;
    developmentAreas: string;
    notes: string;
}

// FIX: Add missing types for ImportantDates component to resolve import errors.
export enum ImportantDateType {
    Exam = 'اختبار',
    Activity = 'نشاط',
    Holiday = 'إجازة',
    Other = 'أخرى',
}

export interface ImportantDate {
    id: number;
    title: string;
    date: string;
    description?: string;
    type: ImportantDateType;
    creatorId: number;
    subscriberId: number;
    targetType: 'all' | 'teacher' | 'classification';
    targetId?: number;
}
