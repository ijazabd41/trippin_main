-- Create eSIM Orders table
-- Run this in your Supabase SQL Editor to create the esim_orders table

-- First, ensure the enum type exists
DO $$ BEGIN
    CREATE TYPE esim_order_status AS ENUM ('pending', 'processing', 'active', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the esim_orders table
CREATE TABLE IF NOT EXISTS esim_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(255) NOT NULL,
  esim_provider_order_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  status esim_order_status DEFAULT 'pending',
  customer_info JSONB,
  plan_details JSONB,
  qr_code TEXT,
  activation_code VARCHAR(255),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  usage_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_esim_orders_user_id ON esim_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_esim_orders_status ON esim_orders(status);
CREATE INDEX IF NOT EXISTS idx_esim_orders_provider_id ON esim_orders(esim_provider_order_id);
CREATE INDEX IF NOT EXISTS idx_esim_orders_stripe_id ON esim_orders(stripe_payment_intent_id);

-- Enable Row Level Security
ALTER TABLE esim_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON esim_orders;
CREATE POLICY "Users can view their own orders" ON esim_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON esim_orders;
CREATE POLICY "Users can insert their own orders" ON esim_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own orders
DROP POLICY IF EXISTS "Users can update their own orders" ON esim_orders;
CREATE POLICY "Users can update their own orders" ON esim_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own orders
DROP POLICY IF EXISTS "Users can delete their own orders" ON esim_orders;
CREATE POLICY "Users can delete their own orders" ON esim_orders
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_esim_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_esim_orders_updated_at ON esim_orders;
CREATE TRIGGER update_esim_orders_updated_at
  BEFORE UPDATE ON esim_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_esim_orders_updated_at();


