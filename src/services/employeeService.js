import { supabase } from './supabaseClient';

export const employeeService = {
    async getEmployees(businessId) {
        if (!businessId) return { data: [], error: null };

        const { data, error } = await supabase
            .from('profiles')
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
            isActive: true,
            // Color generation should probably be consistent or stored, but for now random is fine
            color: '#3B82F6'
        }));

        return { data: formattedEmployees, error: null };
    },

    async getBusiness(businessId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .maybeSingle();
        return { data, error };
    },

    async getBusinessByOwner(ownerId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', ownerId)
            .maybeSingle();
        return { data, error };
    },

    async dissociateEmployee(employeeId, businessId) {
        // Verifica che il dipendente appartenga a questa attività
        const { data: employee, error: checkError } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('id', employeeId)
            .single();

        if (checkError) {
            return { success: false, error: checkError };
        }

        if (employee.business_id !== businessId) {
            return {
                success: false,
                error: { message: 'Il dipendente non appartiene a questa attività' }
            };
        }

        // Dissociate employee by setting business_id to null
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ business_id: null })
            .eq('id', employeeId)
            .select();

        if (updateError) {
            return { success: false, error: updateError };
        }

        if (data && data.length === 0) {
            // RLS might have hidden the row. Verify if the employee is still linked.
            const { data: verifyData, error: verifyError } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', employeeId)
                .maybeSingle();

            // If we can still see the user AND they still have our business_id, then the update FAILED.
            if (verifyData && verifyData.business_id === businessId) {
                return {
                    success: false,
                    error: { message: 'Impossibile rimuovere il dipendente. Verifica i permessi (RLS) nel database.' }
                };
            }
            // If verifyData is null (can't see user anymore) OR business_id is different/null -> Success
        }

        return { success: true, error: null };
    }
};
