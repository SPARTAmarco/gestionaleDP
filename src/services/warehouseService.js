import { supabase } from './supabaseClient';

export const warehouseService = {
    // Get all items for a business
    async getItems(businessId) {
        if (!businessId) return { data: [], error: null };

        try {
            const { data, error } = await supabase
                .from('warehouse_items')
                .select('*')
                .eq('business_id', businessId)
                .order('name');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching items:', error);
            return { data: [], error };
        }
    },

    // Add a new item
    async addItem(itemData) {
        try {
            const { data, error } = await supabase
                .from('warehouse_items')
                .insert([itemData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding item:', error);
            return { data: null, error };
        }
    },

    // Update an item
    async updateItem(id, updates) {
        try {
            // Se la quantità cambia, dovremmo registrare la history (gestito idealmente dal frontend o da una RPC,
            // ma qui facciamo un update semplice dell'item)
            const { data, error } = await supabase
                .from('warehouse_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating item:', error);
            return { data: null, error };
        }
    },

    // Delete an item
    async deleteItem(id) {
        try {
            const { error } = await supabase
                .from('warehouse_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting item:', error);
            return { error };
        }
    },

    // Record Stock Change History
    async addHistoryLog(logData) {
        try {
            const { data, error } = await supabase
                .from('warehouse_history')
                .insert([logData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding history log:', error);
            return { data: null, error };
        }
    },

    // Get History Logs
    async getHistoryLogs(businessId, itemId = null) {
        try {
            let query = supabase
                .from('warehouse_history')
                .select('*, warehouse_items(name)')
                .eq('business_id', businessId)
                .order('date_recorded', { ascending: false });

            if (itemId) {
                query = query.eq('item_id', itemId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching history logs:', error);
            return { data: [], error };
        }
    },

    // Get all categories for a business
    async getCategories(businessId) {
        if (!businessId) return { data: [], error: null };
        try {
            const { data, error } = await supabase
                .from('warehouse_categories')
                .select('*')
                .eq('business_id', businessId)
                .order('name');
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback empty data if table doesn't exist yet but feature is enabled
            return { data: [], error: null };
        }
    },

    // Add a new category
    async addCategory(categoryData) {
        try {
            const { data, error } = await supabase
                .from('warehouse_categories')
                .insert([categoryData])
                .select()
                .single();
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding category:', error);
            return { data: null, error };
        }
    },

    // Delete a category
    async deleteCategory(id) {
        try {
            const { error } = await supabase
                .from('warehouse_categories')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting category:', error);
            return { error };
        }
    }
};
