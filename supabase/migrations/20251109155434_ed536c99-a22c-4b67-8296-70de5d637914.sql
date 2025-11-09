-- Criar tabela para treinos compartilhados
CREATE TABLE IF NOT EXISTS public.shared_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  access_count integer NOT NULL DEFAULT 0
);

-- Adicionar índice para busca por código
CREATE INDEX idx_shared_workouts_share_code ON public.shared_workouts(share_code);

-- Enable RLS
ALTER TABLE public.shared_workouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view shared workouts by code"
ON public.shared_workouts
FOR SELECT
USING (true);

CREATE POLICY "Users can create shared workouts for their own workouts"
ON public.shared_workouts
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_id
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own shared workouts"
ON public.shared_workouts
FOR DELETE
USING (created_by = auth.uid());

-- Função para gerar código único de 6 caracteres
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;