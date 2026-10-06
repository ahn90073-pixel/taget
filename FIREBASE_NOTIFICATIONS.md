# إشعارات Firebase لتطبيق تاجر

تم تفعيل تسجيل Firebase Cloud Messaging داخل تطبيق Android باستخدام سر GitHub:

```text
GOOGLE_SERVICES_JSON_BASE64
```

## ما تم دمجه

- تثبيت `@capacitor/push-notifications`.
- طلب إذن الإشعارات عند تشغيل التطبيق على Android.
- تسجيل الجهاز مع Firebase والحصول على FCM token.
- استقبال الإشعارات أثناء تشغيل التطبيق أو عند فتحها.
- حفظ آخر token محليًا في `taget_fcm_token`.
- فك ملف `google-services.json` داخل GitHub Actions فقط.
- منع إضافة `android/app/google-services.json` إلى Git.
- تفعيل عرض التنبيه والصوت والشارة من إعدادات Capacitor.

## متطلبات السر

يجب أن تكون قيمة `GOOGLE_SERVICES_JSON_BASE64` هي محتوى ملف Firebase الأصلي بعد تحويله إلى Base64، وليس مسار الملف أو JSON عاديًا.

مثال التحويل محليًا:

```bash
base64 -w 0 google-services.json
```

لا تضع الناتج في ملفات المشروع أو في رسائل عامة. أضفه في GitHub من:

`Settings → Secrets and variables → Actions → New repository secret`

بالاسم:

```text
GOOGLE_SERVICES_JSON_BASE64
```

ويجب أن يحتوي الملف على Android package name:

```text
com.taget.app
```

## اختبار الإشعارات

1. ثبّت APK مبنيًا من GitHub Actions بعد نجاح Workflow.
2. وافق على إذن الإشعارات عند أول تشغيل.
3. احصل على FCM token من سجل Android أو من طبقة التطبيق.
4. استخدم Firebase Console لإرسال Test message إلى الجهاز.

الإشعارات لا تُرسل تلقائيًا بمجرد توليد token؛ يلزم إرسالها من Firebase Console أو من خادم Backend باستخدام Firebase Admin SDK.

## iOS

تمت إضافة جسر Capacitor المطلوب لتسجيل APNs داخل `AppDelegate.swift`، لكن تشغيل Firebase/FCM على iOS يحتاج أيضًا إلى:

- ملف `GoogleService-Info.plist` الخاص بـ iOS.
- تفعيل Push Notifications وBackground Modes في Xcode.
- مفتاح APNs أو إعدادات Apple Developer.
- Secret منفصل في GitHub، مثل `GOOGLE_SERVICE_INFO_PLIST_BASE64`، إذا أردت بناء IPA موقّعًا مع Firebase.

سر `GOOGLE_SERVICES_JSON_BASE64` وحده خاص بتطبيق Android ولا يكفي لإشعارات iOS.
