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

## Hosted Sanity Studio and First Published Guide Checkpoint

Completed and verified:
- Deployed Sanity Studio to https://nepali-no-studio.sanity.studio/.
- Verified that the hosted graphical CMS displays News Article, Community Event, Business Listing, and Public Information Guide.
- Created and published a controlled Nepali Public Information Guide based on official UDI information.
- Published the guide with active workflow status, official-source links, review dates, editorial reviewer, intended audience, and an important Norwegian term.
- Verified that the Sanity document had no unpublished edits after publication.
- Ran the Astro production build successfully.
- Verified that Astro generated the first real dynamic guide route at /ne/info/udi-oppholdstillatelse-offisiell-informasjon/.
- Verified the complete publishing chain from hosted Sanity Studio through Content Lake, GROQ, getStaticPaths(), Portable Text, and static production output.
- Updated PROJECT_PROVENANCE.md with the verified Sanity Studio URL and publishing workflow.

## Next Work

- Review, stage, commit, and push the hosted-CMS and first-published-guide documentation checkpoint.
- Decide whether to create a linked Norwegian translation of the test guide.
- Begin reusable layouts, shared navigation, and the visual design foundation.
- Replace the temporary root homepage connection test when the shared layout is ready.
- Continue updating PROJECT_PROVENANCE.md whenever planned services become verified production facts.

## Vercel Production Deployment Checkpoint

Completed and verified:
- Imported the private GitHub repository pank-hub/nepaliNO into Vercel.
- Created the Vercel project nepali-no using the Astro framework preset.
- Configured PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET for Production and Preview deployments.
- Deployed the Astro website successfully to https://nepali-no.vercel.app.
- Verified that pushes to the main branch are connected to the Vercel production deployment workflow.
- Verified the live Nepali News archive at https://nepali-no.vercel.app/ne/news/.
- Verified the live Nepali Public Information archive at https://nepali-no.vercel.app/ne/info/.
- Verified the published UDI guide at https://nepali-no.vercel.app/ne/info/udi-oppholdstillatelse-offisiell-informasjon/.
- Confirmed that the live routes receive published content from the Sanity production dataset.
- Confirmed that the current pages are intentionally unstyled and ready for the visual design phase.
- The custom domain nepali.no has not yet been connected, and Domeneshop DNS has not been changed.

## Forum Architecture Update

The forum platform is no longer fixed as NodeBB. Current candidates are Discourse, NodeBB, and Flarum. Self-hosted Discourse is the current leading recommendation, pending structured evaluation of moderation, privacy, email delivery, backups, hosting requirements, API integration, and operating responsibility.

The homepage must include a platform-neutral Community Discussions section with a safe fallback until the forum is deployed.

## Next Work

- Begin the frontend visual-discovery and typography phase.
- Compare two or three coherent design directions.
- Define brand personality, colors, Devanagari and Latin typography, spacing, content width, and responsive behavior.
- Build reusable layouts, navigation, language selection, footer, cards, trust elements, and a platform-neutral Community Discussions section.
- Replace the temporary root homepage connection test.
- Review every pushed design checkpoint at https://nepali-no.vercel.app.
- Connect nepali.no only after the first presentable design is deployed and the exact Vercel DNS records have been reviewed.

## Mobile-First Design and Homepage News Foundation

Completed and verified:
- Added the shared visual foundation with self-hosted Inter Variable and Noto Sans Devanagari Variable fonts.
- Added global design tokens, accessibility rules, responsive spacing, cards, buttons, badges, prose styling, and mobile-first typography.
- Added src/layouts/BaseLayout.astro.
- Added src/components/SiteHeader.astro and src/components/SiteFooter.astro.
- Centralized interface, accessibility, footer, homepage, and guide-audience labels in src/i18n/ne.ts and src/i18n/nb.ts.
- Added multilingual homepages at /ne/ and /nb/.
- Styled the Public Information archive and individual guide pages.
- Localized Public Information intended-audience values instead of exposing internal Sanity codes.
- Verified the styled pages on Vercel, with especially strong mobile rendering.
- Adopted mobile-first design as a formal project principle because most visitors are expected to use mobile devices.
- Recorded English as a future language option. Nepali and Norwegian will be completed first, while new architecture should avoid permanent two-language assumptions.
- English should later prioritize interface labels and strategic pages for donors, NGOs, partners, transparency, volunteering, and selected important guides.

