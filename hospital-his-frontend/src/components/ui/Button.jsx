import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper function to merge Tailwind classes efficiently
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    isDisabled = false,
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className,
    onClick,
    type = 'button',
    fullWidth = false,
    ...props
}, ref) => {
    
    // Base Styles
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none overflow-hidden isolate";
    
    // Size Variants
    const sizeStyles = {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-10 px-4 text-sm rounded-xl gap-2",
        lg: "h-12 px-6 text-base rounded-xl gap-2.5",
        xl: "h-14 px-8 text-lg rounded-2xl gap-3"
    };

    // Style Variants
    const variants = {
        // Primary: Role-specific dynamic gradient background
        primary: `
            bg-gradient-to-r from-role to-role-dark text-white shadow-lg shadow-role/25 border border-transparent
            hover:shadow-role/40 hover:brightness-110
            active:scale-[0.98]
            focus:ring-role/50
        `,
        // Secondary: Subtle background for less emphasis
        secondary: `
            bg-surface-secondary text-text-secondary border border-border
            hover:bg-surface-highlight hover:text-text-primary hover:border-gray-300 dark:hover:border-gray-600
            active:bg-gray-200 dark:active:bg-gray-700
            focus:ring-gray-200 dark:focus:ring-gray-700
        `,
        // Outline: Transparent with border
        outline: `
            bg-transparent text-text-primary border border-border
            hover:bg-surface-highlight hover:border-role/50 hover:text-role
            active:bg-role/5
            focus:ring-role/30
        `,
        // Ghost: Minimalist, no background until hover
        ghost: `
            bg-transparent text-text-secondary border border-transparent
            hover:bg-surface-highlight hover:text-role
            active:bg-role/10
            focus:ring-role/20
        `,
        // Danger: Destructive actions
        danger: `
            bg-red-500 text-white shadow-lg shadow-red-500/25 border border-transparent
            hover:bg-red-600 hover:shadow-red-500/40
            active:scale-[0.98]
            focus:ring-red-500/50
        `
    };

    // Loading Spinner with size check
    const spinnerSizes = {
        sm: 14,
        md: 18,
        lg: 20,
        xl: 24
    };

    return (
        <motion.button
            ref={ref}
            type={type}
            onClick={onClick}
            disabled={isDisabled || isLoading}
            whileTap={{ scale: isDisabled || isLoading ? 1 : 0.98 }}
            className={cn(
                baseStyles,
                sizeStyles[size],
                variants[variant],
                fullWidth && "w-full",
                className
            )}
            {...props}
        >
            {/* Loading Spinner Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
                    <Loader2 size={spinnerSizes[size]} className="animate-spin" />
                </div>
            )}

            {/* Ripple Effect Container (could be enhanced with real ripple later) */}
            <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity bg-white/20 pointer-events-none" />

            {/* Content Visibility Control for Loading State */}
            <span className={cn(
                "flex items-center justify-center gap-inherit z-10", 
                isLoading && "opacity-0"
            )}>
                {LeftIcon && <LeftIcon size={spinnerSizes[size]} className={cn("transition-transform group-hover:scale-110")} />}
                
                <span>{children}</span>

                {RightIcon && <RightIcon size={spinnerSizes[size]} className={cn("transition-transform group-hover:translate-x-0.5")} />}
            </span>
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
