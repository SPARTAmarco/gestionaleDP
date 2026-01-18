import { supabase } from './supabaseClient';

export const shiftService = {
    async getShifts(businessId) {
        if (!businessId) return { data: [], error: null };

        const { data, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('business_id', businessId);

        if (error) return { data: [], error };

        // Format shifts for app usage (camelCase)
        const formattedShifts = data.map(s => ({
            id: s.id,
            employeeId: s.employee_id,
            date: s.date,
            startTime: s.start_time?.slice(0, 5),
            endTime: s.end_time?.slice(0, 5),
            type: s.type,
            createdAt: s.created_at
        }));

        return { data: formattedShifts, error: null };
    },

    async createShift(shiftData) {
        // shiftData should be in snake_case for DB or we convert it here
        // Let's assume input is camelCase and we convert
        const dbData = {
            business_id: shiftData.businessId,
            employee_id: shiftData.employeeId,
            date: shiftData.date,
            start_time: shiftData.startTime,
            end_time: shiftData.endTime,
            type: shiftData.type || 'morning'
        };

        const { data, error } = await supabase
            .from('shifts')
            .insert([dbData])
            .select();

        return { data, error };
    },

    async updateShift(id, shiftData) {
        const dbData = {
            employee_id: shiftData.employeeId,
            date: shiftData.date,
            start_time: shiftData.startTime,
            end_time: shiftData.endTime,
            type: shiftData.type
        };

        const { data, error } = await supabase
            .from('shifts')
            .update(dbData)
            .eq('id', id)
            .select();

        return { data, error };
    },

    async deleteShift(id) {
        const { error } = await supabase
            .from('shifts')
            .delete()
            .eq('id', id);
        return { error };
    },

    async deleteShiftsRange(businessId, startDate, endDate, employeeId = null) {
        let query = supabase
            .from('shifts')
            .delete()
            .eq('business_id', businessId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (employeeId && employeeId !== 'all') {
            query = query.eq('employee_id', employeeId);
        }

        const { error } = await query;
        return { error };
    },

    async createShiftsBatch(shifts) {
        const { data, error } = await supabase
            .from('shifts')
            .insert(shifts)
            .select();
        return { data, error };
    },

    async deleteEmployeeShifts(businessId, employeeId) {
        const { error } = await supabase
            .from('shifts')
            .delete()
            .eq('business_id', businessId)
            .eq('employee_id', employeeId);
        return { error };
    }
};

