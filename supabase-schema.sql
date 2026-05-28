-- =========================
-- PROFILES (linked to Supabase Auth)
-- =========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================
-- BOOKS
-- =========================
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_books_user ON books(user_id);


-- =========================
-- TRANSACTIONS
-- =========================
CREATE TYPE transaction_type AS ENUM ('in', 'out', 'pending_in', 'pending_out');

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  creator UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_book ON transactions(book_id);


-- =========================
-- INVITATIONS
-- =========================
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  creator UUID REFERENCES profiles(id),
  user_email VARCHAR(255) NOT NULL,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_email ON invitations(user_email);
CREATE INDEX idx_invitations_book ON invitations(book_id);


-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Books: owner or active member can read
CREATE POLICY "Users can view own books or books they are active members of"
  ON books FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(members) AS member
      WHERE member->>'email' = (SELECT email FROM profiles WHERE id = auth.uid())
      AND member->>'status' = 'active'
    )
  );

CREATE POLICY "Users can create books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Transactions: users can manage transactions for books they have access to
CREATE POLICY "Users can view transactions of accessible books"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = transactions.book_id
      AND (
        books.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(books.members) AS member
          WHERE member->>'email' = (SELECT email FROM profiles WHERE id = auth.uid())
          AND member->>'status' = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can create transactions in accessible books"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    creator = auth.uid()
    AND EXISTS (
      SELECT 1 FROM books
      WHERE books.id = transactions.book_id
      AND (
        books.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(books.members) AS member
          WHERE member->>'email' = (SELECT email FROM profiles WHERE id = auth.uid())
          AND member->>'status' = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can delete transactions in accessible books"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = transactions.book_id
      AND (
        books.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(books.members) AS member
          WHERE member->>'email' = (SELECT email FROM profiles WHERE id = auth.uid())
          AND member->>'status' = 'active'
        )
      )
    )
  );

-- Invitations: users can view invitations sent to their email
CREATE POLICY "Users can view invitations for their email"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    user_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR creator = auth.uid()
  );

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (creator = auth.uid());

CREATE POLICY "Users can update invitations sent to them"
  ON invitations FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Book owners can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (creator = auth.uid());
