import React from 'react';
import { Calendar, Users, Bell, Zap, LogOut, Package } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Sidebar = ({ currentView, setCurrentView }) => {
    const {
        business,
        employees,
        pendingRequestsCount,
        authSignOut,
        user,
        t // Use t helper
    } = useAppContext();



    const navItems = [
        { id: 'dashboard', icon: Calendar, label: t('calendar') },
        { id: 'employees', icon: Users, label: t('employees'), badge: employees.length },
        { id: 'warehouse', icon: Package, label: 'Magazzino' }, // [NEW]
        { id: 'requests', icon: Bell, label: t('requests'), badge: pendingRequestsCount }
    ];

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-8">
                <div className="bg-blue-600 p-2 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">La Dolce Pausa</span>
            </div>

            {business && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 transition-colors">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('venue')}</div>
                    <div className="font-bold text-gray-900 dark:text-white">{business.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{business.address}</div>
                </div>
            )}

            <nav className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === item.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.badge > 0 && item.id === 'requests' && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}

            </nav>

            <button
                onClick={authSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 mt-8"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('logout')}</span>
            </button>
        </div >
    );
};

export default Sidebar;
