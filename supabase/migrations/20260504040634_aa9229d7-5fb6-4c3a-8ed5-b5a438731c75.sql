
-- Attach trigger to auth.users (was missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: ensure every existing auth user has a profile + role
INSERT INTO public.profiles (user_id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- First existing user (oldest) becomes admin if no admin exists
DO $$
DECLARE first_uid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    SELECT id INTO first_uid FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF first_uid IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (first_uid, 'admin')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Any remaining users without a role get 'user'
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL;
