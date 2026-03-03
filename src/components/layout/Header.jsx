import React from 'react';
import { Menu, Bell } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useAppContext } from '../../context/AppContext';

const Header = ({ onMenuToggle, currentViewLabel }) => {
    const { business, pendingRequestsCount, settings, updateSettings } = useAppContext();
    const currentLang = settings?.language || 'it';

    return (
        <header className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 -ml-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-full"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    {currentViewLabel}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-full">
                    <button
                        onClick={() => updateSettings('language', 'it')}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${currentLang === 'it' ? 'bg-white dark:bg-dark-surface shadow-sm scale-110' : 'opacity-50 hover:opacity-100'}`}
                        title="Italiano"
                    >
                        <span className="text-sm font-bold leading-none shrink-0" style={{ transform: 'translateY(1px)' }}>IT</span>
                    </button>
                    <button
                        onClick={() => updateSettings('language', 'en')}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${currentLang === 'en' ? 'bg-white dark:bg-dark-surface shadow-sm scale-110' : 'opacity-50 hover:opacity-100'}`}
                        title="English"
                    >
                        <span className="text-sm font-bold leading-none shrink-0" style={{ transform: 'translateY(1px)' }}>EN</span>
                    </button>
                </div>

                <ThemeToggle />
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-full transition-colors">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {pendingRequestsCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {business?.name?.substring(0, 2).toUpperCase()}
                </div>
            </div>
        </header>
    );
};

export default Header;
