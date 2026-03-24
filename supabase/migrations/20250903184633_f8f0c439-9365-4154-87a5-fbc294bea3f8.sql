-- Fix critical security issue: Remove public access to profiles table
-- and implement proper user-specific access controls

-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- Create secure policy: Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create admin policy: Admins can view all profiles (if admin functionality exists)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Ensure users can still insert their own profile (for new user creation)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);