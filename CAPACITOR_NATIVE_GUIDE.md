
## 13. GitHub Actions لبناء APK وAAB

تمت إضافة Workflow في:

```text
.github/workflows/android-build.yml
```

يعمل تلقائيًا عند كل Push إلى `main`، ويمكن تشغيله يدويًا من تبويب **Actions** عبر **Run workflow**. يقوم بالآتي:

1. تثبيت Node.js وJava 21 وAndroid SDK.
2. تنفيذ `npm ci`.
3. تنفيذ `npm run cap:sync`.
4. بناء `assembleRelease` و`bundleRelease`.
5. رفع APK وAAB كـ Workflow Artifacts.

لبناء ملفات Release موقعة، أضف Secrets التالية إلى إعدادات مستودع GitHub من **Settings > Secrets and variables > Actions**:

| Secret | القيمة |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | محتوى `taget-release.keystore` بعد تحويله إلى Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | كلمة مرور Keystore |
| `ANDROID_KEY_ALIAS` | غالبًا `taget` |
| `ANDROID_KEY_PASSWORD` | كلمة مرور المفتاح داخل Keystore |

لتحويل ملف Keystore إلى Base64:

```bash
base64 -w 0 android/taget-release.keystore > keystore.base64.txt
```

انسخ محتوى `keystore.base64.txt` إلى Secret باسم `ANDROID_KEYSTORE_BASE64`، ثم احذف الملف النصي من جهازك إذا لم تعد تحتاجه.

إذا لم تتم إضافة Secrets، يبني الـWorkflow **Debug APK موقّعًا تلقائيًا وقابلًا للتثبيت**، ويتخطى Release APK/AAB. بعد إضافة Secrets سيبني Workflow نسخة Release APK وAAB موقعة تلقائيًا. لا تحاول تثبيت ملف باسم `app-release-unsigned.apk`؛ فهذا ملف غير موقّع وسيظهر على الهاتف كحزمة غير صالحة.

لا ترفع Keystore أو ملف Base64 إلى المستودع. الـ Workflow ينشئ الملفات مؤقتًا داخل Runner ويتم تنظيفها عند انتهاء المهمة.
