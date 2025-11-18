# eSIM Orders Table Setup

## Problem
If you're seeing this error:
```
Could not find the table 'public.esim_orders' in the schema cache
code: 'PGRST205'
```

It means the `esim_orders` table doesn't exist in your Supabase database.

## Solution

### Option 1: Run SQL Migration (Recommended)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `backend/database/create-esim-orders.sql`
4. Click **Run** to execute the SQL

This will:
- Create the `esim_orders` table
- Create necessary indexes
- Set up Row Level Security (RLS) policies
- Create triggers for automatic timestamp updates

### Option 2: Run Full Database Setup

If you haven't set up your database schema yet:

1. Run the full database setup:
   ```bash
   cd backend
   npm run setup
   ```

   This will create all tables including `esim_orders`.

### Option 3: Manual Setup via Supabase Dashboard

1. Go to Supabase Dashboard → **Table Editor**
2. Click **New Table**
3. Name it `esim_orders`
4. Add the following columns:

| Column Name | Type | Default | Nullable |
|------------|------|---------|----------|
| id | uuid | uuid_generate_v4() | No (Primary Key) |
| user_id | uuid | - | No (Foreign Key → users.id) |
| plan_id | varchar(255) | - | No |
| esim_provider_order_id | varchar(255) | - | Yes (Unique) |
| stripe_payment_intent_id | varchar(255) | - | Yes |
| status | esim_order_status | 'pending' | No |
| customer_info | jsonb | - | Yes |
| plan_details | jsonb | - | Yes |
| qr_code | text | - | Yes |
| activation_code | varchar(255) | - | Yes |
| purchase_date | timestamptz | NOW() | Yes |
| expiry_date | timestamptz | - | Yes |
| activated_at | timestamptz | - | Yes |
| cancelled_at | timestamptz | - | Yes |
| usage_data | jsonb | - | Yes |
| created_at | timestamptz | NOW() | Yes |
| updated_at | timestamptz | NOW() | Yes |

5. **Create the enum type first:**
   ```sql
   CREATE TYPE esim_order_status AS ENUM ('pending', 'processing', 'active', 'expired', 'cancelled');
   ```

6. **Enable Row Level Security:**
   - Go to Table Editor → `esim_orders` → **Policies**
   - Click **Enable RLS**

7. **Create RLS Policies:**
   - Policy 1: "Users can view their own orders"
     - Type: SELECT
     - Expression: `auth.uid() = user_id`
   
   - Policy 2: "Users can insert their own orders"
     - Type: INSERT
     - Expression: `auth.uid() = user_id`
   
   - Policy 3: "Users can update their own orders"
     - Type: UPDATE
     - Expression: `auth.uid() = user_id`

## Verification

After creating the table, verify it exists:

1. Go to Supabase Dashboard → **Table Editor**
2. You should see `esim_orders` in the list
3. Or run this query in SQL Editor:
   ```sql
   SELECT * FROM esim_orders LIMIT 1;
   ```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the SQL in the `public` schema
- Check that the table name is exactly `esim_orders` (case-sensitive)

### Error: "permission denied"
- Check that RLS policies are set up correctly
- Ensure the user is authenticated (auth.uid() returns a value)

### Error: "type esim_order_status does not exist"
- Create the enum type first before creating the table (see SQL script)

## Next Steps

After creating the table:
1. The error should no longer appear
2. Your app will be able to store and retrieve eSIM orders
3. Users will be able to view their own orders based on RLS policies


