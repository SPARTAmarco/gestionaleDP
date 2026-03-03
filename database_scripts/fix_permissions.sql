-- POLICY: Allow business owners to update profiles of their employees
-- This is necessary to allow owners to dissociate (remove) employees from their business.

-- 1. Enable RLS on profiles if not already enabled (it should be, but good practice)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create the policy
-- This allows a user (Owner) to UPDATE a profile IF that profile's current business_id belongs to a business owned by the user.
CREATE POLICY "Owners can update their employees"
ON profiles
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- 3. Also ensure they can Select them (probably already exists, but ensuring)
CREATE POLICY "Owners can view their employees"
ON profiles
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);
