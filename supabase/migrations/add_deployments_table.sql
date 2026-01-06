-- HashCoder IDE - Subdomain Deployments Table
-- Add to Supabase SQL Editor

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  port INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('building', 'running', 'error', 'stopped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_deployments_user_id ON deployments(user_id);
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_subdomain ON deployments(subdomain);

-- Add RLS policies
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deployments"
  ON deployments FOR SELECT
  USING (user_id = auth.jwt()->>'userId');

CREATE POLICY "Users can insert own deployments"
  ON deployments FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'userId');

CREATE POLICY "Users can update own deployments"
  ON deployments FOR UPDATE
  USING (user_id = auth.jwt()->>'userId');

CREATE POLICY "Users can delete own deployments"
  ON deployments FOR DELETE
  USING (user_id = auth.jwt()->>'userId');

-- Add columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS subdomain TEXT,
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS last_deployed TIMESTAMP WITH TIME ZONE;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_deployments_updated_at();

-- Comments
COMMENT ON TABLE deployments IS 'Tracks subdomain deployments for HashCoder IDE projects';
COMMENT ON COLUMN deployments.subdomain IS 'Subdomain like app.{userId}';
COMMENT ON COLUMN deployments.port IS 'Port number where app is running (3100-3999)';
COMMENT ON COLUMN deployments.status IS 'Current deployment status';
