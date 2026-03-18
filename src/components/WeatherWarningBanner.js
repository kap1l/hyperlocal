import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const WeatherWarningBanner = ({ warnings }) => {
    const { theme } = useTheme();
    const [dismissed, setDismissed] = useState(false);

    // Reset dismissed state if warnings array changes significantly
    useEffect(() => {
        setDismissed(false);
    }, [warnings?.length]);

    if (!warnings || warnings.length === 0 || dismissed) {
        return null;
    }

    const firstWarning = warnings[0];
    const displayTitle = warnings.length > 1 
        ? `${firstWarning.title} +${warnings.length - 1} more` 
        : firstWarning.title;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="warning-outline" size={20} color="#fff" />
                <Text style={styles.title} numberOfLines={2}>
                    {displayTitle}
                </Text>
            </View>
            <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.closeBtn} 
                onPress={() => setDismissed(true)}
            >
                <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        // Since it's above OfflineBanner, we make it full width
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
        marginRight: 10,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        flex: 1,
    },
    closeBtn: {
        padding: 4,
    }
});

export default WeatherWarningBanner;
