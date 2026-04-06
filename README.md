# PSCC Members and Admin Portal

A standalone Next.js app for Puget Sound Cricket Club operations.

## What it covers

- Member portal with Google sign-in
- Practice check-in with location validation
- Dues, balances, and online payments
- Member media submissions for the social team
- Admin portal for members, games, fees, grounds, practices, equipment, communications, reimbursements, and social review
- Team assignment support for T40 and T20 squads

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- Stripe Checkout
- Tailwind CSS

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in your database, Google OAuth, Stripe, and admin allowlist values.
3. Install dependencies:

```powershell
npm.cmd install
```

4. Generate Prisma client and apply the schema:

```powershell
npx.cmd prisma generate
npx.cmd prisma db push
```

5. Seed the database:

```powershell
npm.cmd run prisma:seed
```

6. Start the app:

```powershell
npm.cmd run dev
```

## Main routes

- `/` landing page
- `/account/sign-in` member sign-in
- `/account` member portal
- `/admin/login` admin sign-in
- `/admin/dashboard` admin dashboard

## Production notes

- Do not commit a real `.env` file.
- Rotate any Google and Stripe secrets that were ever shared outside your private environment.
- For production hosting, use a managed PostgreSQL database and durable object storage for uploads.
