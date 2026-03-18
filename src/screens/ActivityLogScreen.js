import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { getLogs, deleteLog } from '../services/ActivityLogService';
import { saveActivityLogs } from '../services/StorageService';
import LogSessionCard from '../components/LogSessionCard';

const ActivityLogScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const data = await getLogs();
        setSessions(data);
    };

    const handleDelete = async (id) => {
        await deleteLog(id);
        loadSessions();
    };

    const handleClearAll = () => {
        Alert.alert(
            "Clear History",
            "Are you sure you want to permanently delete all your logged activities?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        await saveActivityLogs([]);
                        setSessions([]);
                    }
                }
            ]
        );
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { color: theme.text }]}>
                        {sessions.length} sessions logged
                    </Text>
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={sessions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="book-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
                                Tap '+ Log this session' on the home screen after checking conditions.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <LogSessionCard entry={item} onDelete={handleDelete} />
                    )}
                />
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default ActivityLogScreen;
