import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Use expo-blur for glass effect
import { useTheme } from '../context/ThemeContext';
import { geocodeAddress } from '../services/LocationService';

const CitySearchModal = ({ visible, onClose, onSelect }) => {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        Keyboard.dismiss();
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const data = await geocodeAddress(query);
            // Deduplicate slightly based on coords to avoid spam
            const unique = data.filter((v, i, a) => a.findIndex(t => (t.latitude === v.latitude && t.longitude === v.longitude)) === i);
            setResults(unique);
        } catch (e) {
            setError("Could not find that location. Try a different city name.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Backdrop Blur */}
                <BlurView intensity={theme.name === 'oled' ? 0 : 50} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={[styles.content, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Search City</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.glassBorder }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ex: New York, London, Tokyo"
                            placeholderTextColor={theme.textSecondary}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            autoFocus={true}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading && (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={[styles.statusText, { color: theme.textSecondary }]}>Searching...</Text>
                        </View>
                    )}

                    {error && !loading && (
                        <View style={styles.center}>
                            <Ionicons name="alert-circle-outline" size={32} color={theme.danger} />
                            <Text style={[styles.statusText, { color: theme.danger }]}>{error}</Text>
                        </View>
                    )}

                    <FlatList
                        data={results}
                        keyExtractor={(item, i) => `${item.latitude}-${i}`}
                        style={styles.list}
                        keyboardShouldPersistTaps="always"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.resultItem, { borderBottomColor: theme.glassBorder }]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Ionicons name="location-sharp" size={20} color={theme.accent} style={{ marginRight: 12 }} />
                                <View>
                                    <Text style={[styles.resultName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.resultCoords, { color: theme.textSecondary }]}>
                                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 80, // Drop down a bit
    },
    content: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 1,
        borderBottomWidth: 0,
        paddingHorizontal: 20,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    center: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 10,
    },
    statusText: {
        fontSize: 14,
    },
    list: {
        flex: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    resultCoords: {
        fontSize: 12,
    }
});

export default CitySearchModal;
