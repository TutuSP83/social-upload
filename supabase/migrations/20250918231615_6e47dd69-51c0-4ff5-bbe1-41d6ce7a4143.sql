-- Remove problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Simple admin profiles view" ON public.profiles;

-- Create safer policies for profiles
CREATE POLICY "User can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Basic profile info public" 
ON public.profiles 
FOR SELECT 
USING (true);