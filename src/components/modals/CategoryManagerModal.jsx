import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Trash2, X } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { useAppContext } from '../../context/AppContext';
import { inventoryService } from '../../services/inventoryService';

const CategoryManagerModal = ({ onClose }) => {
    const { business, showNotification, t } = useAppContext();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadCategories = async () => {
        if (!business?.id) return;
        setIsLoading(true);
        const { data, error } = await inventoryService.getCategories(business.id);
        if (error) {
            showNotification(t('error_loading_categories'), 'error');
        } else {
            setCategories(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, [business?.id]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        const { data, error } = await inventoryService.addCategory({
            business_id: business.id,
            name: newCategory.trim()
        });

        if (error) {
            showNotification(t('error_creating_category'), 'error');
        } else {
            showNotification(t('category_created'));
            setNewCategory('');
            loadCategories();
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm(t('delete_category_confirm'))) return;

        const { error } = await inventoryService.deleteCategory(id);
        if (error) {
            showNotification(t('error_deleting_category'), 'error');
        } else {
            showNotification(t('category_deleted'));
            loadCategories();
        }
    };

    return (
        <AnimatedModal title={t('category_management')} onClose={onClose}>
            <div className="space-y-6">
                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <div className="relative flex-1 group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors group-focus-within:bg-indigo-600 group-focus-within:text-white">
                            <Tag className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            placeholder={t('new_category_placeholder')}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newCategory.trim()}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                {/* Categories List */}
                <div className="bg-gray-50 dark:bg-dark-surface/50 rounded-xl border border-gray-100 dark:border-gray-800 p-2 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">{t('loading')}</div>
                    ) : categories.length > 0 ? (
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Tag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">{t('no_categories')}</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </AnimatedModal>
    );
};

export default CategoryManagerModal;
