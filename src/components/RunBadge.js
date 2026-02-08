import React from 'react';
import { useSmartWindow } from '../hooks/useSmartWindow';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import ActivityBadge from './ActivityBadge';
import { useWeather } from '../context/WeatherContext';

const RunBadge = ({ minutelyData, currently }) => {
    const { units } = useWeather();

    // 1. Check Rain (Threshold 0.2 for running)
    const { isSafeNow, nextWindowStart, nextWindowEnd } = useSmartWindow(minutelyData, 0.2, 15);

    // 2. Check Safety using Centralized Logic (Run-specific thresholds)
    const runSafety = analyzeActivitySafety('run', currently, units);

    // Logic Synthesis
    let status = 'safe';
    let message = 'Perfect for a Run';
    let subMessage = 'Conditions are dry & comfortable';

    // 1. Safety Check (Temp, Wind, Conditions)
    if (runSafety.status === 'unsafe' || runSafety.status === 'hazard') {
        status = 'unsafe';
        message = runSafety.label || 'Unsafe Conditions';
        subMessage = runSafety.advice;
    }
    else if (runSafety.status === 'warning' || runSafety.status === 'fair' || runSafety.status === 'poor') {
        // Decide if we blockade or just warn
        // If it's "Poor", we treat as Warning/Orange
        status = 'warning';
        message = runSafety.label; // e.g. "Heat Advisory" or "Poor Conditions"
        subMessage = runSafety.advice;
    }

    // 2. Rain Window Override
    // Even if temp is perfect, if it's raining now without a window, it's unsafe/warning
    if (!isSafeNow) {
        if (nextWindowStart) {
            const startStr = new Date(nextWindowStart * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            // If the base status was safe, downgrade to warning for rain
            if (status === 'safe') {
                status = 'warning';
                message = 'Rain / Wet';
                subMessage = `Next dry window starts at ${startStr}`;
            }
        } else {
            // specific logic: if raining and no window, strictly unsafe
            status = 'unsafe';
            message = 'Rain - No Window';
            subMessage = 'Rain expected for the next hour.';
        }
    } else if (status === 'safe') {
        // If generic check passed and rain check passed
        message = 'Perfect for a Run';
        subMessage = runSafety.advice;
    }

    return (
        <ActivityBadge
            icon="walk-outline" // Running icon
            label="Running"
            status={status}
            message={message}
            subMessage={subMessage}
            onPress={() => { }}
        />
    );
};

export default RunBadge;
