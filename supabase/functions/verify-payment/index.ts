// File: supabase/functions/verify-payment/index.ts
// Verifica la sessione Stripe e aggiorna is_premium su Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno&no-check"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Gestione CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    // Inizializza Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Ottieni l'header di autorizzazione (Supabase lo passa automaticamente con verify_jwt = true)
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("Token di autorizzazione mancante")
    }

    // Inizializza Supabase client con service role key (ha accesso completo)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verifica l'utente autenticato usando il JWT token
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error("Utente non autenticato")
    }

    const { session_id } = await req.json()
    
    if (!session_id) {
      throw new Error("Session ID non fornito")
    }

    // Verifica la sessione Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'customer']
    })

    console.log('=== VERIFICA PAGAMENTO ===')
    console.log('Session ID:', session_id)
    console.log('Session status:', session.status)
    console.log('Payment status:', session.payment_status)
    console.log('Mode:', session.mode)
    console.log('Client reference ID:', session.client_reference_id)
    console.log('User ID:', user.id)
    console.log('Subscription:', session.subscription ? 'Presente' : 'Assente')

    // Verifica che il client_reference_id corrisponda all'utente
    if (session.client_reference_id && session.client_reference_id !== user.id) {
      console.error('ERRORE: La sessione non appartiene a questo utente')
      throw new Error("La sessione non appartiene a questo utente")
    }

    // Per subscription, verifica che la sessione sia completa
    // Per payment one-time, verifica payment_status
    // Per le subscription, payment_status può essere 'paid' o 'no_payment_required' (se è una trial)
    const isPaymentSuccessful = 
      session.status === 'complete' && 
      (session.payment_status === 'paid' || 
       session.payment_status === 'no_payment_required' ||
       (session.mode === 'subscription' && session.subscription))

    console.log('Is payment successful?', isPaymentSuccessful)

    if (isPaymentSuccessful) {
      console.log('Pagamento verificato, aggiorno is_premium...')
      
      // Prima verifica se il profilo esiste
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id, is_premium')
        .eq('id', user.id)
        .maybeSingle()

      console.log('Profilo esistente:', existingProfile)
      console.log('Errore controllo:', checkError)

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Errore nel controllo del profilo: ${checkError.message}`)
      }

      // Se il profilo non esiste, crealo
      if (!existingProfile) {
        console.log('Profilo non trovato, creo nuovo profilo...')
        const { error: insertError, data: insertData } = await supabaseAdmin
          .from('profiles')
          .insert({ 
            id: user.id,
            is_premium: true 
          })
          .select()
          .single()

        console.log('Risultato inserimento:', { insertError, insertData })

        if (insertError) {
          throw new Error(`Errore nella creazione del profilo: ${insertError.message}`)
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Pagamento verificato e account aggiornato a Premium",
          created: true
        }), {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        })
      }

      // Aggiorna is_premium su Supabase usando il client admin
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', user.id)
        .select()

      console.log('Risultato aggiornamento:', { 
        updateError, 
        updateData,
        rowsAffected: updateData?.length || 0
      })

      if (updateError) {
        throw new Error(`Errore nell'aggiornamento del profilo: ${updateError.message}`)
      }

      if (!updateData || updateData.length === 0) {
        throw new Error('Nessuna riga aggiornata. Il profilo potrebbe non esistere.')
      }

      console.log('✅ Profilo aggiornato con successo!')

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Pagamento verificato e account aggiornato a Premium",
        updated: true,
        profile: updateData[0]
      }), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      })
    } else {
      // Il pagamento non è andato a buon fine
      console.log('❌ Pagamento non completato:', {
        status: session.status,
        payment_status: session.payment_status,
        mode: session.mode
      })
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Il pagamento non è stato completato",
        session_status: session.status,
        payment_status: session.payment_status,
        mode: session.mode
      }), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      })
    }

  } catch (error) {
    console.error("Errore nella verifica del pagamento:", error.message)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    })
  }
})

