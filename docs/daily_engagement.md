TASK 5.1 — Personalised Morning Score Notification
Files to modify: src/services/NotificationService.js, src/screens/SettingsScreen.js, src/services/StorageService.js

In StorageService.js, add two helpers: getBriefingTime() reads @briefing_time from AsyncStorage, returns object { hour: number, minute: number } or default { hour: 7, minute: 0 }. Add setBriefingTime(hour, minute) writes same shape.
In NotificationService.js, update scheduleDailyBriefing(weatherData, activity) to read briefing time via getBriefingTime() before scheduling. Change notification title logic: if activityScore >= 80 use "🏃 Great ${activity} conditions today", if >= 60 use "👍 Decent ${activity} window today", else use "⚠️ Tough day for ${activity}". Inject activityScore and best window time into body. Format: "Score: ${score}/100. Best window ${startTime}–${endTime}. ${temp}°, ${conditionSummary}." Truncate body to 100 chars.
In SettingsScreen.js, add a "Morning Briefing" section with a time picker. Use @react-native-community/datetimepicker (already compatible with Expo SDK 54). On change call setBriefingTime(hour, minute) then call scheduleDailyBriefing() to reschedule. Show currently set time as subtitle. Gate this section with a label but do NOT lock behind Pro — notification opt-in is a retention tool for all users.


TASK 5.2 — Activity Streak Counter
Files to create: src/services/StreakService.js, src/components/StreakBadge.js
Files to modify: src/screens/HomeScreen.js, src/services/NotificationService.js

In StreakService.js, implement the following:

getStreak() reads @streak_data from AsyncStorage, returns { count: number, lastActiveDate: string|null } or { count: 0, lastActiveDate: null }.
incrementStreak() reads current streak. Get today's date as YYYY-MM-DD string. If lastActiveDate equals yesterday's date string, increment count and update lastActiveDate to today. If lastActiveDate equals today, do nothing (already counted). Otherwise reset count to 1 and set lastActiveDate to today. Write back and return new streak object.
resetStreak() writes { count: 0, lastActiveDate: null }.
getMilestone(count) returns milestone label if count is 7, 14, 30, 60, 100 — otherwise null.


Call incrementStreak() inside WeatherContext.js after every successful refreshWeather() call.
In StreakBadge.js, accept prop streak (object). If streak.count < 2 return null. Render a compact row with a 🔥 emoji and ${streak.count} day streak text styled with theme.accent. If getMilestone(count) returns a label, render it as a small highlighted badge next to the count.
In HomeScreen.js, load streak via getStreak() in a useEffect into local state. Render <StreakBadge streak={streak} /> in the header row next to the location name.
In NotificationService.js, add scheduleMilestoneNotification(count). If getMilestone(count) is not null, schedule an immediate notification: title "🔥 ${count}-Day Streak!", body "You've checked OutWeather ${count} days in a row. Keep it up!". Call this from incrementStreak() after writing new streak data.


TASK 5.3 — Condition Watchlist ("Alert Me When It's Good")
Files to create: src/services/WatchlistService.js, src/screens/WatchlistScreen.js, src/components/WatchlistCard.js
Files to modify: src/services/BackgroundWeatherTask.js, src/screens/HomeScreen.js, src/navigation/AppNavigator.js, src/screens/SettingsScreen.js

