import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

/**
 * GoldenHourCard - Shows sunrise/sunset times and golden hour windows for photographers
 */
const GoldenHourCard = () => {
    const { theme } = useTheme();
    const { weather, selectedActivity } = useWeather();

    // Only show for photography/camera activity
    if (selectedActivity !== 'camera') return null;

    const sunData = useMemo(() => {
        if (!weather?.daily?.data?.[0]) return null;

        const today = weather.daily.data[0];
        const sunriseTime = today.sunriseTime ? new Date(today.sunriseTime * 1000) : null;
        const sunsetTime = today.sunsetTime ? new Date(today.sunsetTime * 1000) : null;

        if (!sunriseTime || !sunsetTime) return null;

        // Golden Hour: ~1 hour after sunrise and ~1 hour before sunset
        const morningGoldenStart = new Date(sunriseTime);
        const morningGoldenEnd = new Date(sunriseTime.getTime() + 60 * 60 * 1000); // +1 hour

        const eveningGoldenStart = new Date(sunsetTime.getTime() - 60 * 60 * 1000); // -1 hour
        const eveningGoldenEnd = new Date(sunsetTime);

        // Blue Hour: ~30 min before sunrise and ~30 min after sunset
        const morningBlueStart = new Date(sunriseTime.getTime() - 30 * 60 * 1000);
        const morningBlueEnd = sunriseTime;

        const eveningBlueStart = new Date(sunsetTime);
        const eveningBlueEnd = new Date(sunsetTime.getTime() + 30 * 60 * 1000);

        // Format time helper
        const formatTime = (date) => {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        // Calculate countdown to next golden hour
        const now = new Date();
        let nextGolden = null;
        let countdown = '';

        if (now < morningGoldenStart) {
            nextGolden = 'Morning Golden Hour';
            countdown = getCountdown(morningGoldenStart);
        } else if (now < morningGoldenEnd) {
            nextGolden = 'Golden Hour NOW!';
            countdown = 'Go shoot! 📸';
        } else if (now < eveningGoldenStart) {
            nextGolden = 'Evening Golden Hour';
            countdown = getCountdown(eveningGoldenStart);
        } else if (now < eveningGoldenEnd) {
            nextGolden = 'Golden Hour NOW!';
            countdown = 'Go shoot! 📸';
        } else {
            nextGolden = 'Tomorrow Morning';
            countdown = 'See you then';
        }

        function getCountdown(target) {
            const diff = target - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            if (hours > 0) return `in ${hours}h ${mins}m`;
            return `in ${mins}m`;
        }

        return {
            sunrise: formatTime(sunriseTime),
            sunset: formatTime(sunsetTime),
            morningGolden: `${formatTime(morningGoldenStart)} - ${formatTime(morningGoldenEnd)}`,
            eveningGolden: `${formatTime(eveningGoldenStart)} - ${formatTime(eveningGoldenEnd)}`,
            nextGolden,
            countdown,
            isGoldenNow: countdown.includes('NOW'),
        };
    }, [weather?.daily?.data]);

    if (!sunData) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="sunny-outline" size={18} color="#f59e0b" />
                <Text style={[styles.title, { color: theme.text }]}>Golden Hour</Text>
                {sunData.isGoldenNow && (
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
            </View>

            {/* Countdown */}
            <View style={styles.countdownSection}>
                <Text style={[styles.nextLabel, { color: theme.textSecondary }]}>
                    {sunData.nextGolden}
                </Text>
                <Text style={[styles.countdown, { color: sunData.isGoldenNow ? '#f59e0b' : theme.text }]}>
                    {sunData.countdown}
                </Text>
            </View>

            {/* Sun Times Row */}
            <View style={styles.timesRow}>
                <View style={styles.timeBlock}>
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#f97316" />
                    <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Sunrise</Text>
                    <Text style={[styles.timeValue, { color: theme.text }]}>{sunData.sunrise}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.timeBlock}>
                    <Ionicons name="arrow-down-circle-outline" size={20} color="#ef4444" />
                    <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Sunset</Text>
                    <Text style={[styles.timeValue, { color: theme.text }]}>{sunData.sunset}</Text>
                </View>
            </View>

            {/* Golden Hour Windows */}
            <View style={[styles.goldenSection, { borderTopColor: theme.glassBorder }]}>
                <View style={styles.goldenRow}>
                    <Text style={[styles.goldenLabel, { color: theme.textSecondary }]}>🌅 Morning</Text>
                    <Text style={[styles.goldenTime, { color: '#f59e0b' }]}>{sunData.morningGolden}</Text>
                </View>
                <View style={styles.goldenRow}>
                    <Text style={[styles.goldenLabel, { color: theme.textSecondary }]}>🌇 Evening</Text>
                    <Text style={[styles.goldenTime, { color: '#f59e0b' }]}>{sunData.eveningGolden}</Text>
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
        flex: 1,
    },
    liveBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    liveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    countdownSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    countdown: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 4,
    },
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
    },
    timeBlock: {
        alignItems: 'center',
        flex: 1,
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 40,
    },
    goldenSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    goldenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    goldenLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    goldenTime: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default GoldenHourCard;
