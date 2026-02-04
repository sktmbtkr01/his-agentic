import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const InsightCard = ({ type = 'info', message }) => {
    const config = {
        info: {
            icon: Info,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-100',
            title: 'Did you know?'
        },
        alert: {
            icon: AlertTriangle,
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-100',
            title: 'Attention'
        },
        success: {
            icon: CheckCircle,
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-100',
            title: 'Great Job!'
        },
        tip: {
            icon: Lightbulb,
            bg: 'bg-purple-50',
            text: 'text-purple-700',
            border: 'border-purple-100',
            title: 'Health Tip'
        }
    };

    const style = config[type] || config.info;
    const Icon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${style.bg} ${style.border} border rounded-xl p-4 flex gap-3`}
        >
            <div className={`p-2 rounded-full bg-white/50 h-fit ${style.text}`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${style.text}`}>
                    {style.title}
                </h4>
                <p className={`text-sm ${style.text} opacity-90 leading-tight`}>
                    {message}
                </p>
            </div>
        </motion.div>
    );
};

export default InsightCard;
