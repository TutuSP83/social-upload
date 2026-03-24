-- Allow very large files by using bigint for size
ALTER TABLE public.files
ALTER COLUMN size TYPE bigint USING size::bigint;