In WatchlistService.js, define watch item shape: { id: string, activity: string, type: 'score_above'|'rain_stop'|'rain_start', threshold: number, notifiedToday: boolean, lastNotifiedDate: string|null }. Implement getWatchlist(), addWatch(item), removeWatch(id), markNotified(id). markNotified(id) sets notifiedToday: true and lastNotifiedDate to today's date string. Add resetDailyNotified() that sets all items' notifiedToday to false — call this at midnight via background task.
In BackgroundWeatherTask.js, after fetching weather data, call getWatchlist(). For each item where notifiedToday === false, evaluate condition: for score_above call analyzeActivitySafety(item.activity, weather.currently, units) and check if analysis.score >= item.threshold. For rain_stop, check if previous cached precipProbability > 0.3 and current < 0.2. For rain_start, check opposite. If condition met, call NotificationService.sendWatchlistAlert(item) and call markNotified(item.id).
In NotificationService.js, add sendWatchlistAlert(item). Title: "⚡ Your alert triggered". Body for score_above: "${item.activity} score just hit ${score}/100 — conditions are good now." Body for rain_stop: "Rain has stopped at your location." Body for rain_start: "Rain starting at your location.". Schedule as immediate notification (trigger: null).
Create WatchlistScreen.js rendering current watches as a FlatList with delete icon per row. Add a "New Alert" button that opens a modal with: activity selector (reuse GlassDropdown), type selector (Score Above / Rain Stop / Rain Start), score threshold slider (only visible for score_above type, range 50–95 step 5). On save call addWatch() with a uuid generated via Date.now().toString().
In WatchlistCard.js, render a compact summary of active watches — max 2 shown inline, a "See all" link if more. Render on HomeScreen below the activity score.
In AppNavigator.js, add WatchlistScreen to stack. In SettingsScreen.js, add a "Condition Alerts" row that navigates to WatchlistScreen. In HomeScreen.js, render <WatchlistCard /> and add a "Set Alert" TouchableOpacity below FeaturedActivityBadge.


TASK 5.4 — Activity History Log
Files to create: src/services/ActivityLogService.js, src/screens/ActivityLogScreen.js, src/components/LogSessionCard.js, src/components/WeeklyLogSummary.js
Files to modify: src/screens/HomeScreen.js, src/navigation/AppNavigator.js, src/screens/SettingsScreen.js

In ActivityLogService.js, define log entry shape: { id: string, timestamp: number, activity: string, score: number, temperature: number, conditions: string, precipProbability: number, windSpeed: number, note: string|null }. Implement getLogs() reads @activity_log, returns array or []. addLog(entry) prepends entry and writes back. deletelog(id) filters and writes back. getWeeklySummary() filters logs from last 7 days, returns { count: number, avgScore: number, bestDay: string, activities: string[] }.
In HomeScreen.js, after the FeaturedActivityBadge renders, add a "Log this session +" TouchableOpacity. On press, create a log entry using current weather.currently values and current selectedActivity and calculated activityAnalysis.score. Call addLog(entry). Show a brief toast/haptic confirmation. Do not navigate away.
Create LogSessionCard.js as a compact row component: activity icon, date/time, score badge (coloured), temperature, condition summary. Used in the log screen list.
Create WeeklyLogSummary.js: accepts summary prop from getWeeklySummary(). Renders: sessions count, average score as coloured pill, best day label. Show on HomeScreen as a collapsible section using existing CollapsibleSection with title="This Week's Activity" and sectionId="weekly-log".
Create ActivityLogScreen.js: header with total session count, FlatList of LogSessionCard components from getLogs(), swipe-to-delete or trash icon per row calling deleteLog(id), empty state message "Tap 'Log this session' after checking conditions to build your history.".
In AppNavigator.js, add ActivityLogScreen to stack. In SettingsScreen.js, add "Activity History" row navigating to it.


TASK 5.5 — Weekly Outdoor Report
Files to create: src/services/WeeklyReportService.js, src/components/WeeklyReportCard.js
Files to modify: src/services/NotificationService.js, src/screens/HomeScreen.js

In WeeklyReportService.js, implement generateWeeklyReport(activityLogs, weeklyForecast, activity). Returns { sessionCount: number, avgScore: number, bestDayLabel: string, upcomingBestDay: string, upcomingBestScore: number }. Best upcoming day derived from weeklyForecast array — find max score day. Store generated report under @weekly_report_{weekNumber} where weekNumber is Math.floor(Date.now() / 604800000). Implement getWeekNumber() helper. Implement hasSeenThisWeek() checks AsyncStorage for current week's key.
In NotificationService.js, add scheduleWeeklyReport(). Schedule for Sunday 6 PM repeating weekly. Body: "Your OutWeather week is ready. See how you did and what's coming up.". Call this once from App.js after notification permissions granted.
Create WeeklyReportCard.js: renders report data as a card with sections — "This week" (session count, avg score), "Next week" (best day + score preview), a dismiss X button. On dismiss write @weekly_report_seen_{weekNumber} to AsyncStorage.
In HomeScreen.js, on mount check hasSeenThisWeek(). If false and report data exists, render <WeeklyReportCard /> at the top of the scroll view below the trial banner. Generate report by calling generateWeeklyReport() with logs from ActivityLogService and weather.daily.data.


