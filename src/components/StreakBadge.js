import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getMilestone } from '../services/StreakService';

export default function StreakBadge({ streak }) {
    const { theme } = useTheme();

    if (!streak || streak.count < 2) return null;

    const milestoneLabel = getMilestone(streak.count);

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={[styles.text, { color: theme.accent }]}>
                {streak.count} day
            </Text>
            {milestoneLabel && (
                <View style={[styles.milestoneBadge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.milestoneText}>{milestoneLabel}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        gap: 4,
    },
    text: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    milestoneBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 4,
    },
    milestoneText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
