# eSIM Go API v2.4 Integration - Documentation

## ✅ Updated Purchase Flow According to Official API Documentation

### Payment and Purchase Flow

1. **Stripe Payment Processing** (Your Platform)
   - User pays via Stripe using `StripePaymentForm`
   - Payment is processed and confirmed before eSIM order
   - PaymentIntent ID is stored for reference

2. **eSIM Go Account Balance** (Important!)
   - eSIM Go API requires **prepaid account balance**
   - Orders are deducted from your eSIM Go account balance
   - Ensure account has sufficient funds before creating orders
   - In production: Top up account balance after Stripe payment OR pre-fund account

3. **Create eSIM Order** (eSIM Go API)
   - POST `/v2.4/orders` with correct payload structure
   - Order is deducted from eSIM Go account balance
   - Returns order reference for tracking

4. **Get eSIM Assignment** (eSIM Go API)
   - GET `/v2.4/esims/assignments/{orderReference}`
   - Retrieves QR code, ICCID, activation code, SMDP address
   - Returns assignment details for user installation

### Correct API Payload Structure

According to eSIM Go API v2.4 documentation:

```json
{
  "type": "transaction",
  "order": [
    {
      "item": "bundle_name_from_catalogue",
      "quantity": 1
    }
  ],
  "assign": true
}
```

**Key Fields:**
- `type`: `"transaction"` for actual purchases (or `"validate"` for testing)
- `order`: Array of order items with `item` (bundle name) and `quantity`
- `assign`: `true` to automatically assign bundle to eSIM (recommended)

### API Endpoints Used

1. **GET `/v2.4/catalogue`** - Get available bundles/plans
2. **POST `/v2.4/orders`** - Create order (with `type: "transaction"`)
3. **GET `/v2.4/esims/assignments/{orderReference}`** - Get eSIM assignment details

### Authentication

- **Header:** `X-API-Key: your_api_key`
- **Base URL:** `https://api.esim-go.com/v2.4`

### Response Handling

**Order Response:**
```json
{
  "reference": "order_ref_123",
  "status": "completed",
  ...
}
```

**Assignment Response:**
- May return JSON with fields:
  - `RSP URL` or `rspUrl` - QR code URL
  - `ICCID` or `iccid` - eSIM identifier
  - `Matching ID` or `matchingId` - Activation code
  - `SMDP Address` or `smdpAddress` - Server address
  
- Or may return ZIP file with PNG QR code

**QR Code Format:**
If SMDP address and matching ID are available, construct QR code as:
```
LPA:1$smdpAddress$matchingId
```

### Error Handling

**Common Errors:**
- `"Failed to process Order. No payment taken."` - Account balance insufficient
- `"Invalid Order type"` - Incorrect payload structure
- `"Order must contain Order Items"` - Missing order array

### Implementation Notes

1. **Payment Flow:**
   - Stripe processes user payment first
   - Then eSIM order is created using eSIM Go account balance
   - Ensure account balance is maintained

2. **Order Creation:**
   - Use `type: "transaction"` for purchases
   - Include `assign: true` for automatic assignment
   - Store order reference for tracking

3. **Assignment Retrieval:**
   - Fetch assignment details after order creation
   - Handle both JSON and ZIP file responses
   - Construct QR code if needed

4. **Currency:**
   - Stripe payment uses plan currency (defaults to USD)
   - eSIM Go account balance must match currency

### Testing

Use `type: "validate"` to test orders without charging account:
```json
{
  "type": "validate",
  "order": [
    {
      "item": "bundle_name",
      "quantity": 1
    }
  ]
}
```

## 📚 References

- [eSIM Go API Documentation](https://docs.esim-go.com/)
- [eSIM Go Ordering Guide](https://docs.esim-go.com/guides/ordering/)
- [eSIM Go Account Setup](https://docs.esim-go.com/guides/setup_esimgo_account/)

