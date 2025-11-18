-- Add DELETE policy for esim_orders table
-- Run this in your Supabase SQL Editor if DELETE operations are failing

-- Policy: Users can delete their own orders
DROP POLICY IF EXISTS "Users can delete their own orders" ON esim_orders;
CREATE POLICY "Users can delete their own orders" ON esim_orders
  FOR DELETE USING (auth.uid() = user_id);

