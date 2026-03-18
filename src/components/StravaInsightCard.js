import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchStravaActivities, isStravaConnected, getStravaAthleteName } from '../services/StravaService';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function StravaInsightCard() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    
    const [connected, setConnected] = useState(false);
    const [activities, setActivities] = useState([]);
    const [athleteName, setAthleteName] = useState('');

    useEffect(() => {
        const load = async () => {
            const isConn = await isStravaConnected();
            setConnected(isConn);
            if (isConn) {
                const name = await getStravaAthleteName();
                setAthleteName(name);
                const acts = await fetchStravaActivities();
                setActivities(acts.slice(0, 3)); // Show top 3 recent
            }
        };
        if (isFocused) load();
    }, [isFocused]);

    if (!connected) {
        return (
            <TouchableOpacity 
                style={[styles.container, { backgroundColor: '#FC4C02', opacity: 0.9 }]}
                onPress={() => navigation.navigate('StravaConnect')}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="bicycle" size={24} color="#fff" />
                    <View>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Connect Strava</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Sync your activities for better insights</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="bicycle" size={16} color="#FC4C02" />
                    <Text style={[styles.title, { color: theme.text }]}>Strava Activities</Text>
                </View>
                {athleteName ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{athleteName}</Text>
                ) : null}
            </View>

            {activities.length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginVertical: 10 }}>
                    No recent activities found on Strava.
                </Text>
            ) : (
                activities.map((act, index) => {
                    const dateObj = new Date(act.start_date);
                    const distanceMi = (act.distance * 0.000621371).toFixed(1);
                    return (
                        <View key={act.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.glassBorder }]}>
                            <View>
                                <Text style={{ color: theme.text, fontWeight: '500' }}>{act.name}</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    {dateObj.toLocaleDateString()} • {act.type}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                                    {Math.round(act.moving_time / 60)}m
                                </Text>
                                {act.distance > 0 && (
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{distanceMi}mi</Text>
                                )}
                            </View>
                        </View>
                    );
                })
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
        alignItems: 'center',
        paddingVertical: 8,
    }
});
