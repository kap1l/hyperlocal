import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { getWatchlist, addWatch, removeWatch } from '../services/WatchlistService';
import GlassDropdown from '../components/GlassDropdown';
import Slider from '@react-native-community/slider';
import { useSubscription } from '../context/SubscriptionContext';

const WatchlistScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { isPro, presentPaywall } = useSubscription();
    const [watches, setWatches] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    // Modal Form State
    const [newActivity, setNewActivity] = useState('run');
    const [newType, setNewType] = useState('score_above');
    const [newThreshold, setNewThreshold] = useState(80);

    const activities = [
        { id: 'walk', label: 'Walking' },
        { id: 'run', label: 'Running' },
        { id: 'cycle', label: 'Cycling' },
        { id: 'hike', label: 'Hiking' }
    ];

    const types = [
        { id: 'score_above', label: 'Score Above' },
        { id: 'rain_stop', label: 'Rain Stops' },
        { id: 'rain_start', label: 'Rain Starts' }
    ];

    useEffect(() => {
        loadWatches();
    }, []);

    const loadWatches = async () => {
        const data = await getWatchlist();
        setWatches(data);
    };

    const handleSaveNew = async () => {
        const item = {
            id: Date.now().toString(),
            activity: newActivity,
            type: newType,
            threshold: newType === 'score_above' ? newThreshold : null,
            notifiedToday: false,
            lastNotifiedDate: null,
        };
        try {
            await addWatch(item, isPro);
            setModalVisible(false);
            loadWatches();
        } catch (e) {
            if (e.code === 'WATCHLIST_LIMIT_REACHED') {
                setModalVisible(false);
                presentPaywall();
            } else {
                console.error(e);
            }
        }
    };

    const handleDelete = async (id) => {
        await removeWatch(id);
        loadWatches();
    };

    const getTypeText = (item) => {
        if (item.type === 'score_above') return `Score > ${item.threshold}`;
        if (item.type === 'rain_stop') return 'Rain Stops';
        if (item.type === 'rain_start') return 'Rain Starts';
        return '';
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { color: theme.text }]}>Condition Alerts</Text>
                    <View style={{ width: 24 }} />
                </View>

                <FlatList
                    data={watches}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>
                            You have no active condition alerts. Tap the button below to add one.
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, textTransform: 'capitalize' }}>
                                    {item.activity}
                                </Text>
                                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                                    {getTypeText(item)}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                />

                {(!isPro && watches.length >= 1) ? (
                    <TouchableOpacity 
                        style={[styles.fab, { backgroundColor: theme.textSecondary }]}
                        onPress={presentPaywall}
                    >
                        <Ionicons name="lock-closed" size={24} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Upgrade for more alerts</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.fab, { backgroundColor: theme.accent }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>New Alert</Text>
                    </TouchableOpacity>
                )}

            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Alert</Text>
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

                        <GlassDropdown
                            label="Trigger Condition"
                            value={newType}
                            options={types.map(t => ({ value: t.id, label: t.label }))}
                            onSelect={setNewType}
                        />

                        {newType === 'score_above' && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 10 }}>
                                    Target Score: {newThreshold}
                                </Text>
                                <Slider
                                    minimumValue={50}
                                    maximumValue={95}
                                    step={5}
                                    value={newThreshold}
                                    onValueChange={setNewThreshold}
                                    minimumTrackTintColor={theme.accent}
                                    maximumTrackTintColor={theme.textSecondary}
                                />
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                            onPress={handleSaveNew}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Alert</Text>
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
        minHeight: '50%',
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

export default WatchlistScreen;
