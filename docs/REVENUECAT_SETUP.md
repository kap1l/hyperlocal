# RevenueCat Setup Guide for microWeather

This guide will help you configure RevenueCat to handle in-app purchases for iOS and Android.

## 1. Create a RevenueCat Account / Application

1.  Go to [RevenueCat Dashboard](https://app.revenuecat.com/) and sign up/login.
2.  Click **"Projects"** > **"Create new project"**.
3.  Name it `microWeather`.

## 2. Configure Platforms (iOS & Android)

### iOS (App Store)
1.  In RevenueCat, go to **Project Settings** > **Apps**.
2.  Click **+ New** > **App Store**.
3.  Enter your **App Bundle ID** (from `app.json` -> `ios.bundleIdentifier`).
4.  You will need an **App-Specific Shared Secret**.
    *   Go to App Store Connect > Apps > Your App > App Information > App-Specific Shared Secret.
    *   Generate and verify it.
5.  Paste the Shared Secret into RevenueCat.

### Android (Google Play)
1.  In RevenueCat, go to **Project Settings** > **Apps**.
2.  Click **+ New** > **Play Store**.
3.  Enter your **Package Name** (from `app.json` -> `android.package`).
4.  Follow RevenueCat's guide to link your [Google Service Account Key](https://www.revenuecat.com/docs/creating-play-service-credentials).

## 3. Create Products & Entitlements

1.  Go to **Products** in the left sidebar.
2.  **Entitlements**: Create a new entitlement named `pro` (Identifier: `pro`). This matches `ENTITLEMENT_ID` in `SubscriptionContext.js`.
3.  **Offerings**: Create a new offering named `Default` (this is usually created automatically).
4.  **Packages**: Click on the "Default" offering.
    *   Click **+ New Package**.
    *   Identifier: `monthly`. This matches `offerings.monthly` in `SubscriptionContext.js`.
    *   Description: "Monthly Subscription".

## 4. Link Store Products

You need to create the actual subscription products in App Store Connect and Google Play Console FIRST.

### App Store Connect
1.  Go to **Subscriptions**.
2.  Create a "Subscription Group".
3.  Create a "Monthly" product.
    *   Product ID: `microweather_199_1m` (Example).
    *   Price: $1.99.

### Google Play Console
1.  Go to **Monetize** > **Subscriptions**.
2.  Create a product.
    *   Product ID: `microweather_199_1m`.
    *   Price: $1.99.

### Back to RevenueCat
1.  Go to **Products** > **+ New Product**.
2.  Enter the Product ID (`microweather_199_1m`) for both iOS and Android.
3.  Select the `pro` entitlement.

## 5. Get Your Public API Keys

1.  Go to **Project Settings** > **API Keys**.
2.  Copy the **Public SDK Key** for **iOS** (starts with `appl_`).
3.  Copy the **Public SDK Key** for **Android** (starts with `goog_`).

## 6. Update Your Code

Open `src/context/SubscriptionContext.js` and update the `API_KEYS` object:

```javascript
const API_KEYS = {
    apple: 'appl_YOUR_ACTUAL_KEY_HERE', 
    google: 'goog_YOUR_ACTUAL_KEY_HERE' 
};
```

## 7. Testing

1.  **Sandbox** (iOS): Use a Sandbox Tester account on a real device.
2.  **License Testing** (Android): Add your email to License Testers in Play Console.
3.  The app will use `checkLocalFallback` if keys are invalid, but purchases will fail.

**Important:** Purchases usually do NOT work in iOS Simulator. Use a real device.
