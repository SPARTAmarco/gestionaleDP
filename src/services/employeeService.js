import { supabase } from './supabaseClient';

export const employeeService = {
    async getEmployees(businessId) {
        if (!businessId) return { data: [], error: null };

        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('business_id', businessId);

        if (error) return { data: [], error };

        const formattedEmployees = data.map(emp => ({
            id: emp.id,
            firstName: emp.first_name || 'Nome',
            lastName: emp.last_name || 'Cognome',
            email: emp.email,
            position: emp.position || 'Dipendente',
            contractHours: emp.contract_hours || 40,
            isActive: emp.is_active,
            color: emp.color || '#3B82F6'
        }));

        return { data: formattedEmployees, error: null };
    },

    async saveEmployee(businessId, employeeData, selectedEmployee) {
        const dbPayload = {
            business_id: businessId,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            email: employeeData.email,
            position: employeeData.position,
            contract_hours: employeeData.contractHours || 40,
            color: employeeData.color || '#3B82F6',
            is_active: employeeData.isActive !== undefined ? employeeData.isActive : true
        };

        if (selectedEmployee) {
            // Update
            const { data, error } = await supabase
                .from('employees')
                .update(dbPayload)
                .eq('id', selectedEmployee.id)
                .select()
                .single();
            return { data, error };
        } else {
            // Insert
            const { data, error } = await supabase
                .from('employees')
                .insert([dbPayload])
                .select()
                .single();
            return { data, error };
        }
    },

    async getBusiness(businessId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .maybeSingle();
        return { data, error };
    },

    async dissociateEmployee(employeeId, businessId) {
        // Technically just deleting now, or we could set is_active=false. 
        // Based on original logic, we disassociated them. Let's fully delete them as requested in the new single-tenant format.
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', employeeId)
            .eq('business_id', businessId);

        if (error) {
            return { success: false, error };
        }

        return { success: true, error: null };
    }
};
