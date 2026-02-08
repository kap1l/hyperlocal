import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const ExtendedActivityCard = ({ currently, analysis, onFindBestTime }) => {
    const { theme } = useTheme();
    const { selectedActivity } = useWeather();

    if (!analysis) return null;

    const { score, status, advice, metrics, color } = analysis;

    // Helper to get status dot color
    const getStatusDot = (metricStatus) => {
        if (metricStatus === 'good') return theme.success;
        if (metricStatus === 'fair') return '#f59e0b'; // Amber
        return theme.danger;
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.container, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
        >
            {/* Header: Score & Status */}
            <View style={styles.header}>
                <View style={[styles.scoreCircle, { borderColor: color }]}>
                    <Text style={[styles.scoreText, { color: theme.text }]}>{score}</Text>
                    <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>SCORE</Text>
                </View>

                <View style={styles.headerInfo}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                            <Ionicons name={score > 80 ? "shield-checkmark" : "warning-outline"} size={14} color={color} />
                            <Text style={[styles.statusText, { color: color }]}>{status.toUpperCase()}</Text>
                        </View>
                        {/* Feels Like Indicator */}
                        <View style={[styles.feelsLikeBadge, { backgroundColor: theme.cardBg }]}>
                            <Ionicons name="thermometer-outline" size={12} color={theme.textSecondary} />
                            <Text style={[styles.feelsLikeText, { color: theme.textSecondary }]}>
                                Feels {typeof currently.apparentTemperature === 'number' ? Math.round(currently.apparentTemperature) : '--'}°
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.headline, { color: theme.text }]}>
                        {selectedActivity.charAt(0).toUpperCase() + selectedActivity.slice(1)} Forecast
                    </Text>
                </View>
            </View>

            {/* Advice Body */}
            <View style={styles.body}>
                <Text style={[styles.advice, { color: theme.text }]}>
                    "{advice}"
                </Text>
            </View>

            {/* Metrics Grid */}
            <View style={[styles.grid, { borderColor: theme.glassBorder }]}>
                {metrics.map((m, i) => (
                    <View key={i} style={[
                        styles.gridItem,
                        i < 2 && { borderBottomWidth: 1, borderBottomColor: theme.glassBorder }, // simple 2x2 logic assumption
                        i % 2 === 0 && { borderRightWidth: 1, borderRightColor: theme.glassBorder }
                    ]}>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{m.name}</Text>
                        <View style={styles.metricValueRow}>
                            <View style={[styles.dot, { backgroundColor: getStatusDot(m.status) }]} />
                            <Text style={[styles.metricValue, { color: theme.text }]}>{m.value}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Smart Schedule Button */}
            <TouchableOpacity
                style={[styles.scheduleBtn, { backgroundColor: theme.accent }]}
                onPress={onFindBestTime}
            >
                <Ionicons name="calendar" size={16} color={theme.name === 'day' ? '#fff' : '#000'} />
                <Text style={[styles.scheduleBtnText, { color: theme.name === 'day' ? '#fff' : '#000' }]}>
                    Find Best Time
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 15,
    },
    scoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 24,
    },
    scoreLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    headerInfo: {
        flex: 1,
        gap: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feelsLikeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    feelsLikeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    headline: {
        fontSize: 16,
        fontWeight: '700',
    },
    body: {
        marginBottom: 20,
    },
    advice: {
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'italic',
        lineHeight: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gridItem: {
        width: '50%',
        padding: 12,
        gap: 4,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    metricValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    scheduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    scheduleBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

export default ExtendedActivityCard;
