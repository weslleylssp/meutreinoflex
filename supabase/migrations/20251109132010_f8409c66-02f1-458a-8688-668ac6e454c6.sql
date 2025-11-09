-- Create workouts table to persist user-created workouts
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for workouts
CREATE POLICY "Users can view their own workouts"
ON public.workouts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
ON public.workouts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
ON public.workouts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create workout_templates table for pre-configured workouts
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for templates (public read access)
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workout templates"
ON public.workout_templates
FOR SELECT
TO authenticated
USING (true);

-- Insert pre-configured workout templates
INSERT INTO public.workout_templates (name, description, level, exercises) VALUES
(
  'Treino A - Peito e Tríceps',
  'Treino focado em peito e tríceps para iniciantes',
  'beginner',
  '[
    {"id": "1", "name": "Supino Reto", "sets": 3, "reps": 12, "weight": 20},
    {"id": "2", "name": "Supino Inclinado", "sets": 3, "reps": 12, "weight": 15},
    {"id": "3", "name": "Crucifixo", "sets": 3, "reps": 15, "weight": 10},
    {"id": "4", "name": "Tríceps Testa", "sets": 3, "reps": 12, "weight": 10},
    {"id": "5", "name": "Tríceps Corda", "sets": 3, "reps": 15, "weight": 15}
  ]'::jsonb
),
(
  'Treino B - Costas e Bíceps',
  'Treino focado em costas e bíceps para iniciantes',
  'beginner',
  '[
    {"id": "1", "name": "Puxada Frontal", "sets": 3, "reps": 12, "weight": 30},
    {"id": "2", "name": "Remada Curvada", "sets": 3, "reps": 12, "weight": 25},
    {"id": "3", "name": "Remada Sentado", "sets": 3, "reps": 12, "weight": 25},
    {"id": "4", "name": "Rosca Direta", "sets": 3, "reps": 12, "weight": 10},
    {"id": "5", "name": "Rosca Martelo", "sets": 3, "reps": 12, "weight": 8}
  ]'::jsonb
),
(
  'Treino C - Pernas e Ombros',
  'Treino focado em pernas e ombros para iniciantes',
  'beginner',
  '[
    {"id": "1", "name": "Agachamento", "sets": 4, "reps": 12, "weight": 40},
    {"id": "2", "name": "Leg Press", "sets": 3, "reps": 15, "weight": 80},
    {"id": "3", "name": "Cadeira Extensora", "sets": 3, "reps": 15, "weight": 30},
    {"id": "4", "name": "Desenvolvimento", "sets": 3, "reps": 12, "weight": 15},
    {"id": "5", "name": "Elevação Lateral", "sets": 3, "reps": 15, "weight": 8}
  ]'::jsonb
);

-- Create trigger for updating workouts updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();