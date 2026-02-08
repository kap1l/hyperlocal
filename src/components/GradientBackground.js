import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

const GradientBackground = ({ children }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                // Background Linear Gradient
                colors={theme.gradient} // Dark Slate -> Dark Blue -> Blue
                locations={[0, 0.5, 1]}
                style={styles.background}
            />
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
        backgroundColor: '#0f172a', // Fallback
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    content: {
        flex: 1,
    }
});

export default GradientBackground;
