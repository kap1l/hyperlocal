import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { generateDailySummary } from '../services/SmartSummaryService';

const SmartSummaryCard = ({ weather, activity }) => {
    const { theme } = useTheme();

    const summary = useMemo(() => {
        return generateDailySummary(weather, activity);
    }, [weather, activity]);

    if (!weather) return null;

    return (
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: theme.glassBorder }]}>
            <Text style={[styles.text, { color: theme.text }]}>
                {summary}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e', // Accent color
    },
    text: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
    }
});

export default SmartSummaryCard;
