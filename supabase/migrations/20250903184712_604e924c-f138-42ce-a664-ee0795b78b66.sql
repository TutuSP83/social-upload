-- Fix feedback table security vulnerability
-- Remove public access and implement proper user-specific controls

-- Drop the problematic public access policy
DROP POLICY IF EXISTS "anyone_can_view_feedback" ON public.feedback;

-- Create policy for users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for admins to view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);