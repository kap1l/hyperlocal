import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';
import { fetchAirQuality } from '../services/AirQualityService';

const AirQualityCard = () => {
    const { theme } = useTheme();
    const { weather } = useWeather();
    const [aqiData, setAqiData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAQI = async () => {
            if (!weather?.latitude || !weather?.longitude) return;

            setLoading(true);
            const data = await fetchAirQuality(weather.latitude, weather.longitude);
            setAqiData(data);
            setLoading(false);
        };

        loadAQI();
    }, [weather?.latitude, weather?.longitude]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                <ActivityIndicator size="small" color={theme.accent} />
            </View>
        );
    }

    if (!aqiData) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="leaf-outline" size={18} color={theme.accent} />
                <Text style={[styles.title, { color: theme.text }]}>Air Quality</Text>
            </View>

            {/* AQI Section */}
            <View style={styles.row}>
                <View style={styles.aqiBox}>
                    <Text style={[styles.aqiValue, { color: aqiData.level.color }]}>
                        {aqiData.aqi}
                    </Text>
                    <Text style={[styles.aqiLabel, { color: theme.textSecondary }]}>AQI</Text>
                </View>

                <View style={styles.aqiInfo}>
                    <Text style={[styles.aqiLevel, { color: aqiData.level.color }]}>
                        {aqiData.level.emoji} {aqiData.level.label}
                    </Text>
                    <Text style={[styles.advice, { color: theme.textSecondary }]} numberOfLines={2}>
                        {aqiData.level.advice}
                    </Text>
                </View>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
                <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {Math.round(aqiData.pm2_5)}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PM2.5</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {Math.round(aqiData.pm10)}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PM10</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {Math.round(aqiData.ozone)}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>O₃</Text>
                </View>
            </View>

            {/* Pollen Section */}
            <View style={[styles.pollenSection, { borderTopColor: theme.glassBorder }]}>
                <View style={styles.pollenHeader}>
                    <Ionicons name="flower-outline" size={16} color={theme.accent} />
                    <Text style={[styles.pollenTitle, { color: theme.text }]}>Pollen</Text>
                </View>
                <View style={[styles.pollenBadge, { backgroundColor: aqiData.pollen.color + '20' }]}>
                    <Text style={[styles.pollenLevel, { color: aqiData.pollen.color }]}>
                        {aqiData.pollen.level}
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    aqiBox: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    aqiValue: {
        fontSize: 42,
        fontWeight: '800',
    },
    aqiLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    aqiInfo: {
        flex: 1,
    },
    aqiLevel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    advice: {
        fontSize: 12,
        lineHeight: 16,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    metric: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    pollenSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    pollenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pollenTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    pollenBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pollenLevel: {
        fontSize: 12,
        fontWeight: '700',
    },
});

export default AirQualityCard;
