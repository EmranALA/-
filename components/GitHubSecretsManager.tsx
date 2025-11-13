import React from 'react';
import { useLabels } from '../context/AuthContext';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-slate-800 text-white p-4 rounded-lg overflow-x-auto text-sm" dir="ltr">
        <code>{children}</code>
    </pre>
);

const GitHubSecretsManager: React.FC = () => {
    const { getLabel } = useLabels();
    
    const keytoolCommand = `keytool -genkey -v -keystore key.keystore -alias your_alias_name -keyalg RSA -keysize 2048 -validity 10000`;
    const base64Command = `cat key.keystore | base64`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold">{getLabel('page.title.githubSecrets')}</h2>
            <p className="text-slate-600">
                لأتمتة عملية النشر بشكل آمن، تحتاج إلى تخزين المعلومات الحساسة (مثل مفاتيح التوقيع) كـ "Secrets" في مستودع GitHub الخاص بك. انتقل إلى <code className="bg-slate-100 p-1 rounded text-sm">Settings &gt; Secrets and variables &gt; Actions</code> في مستودعك لإنشاء الأسرار التالية.
            </p>

            <div className="space-y-6">
                {/* Signing Key Secret */}
                <div className="p-4 bg-slate-50 border-r-4 border-sky-500 rounded-md">
                    <h3 className="font-bold text-lg text-sky-800">1. مفتاح توقيع التطبيق (Signing Key)</h3>
                    <p className="text-sm text-slate-700 mt-2 mb-4">
                        يجب توقيع جميع تطبيقات Android قبل نشرها. اتبع الخطوات التالية لإنشاء مفتاح وتخزينه بأمان.
                    </p>
                    <div className="space-y-3">
                        <p><strong>أ. إنشاء ملف Keystore:</strong> افتح الـ Terminal أو Command Prompt ونفّذ الأمر التالي. سيطلب منك إدخال كلمة مرور وبعض المعلومات.</p>
                        <CodeBlock>{keytoolCommand}</CodeBlock>
                        <p><strong>ب. تحويل الملف إلى Base64:</strong> لتخزين الملف في GitHub Secrets، يجب تحويله إلى نص. نفّذ الأمر التالي وانسخ الناتج بالكامل.</p>
                        <CodeBlock>{base64Command}</CodeBlock>
                        <p><strong>ج. إنشاء الـ Secret:</strong> في إعدادات GitHub Secrets، قم بإنشاء secret جديد بالاسم:</p>
                        <div className="p-2 bg-white border rounded-md">
                            <code className="font-bold text-indigo-700">SIGNING_KEY_BASE64</code>
                        </div>
                        <p>وألصق النص الذي نسخته في الخطوة السابقة كقيمة له.</p>
                    </div>
                </div>

                {/* Other Signing Secrets */}
                <div className="p-4 bg-slate-50 border-r-4 border-sky-500 rounded-md">
                    <h3 className="font-bold text-lg text-sky-800">2. بيانات مفتاح التوقيع</h3>
                    <p className="text-sm text-slate-700 mt-2 mb-4">
                        أنشئ الأسرار التالية بنفس الطريقة، باستخدام نفس القيم التي أدخلتها عند إنشاء ملف Keystore.
                    </p>
                     <div className="space-y-3">
                        <div>
                             <p><strong>أ. اسم الـ Alias:</strong></p>
                            <div className="p-2 bg-white border rounded-md">
                                <code className="font-bold text-indigo-700">SIGNING_KEY_ALIAS</code>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">القيمة هي <code className="bg-slate-200 text-xs p-0.5 rounded">your_alias_name</code> التي استخدمتها في الأمر.</p>
                        </div>
                         <div>
                             <p><strong>ب. كلمة مرور المفتاح:</strong></p>
                            <div className="p-2 bg-white border rounded-md">
                                <code className="font-bold text-indigo-700">SIGNING_KEY_PASSWORD</code>
                            </div>
                             <p className="text-xs text-slate-500 mt-1">القيمة هي كلمة المرور التي اخترتها.</p>
                        </div>
                    </div>
                </div>

                {/* Play Store Service Account */}
                <div className="p-4 bg-slate-50 border-r-4 border-sky-500 rounded-md">
                    <h3 className="font-bold text-lg text-sky-800">3. حساب خدمة Google Play</h3>
                    <p className="text-sm text-slate-700 mt-2 mb-4">
                        للسماح لـ GitHub Actions برفع التطبيق إلى Google Play، تحتاج إلى إنشاء حساب خدمة ومنحه الأذونات اللازمة.
                    </p>
                    <ul className="list-decimal pr-5 space-y-2 text-sm">
                        <li>اذهب إلى <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-semibold">Google Cloud Console</a> وأنشئ مشروعاً جديداً (أو استخدم مشروعاً قائماً).</li>
                        <li>اذهب إلى "IAM & Admin" ثم "Service Accounts" وأنشئ حساب خدمة جديد.</li>
                        <li>بعد إنشاء الحساب، اذهب إلى تبويب "Keys"، ثم "Add Key"، واختر "Create new key" من نوع JSON. سيتم تحميل ملف JSON إلى جهازك.</li>
                        <li>اذهب إلى <a href="https://play.google.com/console/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-semibold">Google Play Console</a>، ثم "Users and permissions".</li>
                        <li>ادعُ مستخدماً جديداً، وألصق البريد الإلكتروني لحساب الخدمة الذي أنشأته.</li>
                        <li>امنح الحساب صلاحيات "Admin" (أو صلاحيات محددة لإدارة الإصدارات).</li>
                        <li>أخيراً، افتح ملف JSON الذي حملته، انسخ محتواه بالكامل، وأنشئ secret جديداً في GitHub بالاسم:</li>
                    </ul>
                     <div className="p-2 mt-2 bg-white border rounded-md">
                        <code className="font-bold text-indigo-700">PLAY_STORE_SA_KEY_JSON</code>
                    </div>
                     <p className="text-sm text-slate-700 mt-1">ألصق محتوى ملف JSON كقيمة لهذا الـ secret.</p>
                </div>
            </div>
        </div>
    );
};

export default GitHubSecretsManager;