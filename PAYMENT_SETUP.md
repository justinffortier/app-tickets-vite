# Payment Processing Setup Guide

This guide explains how to configure Accrupay payment processing for the Workglue Ticketing System.

## Overview

The application uses Accrupay with the Nuvei payment provider to process ticket purchases. Payments are handled through a secure checkout flow that redirects customers after order creation.

## Required Environment Variables

### Frontend Variables (`.env` file)

```bash
# Accrupay Public Key (visible to the browser)
VITE_ACCRUPAY_PUBLIC_KEY=your_accrupay_public_key
```

### Backend Variables (Supabase Secrets)

Set these using the Supabase CLI:

```bash
# Accrupay Secret Key (server-side only)
supabase secrets set ACCRUPAY_SECRET_KEY=your_accrupay_secret_key

# Webhook Secret (optional, for verifying webhook signatures)
supabase secrets set ACCRUPAY_WEBHOOK_SECRET=your_accrupay_webhook_secret
```

## Setup Steps

### 1. Get Accrupay API Credentials

1. Sign up for an Accrupay account at [https://accru.com](https://accru.com)
2. Navigate to the API section in your dashboard
3. Generate or copy your:
   - Public Key (for frontend)
   - Secret Key (for backend)
   - Webhook Secret (optional)

### 2. Configure Frontend

Add your public key to the `.env` file in the project root:

```bash
VITE_ACCRUPAY_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

### 3. Configure Backend

Set the Supabase secrets:

```bash
# Make sure you're logged into Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set the secrets
supabase secrets set ACCRUPAY_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set ACCRUPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Deploy Payment Edge Function

Deploy the payments edge function to Supabase:

```bash
supabase functions deploy payments
```

### 5. Configure Webhooks (Optional)

To receive real-time payment status updates:

1. Go to your Accrupay dashboard
2. Navigate to Webhooks settings
3. Add a new webhook endpoint:
   ```
   https://your-project-ref.supabase.co/functions/v1/payments
   ```
4. Select the following events:
   - `payment.success`
   - `payment.approved`
   - `payment.failed`
   - `payment.declined`
5. Copy the webhook signing secret and set it in Supabase secrets

## Payment Flow

### Customer Journey

1. **Select Tickets**: Customer fills out the event form and selects tickets
2. **Create Order**: Order is created with `PENDING` status
3. **Redirect to Checkout**: Customer is redirected to `/checkout/:orderId`
4. **Initialize Payment**: Frontend calls backend to create an Accrupay payment session
5. **Enter Payment Details**: Customer enters payment information through Accrupay's secure interface
6. **Process Payment**: Payment is processed by Nuvei
7. **Confirm Payment**: Backend verifies payment and updates order status to `PAID`
8. **Update Inventory**: Ticket inventory is automatically decremented
9. **Confirmation**: Customer is redirected to order confirmation page

### Technical Flow

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────┐
│   Browser   │─────▶│   Frontend   │─────▶│   Backend    │─────▶│ Accrupay│
│             │      │              │      │ (Supabase)   │      │ /Nuvei  │
└─────────────┘      └──────────────┘      └──────────────┘      └─────────┘
      │                      │                      │                   │
      │  1. Submit Form      │                      │                   │
      │─────────────────────▶│                      │                   │
      │                      │  2. Create Order     │                   │
      │                      │─────────────────────▶│                   │
      │                      │                      │                   │
      │  3. Redirect to      │                      │                   │
      │     /checkout/:id    │                      │                   │
      │◀─────────────────────│                      │                   │
      │                      │                      │                   │
      │  4. Load Order       │                      │                   │
      │─────────────────────▶│  5. Get Order Data   │                   │
      │                      │─────────────────────▶│                   │
      │                      │                      │                   │
      │                      │  6. Create Session   │                   │
      │─────────────────────▶│─────────────────────▶│  7. Init Payment  │
      │                      │                      │──────────────────▶│
      │                      │                      │◀──────────────────│
      │                      │  8. Session Token    │                   │
      │                      │◀─────────────────────│                   │
      │  9. Render Checkout  │                      │                   │
      │◀─────────────────────│                      │                   │
      │                      │                      │                   │
      │  10. Submit Payment  │                      │                   │
      │──────────────────────────────────────────────────────────────▶│
      │                      │                      │                   │
      │  11. Payment Result  │                      │                   │
      │◀──────────────────────────────────────────────────────────────│
      │                      │                      │                   │
      │  12. Confirm Payment │                      │                   │
      │─────────────────────▶│─────────────────────▶│  13. Verify       │
      │                      │                      │──────────────────▶│
      │                      │                      │◀──────────────────│
      │                      │  14. Update Order    │                   │
      │                      │      to PAID         │                   │
      │                      │◀─────────────────────│                   │
      │  15. Redirect to     │                      │                   │
      │      Confirmation    │                      │                   │
      │◀─────────────────────│                      │                   │
```

## Testing

### Test Mode

Accrupay provides test API keys for development:

```bash
# Test Public Key
VITE_ACCRUPAY_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Test Secret Key
supabase secrets set ACCRUPAY_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Test Cards

Use these test card numbers in Nuvei's test environment:

- **Successful Payment**: 4000 0000 0000 0077
- **Declined Payment**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 0069

Use any future expiration date and any 3-digit CVV.

## Troubleshooting

### Payment Session Creation Fails

- Verify `ACCRUPAY_SECRET_KEY` is set correctly in Supabase secrets
- Check that the order exists and has `PENDING` status
- Review Supabase function logs: `supabase functions logs payments`

### Payment Confirmation Fails

- Ensure the payment session ID matches
- Verify webhook signature if using webhooks
- Check Accrupay dashboard for payment status

### Checkout Page Shows Error

- Confirm `VITE_ACCRUPAY_PUBLIC_KEY` is set in `.env`
- Verify the order ID in the URL is valid
- Check browser console for errors

## Security Considerations

1. **Never expose secret keys**: Keep `ACCRUPAY_SECRET_KEY` in Supabase secrets only
2. **Use HTTPS**: Always use HTTPS in production
3. **Verify webhooks**: Use webhook signatures to verify authenticity
4. **Validate amounts**: Always verify payment amounts match order totals
5. **Handle failures**: Implement proper error handling and user feedback

## API Reference

### Payment Edge Function Actions

#### `createPaymentSession`

Creates a new Accrupay payment session for an order.

**Request:**
```json
{
  "action": "createPaymentSession",
  "orderId": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "sessionToken": "session_xxxxx",
    "clientToken": "client_xxxxx",
    "sessionId": "session_id"
  }
}
```

#### `confirmPayment`

Confirms and verifies a completed payment.

**Request:**
```json
{
  "action": "confirmPayment",
  "orderId": "uuid",
  "paymentData": {
    "transactionId": "txn_xxxxx",
    "status": "approved"
  }
}
```

**Response:**
```json
{
  "data": {
    "status": "success",
    "orderId": "uuid",
    "transactionId": "txn_xxxxx"
  }
}
```

#### `handleWebhook`

Processes Accrupay webhook events.

**Request:**
```json
{
  "action": "handleWebhook",
  "webhookData": {
    "eventType": "payment.success",
    "data": { ... }
  }
}
```

## Support

For Accrupay-specific issues:
- Documentation: https://github.com/accruteam/sdk-accrupay-react
- Support: Contact Accrupay support team

For application issues:
- Create a ticket in your project management system
- Check application logs in Supabase dashboard

