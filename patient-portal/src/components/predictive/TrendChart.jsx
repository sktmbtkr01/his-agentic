/**
 * TrendChart Component
 * Simple sparkline-style trend visualization
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendChart = ({
    dataPoints = [],
    color = '#6366f1',
    height = 40,
    showTrend = true,
    label = '',
}) => {
    const chartData = useMemo(() => {
        if (!dataPoints || dataPoints.length === 0) {
            return { path: '', trend: 'stable', min: 0, max: 0, latest: null };
        }

        const values = dataPoints.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        // Normalize values to height
        const normalized = values.map(v =>
            height - ((v - min) / range) * (height - 10) - 5
        );

        // Create SVG path
        const width = 100;
        const step = width / (normalized.length - 1 || 1);

        let path = `M 0 ${normalized[0]}`;
        for (let i = 1; i < normalized.length; i++) {
            // Smooth curve with quadratic bezier
            const x = i * step;
            const prevX = (i - 1) * step;
            const cpX = (prevX + x) / 2;
            path += ` Q ${cpX} ${normalized[i - 1]} ${x} ${normalized[i]}`;
        }

        // Calculate trend
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

        let trend = 'stable';
        const change = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;
        if (change > 5) trend = 'increasing';
        else if (change < -5) trend = 'decreasing';

        return {
            path,
            trend,
            min,
            max,
            latest: values[values.length - 1],
            percentChange: Math.round(change),
        };
    }, [dataPoints, height]);

    if (!dataPoints || dataPoints.length === 0) {
        return (
            <div className="flex items-center justify-center h-10 text-xs text-slate-400">
                No data available
            </div>
        );
    }

    const TrendIcon = chartData.trend === 'increasing'
        ? TrendingUp
        : chartData.trend === 'decreasing'
            ? TrendingDown
            : Minus;

    const trendColor = chartData.trend === 'increasing'
        ? 'text-emerald-500'
        : chartData.trend === 'decreasing'
            ? 'text-red-500'
            : 'text-slate-400';

    return (
        <div className="flex items-center gap-3">
            {/* Chart */}
            <div className="flex-1 relative">
                <svg
                    viewBox={`0 0 100 ${height}`}
                    className="w-full"
                    style={{ height }}
                    preserveAspectRatio="none"
                >
                    {/* Gradient fill */}
                    <defs>
                        <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Fill area */}
                    <path
                        d={`${chartData.path} L 100 ${height} L 0 ${height} Z`}
                        fill={`url(#gradient-${label})`}
                    />

                    {/* Line */}
                    <path
                        d={chartData.path}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Latest point dot */}
                    <circle
                        cx="100"
                        cy={chartData.path.split(' ').slice(-1)[0]}
                        r="3"
                        fill={color}
                    />
                </svg>
            </div>

            {/* Trend indicator */}
            {showTrend && (
                <div className="flex items-center gap-1 min-w-[60px]">
                    <TrendIcon size={16} className={trendColor} />
                    <span className={`text-xs font-medium ${trendColor}`}>
                        {chartData.percentChange > 0 ? '+' : ''}{chartData.percentChange}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default TrendChart;
