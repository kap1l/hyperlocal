import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { getActivityLog, logActivitySession, deleteActivitySession } from '../services/ActivityLogService';
import GlassDropdown from '../components/GlassDropdown';
import Slider from '@react-native-community/slider';

const ActivityLogScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [sessions, setSessions] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    // Modal Form State
    const [newActivity, setNewActivity] = useState('run');
    const [newDuration, setNewDuration] = useState(30);
    const [newDistance, setNewDistance] = useState(0);

    const activities = [
        { id: 'walk', label: 'Walking' },
        { id: 'run', label: 'Running' },
        { id: 'cycle', label: 'Cycling' },
        { id: 'hike', label: 'Hiking' }
    ];

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const data = await getActivityLog();
        setSessions(data);
    };

    const handleSaveNew = async () => {
        const session = {
            activity: newActivity,
            duration: newDuration,
            distance: newDistance > 0 ? newDistance : null, 
        };
        await logActivitySession(session);
        setModalVisible(false);
        setNewDistance(0);
        setNewDuration(30);
        loadSessions();
    };

    const handleDelete = async (id) => {
        await deleteActivitySession(id);
        loadSessions();
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { color: theme.text }]}>Activity History</Text>
                    <View style={{ width: 24 }} />
                </View>

                <FlatList
                    data={sessions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>
                            You have not logged any activities yet. Tap the button below to log a session.
                        </Text>
                    }
                    renderItem={({ item }) => {
                        const dateObj = new Date(item.date);
                        return (
                            <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, textTransform: 'capitalize' }}>
                                        {item.activity}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                                        {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    
                                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
                                        <View style={styles.metricRow}>
                                            <Ionicons name="time-outline" size={14} color={theme.text} />
                                            <Text style={{ color: theme.text, fontSize: 13, marginLeft: 4 }}>
                                                {item.duration} min
                                            </Text>
                                        </View>
                                        {item.distance && (
                                            <View style={styles.metricRow}>
                                                <Ionicons name="map-outline" size={14} color={theme.text} />
                                                <Text style={{ color: theme.text, fontSize: 13, marginLeft: 4 }}>
                                                    {item.distance} mi
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />

                <TouchableOpacity 
                    style={[styles.fab, { backgroundColor: theme.accent }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Log Session</Text>
                </TouchableOpacity>

            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Activity</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <GlassDropdown
                            label="Activity"
                            value={newActivity}
                            options={activities.map(a => ({ value: a.id, label: a.label }))}
                            onSelect={setNewActivity}
                        />

                        <View style={{ marginTop: 20 }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 10 }}>
                                Duration: {newDuration} mins
                            </Text>
                            <Slider
                                minimumValue={5}
                                maximumValue={180}
                                step={5}
                                value={newDuration}
                                onValueChange={setNewDuration}
                                minimumTrackTintColor={theme.accent}
                                maximumTrackTintColor={theme.textSecondary}
                            />
                        </View>

                        <View style={{ marginTop: 20 }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 10 }}>
                                Distance (optional): {newDistance > 0 ? `${newDistance} mi` : '---'}
                            </Text>
                            <Slider
                                minimumValue={0}
                                maximumValue={50}
                                step={0.5}
                                value={newDistance}
                                onValueChange={setNewDistance}
                                minimumTrackTintColor={theme.accent}
                                maximumTrackTintColor={theme.textSecondary}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                            onPress={handleSaveNew}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 5,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveBtn: {
        marginTop: 30,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    }
});

export default ActivityLogScreen;
