-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add missing columns to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS newsletter_subscription BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT FALSE;

