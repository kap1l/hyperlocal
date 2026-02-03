# iOS Widget Implementation Guide

## Overview

iOS widgets require **native Swift/SwiftUI code** and cannot be run directly in JavaScript/React Native. This means:
1. Cannot be tested in Expo Go
2. Requires `expo prebuild` to generate native code
3. Needs Xcode for development and testing

## Prerequisites

- macOS 15 (Sequoia) or newer
- Xcode 16+
- CocoaPods 1.16.2+
- Expo SDK 52+
- Apple Developer Account

## Implementation Steps

### Step 1: Install Required Packages

```bash
npx expo install @bacons/apple-targets expo-widgets
```

### Step 2: Create Widget Target

```bash
npx create-target widget
```

This creates a `targets/widget/` directory with Swift files.

### Step 3: Configure app.json

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["@bacons/apple-targets", {
        "appleTeamId": "YOUR_TEAM_ID"
      }]
    ],
    "ios": {
      "entitlements": {
        "com.apple.security.application-groups": [
          "group.com.yourapp.microweather"
        ]
      }
    }
  }
}
```

### Step 4: Create Widget Swift Code

Create `targets/widget/WeatherWidget.swift`:

```swift
import WidgetKit
import SwiftUI

struct WeatherEntry: TimelineEntry {
    let date: Date
    let temperature: Int
    let condition: String
    let activityScore: Int
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(date: Date(), temperature: 72, condition: "Sunny", activityScore: 85)
    }

    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> ()) {
        let entry = loadFromAppGroup()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> ()) {
        let entry = loadFromAppGroup()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    func loadFromAppGroup() -> WeatherEntry {
        let defaults = UserDefaults(suiteName: "group.com.yourapp.microweather")
        let temp = defaults?.integer(forKey: "temperature") ?? 72
        let condition = defaults?.string(forKey: "condition") ?? "Unknown"
        let score = defaults?.integer(forKey: "activityScore") ?? 50
        return WeatherEntry(date: Date(), temperature: temp, condition: condition, activityScore: score)
    }
}

struct WeatherWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("microWeather")
                .font(.caption2)
                .foregroundColor(.secondary)
            
            HStack {
                Text("\(entry.temperature)°")
                    .font(.system(size: family == .systemSmall ? 36 : 48, weight: .bold))
                
                if family != .systemSmall {
                    VStack(alignment: .leading) {
                        Text(entry.condition)
                            .font(.subheadline)
                        Text("Activity: \(entry.activityScore)/100")
                            .font(.caption)
                            .foregroundColor(scoreColor)
                    }
                }
            }
            
            if family == .systemSmall {
                Text(entry.condition)
                    .font(.caption)
            }
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }
    
    var scoreColor: Color {
        if entry.activityScore >= 70 { return .green }
        if entry.activityScore >= 40 { return .orange }
        return .red
    }
}

@main
struct WeatherWidget: Widget {
    let kind: String = "WeatherWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("microWeather")
        .description("Current weather and activity score")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### Step 5: Share Data from React Native

Update `src/services/WidgetService.js` to write to App Groups:

```javascript
import * as ExpoModulesCore from 'expo-modules-core';

// This requires a native module to write to App Groups
// For now, data is shared via AsyncStorage + background task
```

### Step 6: Build and Test

```bash
# Generate native code
npx expo prebuild -p ios --clean

# Open in Xcode
open ios/*.xcworkspace

# Build and run on device/simulator
```

## Current Status

- ✅ Android widgets implemented via `expo-widgets`
- ⏳ iOS widgets require native development
- 📝 This guide documents the implementation path

## Alternative: expo-widgets (Alpha)

Expo is developing an official `expo-widgets` library that may simplify this process:

```bash
npx expo install expo-widgets
```

However, it's currently in alpha and requires development builds.

## Files Created

When ready to implement, these files need to be created:
- `targets/widget/WeatherWidget.swift`
- `targets/widget/Info.plist`
- `targets/widget/widget.entitlements`
