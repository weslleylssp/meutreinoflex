-- Fix workout_history RLS policy conflicts
-- Remove overly permissive policies that expose all data
DROP POLICY IF EXISTS "Anyone can view workout history" ON workout_history;
DROP POLICY IF EXISTS "Anyone can create workout history" ON workout_history;

-- Clean up existing NULL user_id records (orphaned data)
DELETE FROM workout_history WHERE user_id IS NULL;

-- Make user_id NOT NULL to enforce ownership
ALTER TABLE workout_history 
ALTER COLUMN user_id SET NOT NULL;