import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

// MOCK AD COMPONENT
// In production, this would import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const BannerAdComponent = () => {
    const { isPro } = useSubscription();
    const { theme } = useTheme();

    // 1. Privacy Check: If the user is Pro, we render NOTHING.
    // This ensures no ad tracking code ever runs for them.
    if (isPro) return null;

    // 2. Render Mock Ad
    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.adPlaceholder, { borderColor: theme.accent }]}>
                <Text style={[styles.adLabel, { backgroundColor: theme.accent }]}>Ad</Text>
                <Text style={[styles.adText, { color: theme.textSecondary }]}>
                    Google AdMob Banner (Test Mode)
                </Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>
                    Upgrade to remove ads
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    adPlaceholder: {
        width: 320,
        height: 50,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    adLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        color: '#fff',
        fontSize: 10,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderBottomRightRadius: 4,
    },
    adText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default BannerAdComponent;
