# AccruPay Integration Fix Summary

## Issue
Getting error: `accruPay.createPaymentSession is not a function` when trying to load a checkout session.

## Root Causes

### 1. Incorrect Import
**Before:**
```typescript
import { AccruPay } from "npm:@accrupay/node@0.14.0";
```

**After:**
```typescript
import AccruPay, { COUNTRY_ISO_2, CURRENCY, TRANSACTION_PROVIDER } from "npm:@accrupay/node@0.14.0";
```

### 2. Incorrect Initialization
**Before:**
```typescript
const accruPay = new AccruPay({
  apiKey: ACCRUPAY_SECRET_KEY,
  provider: "nuvei",
});
```

**After:**
```typescript
const environment = ENV_TAG === "prod" ? "production" : "qa";
const accruPay = new AccruPay({
  apiSecret: ACCRUPAY_SECRET_KEY,
  environment,
});
```

### 3. Incorrect Method Call
**Before:**
```typescript
const session = await accruPay.createPaymentSession({
  amount: parseFloat(order.total) * 100,
  currency: "USD",
  orderId: order.id,
  customerEmail: order.customer_email,
  // ...
});
```

**After:**
```typescript
const transaction = await accruPay.transactions.startClientPaymentSession({
  transactionProvider: TRANSACTION_PROVIDER.NUVEI,
  data: {
    amount: BigInt(amountInCents),
    currency: CURRENCY.USD,
    billing: {
      billingFirstName: order.customer_first_name || "Guest",
      billingLastName: order.customer_last_name || "User",
      billingEmail: order.customer_email,
      // ... full billing address
    },
    storePaymentMethod: false,
    merchantInternalCustomerCode: order.customer_email,
    merchantInternalTransactionCode: order.id,
  },
});
```

### 4. Payment Verification Method
**Before:**
```typescript
const paymentStatus = await accruPay.verifyPayment({
  sessionToken: order.payment_session_id,
  paymentData: paymentData,
});
```

**After:**
```typescript
const verifiedTransaction = await accruPay.transactions.verifyClientPaymentSession({
  id: order.payment_intent_id,
});
```

## Database Changes

Added new migration: `20251102_add_billing_fields_to_orders.sql`

This adds the following fields to the orders table:
- customer_first_name
- customer_last_name
- customer_phone
- billing_address
- billing_address_2
- billing_city
- billing_state
- billing_zip
- payment_session_id
- payment_provider

## Environment Variables

Make sure to set:
- `ACCRUPAY_SECRET_KEY` - Your AccruPay API secret key
- `ENV_TAG` - Set to "prod" for production, anything else defaults to "qa"

## Testing

To test the checkout flow:
1. Create an order through the event form
2. Navigate to the checkout page
3. The payment session should now initialize successfully
4. Complete a test payment
5. Verify the transaction is confirmed

## Future Improvements

Consider capturing billing information in the EventForm before creating the order, rather than using fallback values in the edge function.

