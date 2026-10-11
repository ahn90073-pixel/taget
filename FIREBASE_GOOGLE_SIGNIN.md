# تسجيل التاجر باستخدام Google على Android

يستخدم تطبيق Android تسجيل Google الأصلي من خلال Firebase Authentication. يحصل التطبيق على Firebase ID token ويرسله عبر HTTPS إلى `tagerbackend`؛ يتحقق الباك إند من توقيع Google و`issuer` و`audience` وكون موفر الدخول `google.com` والبريد مؤكّدًا قبل إنشاء جلسة التاجر.

عند التسجيل الأول، يحفظ الباك إند حساب التاجر في `public.users` ويربطه بـFirebase UID، ثم ينشئ الشركة وعضوية المالك ومخطط PostgreSQL المستقل باستخدام إجراء قاعدة البيانات الموجود. يكون اسم المخطط آمنًا من ناحية الأحرف ويستند إلى اسم المتجر مع لاحقة فريدة، مثل `tenant_store_name_ab12cd34`. إذا سجّل حساب موجود من قبل، يُربط بحساب Google بعد التحقق من البريد ولا تُنشأ له شركة مكررة.

على Android يظهر تسجيل Google في النسخة التي تحتوي على الـnative plugin. إذا وصلت حزمة OTA إلى نسخة Android أقدم لا تحتوي على هذا الـplugin، يبقى تسجيل الدخول الحالي ظاهرًا مؤقتًا كي لا يفقد المستخدمون إمكانية الدخول؛ إنشاء حسابات جديدة على Android يتم من خلال Google بعد تثبيت APK المحدّث. يحتفظ إصدار الويب بتدفق البريد وكلمة المرور الموجود، ولا يتغير مسار تسجيل iOS.

## إعداد Firebase

- فعّل Google ضمن Firebase Authentication في المشروع `tager-z`.
- تأكد من وجود Android app بمعرّف الحزمة `com.taget.app` في مشروع Firebase نفسه.
- أضف بصمات SHA-1 وSHA-256 لشهادة Debug وشهادة Release أو Play App Signing المستخدمة فعليًا، ثم نزّل ملف `google-services.json` المحدّث.
- يوجد إعداد Firebase الخاص بتطبيق العميل في `android/app/google-services.json` ضمن المستودع، ويقرأه Gradle مباشرة عند البناء؛ لا حاجة إلى GitHub Actions Secret له.
- يحتوي الملف على إعدادات Firebase العامة الخاصة بالعميل فقط، وليس مفتاح خدمة أو بيانات اعتماد خاصة. يتحقق سير البناء من المشروع `tager-z` ومعرّف الحزمة `com.taget.app` قبل التجميع.

يُضبط Firebase project ID غير السري على Worker باسم `FIREBASE_PROJECT_ID`. تُطبق Migration `0005_firebase_google_merchant_auth.sql` من سير عمل نشر `tagerbackend` قبل تحديث Worker. لا توجد حاجة لتحديث ملف Android أو إصدار OTA لتطبيق هذا التغيير على شاشة الدخول؛ تسجيل Google native يتطلب تثبيت نسخة Android مبنية بعد إضافة plugin والإعدادات.
