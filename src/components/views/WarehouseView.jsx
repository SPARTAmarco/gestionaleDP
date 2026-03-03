import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Filter, Plus, AlertTriangle, Edit2, Trash2, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { warehouseService } from '../../services/warehouseService';
import ProductModal from '../modals/ProductModal';
import CategoryManagerModal from '../modals/CategoryManagerModal';
import LoadingSpinner from '../ui/LoadingSpinner';

const WarehouseView = () => {
    const { business, showNotification, reloadUserData, t } = useAppContext();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Load items
    const loadItems = async () => {
        if (!business?.id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const { data, error } = await warehouseService.getItems(business.id);
        if (error) {
            showNotification(t('error_loading_products'), 'error');
        } else {
            setItems(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadItems();
    }, [business?.id]);

    // Handlers
    const handleAddItem = () => {
        setSelectedItem(null);
        setShowModal(true);
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleSaveItem = async (itemData) => {
        if (!business?.id) {
            showNotification(t('warning_missing_business_data'), 'error');
            return;
        }
        const dataToSave = { ...itemData, business_id: business.id };

        if (selectedItem) {
            const { error } = await warehouseService.updateItem(selectedItem.id, dataToSave);
            if (error) {
                console.error(error);
                showNotification(`${t('error_saving_product')}: ${error.message || 'Errore sconosciuto'}`, 'error');
            } else {
                showNotification(t('product_updated'));
                loadItems();
                setShowModal(false);
            }
        } else {
            const { error } = await warehouseService.addItem(dataToSave);
            if (error) {
                console.error(error);
                showNotification(`${t('error_saving_product')}: ${error.message || 'Errore sconosciuto'}`, 'error');
            } else {
                showNotification(t('product_added'));
                loadItems();
                setShowModal(false);
            }
        }
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        if (window.confirm(t('delete_product_confirm'))) {
            const { error } = await warehouseService.deleteItem(selectedItem.id);
            if (error) {
                showNotification('Errore eliminazione prodotto', 'error');
            } else {
                showNotification(t('product_deleted'));
                loadItems();
                setShowModal(false);
            }
        }
    };

    // Filtering
    const filteredItems = items.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...new Set(items.map(p => p.category).filter(Boolean))];

    if (isLoading) return <LoadingSpinner />;

    if (!business?.id) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('warning_missing_business_data')}</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                    {t('missing_business_data_desc')}
                </p>
                <button
                    onClick={() => reloadUserData ? reloadUserData() : window.location.reload()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg"
                >
                    {t('reload_data')}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-8 h-8 text-blue-600" />
                        {t('warehouse')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('manage_inventory')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors shadow-sm font-medium"
                    >
                        <Tag className="w-5 h-5" />
                        {t('categories')}
                    </button>
                    <button
                        onClick={handleAddItem}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        {t('new_product')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('search_products')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">{t('all_categories')}</option>
                        {categories.filter(c => c !== 'all').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Item List */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">{t('product')}</th>
                                <th className="p-4 font-semibold">{t('category')}</th>
                                <th className="p-4 font-semibold text-right">{t('price')}</th>
                                <th className="p-4 font-semibold text-center">{t('quantity')}</th>
                                <th className="p-4 font-semibold text-right">{t('status')}</th>
                                <th className="p-4 font-semibold text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                                        onClick={() => handleEditItem(item)}
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                            {item.notes && (
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.notes}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {item.category ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                                                    {item.category}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                                            € {item.cost?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold ${item.quantity <= item.min_threshold
                                                ? 'text-red-500'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {item.quantity} {item.unit}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {item.quantity <= item.min_threshold ? (
                                                <span className="flex items-center justify-end gap-1 text-red-500 text-xs font-bold">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {t('low_stock')}
                                                </span>
                                            ) : (
                                                <span className="text-green-500 text-xs font-bold">
                                                    {t('in_stock')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditItem(item);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {t('no_products_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ProductModal
                    product={selectedItem}
                    onSave={handleSaveItem}
                    onDelete={handleDeleteItem}
                    onClose={() => setShowModal(false)}
                />
            )}

            {showCategoryModal && (
                <CategoryManagerModal
                    onClose={() => setShowCategoryModal(false)}
                />
            )}
        </div>
    );
};

export default WarehouseView;
