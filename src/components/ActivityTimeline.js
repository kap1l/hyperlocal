import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';

const ActivityTimeline = ({ hourlyData, currently, currentAnalysis }) => {
    const { theme } = useTheme();
    const { units, selectedActivity } = useWeather();

    // Helper to get activity name for title
    const activityLabels = {
        walk: 'Walking', run: 'Running', cycle: 'Cycling', camera: 'Photography', drive: 'Driving'
    };
    const activityTitle = activityLabels[selectedActivity] || 'Activity';

    const timeline = useMemo(() => {
        if (!hourlyData || hourlyData.length === 0) return [];

        // 1. Filter for 5 AM - 10 PM
        const filtered = hourlyData.filter(h => {
            const hour = new Date(h.time * 1000).getHours();
            return hour >= 5 && hour <= 22;
        });

        // 2. Map and Slice (show next 12 available slots)
        return filtered.slice(0, 12).map((hourData, index) => {
            const { time, temperature } = hourData;

            // Check if this slot is "Now" (same hour as current time)
            const hourDate = new Date(time * 1000);
            const now = new Date();
            const isNow = hourDate.getDate() === now.getDate() && hourDate.getHours() === now.getHours();

            // VISUAL SYNC:
            // If this slot is "Now", we MUST use the 'currently' data and 'currentAnalysis' (if available)
            // to perfectly match the main Home Screen card.
            const dataToUse = (isNow && currently) ? currently : hourData;
            let safety;

            if (isNow && currentAnalysis) {
                safety = currentAnalysis;
            } else {
                safety = analyzeActivitySafety(selectedActivity, dataToUse, units);
            }

            const hourLabel = isNow ? 'Now' : hourDate.toLocaleTimeString([], { hour: 'numeric' });

            return {
                time: hourLabel,
                temp: Math.round(temperature),
                safety // { status, label, color }
            };
        });
    }, [hourlyData, currently, currentAnalysis, units, selectedActivity]);

    if (timeline.length === 0) return null;

    return (
        <View style={[styles.container, {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            shadowColor: theme.shadow
        }]}>
            <Text style={[styles.title, { color: theme.textSecondary }]}>
                Hourly {activityTitle} Forecast (5 AM - 10 PM)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {timeline.map((item, index) => (
                    <View key={index} style={styles.hourCard}>
                        <Text style={[styles.hourText, { color: theme.textSecondary }]}>{item.time}</Text>

                        {/* Status Icon/Pill */}
                        <View style={[styles.iconContainer, { backgroundColor: item.safety.color + '20' }]}>
                            <Ionicons
                                name={item.safety.status === 'safe' ? 'checkmark' : item.safety.status === 'warning' ? 'alert' : 'warning'}
                                size={18}
                                color={item.safety.color}
                            />
                        </View>

                        <Text style={[styles.tempText, { color: theme.text }]}>{item.temp}°</Text>

                        {/* Compact Status Label */}
                        <Text
                            style={[styles.statusLabel, { color: item.safety.color }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.safety.status === 'safe' ? 'Good' : item.safety.label}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scroll: {
        paddingHorizontal: 16,
        gap: 12, // Tighter gap
    },
    hourCard: {
        alignItems: 'center',
        width: 70, // Fixed width for alignment
    },
    hourText: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    tempText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statusLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 2,
        textAlign: 'center',
        width: '100%',
    }
});

export default ActivityTimeline;
