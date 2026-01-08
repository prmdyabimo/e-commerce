# Authentication demo (login & register)

This project was extended with simple Login and Register pages and local mock API endpoints to show how to wire a Next.js App Router app to an authentication API.

Files added
- `app/login/page.tsx` — client login page using `AuthForm`
- `app/register/page.tsx` — client register page using `AuthForm`
- `app/components/AuthForm.tsx` — reusable form component (client)
- `lib/auth.ts` — small fetch helpers for `signIn` and `signUp`
- `app/api/auth/login/route.ts` — mock login API route (POST)
- `app/api/auth/register/route.ts` — mock register API route (POST)

How to run

1. Install deps if needed:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000` and navigate to `/login` or `/register`.

Notes
- The API endpoints are simple mock handlers. They validate basic shape and return a mock token.
- The client stores the returned token in `localStorage` to keep the example minimal.
- For a production app, replace the API handlers with real logic (persist users, hash passwords, use proper auth tokens/cookies, CSRF protection, etc.).
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
