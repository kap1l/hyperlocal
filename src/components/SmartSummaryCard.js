import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { generateDailySummary, generateFreeSummary } from '../services/SmartSummaryService';

const SmartSummaryCard = ({ weather, activity }) => {
    const { theme } = useTheme();
    const { isPro, purchasePro } = useSubscription();

    const summary = useMemo(() => {
        return generateDailySummary(weather, activity);
    }, [weather, activity]);

    const freeSummary = useMemo(() => {
        return generateFreeSummary(weather, activity);
    }, [weather, activity]);

    if (!weather) return null;

    // FREE USER: Show limited summary with upgrade teaser
    if (!isPro) {
        return (
            <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: theme.glassBorder }]}>
                {/* Limited Summary - Shows general conditions */}
                <Text style={[styles.text, { color: theme.text }]}>
                    {freeSummary}
                </Text>

                {/* Upgrade Teaser */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={purchasePro}
                    style={[styles.upgradeRow, { borderTopColor: theme.glassBorder }]}
                >
                    <View style={styles.upgradeLeft}>
                        <Ionicons name="sparkles" size={14} color={theme.accent} />
                        <Text style={[styles.upgradeText, { color: theme.accent }]}>
                            Get the best time to {activity}
                        </Text>
                    </View>
                    <View style={[styles.proBadge, { backgroundColor: theme.accent + '20' }]}>
                        <Text style={[styles.proText, { color: theme.accent }]}>PRO</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    // PRO USER: Show full summary
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
        borderLeftColor: '#22c55e',
    },
    text: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
    },
    upgradeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    upgradeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    upgradeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    proBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    proText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default SmartSummaryCard;
