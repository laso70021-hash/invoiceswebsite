INSERT INTO public.profiles (id, full_name, business_name)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'business_name'
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;
