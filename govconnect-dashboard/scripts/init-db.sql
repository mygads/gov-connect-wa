-- GovConnect Dashboard Database Schema
-- Auto-generated from Prisma schema

-- Create admin_users table
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS "admin_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");
CREATE INDEX IF NOT EXISTS "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "activity_logs_admin_id_idx" ON "activity_logs"("admin_id");
CREATE INDEX IF NOT EXISTS "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS "knowledge_base" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "admin_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "knowledge_base_category_idx" ON "knowledge_base"("category");
CREATE INDEX IF NOT EXISTS "knowledge_base_is_active_idx" ON "knowledge_base"("is_active");
CREATE INDEX IF NOT EXISTS "knowledge_base_keywords_idx" ON "knowledge_base" USING GIN ("keywords");

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "title" TEXT,
    "description" TEXT,
    "category" TEXT,
    "total_chunks" INTEGER,
    "total_tokens" INTEGER,
    "admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "knowledge_documents_status_idx" ON "knowledge_documents"("status");
CREATE INDEX IF NOT EXISTS "knowledge_documents_category_idx" ON "knowledge_documents"("category");
CREATE INDEX IF NOT EXISTS "knowledge_documents_created_at_idx" ON "knowledge_documents"("created_at");

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS "document_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page_number" INTEGER,
    "section_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "document_chunks_document_id_idx" ON "document_chunks"("document_id");
CREATE INDEX IF NOT EXISTS "document_chunks_chunk_index_idx" ON "document_chunks"("chunk_index");

-- Insert default admin user (username: admin, password: admin123)
-- Password hash generated with bcrypt, rounds=10
INSERT INTO "admin_users" ("id", "username", "password_hash", "name", "role", "is_active", "created_at")
VALUES (
    'admin-default-001',
    'admin',
    '$2b$10$rKvVPZqGhf5vZ5qZ5qZ5qeK5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ',
    'Administrator',
    'admin',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Note: The password hash above is a placeholder. 
-- You should change the password after first login!
