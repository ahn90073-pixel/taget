# اسم التطبيق وتحديث OTA عبر GitHub Releases

## تغيير الاسم

تم تغيير الاسم الظاهر للمستخدم إلى **تاجر** في:

- `capacitor.config.json`
- `android/app/src/main/res/values/strings.xml`
- `ios/App/App/Info.plist`

لم يتغير `com.taget.app` لأنه هوية التطبيق في Android وiOS. تغييره بعد النشر سيعامل التطبيق كتطبيق جديد.

يدعم إصدار iOS الحالي ابتداءً من **iOS 16** لأن Plugin Live Update يتطلب iOS 16 أو أحدث.

## كيف يعمل OTA

تمت إضافة إضافة `@capawesome/capacitor-live-update` مع عميل داخل:

```text
src/utils/liveUpdates.js
```

عند بدء التطبيق الأصلي:

1. يعلن التطبيق أن الـBundle الحالي جاهز.
2. يقرأ `ota-manifest.json` من GitHub Release ثابت اسمه `ota-latest`.
3. إذا كان هناك `bundleId` جديد، ينزّل `ota-bundle.zip`.
4. يحدد الحزمة الجديدة للاستخدام ويعيد تحميل التطبيق.
5. إذا فشلت الحزمة الجديدة قبل إعلان الجاهزية، يعيد Plugin التطبيق إلى الحزمة السابقة.

> حاليًا تم تفعيل حزمة OTA في Android، بينما يحافظ هدف iOS على بناء مستقر بدون ربط Plugin Live Update بسبب تعارض Swift Package مع Capacitor 8.0 في GitHub Runner. Workflow نشر OTA يعمل ويجهز الحزم، لكن تفعيل التحميل داخل iOS يحتاج إصدارًا متوافقًا من Plugin أو Provider مخصصًا قبل توزيع نسخة iOS للمستخدمين.

## النشر التلقائي

الملف:

```text
.github/workflows/ota-release.yml
```

يَعمل عند كل Push إلى `main`، ويبني `dist` ثم ينشر:

```text
ota-bundle.zip
ota-manifest.json
```

داخل Release باسم `ota-latest`.

## سياسة الإصدار الواحد

تم ضبط Actions لتفصل بين نوعي التغييرات:

- تعديلات `src/` وملفات الواجهة: تُنشر OTA فقط، ولا تُنشئ APK/AAB أو IPA جديدًا.
- تعديلات Kotlin/Swift أو إعدادات Capacitor: تُشغّل بناء Android/iOS جديدًا لأنها تحتاج كودًا أصليًا جديدًا.

لذلك تظل نسخة التطبيق المثبتة كما هي، مثلًا `1.0.0`، بينما يتغير `bundleId` الداخلي للواجهة مع كل إصدار OTA. لا تغيّر `versionCode` أو `CFBundleShortVersionString` عند تعديل الواجهة فقط.

يشترط أن يكون التطبيق الأصلي قد بُني بعد دمج Live Update؛ النسخ القديمة التي لا تحتوي Plugin التحديث لن تستطيع تطبيق حزمة OTA.

## شرط مهم للمستودع الخاص

التطبيق المثبت على الهاتف لا يستطيع قراءة GitHub Release من مستودع خاص بدون توثيق. لا تضع GitHub Token داخل التطبيق؛ لأنه سيكون قابلًا للاستخراج.

لذلك يلزم أحد الحلول التالية قبل تفعيل OTA للمستخدمين:

1. جعل Release/المستودع قابلًا للقراءة العامة.
2. نشر `ota-bundle.zip` و`ota-manifest.json` على GitHub Pages عام.
3. استخدام CDN أو خادم تحديث عام، مع إبقاء مصدر المشروع خاصًا.

رابط OTA المضمّن حاليًا هو:

```text
https://github.com/zazotona301-oss/taget/releases/download/ota-latest/ota-manifest.json
```

يمكن تغييره بدون تعديل الكود عبر متغير البناء:

```bash
VITE_OTA_MANIFEST_URL=https://your-public-host/ota-manifest.json npm run build
```

## الحماية

OTA يحدّث ملفات الواجهة فقط، وليس كود Kotlin/Swift أو صلاحيات التطبيق أو نسخة Capacitor الأصلية. أي تغيير Native يحتاج APK/AAB أو IPA جديدًا عبر المتجر.

لبيئة الإنتاج، يجب إضافة تحقق توقيع للحزم عبر `publicKey` في إعداد Live Update وعدم الاعتماد على HTTPS وحده. لا تضع المفتاح الخاص داخل المستودع؛ المفتاح الخاص يستخدم في Workflow فقط، بينما المفتاح العام يمكن تضمينه في التطبيق.