TASK 5.6 — "Same Conditions Last Week" Comparison
Files to modify: src/context/WeatherContext.js, src/components/SmartSummaryCard.js, src/services/StorageService.js

In StorageService.js, add saveWeatherSnapshot(dayOfWeek, hour, snapshot) writes to @snapshot_${dayOfWeek}_${hour} where snapshot is { temperature, precipProbability, windSpeed, conditions, score }. Add getWeatherSnapshot(dayOfWeek, hour) reads same key.
In WeatherContext.js, after successful refreshWeather(), call saveWeatherSnapshot(currentDayOfWeek, currentHour, snapshotFromCurrently). Get currentDayOfWeek as 0–6, currentHour as 0–23 from new Date().
In SmartSummaryCard.js, on mount load last week's snapshot via getWeatherSnapshot(dayOfWeek, hour). If snapshot exists and has a score, append a comparison line below the summary text: if current score > last week's score by 10+, show "Better than last ${dayName} — ${delta} point improvement.". If worse by 10+, show "Tougher than last ${dayName}.". Otherwise show nothing. Style as small italic text with theme.textSecondary.

TASK 6.1 — Strava Integration
Files to create: src/services/StravaService.js, src/screens/StravaConnectScreen.js, src/components/StravaInsightCard.js
Files to modify: src/screens/SettingsScreen.js, src/navigation/AppNavigator.js, src/services/StorageService.js
Prerequisites (you do this, not the agent): Register app at strava.com/settings/api. Set callback URL to outweather://strava-callback. Note your CLIENT_ID and CLIENT_SECRET. Store CLIENT_SECRET as EAS secret STRAVA_CLIENT_SECRET. Store CLIENT_ID in app.config.js as extra.stravaClientId.

In StorageService.js, add saveStravaTokens(tokens) writes { accessToken, refreshToken, expiresAt, athleteId } to @strava_tokens. Add getStravaTokens() reads same. Add clearStravaTokens() deletes key.
In StravaService.js:

initiateStravaAuth(): build OAuth URL https://www.strava.com/oauth/mobile/authorize with params client_id, redirect_uri=outweather://strava-callback, response_type=code, scope=activity:read_all. Open via Linking.openURL().
exchangeCodeForTokens(code): POST to https://www.strava.com/oauth/token with client_id, client_secret (from Constants.expoConfig.extra), code, grant_type=authorization_code. Save response via saveStravaTokens().
refreshAccessToken(): if tokens.expiresAt < Date.now() / 1000 + 300, POST to same endpoint with grant_type=refresh_token. Update stored tokens.
getRecentActivities(count = 10): GET https://www.strava.com/api/v3/athlete/activities?per_page=${count} with Bearer token header. Returns array of { id, name, type, start_date, distance, moving_time, average_speed, start_latlng }.
enrichActivitiesWithWeather(activities): for each activity, call getWeatherSnapshot(dayOfWeek, hour) using activity's start_date. If snapshot exists, attach weather data to activity. Return enriched array.
getPerformanceInsight(activities): find activities of same type as selectedActivity. Group by condition bucket (score 80+, 60–79, below 60). Return { bestConditionsAvgPace, worstConditionsAvgPace, sampleSize }.


In app.config.js, add deep link scheme handler for outweather://strava-callback. In App.js, add Linking.addEventListener('url', handleDeepLink) that extracts code param from callback URL and calls StravaService.exchangeCodeForTokens(code).
Create StravaConnectScreen.js: if not connected, show Strava branding, a connect button calling initiateStravaAuth(), and a brief explanation of what data is accessed. If connected, show athlete name, activity count, a disconnect button calling clearStravaTokens(), and the last sync time.
Create StravaInsightCard.js: accepts insight prop from getPerformanceInsight(). Renders: "Your ${activity} pace is ${X}% better when conditions score 80+." or "You ran ${X} times in conditions like today — average pace was ${Y}.". If sampleSize < 3, render nothing (insufficient data). Show a Strava logo attribution in the card footer.
In SettingsScreen.js, add a "Connected Apps" section with a "Strava" row showing connected/disconnected status. On press navigate to StravaConnectScreen.
In HomeScreen.js, render <StravaInsightCard /> below SmartSummaryCard when Strava is connected and insight data is available.