## Homepage Editorial News Policy

The homepage should remain selective rather than becoming a full news archive:
- zero or one Important Now notice
- one featured story
- up to three latest stories
- a clear link to all News

Important Now is reserved for genuinely significant and time-sensitive information, such as a major UDI rule change, a critical deadline, an important public-safety notice, or a significant NAV or Skatteetaten change. Routine updates must not use this status.

Completed in the current, not-yet-committed work:
- Extended the News Article schema with isImportantNow and importantUntil.
- Added editor guidance and future-expiry validation for Important Now notices.
- Enhanced the Sanity preview to identify featured and Important Now stories.
- Added language-specific GROQ queries for Important Now, one featured homepage story, and up to three latest stories.
- Added featured-story exclusion support to prevent duplicate display in Latest News.
- Validated all three GROQ expressions directly against the Sanity production dataset. Empty arrays were expected because no News Articles have been published yet.
- Sanity Studio build and TypeScript validation passed.

## Current Working Tree

The following intended files are currently modified but not yet committed:
- sanity/schemaTypes/newsArticle.ts
- src/lib/sanity/queries.ts

## Next Work

- Add localized Important Now and homepage-news interface labels.
- Replace the homepage News area with a clean, mobile-first newspaper layout.
- Preserve an empty state when no News Articles exist and never fabricate news content.
- Run Astro Check and the production build.
- Publish one controlled News Article through Sanity to review the real featured/latest presentation.
- Update this progress document, commit, push, and verify the Vercel deployment.

## Vercel-Hosted Sanity Studio Checkpoint

Completed and verified:

- Created a second Vercel project named `nepali-no-studio` from the existing `pank-hub/nepaliNO` GitHub repository.
- Confirmed that the second Vercel project deploys the separate Sanity Studio application, while the existing `nepali-no` project continues to deploy the public Astro website.
- Resolved the initial isolated-build error involving `astro/tsconfigs/strict` by configuring the Studio project from the repository root.
- Configured the Studio Vercel project with:
  - Framework preset: Other
  - Root directory: `./`
  - Install command: `npm install && npm --prefix sanity install`
  - Build command: `npm --prefix sanity run build`
  - Output directory: `sanity/dist`
- Successfully built and deployed Sanity Studio on Vercel.
- Registered `https://nepali-no-studio.vercel.app` as a custom Studio host in the Sanity project.
- Verified that the Vercel-hosted Studio connects to Sanity project `f9johco4` and the `production` dataset.
- Verified that the updated News Article schema is active in the Vercel-hosted Studio.
- Verified the updated `Feature on Homepage` editorial guidance.
- Verified that the new `Important Now` field is visible.
- Confirmed that `Important Until` is conditionally hidden until `Important Now` is enabled, as designed.
- The earlier Codespaces termination during `Verifying local content...` no longer blocks editorial Studio deployment.
- The original `https://nepali-no-studio.sanity.studio/` deployment remains available as a fallback, but it may contain an older schema until redeployed separately.

## Deployment Architecture

The same GitHub repository now supplies two separate Vercel applications:

- Public Astro website: `https://nepali-no.vercel.app`
- Editorial Sanity Studio: `https://nepali-no-studio.vercel.app`

Both applications connect to the same Sanity Content Lake project and production dataset. Public visitors use the Astro website. Authorized editors use the Sanity Studio.

## Current Editorial Safety Note

Do not publish the controlled test News Article yet. The individual News Article route does not exist:

`src/pages/[lang]/news/[slug].astro`

Publishing a featured article before that route exists would create homepage and archive links that lead to a 404 page.

## Next Work

- Verify Git status and the latest commit before making further changes.
- Build the multilingual individual News Article route with the shared header, footer, mobile-first editorial typography, Sanity images, Portable Text, source attribution, author information, and translation support.
- Run `npx astro check` and `npm run build`.
- Create one truthful Nepali project-announcement News Article as a draft.
- Mark the test article as `Feature on Homepage` and keep `Important Now` off.
- Publish only after the individual article route has been validated.
- Verify the complete News workflow on Vercel: Studio, Content Lake, individual article, homepage featured story, latest-news list, and News archive.
- Update project documentation and create a stable Git checkpoint.
