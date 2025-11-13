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

This project is optimised for Vercel and uses Cloudinary as its media source. To deploy:

1. Sign in to [Vercel](https://vercel.com) and create a new project by importing this repository.
2. Add the required environment variables in **Project Settings → Environment Variables**:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - (optional) `CLOUDINARY_FOLDER` to limit the gallery to a specific Cloudinary folder.
3. Trigger a deployment. Vercel will automatically run `npm install` and `npm run build`.

The `/api/media` route is cached on Vercel’s Edge Network for 5 minutes to minimise Cloudinary API calls. Use the Vercel CLI for faster iteration:

```bash
npm install -g vercel
vercel login
vercel link        # run inside the project directory
vercel env pull    # bring env vars to your local .env file
vercel dev         # optional: run locally with Vercel's runtime
vercel             # deploy to production
```

Refer to the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
