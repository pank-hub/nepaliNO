# nepali.no Project Progress

## Mission
Build a centralized digital community hub for the Nepali diaspora in Norway. Primary language: Nepali.

## Architecture
- Frontend: Astro with hybrid SSR and SSG
- Styling: Tailwind CSS 4
- CMS: Sanity
- Forum: NodeBB on external VPS
- Hosting: Vercel
- DNS: Domeneshop
- Domains: nepali.no and forum.nepali.no

## Completed
- Astro initialized in /workspaces/nepaliNO
- npm package renamed to nepali-no
- Tailwind CSS 4 installed and tested
- Sanity Studio created in sanity/ with TypeScript and npm
- Sanity connected through @sanity/astro
- Type declaration added to src/env.d.ts
- Production build completed successfully

## Sanity
- Project: nepali.no
- Project ID: f9johco4
- Dataset: production
- Studio directory: sanity
- API version: 2026-03-01

Never commit private API tokens or authentication credentials.

## Next Step
Create and register TypeScript schemas for News Article, Community Event, and Business Listing. Then create GROQ queries for Astro.

## Working Rules
- Work one verified step at a time.
- Include exact file paths with code.
- Use official current APIs.
- Build-test after meaningful changes.
- Create Git checkpoints after stable milestones.
- Do not commit .env, tokens, node_modules, or build output.
- Use semantic HTML suitable for Nepali localization.
