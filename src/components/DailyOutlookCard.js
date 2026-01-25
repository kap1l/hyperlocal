import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const DailyOutlookCard = ({ dailyData }) => {
    const { theme } = useTheme();
    const { units } = useWeather();

    const formattedDays = useMemo(() => {
        if (!dailyData || dailyData.length === 0) return [];

        return dailyData.slice(0, 7).map((day) => {
            const date = new Date(day.time * 1000);
            const dayName = date.toLocaleDateString([], { weekday: 'short' });
            const isToday = new Date().toDateString() === date.toDateString();

            let iconName = 'sunny-outline';
            let iconColor = '#f59e0b';

            const summary = day.summary?.toLowerCase() || '';
            if (summary.includes('rain')) {
                iconName = 'rainy-outline';
                iconColor = theme.accent;
            } else if (summary.includes('cloud')) {
                iconName = 'cloud-outline';
                iconColor = theme.textSecondary;
            } else if (summary.includes('snow')) {
                iconName = 'snow-outline';
                iconColor = '#93c5fd';
            }

            return {
                dayName: isToday ? 'Today' : dayName,
                high: Math.round(day.temperatureMax),
                low: Math.round(day.temperatureMin),
                precip: Math.round(day.precipProbability * 100),
                icon: iconName,
                iconColor,
                summary: day.summary
            };
        });
    }, [dailyData, theme]);

    if (formattedDays.length === 0) return null;

    return (
        <View style={[styles.container, {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            borderWidth: 1,
            shadowColor: theme.shadow
        }]}>
            <Text style={[styles.title, { color: theme.text }]}>7-Day Outlook</Text>
            {formattedDays.map((day, index) => (
                <View key={index} style={[styles.dayRow, index === formattedDays.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.dayName, { color: theme.text }]}>{day.dayName}</Text>
                    <View style={styles.iconSection}>
                        <Ionicons name={day.icon} size={20} color={day.iconColor} />
                        {day.precip > 10 && (
                            <Text style={[styles.precipText, { color: theme.accent }]}>{day.precip}%</Text>
                        )}
                    </View>
                    <View style={styles.tempSection}>
                        <Text style={[styles.highTemp, { color: theme.text }]}>{day.high}°</Text>
                        <Text style={[styles.lowTemp, { color: theme.textSecondary }]}>{day.low}°</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dayName: {
        fontSize: 15,
        fontWeight: '600',
        width: 60,
    },
    iconSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    precipText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    tempSection: {
        flexDirection: 'row',
        gap: 12,
        width: 80,
        justifyContent: 'flex-end',
    },
    highTemp: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    lowTemp: {
        fontSize: 15,
    },
});

export default DailyOutlookCard;
