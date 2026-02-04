import { useState, useEffect } from 'react';
import healthScoreService from '../services/healthScore.service';

const HealthScoreCard = () => {
    const [scoreData, setScoreData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const data = await healthScoreService.getLatestScore();
                setScoreData(data);
            } catch (err) {
                console.error('Failed to fetch health score:', err);
                setError('Could not load health score');
            } finally {
                setIsLoading(false);
            }
        };

        fetchScore();
    }, []);

    if (isLoading) {
        return (
            <div className="card h-full flex items-center justify-center min-h-[220px]">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card h-full flex items-center justify-center min-h-[220px]">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    const score = scoreData?.score || 0;
    const trend = scoreData?.trend?.direction || 'stable';
    const summary = scoreData?.summary || 'No data available yet.';

    // Calculate color based on score
    let scoreColor = 'text-green-500';
    let ringColor = 'stroke-green-500';

    if (score < 60) {
        scoreColor = 'text-red-500';
        ringColor = 'stroke-red-500';
    } else if (score < 80) {
        scoreColor = 'text-amber-500';
        ringColor = 'stroke-amber-500';
    }

    // Trend icon
    let trendIcon = '→';
    let trendClass = 'text-stone-500';
    if (trend === 'improving') {
        trendIcon = '↗';
        trendClass = 'text-green-500';
    } else if (trend === 'declining') {
        trendIcon = '↘';
        trendClass = 'text-red-500';
    }

    // Calculate ring stroke
    // Circumference = 2 * PI * R
    // R = 58 (to fit in 128x128 viewbox)
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="card relative h-full flex flex-col items-center justify-center text-center p-6">
            <div className="relative w-32 h-32 mb-4">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-stone-200"
                        strokeWidth="8"
                        fill="none"
                    />
                    {/* Score Ring */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className={`${ringColor} transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
                    <span className="text-xs uppercase font-medium text-stone-400">Score</span>
                </div>
            </div>

            <div className={`text-sm font-medium mb-2 flex items-center gap-1 ${trendClass}`}>
                {trendIcon} <span className="capitalize">{trend}</span> Trend
            </div>

            <p className="text-sm text-stone-600 max-w-[200px]">
                {summary}
            </p>

            {/* Last Validated */}
            {scoreData?.calculatedAt && (
                <p className="text-xs text-stone-400 mt-4">
                    Updated {new Date(scoreData.calculatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                    })}
                </p>
            )}
        </div>
    );
};

export default HealthScoreCard;
