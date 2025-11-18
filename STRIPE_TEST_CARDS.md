# Stripe Test Cards for Development

## ✅ Yes, Test Cards Work with Stripe Elements!

You can use Stripe test cards in the embedded payment form just like you would with Stripe Checkout.

## Test Card Numbers

### Success Cards (All work with any future expiry date)

| Card Number | Description | Use Case |
|------------|-------------|----------|
| `4242 4242 4242 4242` | Visa | Standard successful payment |
| `4000 0566 5566 5556` | Visa (debit) | Debit card payment |
| `5555 5555 5555 4444` | Mastercard | Standard successful payment |
| `5200 8282 8282 8210` | Mastercard (debit) | Debit card payment |
| `3782 822463 10005` | American Express | Amex payment |
| `3714 4963 5398 431` | American Express | Amex payment |
| `6011 1111 1111 1117` | Discover | Discover card payment |

### 3D Secure Authentication Cards

| Card Number | Description | Behavior |
|------------|-------------|----------|
| `4000 0025 0000 3155` | Visa | Requires 3D Secure (SCA) |
| `4000 0027 6000 3184` | Visa | 3D Secure authentication required |
| `4000 0082 6000 3178` | Visa | 3D Secure authentication required |

### Decline Cards (Test Error Scenarios)

| Card Number | Error Type | Description |
|------------|-----------|-------------|
| `4000 0000 0000 0002` | Card declined | Generic decline |
| `4000 0000 0000 9995` | Insufficient funds | Not enough money |
| `4000 0000 0000 0069` | Expired card | Card has expired |
| `4000 0000 0000 0127` | Incorrect CVC | Wrong security code |
| `4000 0000 0000 0119` | Processing error | Card processing error |

## Test Card Details

### For All Success Cards:
- **Expiry Date**: Any future date (e.g., `12/25`, `01/26`)
- **CVC**: Any 3 digits (e.g., `123`, `456`)
- **ZIP/Postal Code**: Any valid format (e.g., `12345`, `90210`)

### Example:
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

## Testing in Your App

### 1. Use Test Mode
- Make sure you're using **test publishable key**: `pk_test_...`
- Make sure backend uses **test secret key**: `sk_test_...`

### 2. Enter Test Card
- Open your payment modal
- Enter any test card number above
- Use any future expiry date
- Use any 3-digit CVC
- Click "Pay"

### 3. Test Different Scenarios

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Result: Payment succeeds, eSIM order created
```

**Declined Payment:**
```
Card: 4000 0000 0000 0002
Result: Shows error "Your card was declined"
```

**3D Secure:**
```
Card: 4000 0025 0000 3155
Result: May show 3D Secure popup (if enabled)
```

## Testing in Different Countries

### US Cards (Default)
- `4242 4242 4242 4242` - Works for US

### International Cards
- `4000 0566 5566 5556` - Works internationally
- `5555 5555 5555 4444` - Works internationally

## Testing Different Amounts

All test cards work with any amount:
- ¥6.9 (small amount)
- ¥1000 (medium amount)
- ¥10000 (large amount)

## Testing Payment Methods

### One-Time Payment
- Use any success card
- Payment processes immediately
- Order is created after payment

### Recurring Payment (if you add it later)
- Use cards ending in `4242` for successful subscriptions
- Use `4000 0000 0000 0002` to test failed recurring payments

## Important Notes

⚠️ **Test Mode Only**: These cards ONLY work with test API keys (`pk_test_...`, `sk_test_...`)

✅ **Real Cards Won't Work in Test Mode**: If you use a real card with test keys, it won't work

✅ **No Real Money**: Test cards never charge real money, even if they look real

✅ **Works with Stripe Elements**: All test cards work perfectly with your embedded form

## How to Verify You're in Test Mode

Check your environment variables:
```env
# Frontend (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  ✅ Test key

# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...  ✅ Test key
```

If you see `pk_live_...` or `sk_live_...`, you're in **live mode** and test cards won't work!

## Quick Test Checklist

- [ ] Using test API keys (`pk_test_...`, `sk_test_...`)
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Enter future expiry: `12/25`
- [ ] Enter any CVC: `123`
- [ ] Click "Pay"
- [ ] Should see success message

## Testing Error Scenarios

### Test Network Errors
- Turn off internet → Submit form
- Should show connection error

### Test Invalid Card
- Enter: `1234 5678 9012 3456`
- Should show invalid card error

### Test Declined Card
- Enter: `4000 0000 0000 0002`
- Should show "Card declined" error

## Need More Test Cards?

Visit: https://stripe.com/docs/testing#cards

All test cards work with your embedded Stripe Elements form! 🎉

