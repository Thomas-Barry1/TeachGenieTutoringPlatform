# Stripe Payouts for Tutors – TeachGenie Platform

This document explains how to set up and manage payouts to tutors using Stripe Connect on the TeachGenie platform.

---

## Overview

TeachGenie uses [Stripe Connect](https://stripe.com/connect) to securely process payments and pay out tutors. This allows the platform to collect payments from students and transfer the appropriate share to tutors after sessions are completed.

---

## Step 1: Onboard Tutors to Stripe Connect

1. **Create a Stripe Connect Account for Each Tutor**
   - Use the Stripe API to create an Express or Standard account for each tutor.
   - Store the returned `account.id` (the tutor's Stripe Connect account ID) in your database.

   **Example (Node.js/TypeScript):**
   ```ts
   const account = await stripe.accounts.create({
     type: 'express', // or 'standard'
     email: tutorEmail,
   });
   // Save account.id to your DB
   ```

2. **Send the Tutor to Stripe's Onboarding Link**
   - Generate an onboarding link and redirect the tutor to complete their Stripe setup.
   ```ts
   const accountLink = await stripe.accountLinks.create({
     account: account.id,
     refresh_url: 'https://yourplatform.com/onboarding/refresh',
     return_url: 'https://yourplatform.com/onboarding/complete',
     type: 'account_onboarding',
   });
   // Redirect tutor to accountLink.url
   ```

---

## Step 2: Receive Payment from Student

- When a student books and pays for a session, the payment is processed through Stripe and the funds are deposited into your platform's Stripe account.
- Store the `payment_intent_id` and related payment details in your database for reconciliation.

---

## Step 3: Payout to Tutor (Create a Transfer)

1. **After the session is completed and payment is received:**
   - Calculate the tutor's payout amount (total minus platform fee).
   - Use the Stripe API to create a transfer to the tutor's connected account.

   **Example:**
   ```ts
   await stripe.transfers.create({
     amount: Math.round(tutorPayout * 100), // in cents
     currency: 'usd',
     destination: tutorStripeAccountId, // from your DB
     transfer_group: sessionId, // optional, for tracking
   });
   ```

2. **Store the resulting `transfer.id`** in your `stripe_transfer_id` column for tracking and reconciliation.

---

## Step 4: Stripe Handles Bank Payout

- Stripe will automatically send the funds from the tutor's Stripe balance to their bank account on their payout schedule (daily, weekly, etc.).
- Tutors can manage their payout schedule and bank details via their Stripe dashboard.

---

## Best Practices & Notes

- **Security:** Never expose your Stripe secret or service role keys to the client.
- **Compliance:** Make sure to collect all required information from tutors (tax info, identity verification) as required by Stripe.
- **Error Handling:** Monitor for failed transfers or onboarding issues and notify tutors/admins as needed.
- **Testing:** Use Stripe's test mode and test accounts to simulate the full flow before going live.
- **Documentation:** See [Stripe Connect Docs](https://stripe.com/docs/connect) for more details and advanced features.

---

## References
- [Stripe Connect Overview](https://stripe.com/connect)
- [Onboarding Standard/Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Creating Transfers](https://stripe.com/docs/connect/payouts)
- [Best Practices for Marketplaces](https://stripe.com/docs/connect/marketplaces)

---

*This document is intended for TeachGenie platform developers and administrators.* 