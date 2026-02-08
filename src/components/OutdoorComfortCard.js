import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const OutdoorComfortCard = ({ currently }) => {
    const { theme } = useTheme();
    const { units } = useWeather();

    const analysis = useMemo(() => {
        if (!currently) return null;

        const { temperature, humidity, windSpeed, uvIndex, apparentTemperature } = currently;

        let score = 100;
        let reasons = [];

        // Handle units
        const isMetric = units === 'si';
        const tempF = isMetric ? (temperature * 9 / 5) + 32 : temperature;
        const feelsLikeF = isMetric ? (apparentTemperature * 9 / 5) + 32 : apparentTemperature;

        // Temperature Analysis (More aggressive deductions)
        if (tempF > 100 || feelsLikeF > 105) {
            score -= 60;
            reasons.push("Dangerously Hot");
        } else if (tempF > 90 || feelsLikeF > 95) {
            score -= 30;
            reasons.push("Very Hot");
        } else if (tempF < 10 || feelsLikeF < 5) {
            score -= 60;
            reasons.push("Dangerously Cold");
        } else if (tempF < 25 || feelsLikeF < 20) {
            score -= 40;
            reasons.push("Freezing");
        } else if (tempF < 40 || feelsLikeF < 35) {
            score -= 20;
            reasons.push("Very Cold");
        } else if (tempF < 55) {
            score -= 10;
            reasons.push("Chilly");
        }

        if (humidity > 0.85) {
            score -= 25;
            reasons.push("Extremely Humid");
        } else if (humidity > 0.70) {
            score -= 10;
            reasons.push("Humid");
        }

        if (windSpeed > 25) {
            score -= 30;
            reasons.push("Gale Winds");
        } else if (windSpeed > 15) {
            score -= 15;
            reasons.push("Windy");
        }

        if (uvIndex > 9) {
            score -= 30;
            reasons.push("Extreme UV");
        } else if (uvIndex > 6) {
            score -= 15;
            reasons.push("High UV");
        }

        // Determine Final Status
        let status = "Perfect";
        let statusColor = "#22c55e";

        if (score <= 50) {
            status = "Stay Inside";
            statusColor = "#ef4444";
        } else if (score <= 85) {
            status = "Warning";
            statusColor = "#f59e0b";
        }

        return { score, reasons, status, statusColor, humidityP: Math.round(humidity * 100) };
    }, [currently, units]);

    if (!analysis) return null;

    return (
        <View style={[styles.container, {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            borderWidth: 1,
            shadowColor: theme.shadow
        }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Outdoor Quality</Text>
                <View style={[styles.statusBadge, { backgroundColor: analysis.statusColor }]}>
                    <Text style={styles.statusText}>{analysis.status}</Text>
                </View>
            </View>

            <View style={styles.grid}>
                <View style={styles.item}>
                    <Ionicons name="water-outline" size={20} color={theme.accent} />
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>Humidity</Text>
                        <Text style={[styles.itemValue, { color: theme.text }]}>{analysis.humidityP}%</Text>
                    </View>
                </View>

                <View style={styles.item}>
                    <Ionicons name="thermometer-outline" size={20} color={theme.accent} />
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>Feels Like</Text>
                        <Text style={[styles.itemValue, { color: theme.text }]}>{Math.round(currently.apparentTemperature)}°</Text>
                    </View>
                </View>

                <View style={styles.item}>
                    <Ionicons name="sunny-outline" size={20} color={theme.accent} />
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>UV Index</Text>
                        <Text style={[styles.itemValue, { color: theme.text }]}>{Math.round(currently.uvIndex)}</Text>
                    </View>
                </View>

                <View style={styles.item}>
                    <Ionicons name="leaf-outline" size={20} color={theme.accent} />
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>Wind</Text>
                        <Text style={[styles.itemValue, { color: theme.text }]}>{Math.round(currently.windSpeed)} mph</Text>
                    </View>
                </View>
            </View>

            {analysis.reasons.length > 0 && (
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        Factors: {analysis.reasons.join(', ')}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    item: {
        flexDirection: 'row',
        width: '48%',
        marginBottom: 16,
        alignItems: 'center',
        gap: 10,
    },
    itemContent: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 11,
    },
    itemValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
    },
    footerText: {
        fontSize: 12,
        fontStyle: 'italic',
    }
});

export default OutdoorComfortCard;
