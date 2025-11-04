# AccruPay Authentication Error Troubleshooting

## Current Issue
Getting "Authentication error" when trying to create payment sessions with AccruPay.

## Steps to Fix

### 1. Check Supabase Environment Variables

Run this command to check if your secrets are set:
```bash
supabase secrets list
```

You should see:
- `ACCRUPAY_SECRET_KEY`
- `ENV_TAG` (optional, defaults to "dev" which uses "qa" environment)

### 2. Set the AccruPay Secret Key

If `ACCRUPAY_SECRET_KEY` is missing or incorrect:

```bash
supabase secrets set ACCRUPAY_SECRET_KEY=your_actual_secret_key_here
```

**Important:** Make sure you're using the correct key format:
- AccruPay API secrets typically start with a specific prefix
- Verify the key from your AccruPay dashboard
- Double-check there are no extra spaces or quotes

### 3. Set the Environment Tag (Optional)

If you need to specify production vs QA:

```bash
# For production
supabase secrets set ENV_TAG=prod

# For QA/development (default)
supabase secrets set ENV_TAG=dev
```

### 4. Redeploy the Function

After setting the secrets, redeploy:
```bash
supabase functions deploy payments
```

### 5. Check the Logs

After redeploying, test the checkout flow and check logs:
```bash
supabase functions logs payments
```

Look for these log entries:
- "Initializing AccruPay with environment: ..."
- "API Key length: ..."
- "API Key prefix: ..."
- "Creating payment session for order: ..."

## Common Issues

### Issue: "ACCRUPAY_SECRET_KEY is not set"
**Solution:** The secret wasn't set in Supabase. Run step 2 above.

### Issue: "Authentication error"
**Possible causes:**
1. **Wrong API Key:** Verify you're using the API secret (not a public key)
2. **Wrong Environment:** Your key might be for production but you're using QA environment (or vice versa)
3. **Expired Key:** Check if the key has been rotated in AccruPay dashboard
4. **Wrong AccruPay Account:** Verify you're using the key from the correct AccruPay merchant account

### Issue: "AccruPay is not a constructor"
**Solution:** This has been fixed in the code. Make sure you've deployed the latest version.

## Verify Your AccruPay Credentials

1. Log in to your AccruPay dashboard
2. Go to Settings → API Keys
3. Verify:
   - The API secret is correct
   - The environment (production/qa) matches your `ENV_TAG`
   - The key has the necessary permissions for creating transactions

## Test Connection

You can test if your credentials work by checking the function logs after deployment. The logs will show:
- Environment being used
- API key length (should be > 30 characters typically)
- First 10 characters of your key

## Next Steps

1. Set/verify your `ACCRUPAY_SECRET_KEY` environment variable
2. Redeploy the function
3. Test the checkout flow
4. Check the logs for detailed error information

If you still get authentication errors after verifying the secret key, contact AccruPay support to verify:
- Your API credentials are active
- Your account has permission to create transactions
- The correct environment (production vs QA) for your key


