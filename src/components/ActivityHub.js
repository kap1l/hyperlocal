import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import RunBadge from './RunBadge';
import DogWalkBadge from './DogWalkBadge';

const ActivityHub = ({ minutelyData, currently }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.textSecondary }]}>Activity Outlook</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.badgeWrapper}>
                    <RunBadge minutelyData={minutelyData} currently={currently} />
                </View>
                <View style={styles.badgeWrapper}>
                    <DogWalkBadge minutelyData={minutelyData} currently={currently} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 10,
    },
    title: {
        marginLeft: 20,
        marginBottom: 10,
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 10, // Shadow space
    },
    badgeWrapper: {
        width: 300,
        marginRight: 10,
    }
});

export default ActivityHub;
