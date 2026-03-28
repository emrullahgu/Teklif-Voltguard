-- ?? BORDRO_EXPENSES DELETE FIX - Function-based approach
-- Anon key ile ıalııacak ıekilde delete function oluıtur

-- 1. Delete function oluıtur
CREATE OR REPLACE FUNCTION delete_bordro_expense(expense_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Bu sayede function owner'ın yetkisiyle ıalııır
AS $$
DECLARE
  deleted_row JSON;
  row_count INTEGER;
BEGIN
  -- Silme ilemi
  DELETE FROM public.bordro_expenses 
  WHERE id = expense_id
  RETURNING row_to_json(bordro_expenses.*) INTO deleted_row;
  
  -- Kaı satır silindi?
  GET DIAGNOSTICS row_count = ROW_COUNT;
  
  -- Sonuı dındır
  IF row_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Kayıt bulunamadı',
      'deleted_count', 0
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Kayıt silindi',
      'deleted_count', row_count,
      'deleted_row', deleted_row
    );
  END IF;
END;
$$;

-- 2. Anon rolıne function ıalııtırma yetkisi ver
GRANT EXECUTE ON FUNCTION delete_bordro_expense(UUID) TO anon;
GRANT EXECUTE ON FUNCTION delete_bordro_expense(UUID) TO authenticated;

-- 3. Test et
-- SELECT delete_bordro_expense('YOUR-EXPENSE-ID-HERE');

