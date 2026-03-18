import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 160;
const CHART_WIDTH = SCREEN_WIDTH - 64;

/**
 * RainChart
 *
 * Supports two data resolutions:
 *
 *  1. PirateWeather: 60 per-minute data points → BAR_WIDTH = CHART_WIDTH / 60
 *     Time labels: 0, 15m, 30m, 45m
 *
 *  2. Open-Meteo: `minutely.data` already has 60 interpolated minute-points
 *     produced by OpenMeteoAdapter.interpolateMinutely(), so this chart works
 *     identically for both sources.
 *
 * If fewer than 60 points are received (shouldn't happen after the adapter runs,
 * but as a defensive measure) we fall back to 15-min bucket rendering by
 * stretching bars proportionally across the chart width.
 */
const RainChart = ({ minutelyData, currently }) => {
    const { theme } = useTheme();
    const { units } = useWeather();

    // ── Safety / temperature danger badge ────────────────────────────────
    const dangerInfo = useMemo(() => {
        if (!currently) return null;
        const isMetric = units === 'si';
        const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
        const feelsLikeF = isMetric ? (currently.apparentTemperature * 9 / 5) + 32 : currently.apparentTemperature;

        if (tempF < 10 || feelsLikeF < 5) return { label: 'Extremely Cold', color: '#ef4444' };
        if (tempF > 100 || feelsLikeF > 105) return { label: 'Extreme Heat', color: '#ef4444' };
        if (tempF < 32 || feelsLikeF < 25) return { label: 'Freezing', color: '#f59e0b' };
        return null;
    }, [currently, units]);

    // ── Normalize data to exactly 60 display slots ────────────────────────
    const displayData = useMemo(() => {
        if (!minutelyData || minutelyData.length === 0) return [];

        // Clamp to first 60 points (adapter guarantees this, but be safe)
        if (minutelyData.length >= 60) return minutelyData.slice(0, 60);

        // Fewer points (e.g. raw 4-point 15-min data without the adapter).
        // Linearly interpolate between the pairs.
        const interpolated = [];
        for (let i = 0; i < minutelyData.length - 1; i++) {
            const current = minutelyData[i];
            const next = minutelyData[i + 1];
            
            for (let j = 0; j < 15; j++) {
                const fraction = j / 15;
                interpolated.push({
                    time: current.time + (next.time - current.time) * fraction,
                    precipProbability: (current.precipProbability || 0) + ((next.precipProbability || 0) - (current.precipProbability || 0)) * fraction,
                    precipIntensity: (current.precipIntensity || 0) + ((next.precipIntensity || 0) - (current.precipIntensity || 0)) * fraction,
                });
            }
            if (interpolated.length >= 60) break;
        }
        
        while (interpolated.length < 60) {
            interpolated.push({ ...interpolated[interpolated.length - 1] });
        }
        
        return interpolated.slice(0, 60);
    }, [minutelyData]);

    const hasRain = useMemo(() => {
        if (displayData.length === 0) return false;
        return displayData.some(m => (m.precipProbability || 0) > 0.1);
    }, [displayData]);

    if (!displayData || displayData.length === 0) return null;

    // Don't show chart if completely dry and no temperature danger
    if (!hasRain && !dangerInfo) return null;

    const BAR_WIDTH = CHART_WIDTH / displayData.length;

    // Time label positions — always show Now, 15m, 30m, 45m
    const timeLabels = [0, 15, 30, 45];

    return (
        <View style={[styles.container, {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            borderWidth: 1,
            shadowColor: theme.shadow
        }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Next Hour</Text>
                {dangerInfo && (
                    <View style={[styles.dangerBadge, { backgroundColor: dangerInfo.color + '20' }]}>
                        <Text style={[styles.dangerText, { color: dangerInfo.color }]}>{dangerInfo.label.toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {!hasRain ? (
                <View style={styles.clearContainer}>
                    <Text style={[styles.clearText, { color: theme.textSecondary }]}>
                        {dangerInfo
                            ? 'No precipitation expected.'
                            : 'No rain expected for the next hour.'}
                    </Text>
                </View>
            ) : (
                <View style={styles.chartWrapper}>
                    <View style={styles.intensityLabels}>
                        <Text style={[styles.intensityText, { color: theme.textSecondary }]}>Heavy</Text>
                        <Text style={[styles.intensityText, { color: theme.textSecondary }]}>Med</Text>
                        <Text style={[styles.intensityText, { color: theme.textSecondary }]}>Light</Text>
                    </View>

                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                        <Defs>
                            <LinearGradient id="rainGradient" x1="0" y1="1" x2="0" y2="0">
                                <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.4" />
                                <Stop offset="1" stopColor="#60a5fa" stopOpacity="0.9" />
                            </LinearGradient>
                            <LinearGradient id="heavyGradient" x1="0" y1="1" x2="0" y2="0">
                                <Stop offset="0" stopColor="#8b5cf6" stopOpacity="0.6" />
                                <Stop offset="1" stopColor="#d8b4fe" stopOpacity="1" />
                            </LinearGradient>
                        </Defs>

                        {/* Guide lines at 33% and 66% */}
                        {[0.33, 0.66].map((pct) => (
                            <Line
                                key={pct}
                                x1={0}
                                y1={CHART_HEIGHT - 20 - (pct * (CHART_HEIGHT - 40))}
                                x2={CHART_WIDTH}
                                y2={CHART_HEIGHT - 20 - (pct * (CHART_HEIGHT - 40))}
                                stroke={theme.textSecondary}
                                strokeWidth={0.5}
                                strokeDasharray="4 4"
                                opacity={0.2}
                            />
                        ))}

                        {/* Bars — one per display slot */}
                        {displayData.map((minute, index) => {
                            const prob = minute.precipProbability || 0;
                            const intensity = minute.precipIntensity || 0;
                            const barHeight = prob * (CHART_HEIGHT - 40);
                            const x = index * BAR_WIDTH;
                            const y = CHART_HEIGHT - 20 - barHeight;
                            const isHeavy = intensity > 2;

                            return (
                                <Rect
                                    key={index}
                                    x={x}
                                    y={y}
                                    width={Math.max(BAR_WIDTH * 0.8, 1)}
                                    height={barHeight}
                                    fill={isHeavy ? 'url(#heavyGradient)' : 'url(#rainGradient)'}
                                    rx={2}
                                />
                            );
                        })}

                        {/* Baseline */}
                        <Line
                            x1={0}
                            y1={CHART_HEIGHT - 20}
                            x2={CHART_WIDTH}
                            y2={CHART_HEIGHT - 20}
                            stroke={theme.glassBorder}
                            strokeWidth={1}
                        />

                        {/* Time labels at 0, 15, 30, 45 min marks */}
                        {timeLabels.map((min) => (
                            <SvgText
                                key={min}
                                x={min * BAR_WIDTH + 2}
                                y={CHART_HEIGHT - 5}
                                fill={theme.textSecondary}
                                fontSize="10"
                                fontWeight="600"
                            >
                                {min === 0 ? 'Now' : `${min}m`}
                            </SvgText>
                        ))}
                    </Svg>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        elevation: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.9,
    },
    dangerBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dangerText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    clearContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.8,
    },
    chartWrapper: {
        flexDirection: 'row',
        gap: 12,
    },
    intensityLabels: {
        height: CHART_HEIGHT - 20,
        justifyContent: 'space-between',
        paddingBottom: 20,
        paddingTop: 0,
        width: 30,
    },
    intensityText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        opacity: 0.5,
    },
});

export default RainChart;
