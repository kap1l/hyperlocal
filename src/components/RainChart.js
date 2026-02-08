import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 160;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const BAR_WIDTH = CHART_WIDTH / 60;

const RainChart = ({ minutelyData, currently }) => {
    const { theme } = useTheme();
    const { units } = useWeather();

    const dangerInfo = useMemo(() => {
        if (!currently) return null;
        const isMetric = units === 'si';
        const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
        const feelsLikeF = isMetric ? (currently.apparentTemperature * 9 / 5) + 32 : currently.apparentTemperature;

        if (tempF < 10 || feelsLikeF < 5) return { label: 'Extremely Cold', color: '#ef4444' };
        if (tempF > 100 || feelsLikeF > 105) return { label: 'Extreme Heat', color: '#ef4444' };
        if (tempF < 32 || feelsLikeF < 25) return { label: 'Freezing', color: '#f59e0b' };
        return null; // Return null if safe, don't clutter UI
    }, [currently, units]);

    const hasRain = useMemo(() => {
        if (!minutelyData) return false;
        return minutelyData.slice(0, 60).some(m => (m.precipProbability || 0) > 0.1);
    }, [minutelyData]);

    if (!minutelyData || minutelyData.length === 0) return null;

    // Don't show chart if completely dry, unless there is a temperature danger
    if (!hasRain && !dangerInfo) return null;

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
                            ? "No precipitation expected."
                            : "No rain expected for the next hour."}
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

                        {/* Guides */}
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

                        {/* Bars */}
                        {minutelyData.slice(0, 60).map((minute, index) => {
                            const prob = minute.precipProbability || 0;
                            const intensity = minute.precipIntensity || 0;

                            // Height based on probability, Color based on intensity logic
                            // Actually, PirateWeather/DarkSky: Intensity is the main factor for "how hard".
                            // But usually charts show Probability as height. Let's mix.
                            // Height = Probability, but if Intensity is high, we boost visually.

                            const barHeight = prob * (CHART_HEIGHT - 40);
                            const x = index * BAR_WIDTH;
                            const y = CHART_HEIGHT - 20 - barHeight;

                            // Use heavy gradient if intensity > 0.3 (rough mm/h threshold for visual pop)
                            const isHeavy = intensity > 2; // high threshold for "purple"

                            return (
                                <Rect
                                    key={index}
                                    x={x}
                                    y={y}
                                    width={BAR_WIDTH * 0.8}
                                    height={barHeight}
                                    fill={isHeavy ? "url(#heavyGradient)" : "url(#rainGradient)"}
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

                        {/* Time Labels */}
                        {[0, 15, 30, 45].map((min) => (
                            <SvgText
                                key={min}
                                x={min * BAR_WIDTH + 2}
                                y={CHART_HEIGHT - 5}
                                fill={theme.textSecondary}
                                fontSize="10"
                                fontWeight="600"
                            >
                                {min === 0 ? 'Now' : min + 'm'}
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
        paddingBottom: 20, // Align with chart area
        paddingTop: 0,
        width: 30,
    },
    intensityText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        opacity: 0.5,
    }
});

export default RainChart;
