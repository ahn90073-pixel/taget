# iOS GitHub Actions

تمت إضافة Workflow في:

```text
.github/workflows/ios-build.yml
```

يعمل على macOS عبر `macos-14`، ويبني نسخة الويب ثم يزامن Capacitor ويُنشئ XCArchive. عند إضافة أسرار Apple المطلوبة، يُصدّر IPA موقّعًا.

## بدون أسرار Apple

ينتج Workflow:

```text
taget-ios-archive-<commit>
```

وهو XCArchive غير موقّع لأغراض التحقق من نجاح بناء مشروع iOS. لا يمكن تثبيته على جهاز حقيقي بدون توقيع Apple.

## أسرار IPA الموقّع

أضف الأسرار التالية إلى **Settings > Secrets and variables > Actions**:

| Secret | القيمة |
|---|---|
| `IOS_P12_BASE64` | شهادة Apple Distribution بصيغة `.p12` بعد تحويلها إلى Base64 |
| `IOS_P12_PASSWORD` | كلمة مرور ملف `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | ملف App Store أو Ad Hoc Provisioning Profile بصيغة Base64 |
| `IOS_TEAM_ID` | Apple Developer Team ID |
| `IOS_BUNDLE_ID` | `com.taget.app` |
| `IOS_EXPORT_OPTIONS_PLIST_BASE64` | ملف `ExportOptions.plist` بصيغة Base64 |

تحويل الملفات إلى Base64:

```bash
base64 -w 0 distribution.p12 > distribution.p12.base64.txt
base64 -w 0 Taget.mobileprovision > profile.base64.txt
base64 -w 0 ExportOptions.plist > export-options.base64.txt
```

مثال `ExportOptions.plist` للنشر على App Store:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.taget.app</key>
        <string>YOUR_PROFILE_NAME</string>
    </dict>
</dict>
</plist>
```

استبدل `YOUR_TEAM_ID` و`YOUR_PROFILE_NAME` بالقيم الحقيقية قبل تحويل الملف إلى Base64.

## المخرجات

عند نجاح التوقيع سيظهر في Artifacts:

```text
taget-ios-archive-<commit>
taget-ios-ipa-<commit>
```

ملف IPA الناتج هو الملف المخصص للتثبيت أو التوزيع حسب نوع Provisioning Profile وطريقة التصدير.

> لا يمكن إنشاء شهادة Apple أو Provisioning Profile من GitHub Actions دون حساب Apple Developer. لا ترفع `.p12` أو `.mobileprovision` أو كلمات المرور إلى المستودع؛ استخدم GitHub Secrets فقط.