TASK 6.2 — Google Health Connect (Android — covers Samsung Health, Google Fit, Fitbit)
Files to create: src/services/HealthConnectService.js, src/components/HealthInsightCard.js
Files to modify: src/screens/SettingsScreen.js
Why Health Connect: On Android 14+, Health Connect aggregates data from Samsung Health, Google Fit, Fitbit, Garmin, and others into a single unified API. One integration covers all of them. No separate SDKs needed.
Prerequisites (you do this, not the agent): Add react-native-health-connect to package.json via npm install react-native-health-connect. Add android.permissions in app.config.js: "android.permission.health.READ_STEPS", "android.permission.health.READ_EXERCISE", "android.permission.health.READ_HEART_RATE".

In HealthConnectService.js:

isAvailable(): call initialize() from react-native-health-connect. Returns bool. Health Connect requires Android 14+ — return false gracefully on older versions.
requestPermissions(): call requestPermission([{ accessType: 'read', recordType: 'Steps' }, { accessType: 'read', recordType: 'ExerciseSession' }, { accessType: 'read', recordType: 'HeartRate' }]).
getRecentSessions(days = 14): call readRecords('ExerciseSession', { timeRangeFilter: { operator: 'between', startTime: daysAgoISO, endTime: nowISO } }). Returns array of sessions with startTime, endTime, exerciseType, title.
enrichSessionsWithWeather(sessions): same as Strava enrichment — attach cached weather snapshots by matching day and hour of each session start time.
getConditionTolerance(sessions): analyse enriched sessions to determine user's actual go/no-go thresholds based on real behaviour. Return { lowestScoreUserWentOut: number, averageScoreOnActivedays: number }.


Create HealthInsightCard.js: renders personalised insight derived from getConditionTolerance(). Example: "You typically go out when conditions score 65+. Today's score: 78 — above your usual threshold." Only render when sessions.length >= 5. Show source attribution: "Via Health Connect".
In SettingsScreen.js, add "Health Connect" row in "Connected Apps" section. On press check isAvailable() — if false show Alert "Health Connect requires Android 14 or newer.". If true and not connected, call requestPermissions(). If connected, show permission status and a disconnect option.
In HomeScreen.js, render <HealthInsightCard /> below StravaInsightCard. Only render when Health Connect is authorised and sufficient data exists.

**OutWeather — Pending Tasks for Agent (v1.1.0)**

Read `AGENT_CONTEXT.md` before writing any code. All rules in that file are non-negotiable.

---

**TASK — Feels-Like Temperature Toggle**

Files to modify: `src/components/WeatherCard.js`

1. Add state `const [showFeelsLike, setShowFeelsLike] = useState(false)` inside `WeatherCard`.
2. Locate the primary temperature display element. Wrap it in a `TouchableOpacity` with `onPress={() => setShowFeelsLike(prev => !prev)}` and `activeOpacity={0.7}`.
3. When `showFeelsLike` is false, display `weather.currently.temperature`. When true, display `weather.currently.apparentTemperature`. Both values are already available in the component via WeatherContext.
4. Directly below the temperature value, render a sub-label `Text` component. Show `"feels like"` when `showFeelsLike` is true, `"actual"` when false. Style with `theme.textSecondary`, `fontSize: 11`, `textAlign: 'center'`.
5. On toggle, call `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` from `expo-haptics`.
6. Handle null — if `weather?.currently?.apparentTemperature` is undefined, do not render the toggle and fall back to displaying actual temperature only with no sub-label.

---

**TASK — Activity History Log**

