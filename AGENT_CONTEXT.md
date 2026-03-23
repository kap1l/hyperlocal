# OutWeather — Agent System Context

## App Identity
- Name: OutWeather (internal repo: microWeather / hyperlocal)
- Platform: Android only (iOS deferred)
- Bundle ID: com.antigravity.outweather
- Version: 1.1.0

## Stack
- React Native 0.81.5
- Expo SDK 54
- React 19
- EAS Build
- RevenueCat v9 (react-native-purchases)
- Open-Meteo (primary weather API, no key required)
- PirateWeather (fallback, user-supplied key)
- Sentry (@sentry/react-native)
- AsyncStorage (@react-native-async-storage/async-storage)

## Project Structure
src/
  components/   # UI components
  screens/      # Screen-level components
  services/     # API calls, business logic
  context/      # React context providers
  utils/        # Pure utility functions
  navigation/   # AppNavigator.js (single file)
  widgets/      # Android widget handlers
  config/       # Static config files

## Key Files
- src/context/WeatherContext.js      # Central weather state, location, units
- src/context/SubscriptionContext.js # RevenueCat, isPro, isTrialing, trialDaysLeft
- src/context/ThemeContext.js        # theme object (text, cardBg, accent, textSecondary, glassBorder)
- src/services/WeatherService.js     # Open-Meteo fetch + PirateWeather fallback
- src/services/OpenMeteoAdapter.js   # Maps Open-Meteo response to DarkSky schema
- src/services/StorageService.js     # AsyncStorage helpers
- src/services/NotificationService.js
- src/services/BackgroundWeatherTask.js
- src/navigation/AppNavigator.js     # All screen registration goes here

## Data Model
All weather data conforms to DarkSky/PirateWeather schema (mapped by OpenMeteoAdapter).
Key fields on weather.currently: temperature, apparentTemperature, precipProbability,
precipIntensity, windSpeed, uvIndex, cloudCover, visibility, pressure, summary, icon.
weather.hourly.data = array of hourly objects (same fields + time as unix epoch).
weather.daily.data = array of 7 daily objects.
weather.minutely.data = array of 60 interpolated minute objects.

## Secrets (stored as EAS secrets, never in code)
- REVENUECAT_ANDROID_KEY
- ADMOB_APP_ID_ANDROID
- SENTRY_DSN
- STRAVA_CLIENT_SECRET

## Coding Rules
1. Android only — no iOS-specific code, no HealthKit, no Apple APIs
2. Sentry captureException() in every catch block
3. All styles via StyleSheet.create() — no inline styles
4. Every component must use useTheme() — no hardcoded colours except score colours
   Score colours: green #22c55e (>=70), amber #f59e0b (>=40), red #ef4444 (<40)
5. Every component handles null/undefined props without crashing — return null gracefully
6. No new navigation libraries — use existing @react-navigation/native stack
7. No new AsyncStorage keys without adding helpers to StorageService.js
8. RevenueCat keys never in source code — read from Constants.expoConfig.extra only
9. CLIENT_SECRET values never in client-side JS — EAS secrets only
10. All new screens must be registered in AppNavigator.js

## Current Pro Gating
Free: All Activities unlocked (Walk, Run, Drive, Cycle, Hike, Tennis, Golf, Yoga, Fishing, Stargazing, Photo/Film).
Pro features: 
- Best Time Finder
- Saved Spots (> 1 location)
- Condition Watchlist (> 1 alert)
- Activity History
- Weekly Performance Report
- City search (Manual Mode)
- Custom Home Screen Layout
- Ad-free experience

## Monetisation
- Three package options: Monthly, Annual, Lifetime
- 30-day free trial on Monthly and Annual plans
- Emergency Pro bypass removed — purchases enforced in all builds
- AdMob banner shown to free users, hidden for Pro and during high-z-index overlays

## Background Task
Task name constant: defined in BackgroundWeatherTask.js
Do not rename or re-register — modifying task registration will break existing installs.

## Known Deferred Work
- iOS widget (WidgetKit/SwiftUI) — not started
- Garmin Connect — pending API approval
```

---

**Two additional files worth having:**

`/CHANGELOG.md` — one line per task completed, date stamped. Keeps track of what the agent has already done across sessions so you don't re-assign completed work.

`/.antigravityignore` — already exists in your repo. Use it to tell the agent which files to never modify. Add entries like:
```
android/          # never touch native Android files directly
assets/           # never modify production assets
docs/PRIVACY_POLICY.md
```

---

**How to use it when prompting the agent:**

Start every session with:
```
Read AGENT_CONTEXT.md before writing any code. 
All rules in that file are non-negotiable.

## 1.2.0 (Planned)
COMPLETED:
- ConditionComparisonCard — same conditions last week comparison
- GoalService + GoalProgressCard + GoalSetupScreen — weekly outdoor habit goals
- Goal reminder notification (Thursday 6 PM, channel: goal-reminders)
- Garmin Connect placeholder row in Connected Apps
- ForecastConfidenceChip — multi-model confidence indicator