-- ?? EXPENSE_LOCK_TRIGGER'ı kaldır veya devre dııı bırak

-- ııZıM 1: Trigger'ı tamamen SıL (ınerilen)
DROP TRIGGER IF EXISTS expense_lock_trigger ON public.bordro_expenses;

-- ııZıM 2: Trigger'ı sadece DEVRE DIıI BIRAK (geıici)
-- ALTER TABLE public.bordro_expenses DISABLE TRIGGER expense_lock_trigger;

-- ııZıM 3: check_expense_lock() fonksiyonunu kontrol et ve deıitir
-- SELECT pg_get_functiondef('check_expense_lock'::regproc);

-- Test: Trigger silindikten sonra DELETE ıalıııyor mu?
-- DELETE FROM bordro_expenses WHERE id = 'fcb50c02-1b84-4d4b-9e92-e6b4a2741f4d' RETURNING *;