Files to create: `src/services/ActivityLogService.js`, `src/screens/ActivityLogScreen.js`, `src/components/LogSessionCard.js`, `src/components/WeeklyLogSummary.js`
Files to modify: `src/screens/HomeScreen.js`, `src/navigation/AppNavigator.js`, `src/screens/SettingsScreen.js`, `src/services/StorageService.js`

1. In `StorageService.js`, add two helpers: `getActivityLogs()` reads `@activity_log` from AsyncStorage, returns parsed array or `[]`. `saveActivityLogs(logs)` writes array to `@activity_log`.

2. In `ActivityLogService.js`, define log entry shape:
```
{
  id: string,           // Date.now().toString()
  timestamp: number,    // unix ms
  activity: string,
  score: number,
  temperature: number,
  conditions: string,   // weather.currently.summary
  precipProbability: number,
  windSpeed: number,
  note: null
}
```
Implement:
- `getLogs()` calls `getActivityLogs()`, returns array.
- `addLog(entry)` reads current logs, prepends new entry, caps at 200 entries using `.slice(0, 200)`, writes back via `saveActivityLogs()`.
- `deleteLog(id)` filters out by id, writes back.
- `getWeeklySummary()` filters logs where `timestamp >= Date.now() - 604800000`. Returns `{ count: number, avgScore: number, bestDay: string|null, activities: string[] }`. `bestDay` is the `toLocaleDateString([], { weekday: 'long' })` of the highest-scored session. Returns `null` if no logs in range.
- Wrap all operations in try/catch with `Sentry.captureException`.

3. In `HomeScreen.js`:
   - Import `ActivityLogService` and `useSubscription`.
   - Below `FeaturedActivityBadge`, add a `TouchableOpacity` styled as a small pill button labelled `"+ Log this session"`.
   - On press, construct a log entry from `weather.currently`, `selectedActivity`, and `activityAnalysis.score`. Call `ActivityLogService.addLog(entry)`. Fire `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`. Show no modal — in-place confirmation only.
   - Load weekly summary via `getWeeklySummary()` in a `useEffect` into local state `weeklySummary`.
   - Render `<WeeklyLogSummary summary={weeklySummary} />` after `DailyOutlookCard`. Only render when `weeklySummary?.count > 0`.

4. In `WeeklyLogSummary.js`, accept prop `summary`. Wrap in existing `CollapsibleSection` with `title="This Week's Activity"` and `sectionId="weekly-log"`. Inside, render three stats in a horizontal row: session count with label `"Sessions"`, `avgScore` as a coloured pill (score colour rules from AGENT_CONTEXT), `bestDay` with label `"Best day"`. If `bestDay` is null render `"—"`.

5. In `LogSessionCard.js`, accept prop `entry`. Render a single row: activity icon (`Ionicons`), date/time formatted as `"Mon 14 Mar, 9:41 AM"`, score badge (coloured circle with score number), temperature, conditions summary. Add a `TouchableOpacity` trash icon on the right calling `onDelete(entry.id)` prop. Use `theme.cardBg` background, `borderRadius: 12`, `marginBottom: 8`.

6. In `ActivityLogScreen.js`:
   - Load logs via `getLogs()` on mount into state.
   - Render a `FlatList` of `LogSessionCard` components. Pass `onDelete` prop that calls `deleteLog(id)` and updates local state.
   - Header shows total session count: `"${logs.length} sessions logged"`.
   - Empty state: centred text `"Tap '+ Log this session' on the home screen after checking conditions."` with a subtle icon.
   - Add a `"Clear All"` button in the header right that shows a confirmation `Alert` before calling `saveActivityLogs([])`.

7. In `AppNavigator.js`, register `ActivityLogScreen` in the stack navigator.

8. In `SettingsScreen.js`, add `"Activity History"` row in a `"Data"` section. On press navigate to `ActivityLogScreen`. Show session count as subtitle — load it from `getLogs().length` on screen focus.

---

**TASK — Weekly Outdoor Report**

Files to create: `src/services/WeeklyReportService.js`, `src/components/WeeklyReportCard.js`
Files to modify: `src/services/NotificationService.js`, `src/screens/HomeScreen.js`, `src/services/StorageService.js`

