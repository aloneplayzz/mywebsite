-- Add Discord and GitHub OAuth fields
ALTER TABLE users
ADD COLUMN discord_id VARCHAR(255),
ADD COLUMN github_id VARCHAR(255);

-- Create indexes for OAuth IDs
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_github_id ON users(github_id); 