// File: supabase/functions/create-checkout-session/index.ts
// (Versione Pulita - Pronta per la produzione)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno&no-check"

// --- Variabili di Configurazione ---
// !! ASSICURATI CHE QUESTI SIANO CORRETTI !!
const PREMIUM_PRICE_ID = "price_1SUBiW2NRceBcDBZcNPO3vUv" 
const SUCCESS_URL = "http://localhost:3000/dashboard?payment=success" 
const CANCEL_URL = "http://localhost:3000/dashboard?payment=cancel"  
// NB: In produzione, cambia localhost con il tuo vero URL!
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

    const { email } = await req.json()
    
    if (!email) {
      throw new Error("Email non fornita dal frontend.")
    }

    // Crea la sessione di Checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
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