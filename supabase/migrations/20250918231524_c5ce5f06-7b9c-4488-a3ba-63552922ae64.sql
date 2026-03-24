-- Fix infinite recursion in profiles table by removing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simple, safe policy for admin access
CREATE POLICY "Simple admin profiles view" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Ensure profiles can be viewed by users for basic functionality
CREATE POLICY "Public profile view for usernames" 
ON public.profiles 
FOR SELECT 
USING (true);