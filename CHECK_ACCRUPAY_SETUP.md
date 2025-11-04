# AccruPay Setup Checklist

## Current Status
✅ ACCRUPAY_SECRET_KEY is set

## Next Steps to Debug

### 1. Redeploy with Enhanced Logging
```bash
supabase functions deploy payments
```

### 2. Test the Checkout
Try creating an order and going to the checkout page.

### 3. Check the Logs in Real-Time
```bash
supabase functions logs payments --follow
```

## What to Look For in the Logs

The enhanced logging will show:

### ✅ **Initialization Logs**
```
Initializing AccruPay with environment: qa (or production)
ENV_TAG value: dev (or prod)
API Key length: [some number, usually 100+]
API Key starts with: [first 15 chars]...
AccruPay client initialized successfully
```

### ✅ **Session Creation Logs**
```
Creating payment session for order: [uuid]
Amount in cents: [number]
Session data: {...}
```

### ❌ **Error Indicators to Watch For**

**If you see:**
- `"AccruPay Authentication Error - onAuthError callback triggered"`
  → Your API key is invalid or for wrong environment

- `"AccruPay GraphQL Errors: ..."`
  → Will show the exact GraphQL error from AccruPay API

- `"AccruPay Network Error: ..."`
  → Connection issue to AccruPay servers

## Common Issues & Solutions

### Issue: Environment Mismatch

**Symptoms:** Auth error, logs show `environment: qa` but you have a production key (or vice versa)

**Fix:**
```bash
# If your key is for production:
supabase secrets set ENV_TAG=prod

# If your key is for QA/development:
supabase secrets set ENV_TAG=dev  # or leave unset

# Then redeploy
supabase functions deploy payments
```

### Issue: Wrong API Key Format

**Symptoms:** Auth error immediately

**Check:**
1. Go to your AccruPay dashboard
2. Navigate to API Settings or API Keys section
3. Verify you're copying the **Merchant API Secret** (not a public key)
4. The key should be a long alphanumeric string (usually 100+ characters)

**Update if needed:**
```bash
supabase secrets set ACCRUPAY_SECRET_KEY=your_correct_key_here
supabase functions deploy payments
```

### Issue: GraphQL Errors

**Symptoms:** Logs show specific GraphQL errors

This means:
- ✅ Authentication is working
- ❌ Something in the request data is wrong

Look at the GraphQL error message to see what field or data is invalid.

## Quick Test Commands

```bash
# 1. Check secrets
supabase secrets list

# 2. Redeploy
supabase functions deploy payments

# 3. Watch logs (do this BEFORE testing)
supabase functions logs payments --follow

# 4. In another terminal/browser: Test checkout flow

# 5. Review logs for the detailed output
```

## Expected Log Flow (Success)

```
Initializing AccruPay with environment: qa
ENV_TAG value: dev
API Key length: 128
API Key starts with: mapi_prod_abc12...
AccruPay client initialized successfully
Creating payment session for order: 625564b9-...
Amount in cents: 2500
Session data: {...}
[Transaction created successfully]
```

## If Still Getting Auth Errors

After checking all the above:

1. **Verify with AccruPay Support**
   - Contact AccruPay to verify your API credentials are active
   - Confirm your merchant account has permission to create transactions
   - Ask which environment (production/qa) your current key is for

2. **Test with AccruPay Dashboard**
   - Most payment providers have a way to test API keys in their dashboard
   - Try making a test API call there to verify the key works

3. **Check for Special Characters**
   - Ensure no hidden spaces/newlines when you set the secret
   - Try setting it again: `supabase secrets set ACCRUPAY_SECRET_KEY=...`


