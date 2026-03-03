-- 1. DROP EXISTING TABLES TO START CLEAN
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS warehouse_history CASCADE;
DROP TABLE IF EXISTS warehouse_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- 2. CREATE `businesses` TABLE (CORE REFERENCE)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'La Mia Azienda',
    address TEXT,
    phone TEXT,
    join_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE `employees` TABLE (REPLACES PROFILES, NO AUTH REQUIRED)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    position TEXT,
    contract_hours NUMERIC DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE `shifts` TABLE
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT DEFAULT 'morning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE `requests` TABLE
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- ferie, permesso, malattia, altro
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    start_date DATE,
    end_date DATE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE `warehouse_items` TABLE
CREATE TABLE warehouse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pz', -- kg, litri, scatole ecc.
    min_threshold NUMERIC DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE `warehouse_history` TABLE
CREATE TABLE warehouse_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES warehouse_items(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'load' | 'unload' | 'adjustment'
    quantity_changed NUMERIC NOT NULL,
    previous_quantity NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    notes TEXT,
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. DISABLE ROW LEVEL SECURITY (RLS) GLOBALLY FOR ANONYMOUS ACCESS
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_history DISABLE ROW LEVEL SECURITY;

-- 9. SEED DEFAULT DATA
INSERT INTO businesses (name, address, phone) 
VALUES ('La Dolce Pausa', 'Via Esempio 1, Colzate', '333 1234567');
