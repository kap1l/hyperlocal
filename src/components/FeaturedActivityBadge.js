import React, { useMemo } from 'react';
import { useWeather } from '../context/WeatherContext';
import { analyzeActivitySafety } from '../utils/weatherSafety';
import ActivityBadge from './ActivityBadge';

const FeaturedActivityBadge = ({ currently }) => {
    const { selectedActivity, units } = useWeather();

    const analysis = useMemo(() => {
        return analyzeActivitySafety(selectedActivity, currently, units);
    }, [selectedActivity, currently, units]);

    if (!currently || !analysis) return null;

    const activityLabels = {
        walk: { label: 'Walking', icon: 'walk-outline', sub: 'Outdoor Comfort' },
        run: { label: 'Running', icon: 'speedometer-outline', sub: 'Run Conditions' },
        cycle: { label: 'Cycling', icon: 'bicycle-outline', sub: 'Ride Conditions' },
        camera: { label: 'Photography', icon: 'camera-outline', sub: 'Shooting Conditions' },
        drive: { label: 'Driving', icon: 'car-outline', sub: 'Road Conditions' }
    };

    const info = activityLabels[selectedActivity] || activityLabels['walk'];

    return (
        <ActivityBadge
            icon={info.icon}
            label={info.label}
            status={analysis.status}
            message={analysis.label}
            subMessage={info.sub}
            onPress={() => { }}
        />
    );
};

export default FeaturedActivityBadge;
