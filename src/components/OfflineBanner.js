import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * OfflineBanner - Shows when using cached/stale data
 * @param {boolean} isOffline - Whether device is offline
 * @param {number} lastUpdated - Timestamp of last data fetch
 */
const OfflineBanner = ({ isOffline, lastUpdated }) => {
    const { theme } = useTheme();

    // Calculate how long ago data was updated
    const getTimeAgo = () => {
        if (!lastUpdated) return 'Unknown';
        const diff = Date.now() - lastUpdated;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);

        if (hours > 0) return `${hours}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return 'Just now';
    };

    // Only show if offline OR data is older than 30 minutes
    const isStale = lastUpdated && (Date.now() - lastUpdated > 30 * 60 * 1000);

    if (!isOffline && !isStale) return null;

    return (
        <View style={[styles.container, { backgroundColor: isOffline ? '#f59e0b' : '#6b7280' }]}>
            <Ionicons
                name={isOffline ? "cloud-offline-outline" : "time-outline"}
                size={14}
                color="#fff"
            />
            <Text style={styles.text}>
                {isOffline ? 'Offline Mode' : 'Last updated'}: {getTimeAgo()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default OfflineBanner;
