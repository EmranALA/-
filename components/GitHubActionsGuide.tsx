import React from 'react';
import { useLabels } from '../context/AuthContext';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-slate-800 text-white p-4 rounded-lg overflow-x-auto text-sm" dir="ltr">
        <code>{children}</code>
    </pre>
);

const GitHubActionsGuide: React.FC = () => {
    const { getLabel } = useLabels();

    const workflowYaml = `name: Build and Release to Google Play

on:
  push:
    branches:
      - main # Trigger workflow on push to the main branch

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      # These steps assume you have a build process (e.g., using Vite, Webpack)
      # that generates static files in a 'dist' directory.
      - name: Install dependencies
        run: npm install
      - name: Build web application
        run: npm run build # This should output to ./dist

      - name: Install Bubblewrap CLI
        run: npm install -g @bubblewrap/cli

      - name: Decode Signing Key
        run: echo \${{ secrets.SIGNING_KEY_BASE64 }} | base64 --decode > ./key.keystore

      - name: Build Android App Bundle (AAB)
        run: |
          bubblewrap build --manifest ./dist/manifest.json \\
            --signingKeyPath ./key.keystore \\
            --signingKeyAlias \${{ secrets.SIGNING_KEY_ALIAS }} \\
            --signingKeyPassword \${{ secrets.SIGNING_KEY_PASSWORD }} \\
            --host "https://app.yourdomain.com" # Required for Digital Asset Links
        
      - name: Upload AAB to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: \${{ secrets.PLAY_STORE_SA_KEY_JSON }}
          packageName: com.yourcompany.halaqa
          releaseFiles: app-release-bundle.aab
          track: internal # or 'production', 'beta', 'alpha'
`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold">{getLabel('page.title.githubActionsGuide')}</h2>
            <p className="text-slate-600">
                هذا الدليل يشرح كيفية أتمتة عملية بناء تطبيق ويب وتغليفه كتطبيق أندرويد لنشره على متجر Google Play باستخدام GitHub Actions وأداة Bubblewrap.
            </p>

            <div className="p-4 bg-sky-50 border-r-4 border-sky-500 rounded-md">
                <h3 className="font-bold text-sky-800">ما هو Bubblewrap؟</h3>
                <p className="text-sm text-slate-700 mt-1">
                    هي أداة من Google تقوم بإنشاء مشروع Android يغلف تطبيق الويب الخاص بك. الناتج النهائي هو حزمة تطبيقات Android (AAB) يمكنك تحميلها إلى Google Play.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold border-b pb-2">الخطوات</h3>

                <div>
                    <h4 className="font-semibold text-lg">الخطوة 1: إنشاء ملف Workflow</h4>
                    <p className="text-slate-600 mt-1">
                        في مستودع GitHub الخاص بك، قم بإنشاء ملف جديد بالمسار التالي: <code className="bg-slate-100 p-1 rounded text-sm">.github/workflows/release.yml</code>
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-lg">الخطوة 2: إضافة محتوى Workflow</h4>
                    <p className="text-slate-600 mt-1 mb-2">
                        انسخ والصق الكود التالي في ملف <code className="bg-slate-100 p-1 rounded text-sm">release.yml</code>. تأكد من أن لديك عملية بناء (build process) تضع كل الملفات النهائية في مجلد <code className="bg-slate-100 p-1 rounded text-sm">dist</code> واستبدل القيم المؤقتة مثل <code className="bg-slate-100 p-1 rounded text-sm">app.yourdomain.com</code> و <code className="bg-slate-100 p-1 rounded text-sm">com.yourcompany.halaqa</code>.
                    </p>
                    <CodeBlock>{workflowYaml}</CodeBlock>
                </div>

                <div>
                    <h4 className="font-semibold text-lg">الخطوة 3: فهم الـ Workflow</h4>
                    <ul className="list-disc pr-5 mt-2 space-y-2 text-slate-700">
                        <li><strong className="font-bold">on: push: branches: [ main ]</strong>: يتم تشغيل هذا الـ workflow تلقائياً عند أي عملية دفع (push) إلى الفرع الرئيسي (main).</li>
                        <li><strong className="font-bold">Build web application</strong>: تقوم هذه الخطوات بتجهيز تطبيق الويب الخاص بك عن طريق تثبيت الاعتماديات ثم بناء الملفات النهائية (HTML, JS, CSS) في مجلد `dist`. هذا يضمن أن جميع أصول التطبيق مجمعة محلياً وجاهزة للتغليف.</li>
                        <li><strong className="font-bold">Install Bubblewrap CLI</strong>: يقوم بتثبيت أداة Bubblewrap اللازمة لعملية البناء.</li>
                        <li><strong className="font-bold">Build Android App Bundle (AAB)</strong>: هذه هي الخطوة الأساسية. يستخدم Bubblewrap ملف `manifest.json` المحلي من مجلد `dist` للحصول على معلومات التطبيق. يقوم بعد ذلك بإنشاء مشروع Android قياسي يغلف تطبيق الويب الخاص بك. لاحظ أن الحقل `--host` لا يزال مطلوباً حتى يتمكن Google Play من التحقق من أنك تملك محتوى التطبيق، مما ينشئ رابطاً آمناً بين تطبيقك والنطاق الخاص بك.</li>
                        <li><strong className="font-bold">Upload AAB to Google Play</strong>: تستخدم هذه الخطوة action جاهز لرفع ملف AAB الناتج إلى حسابك في Google Play Console. يتطلب هذا وجود حساب خدمة (Service Account) تم إعداده مسبقاً.</li>
                    </ul>
                </div>

                 <div>
                    <h4 className="font-semibold text-lg">الخطوة 4: إعداد مفاتيح النشر (Secrets)</h4>
                    <p className="text-slate-600 mt-1">
                        هذا الـ workflow يعتمد على وجود "Secrets" في مستودع GitHub الخاص بك. هذه هي متغيرات حساسة مثل مفاتيح التوقيع وكلمات المرور. انتقل إلى دليل "إدارة مفاتيح وأسرار النشر" لمعرفة كيفية إنشائها بالتفصيل.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GitHubActionsGuide;