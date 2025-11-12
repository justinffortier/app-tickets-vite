# CI/CD Setup Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment (CI/CD) to Firebase Hosting. The workflow automatically builds and deploys the application when changes are pushed to specific branches.

## Workflow Configuration

### Production Deployment

**File:** `.github/workflows/deploy-production.yml`

**Trigger:** Automatic deployment on push to `main` branch

**Environment:** Production

**Deployment Target:** Firebase Hosting (prod)

## Workflow Steps

### 1. Checkout Code
```yaml
- uses: actions/checkout@v2
```
Checks out the repository code to the GitHub Actions runner.

### 2. Setup Node.js
```yaml
- uses: actions/setup-node@v1
  with:
    node-version: '20.x'
```
Installs Node.js version 20.x on the runner.

### 3. Install Dependencies
```yaml
- name: Install
  run: yarn install
```
Installs all project dependencies using Yarn.

### 4. Build Application
```yaml
      - name: Build
        env:
          VITE_APP_ENV: production
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_ACCRUPAY_PUBLIC_KEY: ${{ secrets.VITE_ACCRUPAY_PUBLIC_KEY }}
          # Add other VITE_ environment variables as needed
        run: yarn build
```
- Sets `NODE_ENV` to production
- Creates a `.env` file with `REACT_APP_ENV=production`
- Installs Firebase CLI tools globally
- Removes any existing `.firebase` cache directory
- Runs the build process with `CI=` flag to prevent treating warnings as errors

### 5. Upload Coverage Reports
```yaml
- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@v3
```
Uploads test coverage reports to Codecov (optional, requires Codecov setup).

### 6. Deploy to Firebase
```yaml
- name: Deploy
  run: |
    firebase deploy --only hosting:prod --token ${{ secrets.FIREBASE_TOKEN }}
```
Deploys the built application to Firebase Hosting's production target using a secure token.

## Required Secrets

The workflow requires the following GitHub repository secrets to be configured:

### Firebase Configuration

**FIREBASE_SERVICE_ACCOUNT**
- Purpose: Authenticates with Firebase for deployment
- How to get: Download service account JSON from Firebase Console → Project Settings → Service Accounts
- Add the entire JSON content as the secret value

**FIREBASE_PROJECT_ID**
- Purpose: Identifies your Firebase project
- Value: Your Firebase project ID (e.g., `my-project-123`)

### Application Environment Variables

All environment variables from your `.env` file should be added as GitHub secrets:

**Required Secrets:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_ACCRUPAY_PUBLIC_KEY` - Accrupay public key
- `VITE_APP_BASE_URL` - Base URL (optional)

**How to Add Secrets:**
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. Click **Add secret**

## Firebase Hosting Targets

The project is configured with multiple Firebase hosting targets in `firebase.json`:

- **prod** - Production environment (deployed from `main` branch)
- **qa** - QA/Staging environment (can be deployed from a `develop` or `qa` branch)

### Adding QA/Staging Deployment (Optional)

To add automatic deployment for QA/staging, create a new workflow file:

**.github/workflows/deploy-qa.yml**

```yaml
name: Deploy QA

on:
  push:
    branches:
      - 'develop'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: '20.x'
      - name: Install
        run: yarn install
      - name: Build
        env:
          VITE_APP_ENV: development
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          # Add other VITE_ environment variables as needed
        run: yarn build
      - name: Deploy
        run: |
          firebase deploy --only hosting:qa --token ${{ secrets.FIREBASE_TOKEN }}
```

## Environment Variables

### Build-time Environment Variables

- **NODE_ENV:** Set to `production` for optimized builds (automatically set by Vite)
- **VITE_APP_ENV:** Application-specific environment identifier
  - `production` for production builds
  - `development` for development/QA builds
- **VITE_SUPABASE_URL:** Supabase project URL
- **VITE_SUPABASE_ANON_KEY:** Supabase anonymous key
- **VITE_FIREBASE_*:** Firebase configuration variables
- **VITE_GOOGLE_MAPS_API_KEY:** Google Maps API key
- **VITE_ACCRUPAY_PUBLIC_KEY:** Accrupay public key for payment processing

### Additional Environment Variables

All environment variables in Vite must be prefixed with `VITE_` to be exposed to the application. Add them to the Build step's `env` section:

```yaml
- name: Build
  env:
    VITE_APP_ENV: production
    VITE_CUSTOM_API_URL: ${{ secrets.VITE_CUSTOM_API_URL }}
    VITE_CUSTOM_KEY: ${{ secrets.VITE_CUSTOM_KEY }}
  run: yarn build
```

Then add the corresponding secrets in GitHub repository settings.

**Important:** Never commit `.env` files containing sensitive data. Use `.env.example` as a template.

## Monitoring Deployments

### Viewing Workflow Runs

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select the workflow (e.g., "Deploy Production")
4. View the list of workflow runs, their status, and logs

### Deployment Status

- ✅ **Success:** Build and deployment completed successfully
- ❌ **Failure:** Build or deployment failed (check logs for details)
- 🟡 **In Progress:** Workflow is currently running

### Troubleshooting Failed Deployments

1. **Check the workflow logs:**
   - Click on the failed workflow run
   - Expand each step to view detailed logs
   - Look for error messages

2. **Common issues:**
   - **Build errors:** Check for TypeScript/ESLint errors in your code
   - **Firebase authentication:** Verify `FIREBASE_TOKEN` secret is correctly set
   - **Environment variables:** Ensure all required secrets are configured
   - **Dependencies:** Check if `package.json` dependencies are compatible

3. **Testing locally:**
   ```bash
   # Run the same build command locally
   export NODE_ENV=production
   export REACT_APP_ENV=production
   CI= yarn build
   ```

## Manual Deployment

To manually deploy (outside of GitHub Actions):

### Production
```bash
# Build with production environment
yarn deploy

# Or manually:
export VITE_APP_ENV=production
yarn build
firebase deploy --only hosting:prod
```

### QA/Staging
```bash
# Set environment variables
export VITE_APP_ENV=development

# Build
yarn build

# Deploy to QA
firebase deploy --only hosting:qa
```

## Best Practices

1. **Never commit secrets or tokens** to the repository
2. **Use environment-specific branches:**
   - `main` for production
   - `develop` or `qa` for staging/QA
3. **Test builds locally** before pushing to production branches
4. **Monitor deployment logs** regularly
5. **Set up branch protection rules** to require PR reviews before merging to `main`
6. **Use pull requests** for code review before merging to protected branches

## Updating the Workflow

To modify the workflow:

1. Edit `.github/workflows/deploy-production.yml`
2. Commit and push changes
3. The updated workflow will be used for subsequent deployments

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

## Support

For issues with:
- **GitHub Actions:** Check the Actions tab in your repository
- **Firebase Deployment:** Check Firebase Console and CLI documentation
- **Build Errors:** Review build logs and project dependencies

