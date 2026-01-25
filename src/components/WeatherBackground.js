import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme, getWeatherGradient } from '../context/ThemeContext';
import ParticleSystem from './ParticleSystem';

const WeatherBackground = ({ children, condition }) => {
    const { theme } = useTheme();

    // Determine if it's "daytime" based on the theme name for now, 
    // or we could pass IsDay prop. 
    // Ideally the 'condition' (icon) like 'clear-day' contains this info, 
    // but the helper takes (icon, isDay).

    // Let's rely on the icon name containing 'day'/'night' or fallback to theme.name
    const isDay = theme.name === 'day';
    const colors = getWeatherGradient(condition, isDay);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {theme.name !== 'oled' && (
                <LinearGradient
                    colors={colors}
                    style={styles.background}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}

            {/* Particle Layer */}
            <ParticleSystem condition={condition} />

            {/* Overlay for glassmorphism tint (optional, improves text readability) */}
            {theme.name === 'dark' && (
                <View style={styles.overlay} />
            )}

            <View style={styles.content}>
                {children}
            </View>
            <StatusBar style={theme.statusBar} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
        flex: 1,
    }
});

export default WeatherBackground;
