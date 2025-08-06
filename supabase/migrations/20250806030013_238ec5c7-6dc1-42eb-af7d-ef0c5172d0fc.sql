-- Fix email confirmation for existing users to allow login
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- Also ensure the admin_master user is properly set up
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now(),
    role = 'authenticated'
WHERE id = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd';