import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(date: Date(), temperature: "68°", condition: "cloudy", activityScore: "85", activityType: "Walk")
    }

    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> ()) {
        let entry = getSharedEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> ()) {
        let entry = getSharedEntry()
        // Refresh periodically
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getSharedEntry() -> WeatherEntry {
        let defaultEntry = WeatherEntry(date: Date(), temperature: "--", condition: "unknown", activityScore: "-", activityType: "Activity")
        
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.outweather.app") else {
            return defaultEntry
        }
        
        let temp = sharedDefaults.string(forKey: "widgetTemperature") ?? "--"
        let condition = sharedDefaults.string(forKey: "widgetCondition") ?? "unknown"
        let score = sharedDefaults.string(forKey: "widgetActivityScore") ?? "-"
        let activity = sharedDefaults.string(forKey: "widgetActivityType") ?? "Activity"
        
        return WeatherEntry(date: Date(), temperature: temp + "°", condition: condition, activityScore: score, activityType: activity)
    }
}

struct WeatherEntry: TimelineEntry {
    let date: Date
    let temperature: String
    let condition: String
    let activityScore: String
    let activityType: String
}

// Ensure the colors exist or fallback to system colors
extension Color {
    static let customAccent = Color(red: 34/255, green: 197/255, blue: 94/255)
}

struct OutWeatherWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("OutWeather")
                .font(.caption2)
                .bold()
                .foregroundColor(.secondary)
            
            Spacer()
            
            HStack(alignment: .bottom) {
                Text(entry.temperature)
                    .font(.system(size: 34, weight: .bold))
                Spacer()
                Image(systemName: conditionToSymbol(entry.condition))
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            Spacer()
            
            HStack {
                Text("\(entry.activityType.capitalized) Score:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(entry.activityScore == "-" ? "-" : "\(entry.activityScore)/100")
                    .font(.caption)
                    .bold()
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(scoreBackgroundColor(entry.activityScore))
                    .foregroundColor(.white)
                    .cornerRadius(6)
            }
        }
        .padding()
        // Required for rendering in iOS 17+ correctly
        .containerBackground(Color(UIColor.systemBackground), for: .widget)
    }
    
    private func conditionToSymbol(_ condition: String) -> String {
        switch condition.lowercased() {
        case "clear-day": return "sun.max.fill"
        case "clear-night": return "moon.fill"
        case "cloudy": return "cloud.fill"
        case "partly-cloudy-day": return "cloud.sun.fill"
        case "partly-cloudy-night": return "cloud.moon.fill"
        case "rain": return "cloud.rain.fill"
        case "snow": return "cloud.snow.fill"
        case "thunderstorm": return "cloud.bolt.rain.fill"
        default: return "cloud.sun.fill"
        }
    }
    
    private func scoreBackgroundColor(_ score: String) -> Color {
        guard let num = Int(score) else { return .secondary }
        if num >= 80 { return Color.green }
        if num >= 50 { return Color.orange }
        return Color.red
    }
}

@main
struct OutWeatherWidget: Widget {
    let kind: String = "OutWeatherWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            OutWeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("OutWeather")
        .description("Quickly check conditions and your activity safety score.")
        .supportedFamilies([.systemSmall])
    }
}
