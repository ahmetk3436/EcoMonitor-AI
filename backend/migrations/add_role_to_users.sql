-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Set any existing NULL values to 'user'
UPDATE users SET role = 'user' WHERE role IS NULL;
