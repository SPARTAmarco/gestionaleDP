-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    category TEXT,
    min_threshold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users belonging to the business" ON products
    FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ) OR business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert access for business owners and employees" ON products
    FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ) OR business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Enable update access for business owners and employees" ON products
    FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ) OR business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Enable delete access for business owners" ON products
    FOR DELETE
    USING (business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));
