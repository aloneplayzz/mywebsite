-- Create the system user if it doesn't exist
INSERT INTO users (id, email, first_name, last_name)
VALUES ('system', 'system@example.com', 'System', 'User')
ON CONFLICT (id) DO NOTHING;

-- Ensure all foreign key constraints are properly set
ALTER TABLE chatroom_members
    DROP CONSTRAINT IF EXISTS chatroom_members_user_id_users_id_fk,
    ADD CONSTRAINT chatroom_members_user_id_users_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE chatroom_members
    DROP CONSTRAINT IF EXISTS chatroom_members_chatroom_id_chatrooms_id_fk,
    ADD CONSTRAINT chatroom_members_chatroom_id_chatrooms_id_fk
    FOREIGN KEY (chatroom_id)
    REFERENCES chatrooms(id)
    ON DELETE CASCADE;

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_chatroom_members_user_id ON chatroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_members_chatroom_id ON chatroom_members(chatroom_id); 