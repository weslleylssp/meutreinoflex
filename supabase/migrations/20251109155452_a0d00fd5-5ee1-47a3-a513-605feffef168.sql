-- Corrigir search_path da função update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar o trigger que foi removido
CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();