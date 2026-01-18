-- FIX PER RLS ERROR: "new row violates row-level security policy"
-- Questo errore avviene perché la policy precedente impediva alla riga di "uscire" dal tuo business (diventando NULL).
-- Questa versione corregge il problema permettendo esplicitamente il valore NULL per business_id.

-- 1. Rimuoviamo vecchie policy che potrebbero andare in conflitto (nomi probabili)
DROP POLICY IF EXISTS "Owners can update their employees" ON profiles;
DROP POLICY IF EXISTS "Gli Owner possono aggiornare i propri dipendenti" ON profiles;
DROP POLICY IF EXISTS "Owner update employee policy" ON profiles;

-- 2. Creiamo la policy corretta con la clausola WITH CHECK
CREATE POLICY "Owner update employee policy"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- Chi può essere modificato: Dipendenti che ATTUALMENTE appartengono al tuo business
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Cosa è permesso scrivere:
  -- 1. Puoi mantenere il dipendente nel tuo business (modifiche normali)
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
  -- 2. OPPURE puoi impostare business_id a NULL (dissociazione/rimozione)
  OR business_id IS NULL
);
