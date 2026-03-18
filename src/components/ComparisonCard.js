import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getConditionsLastWeek } from '../services/HistoricalWeatherService';
import { useIsFocused } from '@react-navigation/native';
import { useWeather } from '../context/WeatherContext';

export default function ComparisonCard() {
    const { theme } = useTheme();
    const { units, weather } = useWeather();
    const isFocused = useIsFocused();
    const [pastWeather, setPastWeather] = useState(null);

    useEffect(() => {
        if (isFocused && weather) {
            getConditionsLastWeek(units).then(setPastWeather);
        }
    }, [isFocused, units, weather]);

    if (!pastWeather || !weather?.currently) return null;

    const currentTemp = Math.round(weather.currently.temperature);
    const pastTemp = pastWeather.temperature;
    const diff = currentTemp - pastTemp;
    
    let diffText = "About the same as last week";
    let iconName = "remove-outline";
    let color = theme.textSecondary;

    if (diff > 2) {
        diffText = `${diff}° warmer than last week`;
        iconName = "arrow-up-outline";
        color = "#ef4444"; // red
    } else if (diff < -2) {
        diffText = `${Math.abs(diff)}° cooler than last week`;
        iconName = "arrow-down-outline";
        color = "#3b82f6"; // blue
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.headerRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.accent} />
                <Text style={[styles.title, { color: theme.text }]}>Last Week</Text>
            </View>

            <View style={styles.contentRow}>
                <View style={styles.side}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Today</Text>
                    <Text style={[styles.temp, { color: theme.text }]}>{currentTemp}°</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.side}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Last Week</Text>
                    <Text style={[styles.temp, { color: pastTemp > currentTemp ? '#ef4444' : pastTemp < currentTemp ? '#3b82f6' : theme.text }]}>
                        {pastTemp}°
                    </Text>
                </View>
            </View>

            <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                <Ionicons name={iconName} size={14} color={color} />
                <Text style={{ color: theme.text, fontSize: 13, marginLeft: 6 }}>{diffText}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    side: {
        alignItems: 'center',
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    temp: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: 30,
        marginHorizontal: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    }
});