1. In `StorageService.js`, add: `getWeeklyReport(weekNumber)` reads `@weekly_report_${weekNumber}`. `saveWeeklyReport(weekNumber, report)` writes same. `hasSeenWeeklyReport(weekNumber)` reads `@weekly_report_seen_${weekNumber}`, returns bool. `markWeeklyReportSeen(weekNumber)` writes `'true'` to same key.

2. In `WeeklyReportService.js`:
   - `getWeekNumber()` returns `Math.floor(Date.now() / 604800000)`.
   - `generateWeeklyReport(activityLogs, dailyForecast, activity)`:
     - Filter `activityLogs` to last 7 days.
     - Compute `sessionCount`, `avgScore` (average of log scores, rounded).
     - Find `bestDayLabel` — day name of highest scored log entry. Null if no logs.
     - Find `upcomingBestDay` from `dailyForecast` — day with highest activity score computed via `analyzeActivitySafety(activity, dayProxy, units)`. Return `{ dayLabel, score }`.
     - Return full report object: `{ weekNumber, sessionCount, avgScore, bestDayLabel, upcomingBestDay: { label, score }, generatedAt: Date.now() }`.
     - Save via `saveWeeklyReport(weekNumber, report)`.
   - `shouldShowReport()` — returns true if current day is Monday (new week), report exists for previous week (`weekNumber - 1`), and `hasSeenWeeklyReport(weekNumber - 1)` is false.
   - Wrap in try/catch with Sentry.

