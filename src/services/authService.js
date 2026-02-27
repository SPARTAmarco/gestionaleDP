import { supabase } from './supabaseClient';

export const authService = {
    async signUp(formData) {
        const { email, password, firstName, lastName, businessName, address, phone, role } = formData;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: role,
                        business_name: businessName,
                        business_address: address,
                        business_phone: phone
                    }
                }
            });

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error("Errore registrazione:", error);
            return { error };
        }
    },

    async signIn(email, password) {
        // MOCK LOGIN REMOVED


        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },

    async updateProfile(userId, formData) {
        try {
            // 1. Aggiorna Auth (Nome Utente)
            const updates = {
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName
                }
            };

            // Solo se l'email è cambiata (richiede verifica email solitamente, ma lo mettiamo)
            if (formData.email) {
                updates.email = formData.email;
            }

            const { error: authError } = await supabase.auth.updateUser(updates);
            if (authError) throw authError;

            // 2. AGGIORNA O CREA DATI BUSINESS
            // Solo se ci sono dati business da aggiornare
            let updatedBusinessData = null;
            if (formData.businessName || formData.address || formData.phone) {
                const { data, error: busError } = await supabase
                    .from('businesses')
                    .upsert({
                        owner_id: userId,
                        name: formData.businessName,
                        address: formData.address,
                        phone: formData.phone
                    }, { onConflict: 'owner_id' })
                    .select()
                    .single();

                if (busError) throw busError;
                updatedBusinessData = data;
            }

            return { success: true, business: updatedBusinessData };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error };
        }
    },

    async changePassword(newPwd) {
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        return { error };
    },

    // Funzione helper per caricare il profilo completo
    async getFullProfile(userId) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, business_id, first_name, last_name')
            .eq('id', userId)
            .maybeSingle();

        return { data: profile, error };
    }
};
