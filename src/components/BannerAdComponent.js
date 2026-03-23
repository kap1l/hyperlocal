/**
 * BannerAdComponent.js
 *
 * Uses react-native-google-mobile-ads for real banner ad delivery.
 * Pro subscribers see no ads (privacy-first: the ad SDK is never initialised
 * for them).
 *
 * Setup checklist:
 *   1. Run: npm install react-native-google-mobile-ads
 *   2. Set ADMOB_APP_ID in EAS Secrets:
 *      eas secret:create --scope project --name ADMOB_APP_ID_IOS --value ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
 *      eas secret:create --scope project --name ADMOB_APP_ID_ANDROID --value ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
 *   3. app.config.js already reads from process.env.ADMOB_APP_ID — update it
 *      to use the correct platform-specific ID.
 *   4. Run `expo prebuild` or `eas build` to apply native config.
 *
 * Ad unit IDs:
 *   During development / Expo Go → TestIds.BANNER (safe mock ad from Google)
 *   In production builds → your real unit ID from AdMob dashboard
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useSubscription } from '../context/SubscriptionContext';

// ─────────────────────────────────────────────────────────────────────────────
//  Ad Unit IDs
//  Replace the production IDs with your real AdMob banner unit IDs.
//  These are safe to commit — they are NOT secret (unlike the App ID in app.json).
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTION_UNIT_IDS = {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // TODO: replace with real iOS banner unit ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // TODO: replace with real Android banner unit ID
};

const getAdUnitId = () => {
    if (__DEV__) {
        // Always use Google's official test ID during development so you don't
        // accidentally click-through on your own production ads.
        return TestIds.BANNER;
    }
    return Platform.OS === 'ios'
        ? PRODUCTION_UNIT_IDS.ios
        : PRODUCTION_UNIT_IDS.android;
};

const BannerAdComponent = ({ forceHide }) => {
    const { isPro } = useSubscription();
    const [adLoaded, setAdLoaded] = useState(false);

    // 1. Privacy-first: Pro users never load ad SDK
    if (isPro || forceHide) return null;

    const unitId = getAdUnitId();

    return (
        <View style={[styles.container, !adLoaded && styles.hidden]}>
            <BannerAd
                unitId={unitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false, // set true for GDPR/CCPA paths
                    networkExtras: {},
                }}
                onAdLoaded={() => setAdLoaded(true)}
                onAdFailedToLoad={(error) => {
                    if (__DEV__) console.warn('[AdMob] Banner failed to load:', error);
                    setAdLoaded(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    hidden: {
        // Collapse space until the ad actually loads to avoid layout shift
        height: 0,
        overflow: 'hidden',
        paddingVertical: 0,
    },
});

export default BannerAdComponent;
