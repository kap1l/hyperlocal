import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../context/ThemeContext';

const SpotChips = ({ onAddPress }) => {
    const { savedSpots, setLocationConfig, locationConfig } = useWeather();
    const { theme } = useTheme();

    if (!savedSpots) return null;

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <TouchableOpacity
                    style={[
                        styles.chip, 
                        { backgroundColor: locationConfig.mode === 'auto' ? theme.accent : theme.cardBg, borderColor: theme.accent }
                    ]}
                    onPress={() => setLocationConfig({ mode: 'auto' })}
                >
                    <Ionicons name="location" size={14} color={locationConfig.mode === 'auto' ? '#fff' : theme.text} />
                    <Text style={[styles.chipText, { color: locationConfig.mode === 'auto' ? '#fff' : theme.text }]}>Current</Text>
                </TouchableOpacity>

                {savedSpots.map(spot => {
                    const isActive = locationConfig.mode === 'manual' && locationConfig.label === spot.name;
                    return (
                        <TouchableOpacity
                            key={spot.id}
                            style={[
                                styles.chip, 
                                { backgroundColor: isActive ? theme.accent : theme.cardBg, borderColor: theme.accent }
                            ]}
                            onPress={() => setLocationConfig({
                                mode: 'manual',
                                coords: { latitude: spot.lat, longitude: spot.lon },
                                label: spot.name
                            })}
                        >
                            <Text style={[styles.chipText, { color: isActive ? '#fff' : theme.text }]}>{spot.name}</Text>
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    style={[styles.chip, { backgroundColor: theme.cardBg, borderColor: theme.accent, paddingHorizontal: 16 }]}
                    onPress={onAddPress}
                >
                    <Ionicons name="add" size={16} color={theme.text} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    scroll: {
        gap: 8,
        paddingRight: 40,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
    }
});

export default SpotChips;
