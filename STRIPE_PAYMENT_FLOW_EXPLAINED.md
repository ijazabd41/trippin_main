# Stripe Payment Flow - How It Works

## ✅ Yes, It's Still Stripe!

The payment form you see is **Stripe Elements** - an embedded payment form that keeps users on your site instead of redirecting them to Stripe's website.

## Two Stripe Payment Methods

### 1. **Stripe Checkout** (Redirect Method)
```
User clicks "Pay" 
  → Redirects to stripe.com/checkout
  → User enters card on Stripe's page
  → Redirects back to your site
```
- ❌ User leaves your site
- ✅ Simple to implement
- ✅ Hosted by Stripe

### 2. **Stripe Elements** (Embedded Method) ← **You're Using This!**
```
User clicks "Pay"
  → Stays on your site
  → Card input is embedded (secure iframe from Stripe)
  → Payment processed without leaving
```
- ✅ User stays on your site
- ✅ Better UX (no redirect)
- ✅ Fully customizable
- ✅ Still fully secure (PCI compliant)

## How Stripe Elements Works

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Opens Modal                                     │
│    - StripePaymentForm loads                            │
│    - Stripe.js library initializes                     │
│    - CardElement (secure iframe) renders               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Enters Card Details                             │
│    - Card number, expiry, CVV, name                     │
│    - All entered in Stripe's secure iframe              │
│    - Your server NEVER sees card data                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. User Clicks "Pay ¥6.9"                              │
│    - Form submits                                       │
│    - Calls: stripe.createPaymentMethod()               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Stripe Tokenizes Card                                │
│    - Stripe validates card                              │
│    - Creates secure PaymentMethod token                 │
│    - Returns: paymentMethodId (e.g., "pm_1234...")      │
│    - Card number is NEVER sent to your server          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Frontend Sends Token to Backend                      │
│    POST /api/esim/purchase                              │
│    {                                                    │
│      planId: "...",                                    │
│      customerInfo: {...},                              │
│      paymentMethodId: "pm_1234..."  ← Only token!      │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Backend Creates PaymentIntent                        │
│    - Uses Stripe SECRET key (server-side only)          │
│    - Charges the card using paymentMethodId             │
│    - Stripe processes payment                           │
│    - Returns success/failure                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Backend Creates eSIM Order                           │
│    - If payment succeeded                               │
│    - Creates order with eSIM Go API                    │
│    - Returns QR code and activation details            │
└─────────────────────────────────────────────────────────┘
```

## Security Details

### What Your Server Sees:
```javascript
{
  paymentMethodId: "pm_1ABC123..."  // Token only, not card data
}
```

### What Your Server NEVER Sees:
- ❌ Card number
- ❌ CVV
- ❌ Expiry date
- ❌ Cardholder name (from card)

### What Stripe Sees:
- ✅ Card number (in secure iframe)
- ✅ CVV
- ✅ Expiry date
- ✅ All validation happens on Stripe's servers

## Code Flow

### Frontend (`StripePaymentForm.tsx`)
```typescript
// 1. Load Stripe.js
const stripe = await loadStripe('pk_test_...');

// 2. Render CardElement (secure iframe)
<CardElement />  // ← This is Stripe's secure form

// 3. On submit, create PaymentMethod
const { paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});

// 4. Send token to backend (NOT card data!)
onPaymentSuccess(paymentMethod.id);  // "pm_1234..."
```

### Backend (`esim.js`)
```javascript
// 5. Receive token from frontend
const { paymentMethodId } = req.body;  // "pm_1234..."

// 6. Create PaymentIntent with Stripe SECRET key
const paymentIntent = await stripe.paymentIntents.create({
  amount: 690,  // ¥6.9 in cents
  currency: 'jpy',
  payment_method: paymentMethodId,  // Use token to charge
  confirm: true,
});

// 7. If payment succeeded, create eSIM order
if (paymentIntent.status === 'succeeded') {
  // Create eSIM order...
}
```

## Why This is Better Than Redirect

1. **Better UX**: User never leaves your site
2. **Faster**: No redirect delays
3. **Customizable**: You control the design
4. **Still Secure**: PCI compliant (Stripe handles everything)
5. **Mobile Friendly**: Works great on mobile

## Visual Comparison

### Stripe Checkout (Redirect):
```
Your Site → Stripe.com → Your Site
  [Click]    [Pay]    [Return]
```

### Stripe Elements (Embedded) ← **You're Using This**:
```
Your Site
  [Modal Opens]
  [Card Input (Stripe iframe)]
  [Click Pay]
  [Processing...]
  [Success!]
```

## Key Points

✅ **Yes, it's still Stripe** - Just embedded instead of redirected  
✅ **Fully secure** - Card data never touches your server  
✅ **PCI compliant** - Stripe handles all compliance  
✅ **Better UX** - Users stay on your site  
✅ **Real payments** - Uses your Stripe account  

The form you see is Stripe's secure payment form, just embedded in your modal instead of on a separate page!

