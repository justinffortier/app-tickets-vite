# FYC Template for React Projects built with Vite

Please see below these notes for a readme that you can use for your project. 

## Current Status

[![Maintainability](https://api.codeclimate.com/v1/badges/7efff12ae6b4d65a3dcf/maintainability)](https://codeclimate.com/repos/65d6b800671d0200dfc32a2f/maintainability)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5c8ee693fec2439abaeddef2e5400a69)](https://app.codacy.com/gh/FYC-Labs/app-template-2024-vite-react/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

# Project Name

Welcome to [Your Project Name]! 🚀

## Overview

[brief description of project purpose]

## Getting Started

1. **Clone the Repository:**
   git clone [repository-url]

2. **Navigate to the Project Directory:**
   cd [project-directory]

3. **Install Dependencies:**
   yarn

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_ACCRUPAY_PUBLIC_KEY=your_accrupay_public_key
   ```

5. **Configure Supabase Secrets:**
   Set the following secrets in Supabase for payment processing:
   ```
   supabase secrets set ACCRUPAY_SECRET_KEY=your_accrupay_secret_key
   supabase secrets set ACCRUPAY_WEBHOOK_SECRET=your_accrupay_webhook_secret
   ```

6. **Deploy Edge Functions:**
   ```
   yarn deploy-functions
   ```

7. **Start the Project:**
   ```
   yarn start
   ```

## Payment Configuration

This project uses Accrupay for payment processing with the Nuvei provider. To enable payments:

1. **Sign up for Accrupay:** Visit [Accrupay](https://accru.com) to create an account
2. **Get API Keys:** Obtain your public and secret keys from the Accrupay dashboard
3. **Configure Environment Variables:** Add the keys to your `.env` file (frontend) and Supabase secrets (backend)
4. **Deploy Payment Edge Function:** The `payments` edge function handles payment sessions and confirmations

### Payment Flow:
1. Customer selects tickets and submits the event form
2. Order is created with `PENDING` status
3. Customer is redirected to checkout page (`/checkout/:orderId`)
4. Payment session is initialized with Accrupay/Nuvei
5. Customer completes payment through Accrupay checkout interface
6. Payment is confirmed and order status is updated to `PAID`
7. Ticket inventory is automatically updated

## Usage

[Describe how to use or run the project. Provide examples if necessary.]

## Contributing

1. **Create a new branch**
2. **Make your Enhancements, Changes or Features**
3. **Submit a pull request**

## Issues

If you encounter any issues or have suggestions, please create a ticket in Clickup or Userback. We appreciate your feedback!

## License

This project is licensed under the [Your License Name] License - see the LICENSE file for details.

Happy coding! 🚀✨