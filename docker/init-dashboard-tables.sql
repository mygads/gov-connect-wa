-- Dashboard Schema Tables Initialization
-- Run this after schemas are created

SET search_path TO dashboard;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS activity_logs_admin_id_idx ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON activity_logs(timestamp);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt: $2b$10$IZNsPO71i7WOWlc42IF08eR.Ox74nk9ZRdnQ0pztDjBCeE5WGQb3q
INSERT INTO admin_users (id, username, password_hash, name, role, is_active, created_at)
VALUES (
    'cm0x' || substring(md5(random()::text) from 1 for 20),
    'admin',
    '$2b$10$IZNsPO71i7WOWlc42IF08eR.Ox74nk9ZRdnQ0pztDjBCeE5WGQb3q',
    'Administrator',
    'superadmin',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Dashboard Tables Initialized Successfully';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  - admin_users';
    RAISE NOTICE '  - admin_sessions';
    RAISE NOTICE '  - activity_logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Admin User:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '================================================';
END $$;
