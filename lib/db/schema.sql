-- CODEP PULSE: Master SQL Migration v1.0 (Supabase/PostgreSQL)

-- 1. Identity & Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'CLUB', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  student_id TEXT UNIQUE,
  faculty TEXT,
  role user_role DEFAULT 'STUDENT',
  is_seller BOOLEAN DEFAULT FALSE,
  hustle_score INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Marketplace Logic
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  stock_count INTEGER DEFAULT 1,
  category TEXT,
  image_url TEXT,
  is_official BOOLEAN DEFAULT FALSE, -- True for Clubs
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logic: Student Sellers = Max 5 active items
CREATE OR REPLACE FUNCTION check_active_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply to Student role
  IF (SELECT role FROM profiles WHERE id = NEW.seller_id) = 'STUDENT' AND NEW.is_active = TRUE THEN
    IF (SELECT COUNT(*) FROM items WHERE seller_id = NEW.seller_id AND is_active = TRUE) >= 5 THEN
      RAISE EXCEPTION 'Student sellers are limited to 5 active items.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_item_limit ON items;
CREATE TRIGGER tr_item_limit
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION check_active_item_limit();

-- 3. Handshake/Transaction Logic
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'PENDING', -- PENDING, PAID, DROPPED, COLLECTED, EXPIRED
  claim_token TEXT,
  proof_image TEXT, -- For Photo-Proof
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Missions & Runners (Relationship: Transaction-Mission)
CREATE TABLE IF NOT EXISTS missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_id UUID REFERENCES transactions(id),
  runner_id UUID REFERENCES profiles(id),
  type TEXT, -- OFFICIAL, CLUB, RUNNER
  status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, TAKEN, COMPLETED, CANCELLED
  reward_hp INTEGER DEFAULT 10,
  pickup_location TEXT,
  drop_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logic: Max 3 active missions per runner
CREATE OR REPLACE FUNCTION check_active_mission_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM missions WHERE runner_id = NEW.runner_id AND status = 'TAKEN') >= 3 THEN
    RAISE EXCEPTION 'Runners are limited to 3 active missions.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_mission_limit ON missions;
CREATE TRIGGER tr_mission_limit
BEFORE INSERT OR UPDATE ON missions
FOR EACH ROW EXECUTE FUNCTION check_active_mission_limit();

-- Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Adjust as needed for Auth)
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Items are viewable by everyone." ON items FOR SELECT USING (true);

-- Atomic Utilities
CREATE OR REPLACE FUNCTION increment(row_id UUID, val INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET hustle_score = hustle_score + val
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
