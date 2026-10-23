-- ==============================================================================
-- TradePro Supabase Database Schema & Row Level Security (RLS)
-- Run this schema in the SQL Editor for the active TradePro Supabase project.
--
-- Instructions:
-- 1. Open the Supabase Dashboard for the project configured in VITE_SUPABASE_URL.
-- 2. Navigate to "SQL Editor" -> "New Query"
-- 3. Paste this script and click "Run"
--
-- SECURITY COMPLIANCE:
-- - Uses auth.users as the primary authentication identity.
-- - Strictly relies on auth.uid() for ownership verification across all tables.
-- - Passwords and OTP tokens are managed exclusively by Supabase Auth and NEVER stored in these tables.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Public Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  full_name TEXT,
  account_number TEXT,
  tier TEXT DEFAULT 'Pro Member',
  balance NUMERIC(14,2) DEFAULT 100000.00,
  kyc_status TEXT DEFAULT 'VERIFIED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. User Portfolios (Holdings & Virtual Balances)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_portfolios (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  holdings JSONB DEFAULT '[]'::jsonb,
  cash_balance NUMERIC(14,2) DEFAULT 100000.00,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_portfolios' AND policyname = 'Users access own portfolio') THEN
    CREATE POLICY "Users access own portfolio" ON public.user_portfolios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. User Watchlists
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'My Watchlist',
  symbols TEXT[] DEFAULT ARRAY['AAPL', 'NVDA', 'MSFT', 'TSLA'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_watchlists' AND policyname = 'Users access own watchlists') THEN
    CREATE POLICY "Users access own watchlists" ON public.user_watchlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. User Goals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) DEFAULT 0.00,
  target_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_goals' AND policyname = 'Users access own goals') THEN
    CREATE POLICY "Users access own goals" ON public.user_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. User Preferences (Theme, Market, Layout)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  default_market TEXT DEFAULT 'US',
  chart_type TEXT DEFAULT 'candles',
  risk_tolerance TEXT DEFAULT 'moderate',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users access own preferences') THEN
    CREATE POLICY "Users access own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. User Wealth Data (Net Worth & Assets Breakdown)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_wealth_data (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  net_worth NUMERIC(14,2) DEFAULT 0.00,
  liquid_assets NUMERIC(14,2) DEFAULT 0.00,
  real_estate NUMERIC(14,2) DEFAULT 0.00,
  liabilities NUMERIC(14,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_wealth_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wealth_data' AND policyname = 'Users access own wealth data') THEN
    CREATE POLICY "Users access own wealth data" ON public.user_wealth_data FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. User Paper Trading Orders & Executions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_paper_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity NUMERIC(12,4) NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  status TEXT DEFAULT 'FILLED',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_paper_trades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_paper_trades' AND policyname = 'Users access own paper trades') THEN
    CREATE POLICY "Users access own paper trades" ON public.user_paper_trades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. User AI Wealth Preferences
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  persona TEXT DEFAULT 'tactical_macro',
  risk_profile TEXT DEFAULT 'moderate_growth',
  investment_horizon TEXT DEFAULT '3-5 years',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_ai_preferences' AND policyname = 'Users access own AI preferences') THEN
    CREATE POLICY "Users access own AI preferences" ON public.user_ai_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. Trigger: Automatically provision public.profiles upon auth.users signup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_name TEXT;
  acc_num TEXT;
BEGIN
  clean_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  acc_num := 'TP-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0') || '-' || lpad(floor(random() * 90 + 10)::text, 2, '0');

  INSERT INTO public.profiles (id, email, display_name, full_name, account_number, tier, balance, kyc_status)
  VALUES (
    NEW.id,
    NEW.email,
    clean_name,
    clean_name,
    acc_num,
    'Pro Member',
    100000.00,
    'VERIFIED'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- End of Schema Definition
-- ==============================================================================
