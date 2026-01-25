import React from 'react';
import { FlexWidget, TextWidget, ColorProp } from 'react-native-android-widget';

/**
 * WeatherWidget - A simple home screen widget showing activity score
 * @param {Object} props - Widget props including score, activity, temp
 */
export function WeatherWidget({ score = 85, activity = 'walk', temp = 32, advice = 'Stay warm!' }) {
    // Color based on score
    let scoreColor = '#22c55e'; // Green
    if (score < 85) scoreColor = '#84cc16'; // Lime
    if (score < 70) scoreColor = '#f59e0b'; // Amber
    if (score < 50) scoreColor = '#f97316'; // Orange
    if (score < 30) scoreColor = '#ef4444'; // Red

    // Emoji for activity
    const activityEmoji = {
        walk: '🚶',
        run: '🏃',
        cycle: '🚴',
        hike: '🥾',
        golf: '⛳',
        tennis: '🎾',
    }[activity] || '🌤️';

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#1a1a2e',
                borderRadius: 16,
                padding: 12,
            }}
            clickAction="OPEN_APP"
        >
            {/* Activity Score */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <TextWidget
                    text={activityEmoji}
                    style={{
                        fontSize: 24,
                    }}
                />
                <TextWidget
                    text={`${score}`}
                    style={{
                        fontSize: 36,
                        fontWeight: 'bold',
                        color: scoreColor,
                    }}
                />
                <TextWidget
                    text="/100"
                    style={{
                        fontSize: 14,
                        color: '#9ca3af',
                    }}
                />
            </FlexWidget>

            {/* Temperature */}
            <TextWidget
                text={`${temp}°F`}
                style={{
                    fontSize: 18,
                    color: '#ffffff',
                    marginTop: 4,
                }}
            />

            {/* Advice */}
            <TextWidget
                text={advice}
                style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginTop: 4,
                    textAlign: 'center',
                }}
                maxLines={1}
            />
        </FlexWidget>
    );
}
