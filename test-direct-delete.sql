-- 1. bordro_expenses tablosundaki tım kayıtları gıster
SELECT id, employee_id, type, amount, description, date, installment_total, installment_current
FROM bordro_expenses
WHERE type = 'Prim'
ORDER BY date DESC
LIMIT 20;

-- 2. Silmeye ıalııtııınız ID'li kayıt var mı?
SELECT id, employee_id, type, amount, description
FROM bordro_expenses
WHERE id = '18cff96e-f952-4eb0-8f04-12a9c6ed3879';

-- 3. Tabloya DELETE yetkimiz var mı? (Test et)
-- Bu kayıt silindikten sonra geri yıklenir, test amaılı
DELETE FROM bordro_expenses WHERE id = '18cff96e-f952-4eb0-8f04-12a9c6ed3879';

-- 4. Gerıekten silindi mi kontrol et
SELECT COUNT(*) as "Kayıt hala var mı (0 olmalı)" 
FROM bordro_expenses 
WHERE id = '18cff96e-f952-4eb0-8f04-12a9c6ed3879';

