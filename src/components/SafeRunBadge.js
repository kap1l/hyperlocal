import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const THRESHOLD = 0.2; // 20% probability count as "rain"

const SafeRunBadge = ({ minutelyData, currently }) => {
    const { theme } = useTheme();
    const { units } = useWeather();

    const analysis = useMemo(() => {
        if (!minutelyData || minutelyData.length === 0 || !currently) return null;

        // 1. Temperature Check (Sync with OutdoorComfortCard)
        const isMetric = units === 'si';
        const tempF = isMetric ? (currently.temperature * 9 / 5) + 32 : currently.temperature;
        const feelsLikeF = isMetric ? (currently.apparentTemperature * 9 / 5) + 32 : currently.apparentTemperature;

        if (tempF < 10 || feelsLikeF < 5) {
            return { status: 'unsafe', message: "Dangerously Cold: Stay Inside" };
        }
        if (tempF > 100 || feelsLikeF > 105) {
            return { status: 'unsafe', message: "Dangerously Hot: Stay Inside" };
        }

        // 2. Precipitation Logic
        const immediateData = minutelyData.slice(0, 20);
        const rainSoon = immediateData.some(m => m.precipProbability > THRESHOLD);

        if (!rainSoon) {
            // Check for chilly weather even if safe from rain
            if (tempF < 25 || feelsLikeF < 20) {
                return { status: 'warning', message: "Safe from rain, but freezing cold" };
            }
            return { status: 'safe', message: "Safe to run for 20+ mins" };
        }

        // Find next window
        let windowStart = null;
        let windowEnd = null;
        let currentWindowStart = null;
        const MIN_WINDOW_LEN = 15; // 15 mins dry needed

        for (let i = 0; i < minutelyData.length; i++) {
            const isDry = minutelyData[i].precipProbability <= THRESHOLD;
            if (isDry) {
                if (currentWindowStart === null) currentWindowStart = i;
            } else {
                if (currentWindowStart !== null) {
                    if (i - currentWindowStart >= MIN_WINDOW_LEN) {
                        windowStart = minutelyData[currentWindowStart].time;
                        windowEnd = minutelyData[i - 1].time;
                        break;
                    }
                    currentWindowStart = null;
                }
            }
        }

        if (windowStart && windowEnd) {
            const start = new Date(windowStart * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { status: 'unsafe', message: `Rain soon. Next window: ${start}` };
        }

        return { status: 'unsafe', message: "No safe windows soon" };

    }, [minutelyData, currently, units]);

    if (!analysis) return null;

    let mainColor, textColor, borderColor;
    if (analysis.status === 'safe') {
        mainColor = theme.success;
        textColor = theme.name === 'day' ? '#2E7D32' : '#81C784';
        borderColor = theme.success.replace('0.15', '0.3');
    } else if (analysis.status === 'warning') {
        mainColor = 'rgba(245, 158, 11, 0.15)';
        textColor = theme.name === 'day' ? '#B45309' : '#FBBF24';
        borderColor = 'rgba(245, 158, 11, 0.3)';
    } else {
        mainColor = theme.danger;
        textColor = theme.name === 'day' ? '#C62828' : '#E57373';
        borderColor = theme.danger.replace('0.15', '0.3');
    }

    return (
        <View style={[styles.container, { backgroundColor: mainColor, borderColor: borderColor, borderWidth: 1, elevation: 1 }]}>
            <Text style={[styles.text, { color: textColor }]}>
                {analysis.message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 0,
    },
    text: {
        fontWeight: '600',
        fontSize: 16,
    }
});

export default SafeRunBadge;
