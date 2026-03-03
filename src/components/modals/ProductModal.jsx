import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Tag, Hash, DollarSign, AlertTriangle, Trash2, Scale } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { warehouseService } from '../../services/warehouseService';
import { useAppContext } from '../../context/AppContext';

const ProductModal = ({ product, onClose, onSave, onDelete }) => {
    const { t, business } = useAppContext();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: 0,
        unit: 'pz',
        cost: 0,
        min_threshold: 5,
        notes: ''
    });

    useEffect(() => {
        const loadCategories = async () => {
            if (business?.id) {
                const { data } = await warehouseService.getCategories(business.id);
                setCategories(data || []);
            }
        };
        loadCategories();
    }, [business]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                quantity: product.quantity || 0,
                unit: product.unit || 'pz',
                cost: product.cost || 0,
                min_threshold: product.min_threshold || 5,
                notes: product.notes || ''
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const qty = parseInt(formData.quantity);
        const costVal = parseFloat(formData.cost);
        const threshold = parseInt(formData.min_threshold);

        const dataToSubmit = {
            ...formData,
            quantity: isNaN(qty) ? 0 : qty,
            cost: isNaN(costVal) ? 0 : costVal,
            min_threshold: isNaN(threshold) ? 5 : threshold
        };
        onSave(dataToSubmit);
    };

    return (
        <AnimatedModal title={product ? t('edit_product') : t('new_product')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('product_name')}</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors group-focus-within:bg-blue-600 group-focus-within:text-white">
                            <Package className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            placeholder="Es. Caffè macinato"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('category')}</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors group-focus-within:bg-indigo-600 group-focus-within:text-white">
                                <Tag className="w-4 h-4" />
                            </div>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900 dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="">{t('select_category')}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Costo Unitario (€)</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors group-focus-within:bg-green-600 group-focus-within:text-white">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                name="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('quantity')}</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors group-focus-within:bg-gray-800 group-focus-within:text-white">
                                <Hash className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-gray-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Unità</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-colors group-focus-within:bg-purple-600 group-focus-within:text-white">
                                <Scale className="w-4 h-4" />
                            </div>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-gray-900 dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="pz">pz (Pezzi)</option>
                                <option value="kg">kg (Chilogrammi)</option>
                                <option value="g">g (Grammi)</option>
                                <option value="l">l (Litri)</option>
                                <option value="scatole">Scatole</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('min_threshold')}</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center transition-colors group-focus-within:bg-orange-600 group-focus-within:text-white">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                name="min_threshold"
                                value={formData.min_threshold}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('description')}</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="w-full p-4 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white resize-none"
                        placeholder={t('additional_details')}
                    />
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 mt-4">
                    {product ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('delete')}
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
                        >
                            {t('cancel')}
                        </button>
                        <motion.button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/30 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {t('save_changes')}
                        </motion.button>
                    </div>
                </div>
            </form>
        </AnimatedModal>
    );
};

export default ProductModal;
