import { useState, useEffect } from 'react';
import healthScoreService from '../services/healthScore.service';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
            <div className="card-premium h-full min-h-[200px] flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-premium h-full min-h-[200px] flex items-center justify-center bg-white border-red-100">
                <p className="text-rose-500 text-sm font-medium">{error}</p>
            </div>
        );
    }

    const score = scoreData?.score || 0;
    const trend = scoreData?.trend?.direction || 'stable';
    const summary = scoreData?.summary || 'No data available yet.';

    // Calculate color based on score
    let scoreColor = 'text-emerald-500';
    let ringColor = 'stroke-emerald-500';
    let gradientId = 'gradientGreen';

    if (score < 60) {
        scoreColor = 'text-rose-500';
        ringColor = 'stroke-rose-500';
        gradientId = 'gradientRed';
    } else if (score < 80) {
        scoreColor = 'text-amber-500';
        ringColor = 'stroke-amber-500';
        gradientId = 'gradientAmber';
    }

    // Trend icon
    let TrendIcon = Minus;
    let trendClass = 'text-slate-400';
    let trendText = 'Stable';

    if (trend === 'improving') {
        TrendIcon = TrendingUp;
        trendClass = 'text-emerald-500';
        trendText = 'Improving';
    } else if (trend === 'declining') {
        TrendIcon = TrendingDown;
        trendClass = 'text-rose-500';
        trendText = 'Declining';
    }

    // SVG Math
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="card-premium h-full flex flex-col items-center justify-center text-center p-6 bg-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50" />
            
            <div className="relative w-32 h-32 mb-4 z-10">
                <svg className="w-full h-full transform -rotate-90">
                    <defs>
                        <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                        <linearGradient id="gradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#FBBF24" />
                        </linearGradient>
                        <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="100%" stopColor="#F87171" />
                        </linearGradient>
                    </defs>
                    
                    {/* Track */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="none"
                    />
                    
                    {/* Progress */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out shadow-lg"
                    />
                </svg>

                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Score</span>
                </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-3 ${trendClass}`}>
                <TrendIcon size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">{trendText}</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                {summary}
            </p>
        </div>
    );
};

export default HealthScoreCard;
