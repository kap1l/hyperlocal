# Pirate Weather vs. WeatherKit: Data Source Comparison

Since **MicroRain Local** is focused on "hyperlocal minutely forecasts," the choice between Pirate Weather (which we are using) and Apple's WeatherKit is significant. 

Here is a breakdown of how they compare, specifically for your use case.

## 1. The Core Data (Accuracy)
| Feature | Pirate Weather (Current) | Apple WeatherKit (Dark Sky Successor) |
| :--- | :--- | :--- |
| **Source** | **Transparent Open Data**. Primarily NOAA (HRRR & GFS) models. It processes these raw government models to recreate the "minutely" forecast style. | **Hybrid Proprietary**. Combines Dark Sky's original tech w/ global hi-res models (ECMWF, UK Met Office, etc) + machine learning. |
| **"Hyperlocal" Rain** | **Excellent in USA**. Since it uses NOAA's HRRR (High Resolution Rapid Refresh), it's very accurate for short-term rain in the US. Less accurate globally. | **Excellent Global Coverage**. Apple has expanded the "minute-by-minute" rain intensity to the UK, Ireland, and parts of Canada/Australia, not just the US. |
| **Reliability** | **Indie Project**. It's a robust independent project run on AWS. | **Enterprise**. Backed by Apple's infrastructure. |

## 2. Developer Experience & Cost
| Feature | Pirate Weather | Apple WeatherKit |
| :--- | :--- | :--- |
| **Cost** | **Free / Cheap**. 10k calls/month for free. 20k for $2 donation. Perfect for MVP. | **Included w/ Apple Dev**. 500k calls/month included in the $99/year developer membership. |
| **Implementation** | **Simple API Key**. Works on any platform (Android, Web, iOS). Just fetch a URL. | **Complex Auth**. Requires generating JWTs signed with a private key from your Apple Developer account. |
| **Data Format** | **Drop-in Dark Sky**. The JSON structure matches the old Dark Sky API exactly (`minutely.data`), which our app is built around. | **New Schema**. A completely different JSON structure. Migrating would require rewriting `WeatherService.js` and our chart logic. |

## 3. Which is better for MicroRain?

### Why we chose Pirate Weather:
1.  **Zero Barrier to Entry**: No Apple Developer account required ($99) to start building.
2.  **Cross-Platform**: Easier to maintain for a React Native app that might run on Android.
3.  **Legacy Compatibility**: It allowed us to use the "Dark Sky" data structure which is perfect for the "Next Hour" chart we built.

### When to switch to WeatherKit:
*   If you release to the App Store and expect **>20,000 users**.
*   If you need **better European/Global accuracy** (Pirate Weather is US-centric).
*   If you want the official "Apple" branding on your data source.

## Summary
For a hyperlocal runner's app in the US, **Pirate Weather is effectively "Dark Sky Classic"**—it gives you the raw data you need without the overhead. **WeatherKit is "Dark Sky 2.0"**—better global data, but locked into the Apple ecosystem's pricing and auth structure.
