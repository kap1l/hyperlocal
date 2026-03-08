# How to Get Your RevenueCat API Keys

To allow users to subscribe to **OutWeather+**, you need to connect your app to RevenueCat. This handles all the complex billing logic for you.

## 1. Create a RevenueCat Account
1.  Go to [RevenueCat Dashboard](https://app.revenuecat.com/).
2.  Sign up for a free account (it's free up to $2.5k revenue/month).

## 2. Create Your Project
1.  Click on the project dropdown (top left) and select **"Create New Project"**.
2.  Name it `OutWeather`.

## 3. Add Your Apps (iOS & Android)

### For iPhone (iOS)
1.  In your project sidebar, go to **Project Settings** > **Apps**.
2.  Click **+ New App** -> **App Store**.
3.  Enter your App Name ("OutWeather").
4.  **Bundle ID**: enter `com.antigravity.outweather` (Matches your `app.json`).
5.  Click **Save**.
6.  **COPY THE KEY**: Look for **"Public API Key"**. It starts with `appl_`.
    *   *Example: `appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ`*

### For Android (Google Play)
1.  Click **+ New App** -> **Play Store**.
2.  Enter App Name.
3.  **Package Name**: enter `com.antigravity.outweather` (Matches your `app.json`).
4.  Click **Save**.
5.  **COPY THE KEY**: Look for **"Public API Key"**. It starts with `goog_`.
    *   *Example: `goog_zYxWvUtSrQpOnMlKjIhGfEdCbA`*

---

## 4. Update Your Code
Open `src/context/SubscriptionContext.js` and paste your keys:

```javascript
// src/context/SubscriptionContext.js

const API_KEYS = {
    apple: 'appl_YOUR_COPIED_IOS_KEY',  // Paste Apple key here
    google: 'goog_YOUR_COPIED_ANDROID_KEY' // Paste Google key here
};
```

---

## 5. (Critical) Connect Stores
For subscriptions to actually *work*, RevenueCat needs to talk to Apple/Google servers.

1.  **Google Play**: You need to create a Service Account in Google Cloud Console and upload the JSON credentials to RevenueCat. This is the hardest part. Follow this guide carefully: [RevenueCat Android Setup](https://www.revenuecat.com/docs/creating-play-service-credentials).
2.  **App Store**: You need to provide your "App-Specific Shared Secret".
    *   Go to App Store Connect > Users and Access > Integrations > Shared Secret.
    *   Paste it into RevenueCat under Project Settings > Apps > App Store.
