// Dynamic Expo config — replaces app.json
// Keys are injected from environment variables / EAS Secrets at build time.
//
// Required EAS Secrets:
//   eas secret:create --scope project --name REVENUECAT_IOS_KEY     --value <ios_key>
//   eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value <android_key>
//   eas secret:create --scope project --name ADMOB_APP_ID_IOS       --value ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
//   eas secret:create --scope project --name ADMOB_APP_ID_ANDROID   --value ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
//
// Local development (no EAS):
//   export REVENUECAT_IOS_KEY=appl_...
//   export ADMOB_APP_ID_IOS=ca-app-pub-3940256099942544~1458002511  (Google test App ID)

export default {
  expo: {
    name: 'OutWeather',
    slug: 'microweather',
    scheme: 'outweather',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.antigravity.outweather',
      infoPlist: {
        UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
      },
      entitlements: {
        'com.apple.security.application-groups': ['group.com.outweather.app'],
      },
    },
    android: {
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f172a',
      },
      package: 'com.antigravity.outweather',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'RECEIVE_BOOT_COMPLETED',
        'NOTIFICATIONS',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.READ_TOTAL_CALORIES_BURNED'
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-asset',
      'expo-font',
      'expo-notifications',
      'expo-location',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      [
        'expo-build-properties',
        {
          android: {
            newArchEnabled: false,
            minSdkVersion: 26,
          },
        },
      ],
      // Google Mobile Ads — must appear before the build runs native config
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: process.env.ADMOB_APP_ID_IOS || 'ca-app-pub-3940256099942544~1458002511',
          // Delay measurement (ATT prompt) — recommended for iOS privacy compliance
          delay_app_measurement_init: true,
          // User tracking usage description shown in iOS ATT prompt
          user_tracking_usage_description:
            'This allows OutWeather to show you relevant ads that support free access to weather data.',
          // Set to false for GDPR/CCPA if you implement a proper CMP
          android_request_tracking_id: false,
        },
      ],
      [
        'react-native-android-widget',
        {
          widgets: [
            {
              name: 'WeatherWidget',
              label: 'OutWeather Activity',
              minWidth: '180dp',
              minHeight: '110dp',
              description: 'Shows your activity score at a glance',
              previewImage: './assets/widget_preview.png',
              resizeMode: 'horizontal|vertical',
              widgetFeatures: 'reconfigurable',
              updatePeriodMillis: 1800000,
            },
          ],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '847feb51-37ae-4836-9e4d-0275b3cb1dbe',
      },
      sentryDsn: process.env.SENTRY_DSN,
      // RevenueCat keys — injected at build time from EAS Secrets / env vars.
      // null → purchases disabled gracefully (no Pro granted — see SubscriptionContext)
      revenueCatAndroidKey: process.env.REVENUECAT_ANDROID_KEY || null,
      revenueCatIosKey: process.env.REVENUECAT_IOS_KEY || null,
    },
  },
};
