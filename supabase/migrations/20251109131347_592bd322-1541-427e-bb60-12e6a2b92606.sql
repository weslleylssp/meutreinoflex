-- Add user_id column to workout_history
ALTER TABLE public.workout_history
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_workout_history_user_id ON public.workout_history(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.workout_history;
DROP POLICY IF EXISTS "Allow public insert access" ON public.workout_history;

-- Create new RLS policies for authenticated users only
CREATE POLICY "Users can view their own workout history"
ON public.workout_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout history"
ON public.workout_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout history"
ON public.workout_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout history"
ON public.workout_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);