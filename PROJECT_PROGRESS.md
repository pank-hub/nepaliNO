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

## Content Model and Queries Checkpoint

Completed and build-validated:
- News Article schema
- Community Event schema
- Business Listing schema
- All three schemas registered in sanity/schemaTypes/index.ts
- Nine GROQ queries created in src/lib/sanity/queries.ts
- News archive, featured news, and news detail queries
- Upcoming events, featured events, and event detail queries
- Active businesses, featured businesses, and business detail queries
- @types/node installed for Node.js TypeScript support
- TypeScript check passed with npx tsc --noEmit
- Astro production build passed

## Next Work
 - Create Astro routes for the homepage, news archive, and dynamic news article pages
- Fetch Sanity content using the sanity:client virtual module
- Begin the nepali.no design system

## Multilingual News Routing Checkpoint

Completed and validated:
- Added Nepali and Norwegian Bokmal as supported website languages.
- Added centralized language configuration in src/i18n/config.ts.
- Added Nepali interface labels in src/i18n/ne.ts.
- Added Norwegian Bokmal interface labels in src/i18n/nb.ts.
- Added the getTranslations helper in src/i18n/index.ts.
- Added language and optional linked translation fields to the News Article schema.
- Updated News GROQ projections with language and translated-article metadata.
- Added NEWS_ARTICLES_BY_LANGUAGE_QUERY using the $language parameter.
- Added the shared multilingual News archive route at src/pages/[lang]/news/index.astro.
- The shared route generates /ne/news/ and /nb/news/.
- The root homepage still contains the temporary successful Astro-to-Sanity connection test.
- Installed @astrojs/check and TypeScript as development dependencies.
- Astro validation passed with 0 errors and 0 warnings.
- The production build passed and generated 3 pages: /, /ne/news/, and /nb/news/.

## Revised Product Direction

nepali.no is a Nepali-first, but not Nepali-only, nonprofit and public-benefit platform for the Nepali community in Norway.

Important audiences include:
- Nepali-speaking residents in Norway
- Young Nepali Norwegians who may prefer Norwegian
- Students, families, volunteers, and community organizations
- Norwegian public agencies, NGOs, partners, and potential funders

A major platform pillar will be reliable, understandable guidance based on official information from agencies such as UDI, Skatteetaten, NAV, Helsenorge, municipalities, and other public bodies. nepali.no must explain and contextualize information while linking users to the current official source. The platform must not present itself as a government agency or replace official legal, tax, immigration, health, or welfare guidance.

## Important Development Practice

For Astro, HTML, and other substantial code, provide downloadable .txt files instead of rendered chat code blocks. The chat renderer has previously removed opening HTML tags and corrupted Astro markup.

## Next Work

- Review, stage, commit, and push the multilingual News routing milestone.
- Design a Public Information Guide content model with official-source and review-date controls.
- Decide how language and optional translations should apply to Public Information Guides, Community Events, and Business Listings.
- Continue one verified step at a time.

## Public Information Guide Foundation Checkpoint

Completed and validated:
- Added sanity/schemaTypes/publicInformationGuide.ts.
- Registered Public Information Guide in sanity/schemaTypes/index.ts.
- Added Nepali and Norwegian Bokmal language support with an optional linked translation.
- Added topic and intended-audience fields.
- Added rich guide content with accessible images.
- Added responsible public agency and required primary official HTTPS source.
- Added additional official links and explanations of important Norwegian terms.
- Added editorial reviewer, publication date, last-reviewed date, and next-review date.
- Added draft, active, needs-review, and archived workflow statuses.
- Added featured, urgent, and optional funding or partner acknowledgement fields.
- Added five GROQ queries for active, featured, urgent, individual, and overdue-review guides.
- Validated active-guide and overdue-review GROQ expressions directly against the Sanity production dataset.
- Sanity Studio build passed for all four registered document types.
- Astro check passed with 0 errors and 0 warnings.
- Astro production build passed and generated /, /ne/news/, and /nb/news/.

## Next Work

- Create multilingual interface labels and routes for the public-information section.
- Decide the public URL terminology for Nepali and Norwegian routes.
- Create the guide archive and individual guide pages using downloadable .txt files for substantial Astro or HTML code.
- Keep official-source links, review dates, and the non-government disclaimer visible on guide pages.

## Multilingual Public Information Archive Checkpoint

Completed and validated:
- Added Public Information interface labels to src/i18n/ne.ts.
- Added matching Norwegian Bokmal labels to src/i18n/nb.ts.
- Added visible non-government disclaimers in both languages.
- Added labels for official sources, responsible agencies, important Norwegian terms, intended audiences, review dates, urgent information, featured information, and funding acknowledgements.
- Added the shared multilingual archive route at src/pages/[lang]/info/index.astro.
- The shared route generates /ne/info/ and /nb/info/.
- The archive fetches active guides using ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY and the route language.
- The archive displays responsible agencies, official-source links, last-reviewed dates, next-review dates, urgent and featured labels, and localized empty states.
- Astro check passed with 0 errors and 0 warnings.
- Astro production build passed and generated five pages: /, /ne/news/, /nb/news/, /ne/info/, and /nb/info/.

## Next Work

- Create the dynamic multilingual guide route at src/pages/[lang]/info/[slug].astro.
- Use PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY.
- Display the full guide, optional translation link, official sources, important Norwegian terms, review metadata, funding acknowledgement, and visible non-government disclaimer.
- Deliver substantial Astro and HTML code as a downloadable .txt file.

## Dynamic Public Information Guide and Provenance Checkpoint

Completed and validated:
- Installed astro-portabletext for rendering Sanity Portable Text in Astro.
- Installed @sanity/image-url for optimized Sanity CDN image URLs.
- Added src/lib/sanity/image.ts.
- Added src/components/SanityPortableImage.astro.
- Added the dynamic multilingual guide route at src/pages/[lang]/info/[slug].astro.
- The dynamic route generates static pages for active Nepali and Norwegian guides.
- Added full guide rendering with Portable Text and accessible embedded images.
- Added optional translation links.
- Added responsible agency, primary and additional official sources, important Norwegian terms, intended audience, review metadata, editorial reviewer, funding acknowledgement, and the non-government disclaimer.
- Added PROJECT_PROVENANCE.md to document the custom development history, project ownership, open-source foundations, AI-assisted development, public-information safeguards, and funding transparency.
- Astro check passed with 0 errors and 0 warnings.
- Astro production build passed. No individual guide pages were generated because no active Public Information Guide documents have been published yet.

## Provenance Maintenance Note

PROJECT_PROVENANCE.md is a living document. Before donor presentations or production launch, replace future-oriented wording such as planned hosting or planned deployment with verified production facts, URLs, launch dates, partners, funding information, and governance details.

## Next Work

- Review, stage, commit, and push the dynamic guide and provenance milestone.
- Publish a controlled test Public Information Guide in Sanity when Studio access is available.
- Verify that the test guide generates an individual multilingual route.
- Continue the visual design system and reusable layouts after content routing is verified.
