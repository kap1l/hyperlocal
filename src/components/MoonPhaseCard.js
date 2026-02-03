import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

// Get moon phase from API data (0-1)
const getPhaseFromAPI = (phaseValue) => {
    if (phaseValue === undefined) return { name: 'Unknown', emoji: '🌑', quality: 'fair' };

    // 0 = New, 0.25 = First Q, 0.5 = Full, 0.75 = Last Q
    const p = phaseValue;

    if (p === 0 || p > 0.98) return { name: 'New Moon', icon: 'moon-outline', emoji: '🌑', quality: 'excellent' };
    if (p < 0.23) return { name: 'Waxing Crescent', icon: 'moon-outline', emoji: '🌒', quality: 'good' };
    if (p < 0.27) return { name: 'First Quarter', icon: 'moon-outline', emoji: '🌓', quality: 'fair' };
    if (p < 0.48) return { name: 'Waxing Gibbous', icon: 'moon-outline', emoji: '🌔', quality: 'fair' };
    if (p < 0.52) return { name: 'Full Moon', icon: 'moon', emoji: '🌕', quality: 'poor' };
    if (p < 0.73) return { name: 'Waning Gibbous', icon: 'moon-outline', emoji: '🌖', quality: 'fair' };
    if (p < 0.77) return { name: 'Last Quarter', icon: 'moon-outline', emoji: '🌗', quality: 'fair' };
    return { name: 'Waning Crescent', icon: 'moon-outline', emoji: '🌘', quality: 'good' };
};

// Calculate visibility/darkness score for stargazing (0-100)
const getStargazingScore = (weather, moonPhase) => {
    if (!weather?.currently) return 0;

    let score = 100;

    // Cloud cover penalty (major factor)
    const cloudCover = weather.currently.cloudCover || 0;
    score -= cloudCover * 60;

    // Moon phase penalty for stargazing
    const moonPenalties = {
        'excellent': 0,
        'good': 10,
        'fair': 20,
        'poor': 35,
    };
    score -= moonPenalties[moonPhase.quality] || 0;

    // Humidity penalty
    const humidity = weather.currently.humidity || 0;
    if (humidity > 0.8) score -= 15;
    else if (humidity > 0.6) score -= 5;

    // Precipitation penalty
    const precip = weather.currently.precipProbability || 0;
    if (precip > 0.3) score -= 30;

    return Math.max(0, Math.min(100, Math.round(score)));
};

const MoonPhaseCard = () => {
    const { theme } = useTheme();
    const { weather } = useWeather();
    const [moonPhase, setMoonPhase] = useState({ name: 'Loading...', emoji: '🌑', quality: 'fair' });
    const [stargazingScore, setStargazingScore] = useState(0);

    useEffect(() => {
        if (weather?.daily?.data?.[0]) {
            const today = weather.daily.data[0];
            const phase = getPhaseFromAPI(today.moonPhase);
            setMoonPhase(phase);
            setStargazingScore(getStargazingScore(weather, phase));
        }
    }, [weather]);

    const getScoreColor = (score) => {
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score) => {
        if (score >= 70) return 'Excellent';
        if (score >= 40) return 'Fair';
        return 'Poor';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
            <View style={styles.row}>
                {/* Moon Phase */}
                <View style={styles.section}>
                    <Text style={styles.emoji}>{moonPhase.emoji}</Text>
                    <Text style={[styles.phaseName, { color: theme.text }]}>{moonPhase.name}</Text>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Tonight's Moon</Text>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                {/* Stargazing Score */}
                <View style={styles.section}>
                    <View style={styles.scoreRow}>
                        <Text style={[styles.scoreNumber, { color: getScoreColor(stargazingScore) }]}>
                            {stargazingScore}
                        </Text>
                        <Text style={[styles.scoreMax, { color: theme.textSecondary }]}>/100</Text>
                    </View>
                    <Text style={[styles.scoreLabel, { color: getScoreColor(stargazingScore) }]}>
                        {getScoreLabel(stargazingScore)}
                    </Text>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Stargazing</Text>
                </View>
            </View>

            {/* Tips */}
            <View style={[styles.tipRow, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                <Ionicons
                    name={stargazingScore >= 70 ? 'telescope' : 'cloudy-night-outline'}
                    size={16}
                    color={stargazingScore >= 70 ? '#22c55e' : theme.textSecondary}
                />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                    {stargazingScore >= 70
                        ? 'Great night for stargazing! Low light pollution expected.'
                        : stargazingScore >= 40
                            ? 'Decent visibility. Best viewing after midnight.'
                            : 'Cloud cover or bright moon may limit visibility tonight.'}
                </Text>
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    section: {
        alignItems: 'center',
        flex: 1,
    },
    emoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    phaseName: {
        fontSize: 14,
        fontWeight: '700',
    },
    label: {
        fontSize: 11,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 60,
        marginHorizontal: 16,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreNumber: {
        fontSize: 36,
        fontWeight: '800',
    },
    scoreMax: {
        fontSize: 14,
        fontWeight: '600',
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    tipText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
    },
});

export default MoonPhaseCard;
