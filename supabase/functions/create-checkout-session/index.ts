// File: supabase/functions/create-checkout-session/index.ts
// (Versione Pulita - Pronta per la produzione)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno&no-check"

// --- Variabili di Configurazione ---
// !! ASSICURATI CHE QUESTI SIANO CORRETTI !!
const PREMIUM_PRICE_ID = "price_1SUBiW2NRceBcDBZcNPO3vUv" 
// NB: Gli URL vengono passati dal frontend per supportare diversi ambienti
// ------------------------------------

serve(async (req) => {
  // Gestione CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*", // In produzione, cambia con il tuo URL
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    // Inizializza Stripe.
    // Il '!' dice: "Sono sicuro che non è null". Se lo è (segreto non trovato),
    // l'errore di Stripe (401) verrà catturato dal blocco catch.
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { email, baseUrl, userId } = await req.json()
    
    if (!email) {
      throw new Error("Email non fornita dal frontend.")
    }
    
    if (!baseUrl) {
      throw new Error("URL base non fornito dal frontend.")
    }

    // Costruisci gli URL di redirect - assicurati che siano URL assoluti senza trailing slash
    // Rimuovi eventuali trailing slash da baseUrl e assicurati che sia un URL valido
    let cleanBaseUrl = baseUrl.replace(/\/$/, '')
    // Se baseUrl non inizia con http:// o https://, aggiungilo
    if (!cleanBaseUrl.match(/^https?:\/\//)) {
      cleanBaseUrl = `https://${cleanBaseUrl}`
    }
    
    // Usa CHECKOUT_SESSION_ID placeholder che Stripe sostituirà automaticamente
    const successUrl = `${cleanBaseUrl}?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${cleanBaseUrl}`
    
    console.log('Stripe checkout URLs:', { successUrl, cancelUrl, baseUrl, cleanBaseUrl })

    // Crea la sessione di Checkout con tema scuro
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId, // Per identificare l'utente
      payment_method_types: ["card"],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      appearance: {
        theme: 'night', // Tema scuro per Stripe
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#0f172a',
          colorText: '#f1f5f9',
          colorDanger: '#ef4444',
          colorSuccess: '#10b981',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
        rules: {
          '.Input': {
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            color: '#f1f5f9',
          },
          '.Input:focus': {
            borderColor: '#6366f1',
          },
          '.Label': {
            color: '#cbd5e1',
          },
        },
      },
    })

    // Ritorna l'ID della sessione al frontend
    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    })

  } catch (error) {
    // Logga l'errore sul server di Supabase per il debug
    console.error("Errore Stripe:", error.message)
    // Ritorna un errore generico al frontend
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Internal Server Error
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    })
  }
})