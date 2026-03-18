import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getWatchlist } from '../services/WatchlistService';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function WatchlistCard() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [watches, setWatches] = useState([]);

    useEffect(() => {
        if (isFocused) {
            getWatchlist().then(setWatches);
        }
    }, [isFocused]);

    if (watches.length === 0) return null;

    const getTypeText = (item) => {
        if (item.type === 'score_above') return `Score > ${item.threshold}`;
        if (item.type === 'rain_stop') return 'Rain Stops';
        if (item.type === 'rain_start') return 'Rain Starts';
        return '';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="flash-outline" size={16} color={theme.accent} />
                    <Text style={[styles.title, { color: theme.text }]}>Active Alerts ({watches.length})</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Watchlist')}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }}>Manage</Text>
                </TouchableOpacity>
            </View>

            {watches.slice(0, 2).map((w, index) => (
                <View key={w.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.glassBorder }]}>
                    <Text style={{ color: theme.text, textTransform: 'capitalize', fontWeight: '500' }}>{w.activity}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{getTypeText(w)}</Text>
                </View>
            ))}

            {watches.length > 2 && (
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
                    + {watches.length - 2} more
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    }
});
