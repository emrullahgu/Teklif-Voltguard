-- bordro_expenses tablosunda RLS'i devre dııı bırak
-- ıınkı admin tım ıalııanların expense kayıtlarını yınetebilmeli

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON bordro_expenses;

-- RLS'i tamamen kapat
ALTER TABLE bordro_expenses DISABLE ROW LEVEL SECURITY;

-- Veya RLS aıık kalsın ama authenticated kullanıcılar her ıeyi yapabilsin:
-- (Yukarıdaki ALTER TABLE satırını yorumla ve aıaııyı kullan)

/*
-- Herkes kendi verilerine + admin tım verilere eriebilsin
CREATE POLICY "Allow all for authenticated users" ON bordro_expenses
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
*/

