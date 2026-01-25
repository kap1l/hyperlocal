import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getSeverityOverride } from '../utils/weatherSafety';

const WeatherCard = ({ currently, dailyData }) => {
    const { theme } = useTheme();
    if (!currently) return null;

    const { temperature, summary, precipProbability, precipIntensity, windSpeed } = currently;

    // DEBUG: Inspect raw values
    console.log("DEBUG WEATHER:", { temp: temperature, intensity: precipIntensity, wind: windSpeed, summary });

    const severityOverride = getSeverityOverride(currently, false); // assume US for now or pass props
    const displaySummary = severityOverride || summary;

    const sunrise = dailyData?.[0]?.sunriseTime
        ? new Date(dailyData[0].sunriseTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : '--:--';

    const sunset = dailyData?.[0]?.sunsetTime
        ? new Date(dailyData[0].sunsetTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : '--:--';

    return (
        <View style={[styles.card, {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            shadowColor: theme.shadow
        }]}>
            <Text style={[styles.summary, { color: theme.textSecondary }]}>{displaySummary}</Text>
            <Text style={[styles.temp, { color: theme.text }]}>{Math.round(temperature)}°</Text>

            <View style={styles.sunRow}>
                <View style={styles.sunItem}>
                    <Ionicons name="sunny-outline" size={16} color={theme.accent} />
                    <Text style={[styles.sunText, { color: theme.textSecondary }]}>{sunrise}</Text>
                </View>
                <View style={styles.sunItem}>
                    <Ionicons name="moon-outline" size={16} color={theme.accent} />
                    <Text style={[styles.sunText, { color: theme.textSecondary }]}>{sunset}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.stat}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Precip Chance</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{Math.round(precipProbability * 100)}%</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Intensity</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{precipIntensity.toFixed(2)} in/h</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 12,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1, // Reduced for glass feel
        shadowRadius: 10,
        elevation: 5,
    },
    summary: {
        fontSize: 18,
        marginBottom: 4,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    temp: {
        fontSize: 72,
        fontWeight: '700',
    },
    sunRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 10,
    },
    sunItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sunText: {
        fontSize: 13,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 15,
    },
    stat: {
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    }
});

export default WeatherCard;
