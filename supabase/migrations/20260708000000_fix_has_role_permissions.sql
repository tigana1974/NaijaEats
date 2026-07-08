-- Grant execute permission on has_role to anon and public so RLS policies don't fail for unauthenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, public;
