import React from 'react';
import { useSmartWindow } from '../hooks/useSmartWindow';
import { analyzeDogWalkingSafety } from '../utils/weatherSafety';
import ActivityBadge from './ActivityBadge';
import { useWeather } from '../context/WeatherContext';

const DogWalkBadge = ({ minutelyData, currently }) => {
    const { units } = useWeather();

    // 1. Check Rain (Dogs hate rain? Threshold 0.25)
    // Relaxed threshold for dogs compared to running
    const { isSafeNow, nextWindowStart } = useSmartWindow(minutelyData, 0.25, 10);

    // 2. Check Paws Safety
    const pawSafety = analyzeDogWalkingSafety(currently, units);

    if (!currently || !pawSafety) return null;

    let status = 'safe';
    let message = "Good for a Walk";
    let subMessage = "Paws are safe.";

    if (pawSafety.status === 'unsafe') {
        status = 'unsafe';
        message = pawSafety.label;
        subMessage = "Pavement may burn paws.";
    }
    else if (pawSafety.status === 'warning') {
        status = 'warning';
        message = pawSafety.label;
        subMessage = "Limit time outside.";
    }
    else if (!isSafeNow) {
        if (nextWindowStart) {
            const startStr = new Date(nextWindowStart * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            status = 'warning';
            message = "Raining";
            subMessage = `Next dry slot: ${startStr}`;
        } else {
            status = 'unsafe';
            message = "Too Wet";
            subMessage = "Rain continues for now.";
        }
    }

    return (
        <ActivityBadge
            icon="paw-outline"
            label="Dog Walking"
            status={status}
            message={message}
            subMessage={subMessage}
            onPress={() => { }}
        />
    );
};

export default DogWalkBadge;
