import React from 'react';

// Basic Pulse Animation Base
const SkeletonBase = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700/50 rounded ${className}`} />
);

// 1. Stat Card Skeleton
export const StatCardSkeleton = () => {
    return (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-surface border border-border shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    {/* Icon Skeleton */}
                    <SkeletonBase className="h-12 w-12 rounded-xl mb-4" />
                    
                    {/* Title Skeleton */}
                    <SkeletonBase className="h-3 w-24 mb-2" />
                    
                    {/* Value Skeleton */}
                    <SkeletonBase className="h-10 w-32 mb-2" />
                    
                    {/* Subtext Skeleton */}
                    <SkeletonBase className="h-3 w-40" />
                </div>
            </div>
            {/* Decorative Icon Placeholder */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gray-100 dark:bg-gray-800/30 rounded-full opacity-50" />
        </div>
    );
};

// 2. Welcome Banner Skeleton
export const WelcomeBannerSkeleton = () => {
    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-surface border border-border shadow-sm mb-8 h-48 sm:h-56">
             <div className="absolute inset-0 p-8 flex flex-col justify-center">
                <SkeletonBase className="h-8 w-64 mb-4" />
                <SkeletonBase className="h-4 w-96 mb-6" />
                <div className="flex gap-4">
                    <SkeletonBase className="h-10 w-32 rounded-lg" />
                    <SkeletonBase className="h-10 w-32 rounded-lg" />
                </div>
             </div>
        </div>
    );
};

// 3. Needs Attention List Skeleton (3 items)
export const NeedsAttentionSkeleton = () => {
    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                 <SkeletonBase className="h-6 w-32" />
                 <SkeletonBase className="h-8 w-8 rounded-full" />
            </div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 mb-3 bg-surface-secondary/50 rounded-r-xl border-l-4 border-gray-300 dark:border-gray-600 border-y border-r border-border/50">
                    <div className="flex-1">
                        <div className="flex justify-between mb-2">
                            <SkeletonBase className="h-4 w-40" />
                            <SkeletonBase className="h-5 w-16 rounded-full" />
                        </div>
                        <SkeletonBase className="h-3 w-full mb-1" />
                        <SkeletonBase className="h-3 w-2/3" />
                         <div className="flex justify-between mt-3 pt-2 border-t border-dashed border-border/50">
                            <SkeletonBase className="h-3 w-24" />
                            <SkeletonBase className="h-3 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 4. OPD Schedule Chart Skeleton
export const ChartSkeleton = () => {
    return (
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <SkeletonBase className="h-6 w-48" />
                <SkeletonBase className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex-1 flex items-end gap-2 px-2">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-full flex flex-col justify-end gap-1 h-full">
                        <SkeletonBase className={`w-full rounded-t-sm`} style={{ height: `${Math.random() * 60 + 20}%` }} />
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-4 px-2">
                {[...Array(6)].map((_, i) => (
                     <SkeletonBase key={i} className="h-3 w-8" />
                ))}
            </div>
        </div>
    );
};

// 5. Patient Table Row Skeleton (5 rows)
export const TableRowSkeleton = () => {
     return (
        <>
            {[...Array(5)].map((_, index) => (
                <tr key={index} className="border-b border-border hover:bg-surface-secondary/50 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <SkeletonBase className="w-10 h-10 rounded-full" />
                            <div className="flex flex-col gap-1.5">
                                <SkeletonBase className="h-4 w-32" />
                                <SkeletonBase className="h-3 w-20" />
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                         <div className="flex flex-col gap-1.5">
                            <SkeletonBase className="h-4 w-12" />
                            <SkeletonBase className="h-3 w-16" />
                        </div>
                    </td>
                     <td className="p-4">
                        <SkeletonBase className="h-6 w-12 rounded-full" />
                    </td>
                    <td className="p-4">
                         <div className="flex flex-col gap-1.5">
                            <SkeletonBase className="h-4 w-24" />
                            <SkeletonBase className="h-3 w-20" />
                        </div>
                    </td>
                    <td className="p-4">
                        <SkeletonBase className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-4 text-right">
                        <SkeletonBase className="h-8 w-8 rounded-lg ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
};
