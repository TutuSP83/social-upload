
-- Create the execute_sql function for the SQL Editor
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    query_result RECORD;
    results JSON[] := '{}';
BEGIN
    -- Only allow SELECT queries for security
    IF UPPER(TRIM(sql_query)) NOT LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Execute the query and return results as JSON
    FOR query_result IN EXECUTE sql_query LOOP
        results := results || to_json(query_result);
    END LOOP;
    
    RETURN array_to_json(results);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Create the get_table_schema function
CREATE OR REPLACE FUNCTION public.get_table_schema(table_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
        )
    )
    INTO result
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = get_table_schema.table_name
    ORDER BY ordinal_position;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_schema(TEXT) TO authenticated;
