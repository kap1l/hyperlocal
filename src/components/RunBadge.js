import React from 'react';
import { useSmartWindow } from '../hooks/useSmartWindow';
import { analyzeTemperatureSafety } from '../utils/weatherSafety';
import ActivityBadge from './ActivityBadge';
import { useWeather } from '../context/WeatherContext';

const RunBadge = ({ minutelyData, currently }) => {
    const { units } = useWeather();

    // 1. Check Rain (Threshold 0.2 for running)
    const { isSafeNow, nextWindowStart, nextWindowEnd } = useSmartWindow(minutelyData, 0.2, 15);

    // 2. Check Temperature
    const tempSafety = analyzeTemperatureSafety(currently, units);

    if (!currently || !tempSafety) return null;

    // Logic Synthesis
    let status = 'safe';
    let message = 'Perfect for a Run';
    let subMessage = 'Conditions are dry & comfortable';

    // Override if temp is unsafe
    if (tempSafety.status === 'unsafe') {
        status = 'unsafe';
        message = tempSafety.label;
        subMessage = 'Stay indoors, it is dangerous.';
    }
    // If temp is warning, but rain is safe
    else if (tempSafety.status === 'warning') {
        status = 'warning';
        message = tempSafety.label;
        subMessage = isSafeNow ? 'Dry, but dress appropriately.' : 'Wait for better conditions.';
    }
    // If temp is safe, check rain
    else if (!isSafeNow) {
        if (nextWindowStart) {
            const startStr = new Date(nextWindowStart * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            status = 'warning';
            message = 'Rain / Wet';
            subMessage = `Next dry window starts at ${startStr}`;
        } else {
            status = 'unsafe';
            message = 'No Safe Windows';
            subMessage = 'Rain expected for the next hour.';
        }
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
