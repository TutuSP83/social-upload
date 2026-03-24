CREATE OR REPLACE FUNCTION public.create_sender_folder_safe(
  p_shared_with uuid,
  p_shared_by uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  folder_id uuid;
BEGIN
  IF auth.uid() <> p_shared_by THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  folder_id := public.get_or_create_sender_folder(p_shared_with, p_shared_by);
  RETURN folder_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sender_folder_safe(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.sql_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text text NOT NULL,
  success boolean NOT NULL,
  error_message text,
  row_count bigint DEFAULT 0,
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE public.sql_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sql_audit_insert ON public.sql_audit_log;
CREATE POLICY sql_audit_insert
ON public.sql_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
