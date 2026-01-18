import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm p-4 ${className}`}>
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                    </div>
                );

            case 'table-row':
                return (
                    <tr className="border-b border-gray-100 dark:border-dark-border">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                </div>
                            </div>
                        </td>
                        {[...Array(6)].map((_, i) => (
                            <td key={i} className="p-2">
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            </td>
                        ))}
                        <td className="p-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                        </td>
                    </tr>
                );

            case 'list-item':
                return (
                    <motion.div
                        className={`bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border ${className}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'stat-card':
                return (
                    <div className={`bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border ${className}`}>
                        <div className="animate-pulse space-y-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                    </div>
                );

            case 'calendar-cell':
                return (
                    <td className="p-2">
                        <div className="space-y-1">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </td>
                );

            default:
                return (
                    <div className={`h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}></div>
                );
        }
    };

    return (
        <>
            {[...Array(count)].map((_, index) => (
                <React.Fragment key={index}>
                    {renderSkeleton()}
                </React.Fragment>
            ))}
        </>
    );
};

// Specific skeleton components for common use cases
export const TableSkeleton = ({ rows = 5 }) => (
    <tbody>
        {[...Array(rows)].map((_, i) => (
            <SkeletonLoader key={i} type="table-row" />
        ))}
    </tbody>
);

export const CardGridSkeleton = ({ cards = 4 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(cards)].map((_, i) => (
            <SkeletonLoader key={i} type="stat-card" />
        ))}
    </div>
);

export const ListSkeleton = ({ items = 3 }) => (
    <div className="space-y-3">
        {[...Array(items)].map((_, i) => (
            <SkeletonLoader key={i} type="list-item" />
        ))}
    </div>
);

export default SkeletonLoader;
