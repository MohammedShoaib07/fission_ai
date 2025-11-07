/*
  # FISSION AI Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `email` (text, unique) - User email address
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `chat_sessions`
      - `id` (uuid, primary key) - Unique chat session identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `chat_type` (text) - Type of chat: 'coder', 'artist', or 'tutor'
      - `title` (text) - Chat session title
      - `created_at` (timestamptz) - Session creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `chat_messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `session_id` (uuid, foreign key) - Reference to chat_sessions table
      - `role` (text) - Message role: 'user' or 'assistant'
      - `content` (text) - Message content
      - `created_at` (timestamptz) - Message creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_type text NOT NULL CHECK (chat_type IN ('coder', 'artist', 'tutor')),
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own sessions"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own sessions"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own sessions"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
