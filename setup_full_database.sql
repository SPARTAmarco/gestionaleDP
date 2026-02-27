-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT businesses_owner_id_key UNIQUE (owner_id)
);

-- 2. PROFILES TABLE (Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'employee', -- 'owner' or 'employee'
    position TEXT,
    contract_hours NUMERIC DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT DEFAULT 'morning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'vacation', 'sick_leave'
    reason TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCTS TABLE (Inventory)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    category TEXT,
    min_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- ROW LEVEL SECURITY (RLS) ---
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR BUSINESSES
CREATE POLICY "Public profiles are viewable by everyone" ON businesses FOR SELECT USING (true);
CREATE POLICY "Users can create their own business" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own business" ON businesses FOR UPDATE USING (auth.uid() = owner_id);

-- POLICIES FOR PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Owners can update their employees" ON profiles FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- POLICIES FOR SHIFTS
CREATE POLICY "Read access for business members" ON shifts FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()) OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners can insert shifts" ON shifts FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners can update shifts" ON shifts FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners can delete shifts" ON shifts FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- POLICIES FOR REQUESTS
CREATE POLICY "Read access for business members" ON requests FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()) OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Employees can create requests" ON requests FOR INSERT WITH CHECK (
    auth.uid() = employee_id
);
CREATE POLICY "Owners can update requests (approve/reject)" ON requests FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- POLICIES FOR PRODUCTS
CREATE POLICY "Read access for business members" ON products FOR SELECT USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()) OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners and employees can insert products" ON products FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()) OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners and employees can update products" ON products FOR UPDATE USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid()) OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners can delete products" ON products FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- --- FUNCTIONS & TRIGGERS ---

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
