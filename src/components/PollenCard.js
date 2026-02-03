import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

// Pollen level descriptions
const POLLEN_LEVELS = {
    1: { label: 'Very Low', color: '#22c55e', icon: 'leaf-outline' },
    2: { label: 'Low', color: '#84cc16', icon: 'leaf-outline' },
    3: { label: 'Moderate', color: '#f59e0b', icon: 'warning-outline' },
    4: { label: 'High', color: '#f97316', icon: 'alert-circle-outline' },
    5: { label: 'Very High', color: '#ef4444', icon: 'close-circle-outline' },
};

// Simulate pollen data based on weather conditions
// In production, this would come from a pollen API like Ambee or ClimaCell
const estimatePollenLevel = (weather) => {
    if (!weather?.currently) return null;

    const temp = weather.currently.temperature || 60;
    const humidity = weather.currently.humidity || 0.5;
    const windSpeed = weather.currently.windSpeed || 5;
    const precip = weather.currently.precipProbability || 0;

    // Pollen is generally higher in:
    // - Warm, dry conditions (spring/fall)
    // - Moderate wind (disperses pollen)
    // - Low precipitation

    let score = 3; // Start at moderate

    // Temperature factor (50-80°F is peak pollen)
    if (temp >= 50 && temp <= 80) score += 1;
    if (temp >= 60 && temp <= 75) score += 0.5;
    if (temp < 40 || temp > 90) score -= 1;

    // Humidity factor (low humidity = more pollen in air)
    if (humidity < 0.4) score += 1;
    if (humidity > 0.7) score -= 1;

    // Wind factor (moderate wind spreads pollen)
    if (windSpeed > 5 && windSpeed < 15) score += 0.5;
    if (windSpeed > 20) score -= 0.5; // Too windy, pollen settles

    // Rain factor (rain clears pollen)
    if (precip > 0.5) score -= 1.5;
    if (precip > 0.3) score -= 0.5;

    // Clamp to 1-5 range
    return Math.max(1, Math.min(5, Math.round(score)));
};

const PollenCard = () => {
    const { theme } = useTheme();
    const { weather } = useWeather();
    const [pollenLevel, setPollenLevel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (weather) {
            const level = estimatePollenLevel(weather);
            setPollenLevel(level);
            setLoading(false);
        }
    }, [weather]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <ActivityIndicator size="small" color={theme.accent} />
            </View>
        );
    }

    if (!pollenLevel) return null;

    const level = POLLEN_LEVELS[pollenLevel];

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="flower-outline" size={20} color={level.color} />
                    <Text style={[styles.title, { color: theme.text }]}>Pollen Index</Text>
                </View>
            </View>

            <View style={styles.content}>
                {/* Level Indicator */}
                <View style={styles.levelRow}>
                    <View style={[styles.levelBadge, { backgroundColor: level.color + '20', borderColor: level.color }]}>
                        <Ionicons name={level.icon} size={24} color={level.color} />
                        <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
                    </View>
                </View>

                {/* Visual Scale */}
                <View style={styles.scaleContainer}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <View
                            key={n}
                            style={[
                                styles.scaleDot,
                                {
                                    backgroundColor: n <= pollenLevel ? POLLEN_LEVELS[n].color : theme.glassBorder,
                                    transform: [{ scale: n === pollenLevel ? 1.3 : 1 }],
                                },
                            ]}
                        />
                    ))}
                </View>
                <View style={styles.scaleLabels}>
                    <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>Low</Text>
                    <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>High</Text>
                </View>

                {/* Advice */}
                <View style={[styles.adviceRow, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                    <Text style={[styles.adviceText, { color: theme.textSecondary }]}>
                        {pollenLevel <= 2
                            ? '👍 Great day for outdoor activities with allergies.'
                            : pollenLevel === 3
                                ? '⚠️ Moderate pollen. Consider antihistamines if sensitive.'
                                : '🏠 High pollen alert. Limit outdoor exposure if you have allergies.'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    header: {
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        alignItems: 'center',
    },
    levelRow: {
        marginBottom: 16,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    levelText: {
        fontSize: 16,
        fontWeight: '700',
    },
    scaleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    scaleDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginBottom: 12,
    },
    scaleLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    adviceRow: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        width: '100%',
    },
    adviceText: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
});

export default PollenCard;
