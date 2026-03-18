import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CollapsibleSection from './CollapsibleSection';

export default function WeeklyLogSummary({ summary }) {
    const { theme } = useTheme();

    if (!summary || summary.count === 0) return null;

    const getScoreColor = (score) => {
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <CollapsibleSection title="This Week's Activity" icon="calendar-outline" sectionId="weekly-log">
            <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{summary.count}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.statBox}>
                    <View style={[styles.scorePill, { backgroundColor: getScoreColor(summary.avgScore) }]}>
                        <Text style={styles.scoreText}>{summary.avgScore}</Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Score</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
                        {summary.bestDay || '—'}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best day</Text>
                </View>
            </View>
        </CollapsibleSection>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 30,
        marginHorizontal: 10,
    },
    scorePill: {
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 6,
    },
    scoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
