-- Create an admin user
-- First, sign up normally through the app, then get your user ID from the auth.users table
-- Replace the UUID below with your actual user ID after signup

-- To find your user ID, you can run: SELECT id, email FROM auth.users;
-- Then replace the UUID below with your actual user ID

INSERT INTO public.admin_users (id, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Example with a real UUID (replace with your actual user ID):
-- INSERT INTO public.admin_users (id, role)
-- VALUES ('ca430b02-fa97-4c8f-a355-f80631a8ba3f', 'super_admin')
-- ON CONFLICT (id) DO NOTHING;
