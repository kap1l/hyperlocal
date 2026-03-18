# Changelog

## 1.1.0 - Unreleased
- **Data Layer:** Migrated to Open-Meteo as the default global weather provider, falling back to PirateWeather if user has a custom API key.
- **Data Layer:** RainChart visually handles 15-minute gap intervals by linearly interpolating Open-Meteo's minutely data.
- **Monetization:** Swapped mock AdMob with real Google Mobile Ads SDK for free tier banner ads.
- **Monetization:** Wired live RevenueCat setup securely via environment variables and updated to a 30-day Free Trial approach.
- **App Configuration:** Updated bundle identifier and package name to `com.antigravity.outweather`.
- **UI:** Rebranded all instances of "AI Smart Summary" to "Smart Summary".
- **Notifications:** Upgraded Smart Daily Notification generation and integrated `expo-store-review` for native rating prompts on 3rd app open.
- **Crash Reporting:** Added native `sentry/react-native` bug reporting integrated securely via DSN.
- **Activities:** Permanently unlocked Cycling in the free tier version.
- **Features:** Added "Saved Locations" (Spots) powered by AsyncStorage with "Pro" gating limits.
- **Features:** Created a new "7-Day Forecast Card" dynamically evaluating the upcoming week against user's target activity.
- **Features:** Added "Feels-Like Temperature Toggle" interaction securely via `WeatherCard.js`.
- **Features:** Added exact precipitation intensity overlays into the hourly data breakdown.
- **Features:** Created Barometric pressure trend indicator polling tracking historical caching natively.
- **Features:** Replaced single-country NWS weather warning system with Open-Meteo's new global Alerts API.
- **Features:** Engineered a fully customisable Pro Home Screen Card Order capability (`CardOrderService`).
- **Features:** Social native snapshot score sharing implemented with `react-native-view-shot` + `expo-sharing`.
- **Daily Engagement:** "Personalised Morning Briefing" notification functionality embedded into Settings tab.
- **Daily Engagement:** "Activity Streak Counter" and visual milestones to gamify daily checks.
- **Daily Engagement:** Deep customizable "Condition Watchlist" engine letting users flag exact variables to receive alert push.
- **Daily Engagement:** Saved "Activity History Log" tracking past workouts directly inside the app.
- **Daily Engagement:** New "Weekly Report" feature generating a Sunday analytical rollup of logged conditions.
- **Daily Engagement:** Historical cache comparing today's identical hour to previous week's condition (`ComparisonCard`).
- **Integrations:** Built and natively connected full Strava OAuth pipeline with conditional rendering data.
- **Integrations:** Migrated Google Health Connect native Android permissions to support deep physical/walking integrations.
