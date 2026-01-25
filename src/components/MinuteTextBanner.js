import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const THRESHOLD = 0.2;

const MinuteTextBanner = ({ minutelyData }) => {
    const { theme } = useTheme();

    const summary = useMemo(() => {
        if (!minutelyData || minutelyData.length === 0) return null;

        const minutes = minutelyData.slice(0, 60);
        const isCurrentlyRaining = minutes[0].precipProbability >= THRESHOLD;

        let changeTime = -1;
        let type = 'none'; // none, start, stop

        if (isCurrentlyRaining) {
            // Find when it stops
            for (let i = 1; i < minutes.length; i++) {
                if (minutes[i].precipProbability < THRESHOLD) {
                    changeTime = i;
                    type = 'stop';
                    break;
                }
            }
        } else {
            // Find when it starts
            for (let i = 1; i < minutes.length; i++) {
                if (minutes[i].precipProbability >= THRESHOLD) {
                    changeTime = i;
                    type = 'start';
                    break;
                }
            }
        }

        if (type === 'none') {
            return isCurrentlyRaining
                ? { text: "Rain will continue for at least 60 min", icon: 'rainy', color: theme.accent }
                : { text: "No precipitation for at least 60 min", icon: 'sunny', color: theme.success };
        }

        if (type === 'start') {
            return {
                text: `Rain starting in ${changeTime} min`,
                icon: 'time-outline',
                color: theme.accent
            };
        }

        if (type === 'stop') {
            return {
                text: `Rain stopping in ${changeTime} min`,
                icon: 'umbrella-outline',
                color: theme.success
            };
        }

        return null;
    }, [minutelyData, theme]);

    if (!summary) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.inner, { borderLeftColor: summary.color }]}>
                <Ionicons name={summary.icon} size={20} color={summary.color} />
                <Text style={[styles.text, { color: theme.text }]}>{summary.text}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderLeftWidth: 4,
        gap: 12,
    },
    text: {
        fontSize: 15,
        fontWeight: '700',
    },
});

export default MinuteTextBanner;
