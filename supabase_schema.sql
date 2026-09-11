-- 1. Create Tasks Table (Renamed to home_tasks to avoid conflict with baitolab)
CREATE TABLE IF NOT EXISTS home_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Expenses Table (Renamed to home_expenses)
CREATE TABLE IF NOT EXISTS home_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_by TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Expense Splits Table
CREATE TABLE IF NOT EXISTS home_expense_splits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID REFERENCES home_expenses(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE home_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_expense_splits ENABLE ROW LEVEL SECURITY;

-- Create Policies (For this household app, any authenticated user can read and write everything)
CREATE POLICY "Enable read/write for authenticated users" ON home_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON home_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON home_expense_splits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Add Category to Expenses (run this if you already created the table)
ALTER TABLE home_expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';
ALTER TABLE home_expenses ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'daily';
ALTER TABLE home_expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
