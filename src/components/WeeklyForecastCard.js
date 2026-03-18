import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import CollapsibleSection from './CollapsibleSection';

const WeeklyForecastCard = ({ dailyData, activity, units }) => {
    const { theme } = useTheme();

    const formattedDays = useMemo(() => {
        if (!dailyData || dailyData.length === 0) return [];

        return dailyData.slice(0, 7).map((day) => {
            const date = new Date(day.time * 1000);
            const dayName = date.toLocaleDateString([], { weekday: 'short' });
            
            // Map daily fields to what analyzeActivitySafety expects
            const proxyCurrently = {
                ...day,
                temperature: day.temperatureMax,
                apparentTemperature: day.apparentTemperatureHigh || day.temperatureMax,
            };

            const analysis = analyzeActivitySafety(activity || 'walk', proxyCurrently, units);
            
            // Score handling
            const score = analysis ? Math.max(0, Math.min(100, analysis.score)) : 0;
            let barColor = '#ef4444'; // Red
            if (score >= 70) barColor = '#22c55e'; // Green
            else if (score >= 40) barColor = '#f59e0b'; // Amber

            return {
                id: day.time.toString(),
                dayName,
                high: Math.round(day.temperatureMax),
                low: Math.round(day.temperatureMin),
                score,
                barColor
            };
        });
    }, [dailyData, activity, units]);

    if (formattedDays.length === 0) return null;

    return (
        <CollapsibleSection title="This Week" icon="calendar-outline" sectionId="weekly-forecast" accentColor="#8b5cf6">
            <View style={styles.container}>
                {formattedDays.map((day, index) => (
                    <View key={day.id} style={[styles.dayRow, index === formattedDays.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: theme.glassBorder }]}>
                        <Text style={[styles.dayName, { color: theme.text }]}>{day.dayName}</Text>
                        
                        <View style={styles.barContainer}>
                            <View style={[styles.barBackground, { backgroundColor: theme.glassBorder }]}>
                                <View style={[styles.barFill, { width: `${day.score}%`, backgroundColor: day.barColor }]} />
                            </View>
                        </View>

                        <View style={styles.tempSection}>
                            <Text style={[styles.highTemp, { color: theme.text }]}>{day.high}°</Text>
                            <Text style={[styles.lowTemp, { color: theme.textSecondary }]}>{day.low}°</Text>
                        </View>
                    </View>
                ))}
            </View>
        </CollapsibleSection>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 4,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dayName: {
        fontSize: 15,
        fontWeight: '600',
        width: 50,
    },
    barContainer: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    barBackground: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    tempSection: {
        flexDirection: 'row',
        width: 70,
        justifyContent: 'flex-end',
        gap: 8,
    },
    highTemp: {
        fontSize: 15,
        fontWeight: '700',
    },
    lowTemp: {
        fontSize: 15,
    },
});

export default WeeklyForecastCard;
