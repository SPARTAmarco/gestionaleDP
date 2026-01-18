import { supabase } from './supabaseClient';

export const requestService = {
    async getRequests(businessId) {
        if (!businessId) return { data: [], error: null };

        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('business_id', businessId);

        if (error) return { data: [], error };

        const formattedRequests = data.map(r => ({
            id: r.id,
            employeeId: r.employee_id,
            type: r.type,
            reason: r.reason,
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
            createdAt: r.created_at
        }));

        return { data: formattedRequests, error: null };
    },

    async createRequest(requestData) {
        const { error } = await supabase
            .from('requests')
            .insert([{
                business_id: requestData.businessId,
                employee_id: requestData.employeeId,
                type: requestData.type,
                reason: requestData.reason,
                start_date: requestData.startDate,
                end_date: requestData.endDate,
                status: 'pending'
            }]);
        return { error };
    },

    async updateRequestStatus(id, status) {
        const { error } = await supabase
            .from('requests')
            .update({ status })
            .eq('id', id);
        return { error };
    }
};
