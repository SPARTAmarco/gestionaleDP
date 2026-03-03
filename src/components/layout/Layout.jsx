import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppContext } from '../../context/AppContext';

const Layout = ({ children, currentView, setCurrentView, onOpenPremium }) => {
    const { t, authSignOut } = useAppContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const views = {
        'dashboard': t('calendar'),
        'employees': t('employees'),
        'requests': t('requests')
    };

    const currentViewLabel = views[currentView] || 'La Dolce Pausa';

    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleSetView = (view) => {
        setCurrentView(view);
        closeMenu();
    };

    const handleOpenPremium = () => {
        onOpenPremium();
        closeMenu();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex transition-colors duration-300">
            {/* Overlay Mobile Animato */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMenu}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Mobile Animata */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside
                        className="bg-white dark:bg-dark-surface w-64 border-r border-gray-200 dark:border-dark-border fixed inset-y-0 left-0 z-50 transform"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                    >
                        <Sidebar
                            currentView={currentView}
                            setCurrentView={handleSetView}
                            onOpenPremium={handleOpenPremium}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Sidebar Desktop */}
            <aside className="bg-white dark:bg-dark-surface w-64 border-r border-gray-200 dark:border-dark-border hidden lg:block fixed inset-y-0 left-0 z-20 transition-colors duration-300">
                <Sidebar
                    currentView={currentView}
                    setCurrentView={handleSetView}
                    onOpenPremium={onOpenPremium}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64">
                <Header
                    onMenuToggle={() => setIsMobileMenuOpen(true)}
                    currentViewLabel={currentViewLabel}
                />
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
