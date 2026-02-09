import { useState, useEffect } from 'react';
import healthScoreService from '../services/healthScore.service';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

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
            <div className="card-premium h-full min-h-[340px] flex items-center justify-center bg-cream-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-premium h-full min-h-[340px] flex items-center justify-center bg-cream-50">
                <p className="text-peach-500 font-medium">{error}</p>
            </div>
        );
    }

    const score = scoreData?.score || 0;
    const trend = scoreData?.trend?.direction || 'stable';

    // Theme Logic based on Score
    let theme = {
        bg: 'bg-gradient-to-br from-sage-50 via-emerald-50 to-white',
        border: 'border-sage-100',
        gradientStart: '#6B8E7B', // Sage 500
        gradientEnd: '#A6C4B5',   // Sage 300
        textColor: 'text-sage-700',
        badgeBg: 'bg-sage-100',
        badgeText: 'text-sage-700',
        shadowColor: 'shadow-sage-200',
        iconBg: 'bg-white text-sage-600 shadow-sage-100',
        message: "You're thriving today! Keep up the great balance."
    };

    if (score < 60) {
        theme = {
            bg: 'bg-gradient-to-br from-rose-50 via-peach-50 to-white',
            border: 'border-rose-100',
            gradientStart: '#E06C50', // Peach 500
            gradientEnd: '#FA8C73',   // Peach 400
            textColor: 'text-peach-600',
            badgeBg: 'bg-peach-50',
            badgeText: 'text-peach-600',
            shadowColor: 'shadow-peach-200',
            iconBg: 'bg-white text-peach-600 shadow-peach-100',
            message: "Let's focus on recovery today. Take it slow."
        };
    } else if (score < 80) {
        theme = {
            bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-white',
            border: 'border-amber-100',
            gradientStart: '#F59E0B', // Amber 500
            gradientEnd: '#FCD34D',   // Amber 300
            textColor: 'text-amber-600',
            badgeBg: 'bg-amber-50',
            badgeText: 'text-amber-700',
            shadowColor: 'shadow-amber-100',
            iconBg: 'bg-white text-amber-600 shadow-amber-100',
            message: "You're doing okay. A little rest might help."
        };
    }

    // Trend Logic
    let TrendIcon = Minus;
    let trendLabel = 'Stable';
    if (trend === 'improving') {
        TrendIcon = TrendingUp;
        trendLabel = 'Improving';
    } else if (trend === 'declining') {
        TrendIcon = TrendingDown;
        trendLabel = 'Needs Attention';
    }

    // SVG Configuration
    const size = 140; // Reduced size
    const strokeWidth = 12; // Thinner stroke
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={`rounded-[24px] relative overflow-hidden flex flex-row items-center justify-between p-6 shadow-soft border ${theme.bg} ${theme.border}`}>
             {/* Watermark Icon - Large and faded in background */}
             <div className="absolute -right-4 -bottom-4 opacity-[0.05] transform rotate-12 pointer-events-none">
                <Activity size={180} strokeWidth={1.5} className={theme.textColor} />
            </div>

            {/* Left Content: Header & Message */}
            <div className="flex flex-col items-start gap-4 z-10 max-w-[55%]">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full shadow-sm ${theme.iconBg}`}>
                        <Activity size={16} />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider opacity-80 text-sage-900">Health Score</h2>
                    
                    {/* Status Badge */}
                    <div className={`px-2.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ml-1`}>
                        <TrendIcon size={12} />
                        <span>{trendLabel}</span>
                    </div>
                </div>

                <div>
                    <h3 className={`text-base font-bold text-sage-800 mb-1 leading-snug`}>
                       {theme.message}
                    </h3>
                    <p className="text-stone-500 text-xs leading-relaxed">
                        {scoreData?.summary || "Based on your recent vitals and activity."}
                    </p>
                </div>
            </div>

            {/* Right Content: Score Circle */}
            <div className="relative flex items-center justify-center shrink-0 z-10">
                {/* Soft Inner Glow/Shadow Background */}
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-10 bg-current ${theme.textColor}`}></div>
                
                <svg width={size} height={size} className="transform -rotate-90 drop-shadow-md">
                     <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={theme.gradientStart} />
                            <stop offset="100%" stopColor={theme.gradientEnd} />
                        </linearGradient>
                    </defs>

                    {/* Background Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor" 
                        strokeOpacity="0.1"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className={theme.textColor}
                    />

                    {/* Progress Arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Centered Score */}
                <div className="absolute flex flex-col items-center">
                    <span className={`text-4xl font-display font-bold ${theme.textColor} tracking-tight`}>
                        {score}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide opacity-60 ${theme.textColor}`}>
                        / 100
                    </span>
                </div>
            </div>
            
        </div>
    );
};

export default HealthScoreCard;
