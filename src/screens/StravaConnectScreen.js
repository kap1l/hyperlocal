import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { connectStrava, disconnectStrava, isStravaConnected, getStravaAthleteName } from '../services/StravaService';

const StravaConnectScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [connected, setConnected] = useState(false);
    const [athleteName, setAthleteName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        setLoading(true);
        const isConn = await isStravaConnected();
        setConnected(isConn);
        if (isConn) {
            const name = await getStravaAthleteName();
            setAthleteName(name);
        }
        setLoading(false);
    };

    const handleConnect = async () => {
        setLoading(true);
        const success = await connectStrava();
        if (success) {
            await checkConnection();
        } else {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        await disconnectStrava();
        await checkConnection();
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { color: theme.text }]}>Strava Integration</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <Ionicons name="bicycle" size={80} color="#FC4C02" style={{ marginBottom: 20 }} />
                    <Text style={[styles.title, { color: theme.text }]}>Connect to Strava</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Sync your activities to get better insights and compare your performance with the weather conditions.
                    </Text>

                    {loading ? (
                        <View style={{ marginTop: 40 }}>
                            <ActivityIndicator size="large" color="#FC4C02" />
                        </View>
                    ) : connected ? (
                        <View style={[styles.statusCard, { backgroundColor: theme.cardBg }]}>
                            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                            <Text style={[styles.statusText, { color: theme.text }]}>Connected as {athleteName}</Text>
                            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                                <Text style={styles.disconnectText}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
                            <Text style={styles.connectText}>Connect with Strava</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    connectBtn: {
        backgroundColor: '#FC4C02',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#FC4C02',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
    },
    connectText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    statusCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 24,
    },
    disconnectBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    disconnectText: {
        color: '#ef4444',
        fontWeight: 'bold',
    }
});

export default StravaConnectScreen;
