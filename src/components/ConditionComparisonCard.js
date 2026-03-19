import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getWeatherSnapshot } from '../services/StorageService';

export default function ConditionComparisonCard({ currentScore, currentTemp, currentConditions }) {
    const { theme } = useTheme();
    const [lastWeekSnapshot, setLastWeekSnapshot] = useState(null);

    useEffect(() => {
        const loadSnapshot = async () => {
            const now = new Date();
            const snapshot = await getWeatherSnapshot(now.getDay(), now.getHours());
            setLastWeekSnapshot(snapshot);
        };
        loadSnapshot();
    }, []);

    // 518400000 ms = 6 days. If > 6 days ago, it's valid last week data.
    if (!lastWeekSnapshot || (Date.now() - lastWeekSnapshot.timestamp < 518400000)) {
        return null;
    }

    if (currentScore === undefined || currentTemp === undefined) {
        return null;
    }

    const scoreDelta = currentScore - lastWeekSnapshot.score;
    const tempDelta = Math.round(currentTemp - lastWeekSnapshot.temperature);

    // Only render when meaningful change
    if (Math.abs(scoreDelta) < 5 && Math.abs(tempDelta) < 3) {
        return null;
    }

    const dayName = new Date().toLocaleDateString([], { weekday: 'long' });
    let textOut = '';

    if (scoreDelta >= 10) {
        textOut = `Better than last ${dayName} — conditions up ${scoreDelta} points.`;
    } else if (scoreDelta <= -10) {
        textOut = `Tougher than last ${dayName} — conditions down ${Math.abs(scoreDelta)} points.`;
    } else {
        textOut = `Similar to last ${dayName} — ${Math.abs(tempDelta)}° ${tempDelta > 0 ? 'warmer' : 'cooler'}.`;
    }

    return (
        <Text style={[styles.text, { color: theme.textSecondary }]}>
            {textOut}
        </Text>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        fontStyle: 'italic',
        marginHorizontal: 16,
        marginBottom: 8,
    }
});
