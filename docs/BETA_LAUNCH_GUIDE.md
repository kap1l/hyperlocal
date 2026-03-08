    # Beta Launch Guide: How to Ship "Hidden" Apps

You can upload your app to Google Play and the App Store while keeping it hidden from the general public. This allows you to test with a specific group of users before the official launch.

---

## 🤖 Android (Google Play Store)

On Android, this is called **Closed Testing**.

### 1. Build the App
Run this command to build a production-ready Android Bundle (`.aab`):
```bash
eas build --platform android --profile production
```

**Important: New Personal Account Requirement**
> [!WARNING]
> Since Nov 2023, new personal developer accounts must have **20 testers opted-in for at least 14 days** before they can apply for Production access. Keep this in mind!

### 2. Upload to Google Play Console
**Option A: Automated Submission (Recommended)**
If you have your Google Service Account key configured:
```bash
eas submit -p android --latest
```

**Option B: Manual Upload**
1.  Go to **[Google Play Console](https://play.google.com/console)**.
2.  Create your App -> Complete the initial setup (Privacy Policy, App Access, etc.).
3.  Navigate to **Testing > Closed testing**.
4.  **Create track**: Click "Create track" (e.g., "Alpha").
5.   **Testers Tab**:
    *   Create an email list.
    *   Add at least **20 Gmail addresses**.
    *   **Crucial**: Share the "Join on Web" link with them. They MUST accept the invite.
6.  **Releases Tab**:
    *   "Create new release".
    *   Upload the `.aab` file (download from EAS dashboard).
    *   Review and rollout.

**Is it hidden?** YES. Only people on your email list who accept the invite can see it.

### ❓ Internal vs. Closed Testing (Crucial Difference)
*   **Internal Testing:**
    *   **Speed:** Instant (no review).
    *   **Purpose:** Quick sanity checks for you/team.
    *   **Warning:** **Does NOT count** towards the 20-tester requirement.
*   **Closed Testing:**
    *   **Speed:** Requires Google Review (1-3 days).
    *   **Purpose:** The official "Beta" for the 20-tester rule.
    *   **Action:** You **MUST** use this track to unlock Production.

---

## 🍎 iOS (App Store)

On iOS, this is done via **TestFlight**.

### 1. Build the App
Run this command to build for iOS distribution:
```bash
eas build --platform ios --profile production
```
*(Note: You need an Apple Developer Account ($99/yr) to do this)*

### 2. Upload to App Store Connect
If you have configured EAS Submit, you can run:
```bash
eas submit -p ios
```
Otherwise, download the `.ipa` and upload it using the "Transporter" app on macOS.

### 3. Configure TestFlight
1.  Go to **[App Store Connect](https://appstoreconnect.apple.com)**.
2.  Select your app -> **TestFlight** tab.
3.  **Internal Testing (Immediate)**:
    *   Add your own team members (Admin, Developer roles).
    *   **Pros**: Updates available instantly. No review.
    *   **Cons**: Requires Apple ID + Team role.

4.  **External Testing (Public)**:
    *   Create a Group (e.g., "Public Beta").
    *   **Add Build**: Click `(+)` next to Builds.
    *   **Review**: The *first* build of a new version (e.g., v1.0, v1.1) requires a Beta App Review (~24h). Subsquent builds (v1.0.1) are usually instant.
    *   **Invites**: Once approved, enable the **Public Link** to share freely.
    *   **Expires**: Builds expire after 90 days.

**Is it hidden?** YES. Users need TestFlight. It is not searchable.

---

## 🚀 Summary Workflow

1.  **Build**: `eas build --profile production --platform all`
2.  **Submit**: Upload artifacts to Play Console (Closed Track) and App Store Connect (TestFlight).
3.  **Invite**: Add tester emails to the respective lists.
4.  **Wait (Android Only)**: Ensure 20 testers have been opted-in for **14 consecutive days**.
5.  **Test**: Collect feedback via TestFlight or Google Play feedback tools.
6.  **Promote**: Once ready, promote the build to **Production** to go live publicly!

---

## 🛠️ Troubleshooting

### 1. "My changes aren't showing up!"
If you changed native code (like app icon, permissions, or `app.json` config), you **must** rebuild the native binary. OTA updates (JS only) won't work.
Run: `eas build --platform android --profile production`

### 2. "App crashes immediately on launch"
Check the logs using `adb logcat` (Android) or Console.app (iOS). Common causes:
*   Missing permission description string in `app.json`.
*   Env variables missing in `eas.json` (like `ORG_GRADLE_JVMARGS`).
*   Incompatible native libraries.

---

## 👥 How to Find 20 Testers (Google Play)
Finding 20 people can be tough. Here are proven strategies:

1.  **Friends & Family:** The easiest path. Just ask them to install it and keep it for 2 weeks. They don't actually need to *use* it daily, just have it installed.
2.  **Reddit Communities:**
    *   **[r/AndroidClosedTesting](https://www.reddit.com/r/AndroidClosedTesting/):** A community dedicated to this exact problem. You test their app, they test yours ("Test 4 Test").
    *   **r/androiddev:** sometimes has threads for this.
3.  **Social Media:** LinkedIn or Twitter/X posts asking for "Early Access" help often get good engagement.
4.  **Paid Services:** There are platforms (search "20 testers for google play") that offer this service for a fee, though "organic" testers are better for real feedback.
