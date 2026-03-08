# Production Launch Checklist

Before running your final build command, ensure you have completed these steps:

## 1. App Identity & Icons
- [ ] **App Icon**: Replace `./assets/icon.png` (1024x1024) with your final app logo.
- [ ] **Adaptive Icon**: Replace `./assets/adaptive-icon.png` (1024x1024) for Android.
- [ ] **Splash Screen**: Replace `./assets/splash.png` (1242x2436) with your launch screen image.

## 2. API Keys & Secrets
- [ ] **AdMob ID**: Update `app.json` -> `android.config.googleMobileAdsAppId` with your REAL AdMob App ID.
      *(Currently using Test ID: `ca-app-pub-3940256099942544~3347511713`)*
- [ ] **PirateWeather Key**: Ensure users can input their own key, or if you are bundling one for Pro users, ensure it is secure.
- [ ] **RevenueCat Keys**: In `src/context/SubscriptionContext.js`, replace `appl_YOUR_IOS_KEY_HERE` and `test_...` with your live production keys from the RevenueCat dashboard.

## 3. Store Listings
- [ ] **Screenshots**: Take screenshots on a simulator/device for:
    -   iPhone 6.5" Display (Pro Max)
    -   iPhone 5.5" Display (8 Plus)
    -   Android Phone
    -   (Optional) Android 10" Tablet
- [ ] **Description**: Write a compelling short description (80 chars) and full description.
- [ ] **Privacy Policy**: Host a privacy policy URL (Use a free generator or GitHub pages). You need this link for the Store submission.

## 4. Final Build & Submit

### Standard Release (Production)
Run this command to build the artifacts for the App Stores:

```bash
eas build --platform all --profile production
```

This will generate:
-   **Android**: `.aab` file (Submit to Play Console -> Production/Closed Testing)
-   **iOS**: `.ipa` file (Submit to App Store Connect -> TestFlight)

### Troubleshoot Widgets
If the Android widget doesn't appear after install:
-   Ensure you are testing on a real device or emulator (not Expo Go).
-   Sometimes a restart of the launcher/device is needed for new detailed widgets to appear in the list.

## 5. Post-Launch
- [ ] **Monitor Crashes**: Check EAS Build logs or Sentry (if installed) for crash reports.
- [ ] **Check Reviews**: Respond to early user feedback immediately.
