import { supabase } from './supabaseClient';

export const inventoryService = {
    // Get all products for a business
    async getProducts(businessId) {
        if (!businessId) return { data: [], error: null };

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', businessId)
                .order('name');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching products:', error);
            return { data: [], error };
        }
    },

    // Add a new product
    async addProduct(productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding product:', error);
            return { data: null, error };
        }
    },

    // Update a product
    async updateProduct(id, updates) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating product:', error);
            return { data: null, error };
        }
    },

    // Delete a product
    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { error };
        }
    },

    // --- Categories ---

    async getCategories(businessId) {
        try {
            const { data, error } = await supabase
                .from('product_categories')
                .select('*')
                .eq('business_id', businessId)
                .order('name');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { data: [], error };
        }
    },

    async addCategory(categoryData) {
        try {
            const { data, error } = await supabase
                .from('product_categories')
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

    async deleteCategory(id) {
        try {
            const { error } = await supabase
                .from('product_categories')
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
