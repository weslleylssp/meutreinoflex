-- Create workout history table
CREATE TABLE public.workout_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_weight NUMERIC NOT NULL DEFAULT 0,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  total_sets INTEGER NOT NULL DEFAULT 0,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have auth yet)
CREATE POLICY "Anyone can view workout history" 
ON public.workout_history 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create workout history" 
ON public.workout_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_workout_history_completed_at ON public.workout_history(completed_at DESC);