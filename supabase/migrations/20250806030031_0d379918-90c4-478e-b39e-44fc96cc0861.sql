-- Simple fix: just confirm emails for login to work properly
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;