3. In `NotificationService.js`, add `scheduleWeeklyReportNotification()`. Schedule for Sunday at 18:00 repeating weekly (`trigger: { weekday: 1, hour: 18, minute: 0, repeats: true }` — note: `weekday: 1` is Sunday in Expo's trigger spec). Title: `"📊 Your OutWeather week is ready"`. Body: `"See how your outdoor conditions looked this week and what's coming up."`. Only schedule if not already scheduled — check via `Notifications.getAllScheduledNotificationsAsync()` and skip if a notification with matching title exists.

4. In `WeeklyReportCard.js`:
   - Accept props `report` and `onDismiss`.
   - Render as a full-width card with `theme.cardBg` background and `theme.accent` left border.
   - Header: `"📊 Your Week in Review"` with a dismiss X `TouchableOpacity` calling `onDismiss`.
   - Section 1 `"Last Week"`: show `sessionCount` sessions, `avgScore` as coloured pill, `bestDayLabel` as `"Best day: ${bestDayLabel}"` or `"No sessions logged"` if null.
   - Section 2 `"Coming Up"`: show `upcomingBestDay.label` and `upcomingBestDay.score` as `"Best day ahead: ${label} (${score}/100)"`.
   - If `sessionCount === 0`, replace section 1 with `"No sessions logged last week. Tap '+ Log this session' to start tracking."`.
   - Style with `marginHorizontal: 16`, `marginBottom: 8`, `padding: 16`, `borderRadius: 16`.

5. In `HomeScreen.js`:
   - On mount, call `WeeklyReportService.shouldShowReport()`. If true, call `generateWeeklyReport()` with logs from `ActivityLogService` and `weather?.daily?.data` and `selectedActivity`. Store in local state `weeklyReport`.
   - Render `<WeeklyReportCard report={weeklyReport} onDismiss={handleDismissReport} />` at the top of the scroll content, below the trial banner and above all other cards. Only render when `weeklyReport !== null`.
   - `handleDismissReport` calls `markWeeklyReportSeen(weeklyReport.weekNumber)` and sets `weeklyReport` to null.

6. In `App.js`, call `scheduleWeeklyReportNotification()` once after notification permissions are confirmed granted. Add a guard so it only runs in production (`!__DEV__`).

---

**After agent completes, update `AGENT_CONTEXT.md` CHANGELOG section:**

Move these three items from `PENDING` to `COMPLETED` under 1.1.0:
- Feels-like temperature toggle (WeatherCard.js)
- ActivityLogService + ActivityLogScreen + LogSessionCard + WeeklyLogSummary
- WeeklyReportService + WeeklyReportCard

OutWeather — Next Feature Block (v1.2.0)
Read AGENT_CONTEXT.md before writing any code. All rules in that file are non-negotiable.

TASK 7.1 — Same Conditions Last Week Comparison
Files to create: src/components/ConditionComparisonCard.js
Files to modify: src/services/StorageService.js, src/context/WeatherContext.js, src/screens/HomeScreen.js

In StorageService.js, add: saveWeatherSnapshot(dayOfWeek, hour, snapshot) writes to @snapshot_${dayOfWeek}_${hour} where snapshot is { temperature, precipProbability, windSpeed, conditions, score, timestamp }. Add getWeatherSnapshot(dayOfWeek, hour) reads same key, returns parsed object or null.
In WeatherContext.js, after every successful refreshWeather(), extract from weather.currently: temperature, precipProbability, windSpeed, summary as conditions. Get activityScore from analyzeActivitySafety(selectedActivity, weather.currently, units)?.score. Call saveWeatherSnapshot(new Date().getDay(), new Date().getHours(), snapshot).
In ConditionComparisonCard.js:

On mount, load snapshot via getWeatherSnapshot(new Date().getDay(), new Date().getHours()) into local state lastWeekSnapshot.
Accept props currentScore, currentTemp, currentConditions.
If lastWeekSnapshot is null or lastWeekSnapshot.timestamp > Date.now() - 518400000 (less than 6 days old — not actually last week), return null.
Compute scoreDelta = currentScore - lastWeekSnapshot.score.
Compute tempDelta = Math.round(currentTemp - lastWeekSnapshot.temperature).
Render a single line of contextual text:

If scoreDelta >= 10: "Better than last ${dayName} — conditions up ${scoreDelta} points."
If scoreDelta <= -10: "Tougher than last ${dayName} — conditions down ${Math.abs(scoreDelta)} points."
Otherwise: "Similar to last ${dayName} — ${Math.abs(tempDelta)}° ${tempDelta > 0 ? 'warmer' : 'cooler'}."


Style as small italic text with theme.textSecondary, fontSize: 12, marginHorizontal: 16, marginBottom: 8.
Only render when Math.abs(scoreDelta) >= 5 || Math.abs(tempDelta) >= 3 — below that threshold the comparison adds no value.


In HomeScreen.js, render <ConditionComparisonCard currentScore={activityAnalysis?.score} currentTemp={weather?.currently?.temperature} currentConditions={weather?.currently?.summary} /> directly below SmartSummaryCard.


TASK 7.2 — Outdoor Habit Goals
Files to create: src/services/GoalService.js, src/components/GoalProgressCard.js, src/screens/GoalSetupScreen.js
Files to modify: src/navigation/AppNavigator.js, src/screens/SettingsScreen.js, src/screens/HomeScreen.js, src/services/NotificationService.js, src/services/StorageService.js

In StorageService.js, add: getGoal() reads @habit_goal, returns parsed object or null. saveGoal(goal) writes to @habit_goal. getGoalProgress() reads @goal_progress_${currentWeekNumber}, returns parsed object or { sessionsLogged: 0, weekNumber: currentWeekNumber }. saveGoalProgress(progress) writes to @goal_progress_${currentWeekNumber}. Week number via Math.floor(Date.now() / 604800000).
In GoalService.js, define goal shape: { activity: string, targetDays: number, preferredTime: 'morning'|'afternoon'|'evening'|'any' }. Implement:

getGoal() and saveGoal(goal) via StorageService.
getProgress() reads current week progress. Returns { sessionsLogged, targetDays, remaining, isOnTrack, daysLeftInWeek }. daysLeftInWeek is 7 - new Date().getDay(). isOnTrack is sessionsLogged / (7 - daysLeftInWeek) >= targetDays / 7.
logGoalSession() increments sessionsLogged in current week progress and writes back. Call this from ActivityLogService.addLog() automatically — if goal activity matches log activity, call GoalService.logGoalSession().
getBestRemainingWindows(weeklyForecast, activity, units) — from weeklyForecast, find days with score >= 65, return up to 3 as [{ dayLabel, score }].
Wrap all in try/catch with Sentry.


Create GoalSetupScreen.js:

Three inputs: activity selector (reuse GlassDropdown with full activity list), target days per week ([1,2,3,4,5,6,7] as horizontal selector), preferred time of day (Morning / Afternoon / Evening / Any as segmented control using TouchableOpacity row).
Save button calls GoalService.saveGoal(goal) and navigates back.
If existing goal exists on mount, pre-populate all fields.
Delete goal option shown only when editing — calls saveGoal(null) after Alert confirmation.


Create GoalProgressCard.js:

Load goal and progress on mount.
If no goal set, render a subtle CTA: "Set a weekly outdoor goal →" as a TouchableOpacity navigating to GoalSetupScreen. Style minimally — don't compete with core content.
If goal set, render: activity icon + "${sessionsLogged}/${targetDays} sessions this week", a progress bar (View with percentage width, colour green if on track, amber if behind), best remaining windows as chips "Thu 82/100", "Sat 79/100".
If goal complete (sessionsLogged >= targetDays), replace progress bar with "✓ Goal complete this week!" in green.


In NotificationService.js, add scheduleGoalReminderNotification(goal, remainingWindows). Schedule for Thursday 6 PM if progress.sessionsLogged < progress.targetDays - 1. Title: "🎯 Goal check-in". Body: "You're ${remaining} session${remaining > 1 ? 's' : ''} from your weekly goal. ${remainingWindows[0]?.dayLabel || 'This weekend'} looks good — score ${remainingWindows[0]?.score || ''}/100.". Cancel any existing goal reminder before scheduling new one via Notifications.cancelAllScheduledNotificationsAsync() filtered by title — use a dedicated notification channel goal-reminders on Android.
In HomeScreen.js, render <GoalProgressCard /> after WeeklyLogSummary. Import GoalSetupScreen navigation.
In AppNavigator.js, register GoalSetupScreen in stack.
In SettingsScreen.js, add "Weekly Goal" row in the existing "Data" section navigating to GoalSetupScreen. Show "${targetDays}x ${activity}/week" as subtitle when goal is set, "Not set" when null.


TASK 7.3 — Garmin Connect Placeholder
Files to modify: src/screens/SettingsScreen.js

In the "Connected Apps" section in SettingsScreen.js, add a "Garmin Connect" row after the Health Connect row.
Row shows a "Coming Soon" badge styled as a small pill with theme.accent + '30' background and theme.accent text.
On press show an Alert: title "Garmin Connect", body "Garmin integration is coming soon. We've applied for API access and will notify you when it's available.", single "OK" button.
Do not wire any service, OAuth, or navigation — placeholder UI only.


TASK 7.4 — Multi-Model Weather Confidence Indicator
Files to create: src/components/ForecastConfidenceChip.js
Files to modify: src/services/WeatherService.js, src/context/WeatherContext.js, src/screens/HomeScreen.js

In WeatherService.js, after fetching Open-Meteo data, make a second lightweight fetch to Open-Meteo using the ICON model specifically: append &models=icon_global to the base URL. Fetch only current block. Store both responses — primary (default ensemble) and secondary (ICON model). Extract temperature_2m and precipitation from both. Compute tempDelta = Math.abs(primary.current.temperature_2m - secondary.current.temperature_2m) and precipDelta = Math.abs(primary.current.precipitation - secondary.current.precipitation). Return confidence object: { tempDelta, precipDelta, level: tempDelta < 1 && precipDelta < 0.5 ? 'high' : tempDelta < 3 ? 'medium' : 'low' } alongside the main weather data. Wrap secondary fetch in its own try/catch — if it fails, return { level: 'unknown' } and do not affect primary data.
In WeatherContext.js, store forecastConfidence in state. Expose from Provider.
In ForecastConfidenceChip.js, accept prop confidence. Map level to display: high → "Forecast confident" with #22c55e. medium → "Models slightly disagree" with #f59e0b. low → "Forecast uncertain" with #ef4444. unknown → return null. Render as a small pill chip with icon checkmark-circle-outline / alert-circle-outline / close-circle-outline from Ionicons. Style: fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10.
In HomeScreen.js, render <ForecastConfidenceChip confidence={forecastConfidence} /> inline in the header area next to the location name, below the temperature. Only render when forecastConfidence?.level !== 'unknown'.