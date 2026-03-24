-- Fix foreign key constraint in user_stats table to allow user deletion
-- Drop the existing foreign key constraint
ALTER TABLE public.user_stats DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey;

-- Add the constraint back with CASCADE deletion
ALTER TABLE public.user_stats 
ADD CONSTRAINT user_stats_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;