import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../context/WeatherContext';

const RAIN_THRESHOLD = 0.2;

const OutdoorQualityBadge = ({ minutelyData, currently, dailyData }) => {
    const { theme } = useTheme();
    const { units, selectedActivity } = useWeather();

    const analysis = useMemo(() => {
        if (!currently) return null;

        const { temperature, humidity, windSpeed, uvIndex, apparentTemperature, time } = currently;
        const isMetric = units === 'si';
        const tempF = isMetric ? (temperature * 9 / 5) + 32 : temperature;
        const feelsLikeF = isMetric ? (apparentTemperature * 9 / 5) + 32 : apparentTemperature;

        const immediateRain = minutelyData?.slice(0, 15).some(m => m.precipProbability > RAIN_THRESHOLD);

        let isDark = false;
        if (dailyData && dailyData[0]) {
            const { sunriseTime, sunsetTime } = dailyData[0];
            if (time < sunriseTime || time > sunsetTime) {
                isDark = true;
            }
        }

        let score = 100;
        let mainIssue = "";
        let status = 'safe';

        // --- ACTIVITY SPECIFIC THRESHOLDS ---

        // 1. Temperature Deductions
        if (selectedActivity === 'run') {
            if (tempF > 85 || feelsLikeF > 90) { score -= 45; mainIssue = "High Heat (Running)"; }
            else if (tempF < 20) { score -= 40; mainIssue = "Bitter Cold"; }
        } else if (selectedActivity === 'cycle') {
            if (tempF > 95) { score -= 40; mainIssue = "Extreme Heat"; }
            else if (tempF < 30) { score -= 50; mainIssue = "Freezing Windchill"; }
        } else {
            if (tempF < 10 || feelsLikeF < 5) { score -= 80; mainIssue = "Extreme Cold"; }
            else if (tempF < 32 || feelsLikeF < 25) { score -= 40; mainIssue = "Freezing"; }
            else if (tempF > 100 || feelsLikeF > 105) { score -= 80; mainIssue = "Extreme Heat"; }
        }

        // 2. Rain Deductions
        if (immediateRain) {
            if (selectedActivity === 'camera') { score -= 70; mainIssue = "Rain (Gear Hazard)"; }
            else if (selectedActivity === 'cycle') { score -= 60; mainIssue = "Slippery Roads"; }
            else if (selectedActivity === 'drive') { score -= 30; mainIssue = "Wet Roads"; }
            else { score -= 50; mainIssue = mainIssue ? `${mainIssue} & Rain` : "Rain Incoming"; }
        }

        // 3. Wind Deductions
        if (windSpeed > 15) {
            if (selectedActivity === 'cycle') { score -= 45; if (!mainIssue) mainIssue = "Strong Headwinds"; }
            else if (selectedActivity === 'camera') { score -= 40; if (!mainIssue) mainIssue = "Wind (Tripod Shake)"; }
            else if (windSpeed > 25) { score -= 40; mainIssue = "Gale Winds"; }
        }

        // 4. Night Deductions
        if (isDark) {
            if (selectedActivity === 'camera') { score -= 60; mainIssue = "Poor Lighting"; }
            else if (selectedActivity === 'run' || selectedActivity === 'cycle') { score -= 30; mainIssue = mainIssue ? `${mainIssue} (Night)` : "Low Visibility (Night)"; }
            else if (selectedActivity === 'drive') { score -= 20; if (!mainIssue) mainIssue = "Night Driving"; }
            else { score -= 25; if (!mainIssue) mainIssue = "Limited Visibility"; }
        }

        // 5. UV Deductions
        if (uvIndex > 8 && !isDark && selectedActivity !== 'drive') {
            score -= 25;
            if (!mainIssue) mainIssue = "High UV Burn Risk";
        }

        // --- FINAL STATUS ---
        const activityLabels = {
            walk: "walking", run: "running", cycle: "cycling", camera: "shoooting", drive: "driving"
        };
        const activeLabel = activityLabels[selectedActivity];

        let message = `Great for ${activeLabel}`;
        if (score < 40) {
            status = 'dangerous';
            message = `Dangerous for ${activeLabel}: ${mainIssue || "Avoid"}`;
        } else if (score < 75) {
            status = 'warning';
            message = `Caution ${activeLabel}: ${mainIssue || "Suboptimal"}`;
        } else if (score < 90) {
            status = 'warning';
            message = mainIssue ? `OK for ${activeLabel} (${mainIssue})` : `Decent for ${activeLabel}`;
        }

        return { status, message, score };
    }, [minutelyData, currently, dailyData, units, selectedActivity]);

    if (!analysis) return null;

    let bgColor, textColor, borderColor, iconName;
    if (analysis.status === 'safe') {
        bgColor = theme.success;
        textColor = theme.name === 'day' ? '#2E7D32' : '#81C784';
        borderColor = theme.success.replace('0.15', '0.3');
        iconName = 'checkmark-circle';
    } else if (analysis.status === 'warning') {
        bgColor = 'rgba(245, 158, 11, 0.15)';
        textColor = theme.name === 'day' ? '#B45309' : '#FBBF24';
        borderColor = 'rgba(245, 158, 11, 0.3)';
        iconName = 'warning';
    } else {
        bgColor = theme.danger;
        textColor = theme.name === 'day' ? '#C62828' : '#E57373';
        borderColor = theme.danger.replace('0.15', '0.3');
        iconName = 'close-circle';
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor, borderColor: borderColor, borderWidth: 1 }]}>
            <Ionicons name={iconName} size={20} color={textColor} />
            <Text style={[styles.text, { color: textColor }]}>
                {analysis.message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    text: {
        fontWeight: '700',
        fontSize: 14,
        textAlign: 'center',
    }
});

export default OutdoorQualityBadge;
