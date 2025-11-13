import {
  Role, User, Level, Halaqa, Student, AttendanceStatus, AttendanceRecord,
  ProgressRecord, Notification, PaymentStatus, PaymentRecord,
  Subscriber, SubscriptionPlan, SubscriberStatus, Gender, StudentClassification, TeacherClassification, AccountantAlert, TeacherSettings, PlanDetails, PromotionFeature,
  ChatRoom, ChatMessage, StudyPlanConfiguration, StudyPlanDataRecord, ScheduledAlert, LessonPlanRecord,
  VisitType, VisitItem, SupervisoryVisit,
  DateFormat, SidebarConfig, HalaqaSetting,
  // FIX: Add ImportantDate types to resolve import errors.
  ImportantDate, ImportantDateType
} from '../types';

// FIX: Removed unnecessary self-import of `getStudyPlanConfigurationsForTeacher` which caused a circular dependency and declaration conflict. The function is defined within the file before its usage, making the import redundant.

// --- LocalStorage Helper Functions ---

function initializeAndGetData<T>(key: string, initialData: T): T {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error(`Failed to load ${key} from localStorage`, e);
    }
    // If nothing in storage or error, return initial data and save it.
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
}

function saveData<T>(key: string, data: T) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save ${key} to localStorage`, e);
    }
}

// --- KEYS & INITIAL DATA ---

const KEYS = {
    USERS: 'halaqa_users',
    SUBSCRIBERS: 'halaqa_subscribers',
    HALAQAT: 'halaqa_halaqat',
    STUDENTS: 'halaqa_students',
    LEVELS: 'halaqa_levels',
    ATTENDANCE: 'halaqa_attendance',
    PROGRESS: 'halaqa_progress',
    PAYMENTS: 'halaqa_payments',
    STUDENT_CLASSIFICATIONS: 'halaqa_student_classifications',
    TEACHER_CLASSIFICATIONS: 'halaqa_teacher_classifications',
    ACCOUNTANT_ALERTS: 'halaqa_accountant_alerts',
    SCHEDULED_ALERTS: 'halaqa_scheduled_alerts',
    TEACHER_SETTINGS: 'halaqa_teacher_settings',
    HALAQA_SETTINGS: 'halaqa_halaqa_settings',
    ACCOUNTANT_GROUP_MESSAGE_TEMPLATE: 'halaqa_accountant_group_message_template',
    LATE_PAYMENT_TEMPLATE: 'halaqa_late_payment_template',
    PAID_PAYMENT_TEMPLATE: 'halaqa_paid_payment_template',
    SUBSCRIPTION_PLANS: 'halaqa_subscription_plans',
    PROMOTION_FEATURES: 'halaqa_promotion_features',
    STUDY_PLAN_CONFIGS: 'halaqa_study_plan_configs',
    STUDY_PLAN_DATA: 'halaqa_study_plan_data',
    LESSON_PLAN_RECORDS: 'halaqa_lesson_plan_records',
    VISIT_ITEMS: 'halaqa_visit_items',
    SUPERVISORY_VISITS: 'halaqa_supervisory_visits',
    SIDEBAR_CONFIG: 'halaqa_sidebar_config',
    DATE_FORMAT: 'halaqa_date_format',
    IMPORTANT_DATES: 'halaqa_important_dates',
    LABELS: 'halaqa_labels',
};

// --- DATA CONSISTENCY REFACTOR ---
// The initial data is structured to be more consistent for a multi-subscriber environment.

// AppManager (no subscriber)
const initialUser0: User = { id: 0, name: 'مدير التطبيق', username: 'appmanager', role: Role.AppManager };

// Subscriber 1: مركز الفرقان
const initialSub1Users: User[] = [
  { id: 1, name: 'المدير العام', username: 'admin', role: Role.Admin, subscriberId: 1, phoneNumber: '966501234567' },
  { id: 2, name: 'خالد الأحمد', username: 'supervisor_khalid', role: Role.Supervisor, viewableGenders: [Gender.Male], subscriberId: 1 },
  { id: 3, name: 'سعيد محمد', username: 'teacher_saeed', role: Role.Teacher, viewableGenders: [Gender.Male], classificationIds: [1], subscriberId: 1 },
  { id: 4, name: 'فاطمة علي', username: 'teacher_fatima', role: Role.Teacher, viewableGenders: [Gender.Female], classificationIds: [2], subscriberId: 1 },
  { id: 7, name: 'المحاسب', username: 'accountant', role: Role.Accountant, subscriberId: 1 },
  { id: 9, name: 'نائب المدير', username: 'deputy_manager', role: Role.DeputyManager, subscriberId: 1 },
];
const initialSub1Students: Student[] = [
  { id: 1, name: 'يوسف خالد', gender: Gender.Male, levelId: 1, teacherId: 3, halaqaId: 1, paymentStatus: PaymentStatus.Paid, phoneNumber: '551234567', notes: 'طالب متميز', classificationId: 2, subscriberId: 1, recallIdentifiers: {'field_surah': 'البقرة', 'field_from_ayah': '1', 'field_to_ayah': '5'} },
  { id: 2, name: 'محمد علي', gender: Gender.Male, levelId: 2, teacherId: 3, halaqaId: 1, paymentStatus: PaymentStatus.Paid, phoneNumber: '557654321', notes: '', classificationId: 2, subscriberId: 1, recallIdentifiers: {} },
  { id: 3, name: 'عمر الفاروق', gender: Gender.Male, levelId: 1, teacherId: 4, halaqaId: 2, paymentStatus: PaymentStatus.Late, phoneNumber: '555555555', notes: '', classificationId: 3, subscriberId: 1, recallIdentifiers: {} },
  { id: 4, name: 'زينب أحمد', gender: Gender.Female, levelId: 3, teacherId: 4, halaqaId: 2, paymentStatus: PaymentStatus.Unpaid, phoneNumber: '551112222', notes: 'تحتاج متابعة في المراجعة', subscriberId: 1, recallIdentifiers: {} },
  { id: 7, name: 'خديجة مصطفى', gender: Gender.Female, levelId: 1, teacherId: 3, halaqaId: 4, paymentStatus: PaymentStatus.Late, phoneNumber: '556667777', notes: '', classificationId: 1, subscriberId: 1, recallIdentifiers: {} },
];

// Subscriber 2: دار الأترجة النسائية
const initialSub2Users: User[] = [
  { id: 5, name: 'مديرة دار الأترجة', username: 'admin_dar', role: Role.Admin, subscriberId: 2, phoneNumber: '966555555555' },
];
const initialSub2Students: Student[] = [
  { id: 5, name: 'سارة عبدالله', gender: Gender.Female, levelId: 2, paymentStatus: PaymentStatus.Paid, phoneNumber: '553334444', notes: '', subscriberId: 2, recallIdentifiers: {} },
  { id: 6, name: 'عبدالرحمن سعيد', gender: Gender.Male, levelId: 4, paymentStatus: PaymentStatus.Paid, phoneNumber: '559876543', notes: '', classificationId: 2, subscriberId: 2, recallIdentifiers: {} },
];

// Subscriber 3: مجمع حلقات النور
const initialSub3Users: User[] = [
    { id: 8, name: 'مدير مجمع النور', username: 'admin_noor', role: Role.Admin, subscriberId: 3, phoneNumber: '966543210987' },
];

// Subscriber 4: مؤسسة الرواد (Parent)
const initialSub4Users: User[] = [
    { id: 10, name: 'مدير المؤسسات', username: 'manager_institutions', role: Role.ManagerOfInstitutions, subscriberId: 4 },
];

// Subscriber 5: فرع الشمال (Child of Sub 4)
const initialSub5Users: User[] = [
    { id: 11, name: 'مدير فرع الشمال', username: 'admin_north', role: Role.Admin, subscriberId: 5 },
];


const initialUsers: User[] = [
  initialUser0,
  ...initialSub1Users,
  ...initialSub2Users,
  ...initialSub3Users,
  ...initialSub4Users,
  ...initialSub5Users,
];

const initialSubscribers: Subscriber[] = [
    { id: 1, organizationName: 'مركز الفرقان', plan: 'المتقدمة', status: 'نشط', joinDate: '2024-03-15', adminUserId: 1, customPrice: 250 },
    { id: 2, organizationName: 'دار الأترجة النسائية', plan: 'الأساسية', status: 'نشط', joinDate: '2024-04-01', adminUserId: 5 },
    { id: 3, organizationName: 'مجمع حلقات النور', plan: 'الأساسية', status: 'غير نشط', joinDate: '2024-02-10', adminUserId: 8 },
    { id: 4, organizationName: 'مؤسسة الرواد التعليمية', plan: 'المؤسسات', status: 'نشط', joinDate: '2024-05-25', adminUserId: 10 },
    { id: 5, organizationName: 'فرع شمال الرياض', plan: 'المتقدمة', status: 'نشط', joinDate: '2024-05-26', adminUserId: 11, parentId: 4 },
];

const initialHalaqat: Halaqa[] = [
  { id: 1, name: 'حلقة الأترجة', supervisorId: 2, teacherIds: [3] },
  { id: 2, name: 'حلقة الرياحين', supervisorId: 2, teacherIds: [4] },
  { id: 4, name: 'حلقة الفرقان', supervisorId: 2, teacherIds: [3] },
];

const initialStudents: Student[] = [
  ...initialSub1Students,
  ...initialSub2Students,
];

const initialLevels: Level[] = [
  { id: 1, name: 'المستوى الأول (جزء عم)', creatorId: 1, subscriberId: 1 },
  { id: 2, name: 'المستوى الثاني (جزء تبارك)', creatorId: 1, subscriberId: 1 },
  { id: 3, name: 'المستوى الثالث (5 أجزاء)', creatorId: 2, subscriberId: 1 },
  { id: 4, name: 'المستوى الرابع (10 أجزاء)', creatorId: 2, subscriberId: 1 },
  { id: 5, name: 'مستوى التمهيدي (دار الأترجة)', creatorId: 5, subscriberId: 2 },
];


const initialStudentClassifications: StudentClassification[] = [
  { id: 1, name: 'طالب منحة', defaultAmount: 0 },
  { id: 2, name: 'رسوم عادية', defaultAmount: 100 },
  { id: 3, name: 'رسوم مخفضة', defaultAmount: 50 },
];

const initialTeacherClassifications: TeacherClassification[] = [
  { id: 1, name: 'معلمو الفترة الصباحية', subscriberId: 1 },
  { id: 2, name: 'معلمات الفترة المسائية', subscriberId: 1 },
  { id: 3, name: 'معلمات دار الأترجة', subscriberId: 2 },
];

const initialAccountantAlerts: AccountantAlert[] = [];
const initialScheduledAlerts: ScheduledAlert[] = [];
const initialTeacherSettings: TeacherSettings[] = [];
const initialHalaqaSettings: HalaqaSetting[] = [
    { halaqaId: 1, whatsAppGroupLink: 'https://chat.whatsapp.com/12345' },
    { halaqaId: 2, whatsAppGroupLink: 'https://chat.whatsapp.com/67890' },
];
const initialAccountantGroupMessageTemplate = { name: 'رسالة التذكير الجماعية', template: "السلام عليكم ورحمة الله،\n\nهذا تحديث بحالة السداد لطلاب حلقة *{halaqaName}* لشهر *{month}*:\n\n{studentList}\n\nنرجو من أولياء الأمور الكرام المبادرة بالسداد. شكراً لتعاونكم."};


const initialAttendance: AttendanceRecord[] = [
  { id: 1, studentId: 1, date: '2024-05-20', status: AttendanceStatus.Present },
  { id: 2, studentId: 2, date: '2024-05-20', status: AttendanceStatus.Present },
  { id: 3, studentId: 1, date: '2024-05-21', status: AttendanceStatus.Present },
  { id: 4, studentId: 2, date: '2024-05-21', status: AttendanceStatus.Absent },
  { id: 5, studentId: 1, date: new Date().toISOString().slice(0, 10), status: AttendanceStatus.Present },
];

const initialProgress: ProgressRecord[] = [
  { id: 1, studentId: 1, date: '2024-05-20', memorized: 'النبأ 1-10', revised: 'الضحى' },
  { id: 2, studentId: 2, date: '2024-05-20', memorized: 'الملك 1-5', revised: 'القلم' },
  { id: 3, studentId: 1, date: new Date().toISOString().slice(0, 10), memorized: 'النبأ 11-20', revised: 'الشرح' },
];

const initialPayments: PaymentRecord[] = [
    { id: 1, studentId: 1, amount: 100, paymentDate: '2024-05-01', paymentMonth: '2024-05' },
    { id: 2, studentId: 2, amount: 100, paymentDate: '2024-05-02', paymentMonth: '2024-05' },
    { id: 5, studentId: 3, amount: 100, paymentDate: '2024-04-05', paymentMonth: '2024-04' }, // Late
];

const initialLatePaymentTemplate = { name: 'رسالة تذكير بالدفع المتأخر', template: "السلام عليكم ورحمة الله، نود تذكيركم بأن الرسوم الدراسية للطالبـ/ـة {studentName} في حلقة {halaqaName} قد تأخرت. يرجى المبادرة بالسداد في أقرب وقت. شكراً لتعاونكم." };
const initialPaidPaymentTemplate = { name: 'رسالة شكر على السداد', template: "السلام عليكم ورحمة الله، نشكركم على سداد الرسوم الدراسية للطالبـ/ـة {studentName} في حلقة {halaqaName}. مقدرين لكم حرصكم وتعاونكم." };

const initialSubscriptionPlans: PlanDetails[] = [
    {
        name: 'الأساسية',
        price: '99 ريال',
        period: '/شهرياً',
        description: 'مثالية للحلقات الصغيرة والبدايات الجديدة.',
        features: [
            'حتى 50 طالب',
            '5 معلمين',
            'تقارير أساسية',
            'دعم عبر البريد الإلكتروني',
        ],
    },
    {
        name: 'المتقدمة',
        price: '199 ريال',
        period: '/شهرياً',
        description: 'الأكثر شيوعاً، لمراكز التحفيظ النامية.',
        features: [
            'حتى 200 طالب',
            '20 معلم',
            'تقارير متقدمة وتصدير',
            'نظام نقاط ومكافآت',
            'دعم فني متميز',
        ],
        highlight: true,
    },
    {
        name: 'المؤسسات',
        price: 'تواصل معنا',
        period: '',
        description: 'حلول مخصصة للمؤسسات القرآنية الكبيرة.',
        features: [
            'عدد لا محدود من الطلاب والمعلمين',
            'صلاحيات مخصصة',
            'واجهة برمجية (API)',
            'مدير حساب مخصص',
            'دعم على مدار الساعة',
        ],
    },
];

const initialPromotionFeatures: PromotionFeature[] = [
  { category: 'إدارة شاملة للمستخدمين والحلقات', points: [ 'صلاحيات متعددة (مدير، مشرف، معلم، محاسب).', 'إنشاء حلقات دراسية غير محدودة وربطها بالمشرفين والمعلمين.', 'تسجيل الطلاب وتوزيعهم على الحلقات وتحديد مستوياتهم.', 'استيراد جماعي للطلاب من جداول البيانات لتسهيل البدء.' ] },
  { category: 'متابعة دقيقة للأداء', points: [ 'تسجيل الحضور والغياب اليومي للطلاب بسهولة.', 'متابعة المحفوظات والمراجعة اليومية لكل طالب.', 'نظام نقاط تحفيزي لزيادة التنافسية وتشجيع الطلاب.' ] },
  { category: 'تقارير ذكية وتلقائية', points: [ 'إنشاء تقارير أداء شاملة بضغطة زر.', 'تصدير التقارير بصيغ PDF و CSV لمشاركتها بسهولة.', 'لوحات تحكم إحصائية لكل صلاحية لعرض البيانات بشكل مرئي وجذاب.' ] },
  { category: 'إدارة مالية متكاملة', points: [ 'متابعة حالة السداد للطلاب (مدفوع، متأخر، غير مدفوع).', 'تسجيل الدفعات بسهولة وتحديث حالة الطالب تلقائياً.', 'إرسال رسائل تذكير وشكر عبر الواتساب بنماذج قابلة للتخصيص.' ] },
  { category: 'مرونة وتخصيص', points: [ 'تخصيص الصفحات التي تظهر في القائمة لكل دور (معلم، مشرف، محاسب).', 'تحديد صلاحيات الاطلاع على بيانات الطلاب حسب الجنس (طلاب/طالبات) للمحافظة على الخصوصية.', 'واجهة عصرية باللغة العربية ومتجاوبة مع جميع الأجهزة.' ] }
];
const initialStudyPlanConfigs: StudyPlanConfiguration[] = [
  {
    id: 1,
    subscriberId: 1,
    name: 'منهجية الإتقان والتثبيت (خطة افتراضية)',
    targetClassificationIds: [1, 2],
    groups: [
      {
        id: 'group_new_memo',
        label: 'الحفظ الجديد (السبق)',
        subGroups: [
          {
            id: 'sg_lesson_data',
            label: 'بيانات الدرس',
            fields: [
              { id: 'field_surah', label: 'السورة', isRecallIdentifier: true },
              { id: 'field_from_ayah', label: 'من آية', isRecallIdentifier: true },
              { id: 'field_to_ayah', label: 'إلى آية', isRecallIdentifier: true },
            ],
          },
          {
            id: 'sg_memo_eval',
            label: 'تقييم الحفظ الجديد',
            fields: [
              { id: 'field_memo_rating', label: 'التقييم العام', isRecallIdentifier: false },
              { id: 'field_memo_mistakes', label: 'عدد الأخطاء', isRecallIdentifier: false },
            ],
          },
        ],
      },
      {
        id: 'group_recent_rev',
        label: 'المراجعة القريبة',
        subGroups: [
          {
            id: 'sg_prev_lesson',
            label: 'الدرس السابق',
            fields: [
              { id: 'field_prev_lesson_range', label: 'المقدار', isRecallIdentifier: false },
              { id: 'field_prev_lesson_rating', label: 'التقييم', isRecallIdentifier: false },
            ],
          },
          {
            id: 'sg_last_five',
            label: 'آخر خمسة أجزاء',
            fields: [
              { id: 'field_last_five_range', label: 'المقدار', isRecallIdentifier: false },
              { id: 'field_last_five_rating', label: 'التقييم', isRecallIdentifier: false },
            ],
          },
        ],
      },
      {
        id: 'group_distant_rev',
        label: 'المراجعة البعيدة (الورد اليومي)',
        subGroups: [
          {
            id: 'sg_daily_wird',
            label: 'مقدار الورد وتقييمه',
            fields: [
              { id: 'field_wird_amount', label: 'المقدار', isRecallIdentifier: false },
              { id: 'field_wird_rating', label: 'التقييم', isRecallIdentifier: false },
            ],
          },
        ],
      },
      {
        id: 'group_tajweed',
        label: 'التجويد والأداء',
        subGroups: [
          {
            id: 'sg_tajweed_notes',
            label: 'ملاحظات الأداء',
            fields: [
              { id: 'field_tajweed_note', label: 'ملاحظة تجويدية', isRecallIdentifier: false },
              { id: 'field_performance_note', label: 'ملاحظة على الأداء الصوتي', isRecallIdentifier: false },
            ],
          },
        ],
      },
    ],
  }
];
const initialStudyPlanDataRecords: StudyPlanDataRecord[] = [];
const initialLessonPlanRecords: LessonPlanRecord[] = [];
const initialVisitItems: VisitItem[] = [
    { id: 1, text: 'التحضير للدرس وتنظيم المحتوى', subscriberId: 1 },
    { id: 2, text: 'التفاعل مع الطلاب وإشراكهم', subscriberId: 1 },
    { id: 3, text: 'استخدام الوسائل التعليمية المناسبة', subscriberId: 1 },
    { id: 4, text: 'إدارة وقت الحصة بفعالية', subscriberId: 1 },
    { id: 5, text: 'متابعة أداء الطلاب وتقديم التغذية الراجعة', subscriberId: 1 },
];
const initialSupervisoryVisits: SupervisoryVisit[] = [];

// FIX: Add initial data for important dates feature.
const initialImportantDates: ImportantDate[] = [
    {
        id: 1,
        title: 'بداية الاختبارات النصفية',
        date: '2024-06-10',
        type: ImportantDateType.Exam,
        creatorId: 2, // supervisor
        subscriberId: 1,
        targetType: 'all',
    },
    {
        id: 2,
        title: 'رحلة ترفيهية',
        date: '2024-06-20',
        description: 'رحلة إلى منتزه الملك عبدالله للمتميزين في الحفظ.',
        type: ImportantDateType.Activity,
        creatorId: 2,
        subscriberId: 1,
        targetType: 'all',
    },
    {
        id: 3,
        title: 'إجازة عيد الأضحى',
        date: '2024-06-16',
        type: ImportantDateType.Holiday,
        creatorId: 1, // admin
        subscriberId: 1,
        targetType: 'all',
    }
];

const initialSidebarConfig: SidebarConfig = {
    [Role.Admin]: null,
    [Role.AppManager]: null,
    [Role.ManagerOfInstitutions]: null,
    [Role.DeputyManager]: null,
    [Role.Supervisor]: null,
    [Role.Teacher]: null,
    [Role.Accountant]: null,
};
const initialDateFormat: DateFormat = 'gregorian';

export const initialLabels: Record<string, string> = {
    // Sidebar
    'sidebar.dashboard': 'الرئيسية',
    'sidebar.attendance': 'متابعة الطلاب',
    'sidebar.lessonPrep': 'تحضير الدروس',
    'sidebar.studentRecords': 'سجلات الطلاب',
    'sidebar.planApprovals': 'خطط للاعتماد',
    'sidebar.supervisoryVisits': 'الزيارات الإشرافية',
    'sidebar.students': 'إدارة الطلاب',
    'sidebar.halaqat': 'إدارة الحلقات',
    'sidebar.users': 'إدارة المستخدمين',
    'sidebar.studyPlans': 'الخطط الدراسية',
    'sidebar.reports': 'التقارير',
    'sidebar.payments': 'المدفوعات',
    'sidebar.teacherPayments': 'مدفوعات طلابي',
    'sidebar.accountant': 'لوحة المحاسب',
    'sidebar.accountantAlerts': 'الإشعارات',
    'sidebar.messageSettings': 'نماذج الرسائل',
    'sidebar.subscription': 'الاشتراك والفوترة',
    'sidebar.appManager': 'إدارة المشتركين',
    'sidebar.hierarchicalInstitutions': 'المؤسسات والفروع',
    'sidebar.subordinateInstitutions': 'المؤسسات التابعة',
    'sidebar.promotion': 'صفحة الترويج',
    'sidebar.profile': 'الملف الشخصي',
    'sidebar.settings': 'الإعدادات',
    'sidebar.labelCustomization': 'تخصيص المسميات',
    'sidebar.githubActionsGuide': 'دليل GitHub Actions',
    'sidebar.githubSecrets': 'إدارة مفاتيح النشر',

    // Page Titles
    'page.title.attendance': 'متابعة الطلاب',
    'page.title.lessonPrep': 'تحضير الدروس',
    'page.title.studentRecords': 'سجلات الطلاب',
    'page.title.planApprovals': 'خطط الدروس للاعتماد',
    'page.title.supervisoryVisits': 'الزيارات الإشرافية',
    'page.title.students': 'إدارة الطلاب',
    'page.title.halaqat': 'إدارة الحلقات',
    'page.title.users': 'إدارة المستخدمين',
    'page.title.studyPlans': 'الخطط الدراسية',
    'page.title.reports': 'إنشاء التقارير',
    'page.title.payments': 'المدفوعات',
    'page.title.teacherPayments': 'مدفوعات طلابي',
    'page.title.accountantAlerts': 'الإشعارات والتنبيهات',
    'page.title.messageSettings': 'إعداد رسائل التقارير اليومية',
    'page.title.subscription': 'إدارة الاشتراك والفوترة',
    'page.title.appManager': 'إدارة المشتركين',
    'page.title.hierarchicalInstitutions': 'المؤسسات والفروع',
    'page.title.subordinateInstitutions': 'المؤسسات التابعة',
    'page.title.promotion': 'صفحة الترويج والتسويق',
    'page.title.profile': 'الملف الشخصي',
    'page.title.settings': 'إعدادات النظام',
    'page.title.labelCustomization': 'تخصيص المسميات',
    'page.title.githubActionsGuide': 'أتمتة النشر باستخدام GitHub Actions',
    'page.title.githubSecrets': 'إدارة مفاتيح وأسرار النشر',

    // Dashboard Titles
    'dashboard.title.admin': 'لوحة تحكم المدير العام',
    'dashboard.title.supervisor': 'لوحة تحكم المشرف',
    'dashboard.title.teacher': 'لوحة تحكم المعلم',
    'dashboard.title.accountant': 'لوحة تحكم المحاسب',

    // Component Tabs
    'payments.tabs.student_payments': 'سجل المدفوعات',
    'payments.tabs.halaqa_followup': 'متابعة الحلقات',
    'payments.tabs.group_settings': 'إعدادات الرسائل',
    'payments.subtabs.log': 'سجل الدفع',
    'payments.subtabs.stats': 'إحصائيات',
    'payments.subtabs.settings': 'إعدادات',

    'studentManagement.tabs.students': 'إدارة الطلاب',
    'studentManagement.tabs.levels': 'مستويات الطلاب',
    'studentManagement.tabs.importLogic': 'إنشاء منطق استيراد',

    'lessonPrep.tabs.current': 'التحضير الحالي',
    'lessonPrep.tabs.history': 'خططي السابقة',

    'supervisoryVisits.tabs.form': 'استمارة زيارة',
    'supervisoryVisits.tabs.log': 'سجل الزيارات',
    'supervisoryVisits.tabs.items': 'بنود الزيارات',
    
    'studyPlan.tabs.design': 'تصميم الخطط',
    'studyPlan.tabs.data': 'بناء قاعدة الاستدعاء',
    'studyPlan.tabs.classifications': 'تصنيفات المعلمين',

    'teacherPayments.tabs.payments': 'مدفوعات الطلاب',
    'teacherPayments.tabs.settings': 'إعدادات الرسائل',
};


// --- EXPORTED DATA (STATE) ---

export let users: User[] = initializeAndGetData(KEYS.USERS, initialUsers);
export let subscribers: Subscriber[] = initializeAndGetData(KEYS.SUBSCRIBERS, initialSubscribers);
export let halaqat: Halaqa[] = initializeAndGetData(KEYS.HALAQAT, initialHalaqat);
export let students: Student[] = initializeAndGetData(KEYS.STUDENTS, initialStudents);
export let levels: Level[] = initializeAndGetData(KEYS.LEVELS, initialLevels);
export let attendanceRecords: AttendanceRecord[] = initializeAndGetData(KEYS.ATTENDANCE, initialAttendance);
export let progressRecords: ProgressRecord[] = initializeAndGetData(KEYS.PROGRESS, initialProgress);
export let paymentRecords: PaymentRecord[] = initializeAndGetData(KEYS.PAYMENTS, initialPayments);
export let studentClassifications: StudentClassification[] = initializeAndGetData(KEYS.STUDENT_CLASSIFICATIONS, initialStudentClassifications);
export let teacherClassifications: TeacherClassification[] = initializeAndGetData(KEYS.TEACHER_CLASSIFICATIONS, initialTeacherClassifications);
export let accountantAlerts: AccountantAlert[] = initializeAndGetData(KEYS.ACCOUNTANT_ALERTS, initialAccountantAlerts);
export let scheduledAlerts: ScheduledAlert[] = initializeAndGetData(KEYS.SCHEDULED_ALERTS, initialScheduledAlerts);
export let teacherSettings: TeacherSettings[] = initializeAndGetData(KEYS.TEACHER_SETTINGS, initialTeacherSettings);
export let halaqaSettings: HalaqaSetting[] = initializeAndGetData(KEYS.HALAQA_SETTINGS, initialHalaqaSettings);
export let subscriptionPlans: PlanDetails[] = initializeAndGetData(KEYS.SUBSCRIPTION_PLANS, initialSubscriptionPlans);
export let promotionFeatures: PromotionFeature[] = initializeAndGetData(KEYS.PROMOTION_FEATURES, initialPromotionFeatures);
export let studyPlanConfigurations: StudyPlanConfiguration[] = initializeAndGetData(KEYS.STUDY_PLAN_CONFIGS, initialStudyPlanConfigs);
export let studyPlanDataRecords: StudyPlanDataRecord[] = initializeAndGetData(KEYS.STUDY_PLAN_DATA, initialStudyPlanDataRecords);
export let lessonPlanRecords: LessonPlanRecord[] = initializeAndGetData(KEYS.LESSON_PLAN_RECORDS, initialLessonPlanRecords);
export let visitItems: VisitItem[] = initializeAndGetData(KEYS.VISIT_ITEMS, initialVisitItems);
export let supervisoryVisits: SupervisoryVisit[] = initializeAndGetData(KEYS.SUPERVISORY_VISITS, initialSupervisoryVisits);
export let importantDates: ImportantDate[] = initializeAndGetData(KEYS.IMPORTANT_DATES, initialImportantDates);
export let labels: Record<string, string> = initializeAndGetData(KEYS.LABELS, initialLabels);

// --- STATIC DATA ---
export const notifications: Notification[] = [
  { id: 1, text: 'تم تسجيل طالب جديد في حلقتك.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 2, text: 'تقرير الأداء الأسبوعي جاهز للعرض.', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: 3, text: 'تذكير: اجتماع المشرفين غداً الساعة 10 صباحاً.', timestamp: new Date(Date.now() - 172800000).toISOString(), read: true },
];

export const chatRooms: ChatRoom[] = [
    { id: 'halaqa_1_chat', name: 'مشرفي ومعلمي مركز الفرقان', participantIds: [1, 2, 3, 4, 7, 9] },
    { id: 'halaqa_2_chat', name: 'معلمات دار الأترجة', participantIds: [5] },
];

export const chatMessages: ChatMessage[] = [
    { id: 1, roomId: 'halaqa_1_chat', senderId: 2, text: 'السلام عليكم، يرجى من المعلمين رفع تقارير الطلاب قبل نهاية اليوم.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, roomId: 'halaqa_1_chat', senderId: 3, text: 'وعليكم السلام، أبشر أستاذ خالد. سيتم الرفع قريباً.', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
    { id: 3, roomId: 'halaqa_1_chat', senderId: 4, text: 'إن شاء الله.', timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString() },
    { id: 4, roomId: 'halaqa_2_chat', senderId: 5, text: 'هل تم التواصل مع أولياء أمور الطالبات المتأخرات في السداد؟', timestamp: new Date(Date.now() - 86400000).toISOString() },
];


// --- DYNAMIC ID GENERATION ---
let nextUserId = Math.max(0, ...users.map(i => i.id)) + 1;
let nextStudentId = Math.max(0, ...students.map(i => i.id)) + 1;
let nextHalaqaId = Math.max(0, ...halaqat.map(i => i.id)) + 1;
let nextLevelId = Math.max(0, ...levels.map(i => i.id)) + 1;
let nextPaymentId = Math.max(0, ...paymentRecords.map(i => i.id)) + 1;
let nextSubscriberId = Math.max(0, ...subscribers.map(i => i.id)) + 1;
let nextStudentClassificationId = Math.max(0, ...studentClassifications.map(i => i.id)) + 1;
let nextTeacherClassificationId = Math.max(0, ...teacherClassifications.map(i => i.id)) + 1;
let nextAlertId = Math.max(0, ...accountantAlerts.map(i => i.id)) + 1;
let nextScheduledAlertId = Math.max(0, ...scheduledAlerts.map(i => i.id)) + 1;
let nextStudyPlanConfigId = Math.max(0, ...studyPlanConfigurations.map(i => i.id)) + 1;
let nextLessonPlanRecordId = Math.max(0, ...lessonPlanRecords.map(i => i.id)) + 1;
let nextVisitItemId = Math.max(0, ...visitItems.map(i => i.id)) + 1;
let nextSupervisoryVisitId = Math.max(0, ...supervisoryVisits.map(i => i.id)) + 1;
let nextImportantDateId = Math.max(0, ...importantDates.map(i => i.id)) + 1;

// --- Data Manipulation Functions ---

export const getLabels = (): Record<string, string> => {
    const storedLabels = initializeAndGetData(KEYS.LABELS, initialLabels);
    const mergedLabels = { ...initialLabels, ...storedLabels };
    if (Object.keys(mergedLabels).length > Object.keys(storedLabels).length) {
        saveData(KEYS.LABELS, mergedLabels);
    }
    labels = mergedLabels;
    return labels;
};

export const getLabel = (key: string, fallback?: string): string => {
    if (Object.keys(labels).length < Object.keys(initialLabels).length) {
        getLabels();
    }
    return labels[key] ?? fallback ?? key;
};

export const saveLabels = (newLabels: Record<string, string>) => {
    labels = { ...initialLabels, ...newLabels };
    saveData(KEYS.LABELS, labels);
    window.dispatchEvent(new CustomEvent('labels-updated'));
};

export const getPlanLimits = (planName: SubscriptionPlan): { studentLimit: number, teacherLimit: number } => {
    const planDetails = subscriptionPlans.find(p => p.name === planName);
    if (!planDetails) {
        return { studentLimit: 0, teacherLimit: 0 };
    }

    let studentLimit = Infinity;
    let teacherLimit = Infinity;

    planDetails.features.forEach(feature => {
        const studentMatch = feature.match(/(\d+)\s*طالب/);
        if (studentMatch) {
            studentLimit = parseInt(studentMatch[1], 10);
        }

        const teacherMatch = feature.match(/(\d+)\s*معلم/);
        if (teacherMatch) {
            teacherLimit = parseInt(teacherMatch[1], 10);
        }

        if (feature.includes('لا محدود')) {
            studentLimit = Infinity;
            teacherLimit = Infinity;
        }
    });

    return { studentLimit, teacherLimit };
};

export const addUser = (user: Omit<User, 'id'>): User | null => {
    if (user.role === Role.Teacher && user.subscriberId) {
        const subscriber = subscribers.find(s => s.id === user.subscriberId);
        if (subscriber) {
            const limits = getPlanLimits(subscriber.plan);
            const currentTeacherCount = users.filter(u => u.subscriberId === user.subscriberId && u.role === Role.Teacher).length;
            if (currentTeacherCount >= limits.teacherLimit) {
                console.warn(`Subscription limit reached for teachers for subscriber ${user.subscriberId}`);
                return null;
            }
        }
    }
    const newUser: User = { ...user, id: nextUserId++, extraPermissions: user.extraPermissions || [] };
    users.push(newUser);
    saveData(KEYS.USERS, users);
    return newUser;
};

export const updateUser = (updatedUser: User) => {
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        saveData(KEYS.USERS, users);
    }
};

export const deleteUser = (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if ([Role.Admin, Role.AppManager].includes(userToDelete.role)) {
        console.warn("Cannot delete Admin or AppManager users.");
        return;
    }

    users = users.filter(u => u.id !== userId);
    saveData(KEYS.USERS, users);

    if (userToDelete.role === Role.Teacher) {
        halaqat.forEach(h => {
            if (h.teacherIds.includes(userId)) {
                h.teacherIds = h.teacherIds.filter(id => id !== userId);
            }
        });
        saveData(KEYS.HALAQAT, halaqat);
    }

    if (userToDelete.role === Role.Supervisor) {
        const admin = users.find(u => u.subscriberId === userToDelete.subscriberId && u.role === Role.Admin);
        halaqat.forEach(h => {
            if (h.supervisorId === userId) {
                h.supervisorId = admin ? admin.id : h.supervisorId; // Reassign to admin if possible
            }
        });
        saveData(KEYS.HALAQAT, halaqat);
    }
};

export const addHalaqa = (halaqa: Omit<Halaqa, 'id'>): Halaqa => {
    const newHalaqa = { ...halaqa, id: nextHalaqaId++ };
    halaqat.push(newHalaqa);
    saveData(KEYS.HALAQAT, halaqat);
    return newHalaqa;
};

export const updateHalaqa = (updatedHalaqa: Halaqa) => {
    const index = halaqat.findIndex(h => h.id === updatedHalaqa.id);
    if (index !== -1) {
        halaqat[index] = updatedHalaqa;
        saveData(KEYS.HALAQAT, halaqat);
    }
};

export const deleteHalaqa = (halaqaId: number) => {
    halaqat = halaqat.filter(h => h.id !== halaqaId);
    saveData(KEYS.HALAQAT, halaqat);

    // Unassign students from this halaqa by setting halaqaId to a non-existent ID (or null/undefined)
    students.forEach(s => {
        if (s.halaqaId === halaqaId) {
            // @ts-ignore
            s.halaqaId = undefined; 
        }
    });
    saveData(KEYS.STUDENTS, students);
};

export const addStudent = (student: Omit<Student, 'id' | 'paymentStatus'>): Student | null => {
    const classification = studentClassifications.find(c => c.id === student.classificationId);
    const isFreeStudent = classification?.defaultAmount === 0;

    if (student.subscriberId && !isFreeStudent) {
        const subscriber = subscribers.find(s => s.id === student.subscriberId);
        if (subscriber) {
            const limits = getPlanLimits(subscriber.plan);
            const currentStudentCount = students.filter(s => s.subscriberId === student.subscriberId).length;
            if (currentStudentCount >= (limits.studentLimit + 5)) {
                console.warn(`Subscription limit reached for students for subscriber ${student.subscriberId}`);
                return null;
            }
        }
    }
    const newStudent: Student = {
        ...student,
        id: nextStudentId++,
        paymentStatus: PaymentStatus.Unpaid,
        recallIdentifiers: {},
    };
    students.push(newStudent);
    saveData(KEYS.STUDENTS, students);
    return newStudent;
};

export const updateStudent = (updatedStudent: Student) => {
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        students[index] = updatedStudent;
        saveData(KEYS.STUDENTS, students);
    }
};

export const updateStudentRecallIdentifier = (studentId: number, fieldId: string, value: string | null) => {
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        const student = students[studentIndex];
        if (!student.recallIdentifiers) {
            student.recallIdentifiers = {};
        }

        if (value === null) {
            delete student.recallIdentifiers[fieldId];
        } else {
            student.recallIdentifiers[fieldId] = value;
        }
        
        students[studentIndex] = student;
        saveData(KEYS.STUDENTS, students);
        window.dispatchEvent(new CustomEvent('student-data-updated'));
    }
};

export const saveAttendance = (studentId: number, date: string, status: AttendanceStatus) => {
    let record = attendanceRecords.find(a => a.studentId === studentId && a.date === date);
    if (record) {
        record.status = status;
    } else {
        const newRecord: AttendanceRecord = {
            id: Math.max(0, ...attendanceRecords.map(a => a.id)) + 1,
            studentId,
            date,
            status,
        };
        attendanceRecords.push(newRecord);
    }
    saveData(KEYS.ATTENDANCE, attendanceRecords);
};

export const addPayment = (payment: Omit<PaymentRecord, 'id'>) => {
    const newPayment = { ...payment, id: nextPaymentId++ };
    paymentRecords.push(newPayment);
    saveData(KEYS.PAYMENTS, paymentRecords);
    
    const studentIndex = students.findIndex(s => s.id === payment.studentId);
    if (studentIndex !== -1) {
        students[studentIndex].paymentStatus = PaymentStatus.Paid;
        saveData(KEYS.STUDENTS, students);
    }
};

export const deleteStudent = (studentId: number) => {
    students = students.filter(s => s.id !== studentId);
    saveData(KEYS.STUDENTS, students);

    attendanceRecords = attendanceRecords.filter(a => a.studentId !== studentId);
    saveData(KEYS.ATTENDANCE, attendanceRecords);
    
    progressRecords = progressRecords.filter(p => p.studentId !== studentId);
    saveData(KEYS.PROGRESS, progressRecords);
    
    paymentRecords = paymentRecords.filter(p => p.studentId !== studentId);
    saveData(KEYS.PAYMENTS, paymentRecords);
};

export const addSubscriber = (subscriber: Omit<Subscriber, 'id'>): Subscriber => {
    const newSubscriber = { ...subscriber, id: nextSubscriberId++ };
    subscribers.push(newSubscriber);
    saveData(KEYS.SUBSCRIBERS, subscribers);
    return newSubscriber;
};

export const updateSubscriber = (updatedSubscriber: Subscriber) => {
    const index = subscribers.findIndex(s => s.id === updatedSubscriber.id);
    if (index !== -1) {
        subscribers[index] = updatedSubscriber;
        saveData(KEYS.SUBSCRIBERS, subscribers);
    }
};

export const deleteSubscriber = (subscriberId: number) => {
    subscribers = subscribers.filter(s => s.id !== subscriberId);
    saveData(KEYS.SUBSCRIBERS, subscribers);
};

export const addStudentClassification = (classification: Omit<StudentClassification, 'id'>): StudentClassification => {
    const newClassification = { ...classification, id: nextStudentClassificationId++ };
    studentClassifications.push(newClassification);
    saveData(KEYS.STUDENT_CLASSIFICATIONS, studentClassifications);
    return newClassification;
};

export const updateStudentClassification = (updatedClassification: StudentClassification) => {
    const index = studentClassifications.findIndex(c => c.id === updatedClassification.id);
    if (index !== -1) {
        studentClassifications[index] = updatedClassification;
        saveData(KEYS.STUDENT_CLASSIFICATIONS, studentClassifications);
    }
};

export const deleteStudentClassification = (classificationId: number) => {
    studentClassifications = studentClassifications.filter(c => c.id !== classificationId);
    saveData(KEYS.STUDENT_CLASSIFICATIONS, studentClassifications);
    // Also remove this classification from all students
    students.forEach(student => {
        if (student.classificationId === classificationId) {
            delete student.classificationId;
        }
    });
    saveData(KEYS.STUDENTS, students);
};

export const addTeacherClassification = (classification: Omit<TeacherClassification, 'id'>): TeacherClassification => {
    const newClassification = { ...classification, id: nextTeacherClassificationId++ };
    teacherClassifications.push(newClassification);
    saveData(KEYS.TEACHER_CLASSIFICATIONS, teacherClassifications);
    return newClassification;
};

export const updateTeacherClassification = (updatedClassification: TeacherClassification) => {
    const index = teacherClassifications.findIndex(c => c.id === updatedClassification.id);
    if (index !== -1) {
        teacherClassifications[index] = updatedClassification;
        saveData(KEYS.TEACHER_CLASSIFICATIONS, teacherClassifications);
    }
};

export const deleteTeacherClassification = (classificationId: number) => {
    teacherClassifications = teacherClassifications.filter(c => c.id !== classificationId);
    saveData(KEYS.TEACHER_CLASSIFICATIONS, teacherClassifications);
    // Also remove this classification from all teachers
    users.forEach(user => {
        if (user.classificationIds?.includes(classificationId)) {
            user.classificationIds = user.classificationIds.filter(id => id !== classificationId);
        }
    });
    saveData(KEYS.USERS, users);
};

export const addAccountantAlert = (alertData: Omit<AccountantAlert, 'id' | 'readByUserIds' | 'timestamp'>): AccountantAlert => {
    const newAlert: AccountantAlert = {
        ...alertData,
        id: nextAlertId++,
        timestamp: new Date().toISOString(),
        readByUserIds: []
    };
    accountantAlerts.push(newAlert);
    saveData(KEYS.ACCOUNTANT_ALERTS, accountantAlerts);
    return newAlert;
};

export const markAlertAsRead = (alertId: number, userId: number) => {
    const alertIndex = accountantAlerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1 && !accountantAlerts[alertIndex].readByUserIds.includes(userId)) {
        accountantAlerts[alertIndex].readByUserIds.push(userId);
        saveData(KEYS.ACCOUNTANT_ALERTS, accountantAlerts);
    }
};

export const addScheduledAlert = (alertData: Omit<ScheduledAlert, 'id'>): ScheduledAlert => {
    const newAlert: ScheduledAlert = {
        ...alertData,
        id: nextScheduledAlertId++,
    };
    scheduledAlerts.push(newAlert);
    saveData(KEYS.SCHEDULED_ALERTS, scheduledAlerts);
    return newAlert;
};

export const updateScheduledAlert = (updatedAlert: ScheduledAlert) => {
    const index = scheduledAlerts.findIndex(a => a.id === updatedAlert.id);
    if (index !== -1) {
        scheduledAlerts[index] = updatedAlert;
        saveData(KEYS.SCHEDULED_ALERTS, scheduledAlerts);
    }
};

export const deleteScheduledAlert = (alertId: number) => {
    scheduledAlerts = scheduledAlerts.filter(a => a.id !== alertId);
    saveData(KEYS.SCHEDULED_ALERTS, scheduledAlerts);
};

// --- Levels Management ---
export const addLevel = (level: Omit<Level, 'id'>): Level => {
    const newLevel = { ...level, id: nextLevelId++ };
    levels.push(newLevel);
    saveData(KEYS.LEVELS, levels);
    return newLevel;
};

export const updateLevel = (updatedLevel: Level) => {
    const index = levels.findIndex(l => l.id === updatedLevel.id);
    if (index !== -1) {
        levels[index] = updatedLevel;
        saveData(KEYS.LEVELS, levels);
    }
};

export const deleteLevel = (levelId: number) => {
    levels = levels.filter(l => l.id !== levelId);
    saveData(KEYS.LEVELS, levels);
};

// --- Teacher Settings ---
export const getTeacherSettings = (teacherId: number): TeacherSettings | undefined => {
    return teacherSettings.find(s => s.teacherId === teacherId);
};

export const updateTeacherSettings = (settings: TeacherSettings) => {
    const index = teacherSettings.findIndex(s => s.teacherId === settings.teacherId);
    if (index !== -1) {
        teacherSettings[index] = settings;
    } else {
        teacherSettings.push(settings);
    }
    saveData(KEYS.TEACHER_SETTINGS, teacherSettings);
};

// --- Halaqa Settings (Centralized) ---
export const getHalaqaSetting = (halaqaId: number): HalaqaSetting | undefined => {
    return halaqaSettings.find(s => s.halaqaId === halaqaId);
};

export const saveHalaqaSetting = (setting: HalaqaSetting) => {
    const index = halaqaSettings.findIndex(s => s.halaqaId === setting.halaqaId);
    if (index !== -1) {
        halaqaSettings[index] = setting;
    } else {
        halaqaSettings.push(setting);
    }
    saveData(KEYS.HALAQA_SETTINGS, halaqaSettings);
};

// --- Accountant Message Template ---
export const getAccountantGroupMessageTemplate = (): { name: string, template: string } => {
    return initializeAndGetData(KEYS.ACCOUNTANT_GROUP_MESSAGE_TEMPLATE, initialAccountantGroupMessageTemplate);
};

export const saveAccountantGroupMessageTemplate = (data: { name: string, template: string }) => {
    saveData(KEYS.ACCOUNTANT_GROUP_MESSAGE_TEMPLATE, data);
};


// --- Payment Message Templates ---
export const getPaymentMessageTemplate = (type: 'late' | 'paid'): { name: string, template: string } => {
    const key = type === 'late' ? KEYS.LATE_PAYMENT_TEMPLATE : KEYS.PAID_PAYMENT_TEMPLATE;
    const initialData = type === 'late' ? initialLatePaymentTemplate : initialPaidPaymentTemplate;
    return initializeAndGetData(key, initialData);
};

export const savePaymentMessageTemplate = (type: 'late' | 'paid', data: { name: string, template: string }) => {
    const key = type === 'late' ? KEYS.LATE_PAYMENT_TEMPLATE : KEYS.PAID_PAYMENT_TEMPLATE;
    saveData(key, data);
};

export const getSidebarConfig = (): SidebarConfig => {
    return initializeAndGetData(KEYS.SIDEBAR_CONFIG, initialSidebarConfig);
};

export const saveSidebarConfig = (config: SidebarConfig) => {
    saveData(KEYS.SIDEBAR_CONFIG, config);
};

export const getDateFormat = (): DateFormat => {
    return initializeAndGetData(KEYS.DATE_FORMAT, initialDateFormat);
};

export const saveDateFormat = (format: DateFormat) => {
    saveData(KEYS.DATE_FORMAT, format);
};

export const formatDate = (dateString: string | Date): string => {
    if (!dateString) return '';
    try {
        const dateFormat = getDateFormat();
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);
        
        if (dateFormat === 'hijri') {
            return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        }
        
        // Use a reliable format for Gregorian YYYY-MM-DD
        return new Intl.DateTimeFormat('fr-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);

    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return String(dateString).slice(0, 10); // fallback
    }
};

// --- Subscription Plans ---
export const updateSubscriptionPlans = (updatedPlans: PlanDetails[]) => {
    subscriptionPlans = updatedPlans;
    saveData(KEYS.SUBSCRIPTION_PLANS, subscriptionPlans);
};

// --- Promotion Features ---
export const updatePromotionFeatures = (updatedFeatures: PromotionFeature[]) => {
    promotionFeatures = updatedFeatures;
    saveData(KEYS.PROMOTION_FEATURES, promotionFeatures);
};

// --- Study Plans (New Dynamic System) ---

export const saveStudyPlanConfiguration = (config: Omit<StudyPlanConfiguration, 'id'> | StudyPlanConfiguration): StudyPlanConfiguration => {
    if ('id' in config) { // Update
        const index = studyPlanConfigurations.findIndex(c => c.id === config.id);
        if (index !== -1) {
            studyPlanConfigurations[index] = config;
            saveData(KEYS.STUDY_PLAN_CONFIGS, studyPlanConfigurations);
            return config;
        }
    }
    // Add
    const newConfig: StudyPlanConfiguration = { ...config, id: nextStudyPlanConfigId++ } as StudyPlanConfiguration;
    studyPlanConfigurations.push(newConfig);
    saveData(KEYS.STUDY_PLAN_CONFIGS, studyPlanConfigurations);
    return newConfig;
};

export const deleteStudyPlanConfiguration = (configId: number) => {
    studyPlanConfigurations = studyPlanConfigurations.filter(c => c.id !== configId);
    saveData(KEYS.STUDY_PLAN_CONFIGS, studyPlanConfigurations);
    studyPlanDataRecords = studyPlanDataRecords.filter(d => d.planConfigId !== configId);
    saveData(KEYS.STUDY_PLAN_DATA, studyPlanDataRecords);
};

export const getStudyPlanConfigurationsForSubscriber = (subscriberId: number): StudyPlanConfiguration[] => {
    return studyPlanConfigurations.filter(c => c.subscriberId === subscriberId);
};

export const getStudyPlanConfigurationsForTeacher = (teacherId: number): StudyPlanConfiguration[] => {
    const teacher = users.find(u => u.id === teacherId);
    if (!teacher || !teacher.classificationIds || teacher.classificationIds.length === 0 || !teacher.subscriberId) return [];
    
    return studyPlanConfigurations.filter(c => 
        c.subscriberId === teacher.subscriberId && 
        teacher.classificationIds!.some(teacherClassId => c.targetClassificationIds.includes(teacherClassId))
    );
};

// --- Study Plan Data (Recall Database) ---

export const getStudyPlanDataForPlan = (planConfigId: number): StudyPlanDataRecord[] => {
    return studyPlanDataRecords.filter(d => d.planConfigId === planConfigId);
};

export const findStudyPlanDataRecord = (planConfigId: number, recallIdentifiers: Record<string, string>): StudyPlanDataRecord | undefined => {
    const identifierKeys = Object.keys(recallIdentifiers);
    if (identifierKeys.length === 0 || identifierKeys.some(k => !recallIdentifiers[k]?.trim())) {
        return undefined;
    }

    return studyPlanDataRecords.find(d => {
        if (d.planConfigId !== planConfigId) return false;

        const recordIdentifierKeys = Object.keys(d.recallIdentifiers);
        if (recordIdentifierKeys.length !== identifierKeys.length) return false;

        return identifierKeys.every(key =>
            d.recallIdentifiers[key]?.trim().toLowerCase() === recallIdentifiers[key]?.trim().toLowerCase()
        );
    });
};

export const getUniqueRecallValuesForField = (planConfigId: number, fieldId: string): string[] => {
    const values = new Set<string>();
    studyPlanDataRecords
        .filter(d => d.planConfigId === planConfigId && d.recallIdentifiers[fieldId])
        .forEach(d => values.add(d.recallIdentifiers[fieldId]));
    return Array.from(values).sort();
};


export const saveStudyPlanDataForPlan = (planConfigId: number, dataToSave: StudyPlanDataRecord[]) => {
    // Remove old data for this plan
    studyPlanDataRecords = studyPlanDataRecords.filter(d => d.planConfigId !== planConfigId);
    // Add new data
    studyPlanDataRecords.push(...dataToSave);
    saveData(KEYS.STUDY_PLAN_DATA, studyPlanDataRecords);
};

// --- Lesson Prep Approvals ---
export const saveLessonPlanRecord = (planRecord: Omit<LessonPlanRecord, 'id'> | LessonPlanRecord): LessonPlanRecord => {
    const recordWithTimestamp = { ...planRecord, lastModified: new Date().toISOString() };

    if ('id' in recordWithTimestamp && recordWithTimestamp.id !== -1) { // Update
        const index = lessonPlanRecords.findIndex(p => p.id === recordWithTimestamp.id);
        if (index !== -1) {
            lessonPlanRecords[index] = recordWithTimestamp as LessonPlanRecord;
            saveData(KEYS.LESSON_PLAN_RECORDS, lessonPlanRecords);
            return recordWithTimestamp as LessonPlanRecord;
        }
    }
    // Add new
    const newRecord: LessonPlanRecord = { ...recordWithTimestamp, id: nextLessonPlanRecordId++ } as LessonPlanRecord;
    lessonPlanRecords.push(newRecord);
    saveData(KEYS.LESSON_PLAN_RECORDS, lessonPlanRecords);
    return newRecord;
};

export const getLessonPlanRecord = (teacherId: number, halaqaId: number, date: string): LessonPlanRecord | undefined => {
    return lessonPlanRecords.find(p => 
        p.teacherId === teacherId &&
        p.halaqaId === halaqaId &&
        p.date === date
    );
};

export const getLessonPlansForTeacher = (teacherId: number): LessonPlanRecord[] => {
    return lessonPlanRecords
        .filter(p => p.teacherId === teacherId)
        .sort((a, b) => {
            const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
            const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
            return dateB - dateA;
        });
};

export const deleteLessonPlanRecord = (id: number) => {
    lessonPlanRecords = lessonPlanRecords.filter(p => p.id !== id);
    saveData(KEYS.LESSON_PLAN_RECORDS, lessonPlanRecords);
};


export const getPendingApprovalsForSupervisor = (supervisorId: number): LessonPlanRecord[] => {
    return lessonPlanRecords.filter(
        a => a.supervisorId === supervisorId && a.status === 'pending'
    );
};

export const updateApprovalStatus = (approvalId: number, newStatus: 'approved' | 'rejected', notes?: string) => {
    const index = lessonPlanRecords.findIndex(a => a.id === approvalId);
    if (index !== -1) {
        lessonPlanRecords[index].status = newStatus;
        lessonPlanRecords[index].supervisorNotes = notes;
        lessonPlanRecords[index].lastModified = new Date().toISOString();
        saveData(KEYS.LESSON_PLAN_RECORDS, lessonPlanRecords);
    }
};

export const applyLessonPlanToStudents = (planRecord: LessonPlanRecord) => {
    const halaqaStudents = students.filter(s => s.halaqaId === planRecord.halaqaId);
    
    halaqaStudents.forEach(student => {
        // Find if a progress record for this student and day already exists
        let progressRecord = progressRecords.find(p => p.studentId === student.id && p.date === planRecord.date);

        const progressJson = JSON.stringify(planRecord.planData);

        if (progressRecord) {
            // Update existing record
            progressRecord.progressData = progressJson;
            progressRecord.planConfigId = planRecord.planConfigId;
        } else {
            // Create new record
            const newRecord: ProgressRecord = {
                id: Math.max(0, ...progressRecords.map(p => p.id)) + 1,
                studentId: student.id,
                date: planRecord.date,
                memorized: '', // Legacy
                revised: '',   // Legacy
                progressData: progressJson,
                planConfigId: planRecord.planConfigId,
            };
            progressRecords.push(newRecord);
        }
    });

    saveData(KEYS.PROGRESS, progressRecords);
};

export const updateStudentProgressField = (studentId: number, date: string, fieldId: string, value: string) => {
    let record = progressRecords.find(p => p.studentId === studentId && p.date === date);
    if (!record) {
        // Find student to get planConfigId if possible
        const student = students.find(s => s.id === studentId);
        const teacher = users.find(u => u.id === student?.teacherId);
        
        // This is a simplified way to find the plan. A more robust solution might be needed
        // if a teacher can have multiple plans for different classifications.
        const plans = teacher ? getStudyPlanConfigurationsForTeacher(teacher.id) : [];
        const planConfigId = plans.length > 0 ? plans[0].id : undefined;

        record = {
            id: Math.max(0, ...progressRecords.map(p => p.id)) + 1,
            studentId,
            date,
            memorized: '',
            revised: '',
            progressData: JSON.stringify({ [fieldId]: value }),
            planConfigId,
        };
        progressRecords.push(record);
    } else {
        const data = record.progressData ? JSON.parse(record.progressData) : {};
        data[fieldId] = value;
        record.progressData = JSON.stringify(data);
    }
    saveData(KEYS.PROGRESS, progressRecords);
};


// --- Supervisory Visits ---
export const getVisitItemsForSubscriber = (subscriberId: number): VisitItem[] => {
    return visitItems.filter(item => item.subscriberId === subscriberId);
};

export const addVisitItem = (item: Omit<VisitItem, 'id'>): VisitItem => {
    const newItem = { ...item, id: nextVisitItemId++ };
    visitItems.push(newItem);
    saveData(KEYS.VISIT_ITEMS, visitItems);
    return newItem;
};

export const updateVisitItem = (updatedItem: VisitItem) => {
    const index = visitItems.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
        visitItems[index] = updatedItem;
        saveData(KEYS.VISIT_ITEMS, visitItems);
    }
};

export const deleteVisitItem = (itemId: number) => {
    visitItems = visitItems.filter(i => i.id !== itemId);
    saveData(KEYS.VISIT_ITEMS, visitItems);
};

export const addSupervisoryVisit = (visit: Omit<SupervisoryVisit, 'id'>): SupervisoryVisit => {
    const newVisit = { ...visit, id: nextSupervisoryVisitId++ };
    supervisoryVisits.push(newVisit);
    saveData(KEYS.SUPERVISORY_VISITS, supervisoryVisits);
    return newVisit;
};

export const deleteSupervisoryVisit = (visitId: number) => {
    supervisoryVisits = supervisoryVisits.filter(v => v.id !== visitId);
    saveData(KEYS.SUPERVISORY_VISITS, supervisoryVisits);
};

// FIX: Add data manipulation functions for important dates.
export const addImportantDate = (date: Omit<ImportantDate, 'id'>): ImportantDate => {
    const newDate = { ...date, id: nextImportantDateId++ };
    importantDates.push(newDate);
    saveData(KEYS.IMPORTANT_DATES, importantDates);
    return newDate;
};

export const updateImportantDate = (updatedDate: ImportantDate) => {
    const index = importantDates.findIndex(d => d.id === updatedDate.id);
    if (index !== -1) {
        importantDates[index] = updatedDate;
        saveData(KEYS.IMPORTANT_DATES, importantDates);
    }
};

export const deleteImportantDate = (dateId: number) => {
    importantDates = importantDates.filter(d => d.id !== dateId);
    saveData(KEYS.IMPORTANT_DATES, importantDates);
};

export const saveBatchData = (
    attendanceData: Record<number, AttendanceStatus>,
    progressData: Record<number, Record<string, string>>,
    date: string
) => {
    // --- Batch Attendance ---
    const attendanceMap = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(rec => attendanceMap.set(`${rec.date}-${rec.studentId}`, rec));
    let nextAttendanceId = Math.max(0, ...attendanceRecords.map(a => a.id)) + 1;

    Object.entries(attendanceData).forEach(([studentIdStr, status]) => {
        const studentId = parseInt(studentIdStr, 10);
        const key = `${date}-${studentId}`;
        const record = attendanceMap.get(key);

        if (record) {
            if(record.status !== status) record.status = status;
        } else {
            const newRecord: AttendanceRecord = {
                id: nextAttendanceId++,
                studentId,
                date,
                status,
            };
            attendanceRecords.push(newRecord);
            attendanceMap.set(key, newRecord);
        }
    });
    saveData(KEYS.ATTENDANCE, attendanceRecords);

    // --- Batch Progress ---
    const progressMap = new Map<string, ProgressRecord>();
    progressRecords.forEach(rec => progressMap.set(`${rec.date}-${rec.studentId}`, rec));
    let nextProgressId = Math.max(0, ...progressRecords.map(p => p.id)) + 1;

    Object.entries(progressData).forEach(([studentIdStr, studentProgressData]) => {
        const studentId = parseInt(studentIdStr, 10);
        const key = `${date}-${studentId}`;
        let record = progressMap.get(key);
        
        const hasDataToSave = Object.values(studentProgressData).some(v => v);

        if (record) {
            const data = record.progressData ? JSON.parse(record.progressData) : {};
            // Merge new data with existing
            Object.assign(data, studentProgressData);
            record.progressData = JSON.stringify(data);
        } else if (hasDataToSave) {
            // Only create if there's data to save
            const student = students.find(s => s.id === studentId);
            const teacher = users.find(u => u.id === student?.teacherId);
            const plans = teacher ? getStudyPlanConfigurationsForTeacher(teacher.id) : [];
            const planConfigId = plans.length > 0 ? plans[0].id : undefined;

            const newRecord: ProgressRecord = {
                id: nextProgressId++,
                studentId,
                date,
                memorized: '', // Legacy
                revised: '',   // Legacy
                progressData: JSON.stringify(studentProgressData),
                planConfigId,
            };
            progressRecords.push(newRecord);
            progressMap.set(key, newRecord);
        }
    });
    saveData(KEYS.PROGRESS, progressRecords);
};
