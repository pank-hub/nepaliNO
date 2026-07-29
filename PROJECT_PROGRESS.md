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

## Complete Bilingual News Publishing and Archive Milestone

Completed and verified:

- Built the multilingual individual News Article route:
  - `src/pages/[lang]/news/[slug].astro`
- Updated `NEWS_ARTICLE_BY_SLUG_QUERY` to filter by both slug and language.
- Added the shared `BaseLayout`, responsive header, responsive footer, editorial typography, Sanity image rendering, Portable Text body rendering, author and publication metadata, source attribution, localized region and category labels, and translation links to individual News Article pages.
- Published the first controlled Nepali News Article:
  - Title: `nepali.no को नयाँ डिजिटल प्लेटफर्म परीक्षण चरणमा`
  - Slug: `nepali-no-digital-platform-testing`
  - Featured on the Nepali homepage
  - Important Now disabled
- Published a separate Norwegian Bokmal translation and linked the two documents reciprocally through the Sanity `Translated Version` field.
- Verified that the Nepali and Norwegian versions have independent titles, summaries, bodies, slugs, publication metadata, image text, and featured settings.
- Verified direct language switching between the linked Nepali and Norwegian News Articles.
- Verified that each language can have its corresponding article featured on its own homepage without competing across languages.
- Published image replacements through Sanity and confirmed that a fresh public Vercel deployment updates both the homepage and individual News Article.
- Localized Sanity News region and category values in the frontend, including:
  - `culture-community` to `संस्कृति र समुदाय`
  - `culture-community` to `Kultur og fellesskap`
- Moved the homepage News section directly below the homepage introduction.
- Refined the homepage featured-story layout:
  - image and story text side by side on desktop
  - headline and summary before the image on mobile
  - up to three latest stories below the lead story
- Replaced the original unstyled News archive with a complete mobile-first editorial archive for:
  - `/ne/news/`
  - `/nb/news/`
- Added a multilingual News archive hero, lead-story treatment, featured image, summary, author, publication date, localized metadata, article count, responsive additional-story rows, shared header and footer, and a polished empty state.
- Verified the complete bilingual publishing path:
  - Vercel-hosted Sanity Studio
  - Sanity Content Lake
  - public Astro production build
  - language-specific homepages
  - language-specific News archives
  - individual News Article routes
  - reciprocal translation switching
- Confirmed that the public production build generates 10 pages while both News translations are published.
- Confirmed that Sanity publishing currently requires a manual redeployment of the public `nepali-no` Vercel project before static pages reflect new or changed content.

## Current Vercel Applications

- Public Astro website: `https://nepali-no.vercel.app`
- Editorial Sanity Studio: `https://nepali-no-studio.vercel.app`

The public Astro website and editorial Studio are separate Vercel projects built from the same GitHub repository. Both connect to Sanity project `f9johco4` and the `production` dataset.

## Current Git Checkpoint

Latest pushed commit at this milestone:

`41c300e news-archive`

Important preceding checkpoints:

- `c44141c news-` - moved and refined homepage News placement
- `9b04bbf category-labels` - localized News category and region labels
- `01dec21 news-route` - added the individual multilingual News Article route
- `a190185 studio-docs` - documented the successful Vercel-hosted Sanity Studio

The working tree should be verified before further changes.

## Editorial Rules Confirmed

Homepage News selection:

- zero or one active Important Now notice
- one featured story per language
- up to three latest stories per language
- a link to the full News archive

Important Now must remain reserved for genuinely significant, time-sensitive information. Routine announcements and ordinary featured stories must not use Important Now.

Sanity technically permits several articles to be marked `Feature on Homepage`, but the editorial practice should normally be one current featured article per language. When a new featured article is selected, the previous featured article should be switched off.

## Known Content and Workflow Notes

- The first Nepali and Norwegian News Articles are controlled test or launch-announcement content and may be rewritten, unpublished, or removed before the final public launch.
- The articles remain valuable for validating the bilingual publishing architecture.
- Nepali interface proofreading is planned with a fluent reviewer. Literal translations should be replaced with natural daily-use Nepali where appropriate.
- Most interface labels are centralized in `src/i18n/ne.ts` and `src/i18n/nb.ts`, but some newer News labels and metadata mappings remain inside Astro templates and should later be centralized.
- Interface text changes require a Git commit, push, and Vercel deployment. Multiple proofreading corrections should be grouped into one reviewed batch rather than pushed one phrase at a time.
- Sanity editorial content changes do not require a Git commit, but the statically generated public website currently requires a fresh public Vercel deployment.
- A future Sanity webhook should trigger the public Vercel build automatically after publishing or updating content.

## Next Planned Refinement

The live News archive is working, but desktop review identified two layout improvements:

1. Reduce the desktop News archive hero height by approximately 35 to 40 percent so the lead story appears sooner.
2. Add a compact `Useful information / Nyttig informasjon / उपयोगी जानकारी` section between the News content and footer.

The Information section should not be random. Use a predictable language-specific selection:

- featured Public Information guides first
- recently reviewed guides next
- maximum three guides
- hide the section when no guides exist

Recommended News archive order:

1. Compact News hero
2. Featured News story
3. Additional News stories when available
4. Useful Public Information guides
5. Footer

The Information links should use compact editorial rows rather than oversized cards and should provide a bridge from current News to durable Public Information guidance.
## Automated Publishing and Knowledge-Centre Strategy

### Automated Sanity-to-Vercel Publishing

Completed and verified:

- Created a Deploy Hook in the public Vercel project `nepali-no`, targeting the `main` branch.
- Created an outgoing Sanity document webhook for dataset `production`.
- Configured the webhook to trigger on published create, update, and delete events for:
  - `newsArticle`
  - `publicInformationGuide`
  - `communityEvent`
  - `businessListing`
- Kept draft and version events disabled so ordinary editor autosaves do not trigger public deployments.
- Used a minimal webhook payload because Vercel only needs the private Deploy Hook request to start a new build.
- Verified the complete automatic workflow with a harmless Norwegian News Article caption correction:
  - content edited and published in Sanity Studio
  - Sanity webhook called the private Vercel Deploy Hook
  - the public `nepali-no` Vercel project started a new production deployment automatically
  - Astro fetched current Sanity content
  - 10 static pages were generated
  - deployment completed successfully
  - the corrected Norwegian caption appeared on the public article
- Manual redeployment of the public Vercel project is no longer required for ordinary published changes to the four configured editorial content types.
- The Vercel Deploy Hook URL is secret operational information and must never be committed, shared in chat, included in screenshots, or stored in public documentation. If exposed, revoke it and create a replacement.

### News Archive Refinement

Completed and verified:

- Reduced the desktop News archive hero height so the lead story appears earlier.
- Added `NEWS_ARCHIVE_USEFUL_GUIDES_QUERY`.
- Added a compact language-specific Useful Information area below the News content.
- The Useful Information query returns a maximum of three active Public Information guides using predictable editorial ordering:
  1. featured guides first
  2. most recently reviewed guides next
  3. publication date as the final fallback
- The section is hidden when no appropriate guide exists.
- The section uses compact editorial rows with responsible agency, guide title, summary, review date, and reading link.
- Mobile presentation stacks the guide information and removes lower-priority review metadata from the compact view.
- Astro Check and the production build passed.
- Latest pushed code checkpoint before this documentation update:
  - `ee7075e useful-guides`

## Public Information as a Large-Scale Knowledge Centre

The Public Information collection is expected to grow far beyond the initial approximately 100 identified topics. The content will revolve around a stable set of broad subject areas and should not be presented as a flat list of unrelated guide pages.

The overall platform architecture remains valid. Do not rebuild or replace Astro, Sanity, Vercel, the multilingual document model, translation references, review controls, or existing routes. Evolve the Public Information experience into a structured knowledge centre.

### Recommended Main Categories

1. Arrival, residence and immigration
2. Moving from the EU/EEA
3. Banking, digital identity and communication
4. Housing and accommodation
5. Employment and workplace rights
6. Family, children and education
7. Healthcare and insurance
8. Taxes, benefits and business
9. Language, society and integration
10. Legal help, emergencies and essential services
11. Other useful information

The fallback category should be presented naturally as:

- Nepali: `अन्य उपयोगी जानकारी`
- Norwegian: `Annen nyttig informasjon`

The fallback category is a safety mechanism, not a dumping ground. If several related guides accumulate there, that is evidence that a new proper category or subtopic may be needed.

### Categories, Tags and Reader Journeys

- Each guide should have one broad and stable primary category.
- Flexible tags or keywords should represent specific subjects such as BankID, deposit account, holiday pay, fastlege, tax card, or family immigration.
- Reader-stage and audience filters should support journeys such as:
  - before arriving
  - newly arrived
  - student
  - worker
  - family
  - business owner
  - long-term resident
  - EU/EEA citizen
  - everyone
- Avoid creating a separate main category for every narrow subject.
- Avoid automatically turning every numbered question into a separate thin page.
- Group closely related questions into comprehensive guides when that better matches the reader's task and reduces duplicated maintenance.

### Recommended Information Hierarchy

Level 1: Public Information homepage

- `/ne/info/`
- `/nb/info/`
- Shows stable topic hubs, important starting points, search entry, and audience journeys.

Level 2: Topic hubs

Examples:

- immigration and first steps
- banking and digital identity
- housing
- employment rights
- family and education
- healthcare

A topic hub should contain an introduction, start-here guides, essential guides, recently reviewed material, responsible authorities, related News, and all guides in that topic.

Level 3: Individual guides

Each guide should support a concise answer, intended audience, structured explanation or steps, important Norwegian terms, responsible authority, official links, review dates, related guides, related News, and a translation link.

### Future Schema and Editorial Improvements

Plan, inspect, and implement carefully rather than changing everything at once:

- stable primary topic or topic-hub reference
- flexible tags and search synonyms
- guide format, such as quick answer, step-by-step guide, comprehensive guide, checklist, explainer, or emergency information
- reader journey or stage
- intentionally related guides
- optional collections such as First weeks in Norway
- editorial priority such as Essential, Recommended, or Specialist
- maintenance sensitivity such as High, Medium, or Low
- related current News and updates
- scalable search that recognises Norwegian official terms and natural Nepali search phrases

## Planned Major Phase: Language Learning

After the core information platform has matured, the next major development phase is planned as language learning.

### Programme A: Norwegian for Native Nepali Speakers

Potential areas include:

- pronunciation explained through Nepali
- everyday Norwegian vocabulary and expressions
- grammar explained with Nepali comparisons
- workplace Norwegian
- Norwegian for healthcare appointments
- Norwegian for parents communicating with schools
- Norwegian for NAV, UDI, Skatteetaten and other public services
- examination preparation
- listening exercises and interactive practice

### Programme B: Nepali for Children with Nepali Background

Potential areas include:

- Devanagari letters and sounds
- reading and writing
- family and everyday vocabulary
- age-specific bilingual lessons
- stories and cultural knowledge
- speaking with relatives across generations
- games, quizzes and interactive exercises
- learning paths for children who understand spoken Nepali but cannot read or write it

### Learning-Platform Architecture

Do not mix the learning system into the Public Information content type. The future platform structure should allow a separate learning area:

- `/ne/learn/`
- `/nb/learn/`

The learning model will likely require:

- programme
- course
- module
- lesson
- exercise
- question and feedback
- audio, image and video resources
- learner accounts
- progress tracking
- privacy and consent controls

Sanity can manage curriculum and lesson content. Learner accounts, answers, progress, certificates, and sensitive user data should use an appropriate application database and authentication layer rather than ordinary Sanity documents.

## Donor and Grant Readiness

The language-learning phase is expected to require support from donors, Norwegian public funding bodies, NGOs, foundations, municipalities, or partner organisations.

Build a donor-ready second phase through:

1. audience and needs research
2. curriculum and pedagogical design
3. qualified language and education contributors
4. a small pilot for each learning programme
5. audio and interactive learning resources
6. child safeguarding and privacy planning
7. measurable learning outcomes
8. mobile-first accessibility
9. pilot evaluation and user feedback
10. transparent governance, budget, staffing and maintenance plans

The funding narrative should connect two complementary public-benefit goals:

- helping adults and newcomers participate confidently in Norwegian society
- helping children preserve and develop Nepali language, cultural identity and intergenerational connection

The planned language-learning programme must be documented as a future funded phase, not as a delivered feature.

## Strategic Development Order

Recommended order from the current checkpoint:

1. Complete the scalable Public Information taxonomy and topic-hub architecture.
2. Extend the Sanity schema carefully for categories, tags, guide formats, reader journeys, relationships and priority.
3. Redesign the Public Information archive around topic hubs.
4. Add search after enough real guides exist to test relevance properly.
5. Continue publishing and reviewing high-priority guides.
6. Establish Events and other core community services.
7. Collect evidence of usage, public value and community need.
8. Develop the language-learning curriculum and donor-ready pilot proposal with qualified contributors.
9. Build the learning platform as a deliberately funded major phase.

## Public Information Topic Hub Milestone

Completed and verified:

- Extended Public Information from a flat guide archive toward a scalable multilingual knowledge-centre architecture.
- Added and registered the Sanity document type:
  - `sanity/schemaTypes/publicInformationTopic.ts`
- Preserved the existing `Public Information Guide` schema, published UDI guide, stable topic keys, and existing guide URLs.
- Topic Hub documents support:
  - language-specific public title and slug
  - reciprocal translation reference
  - stable `topicKey` matching the existing guide topic value
  - summary and optional rich introduction
  - display order
  - optional icon key
  - editorially selected featured guides
  - optional SEO description
  - explicit active or inactive public status
- Added and validated Topic Hub GROQ queries:
  - `PUBLIC_INFORMATION_TOPICS_BY_LANGUAGE_QUERY`
  - `PUBLIC_INFORMATION_TOPIC_BY_SLUG_QUERY`
  - `PUBLIC_INFORMATION_GUIDES_BY_TOPIC_QUERY`
- Verified in Sanity Vision that inactive Topic Hubs are excluded from public queries.
- Verified in Sanity Vision that the first Topic Hub correctly references the existing active Nepali UDI guide.

### First Topic Hub

Created and published the first controlled Nepali Topic Hub:

- Public title: `आगमन, बसोबास र आप्रवासन`
- Slug: `aagaman-basobas-aaprawasan`
- Language: Nepali
- Topic key: `immigration-residence`
- Display order: `10`
- Icon key: `immigration`
- Featured guide: the existing active Nepali UDI residence-permit guide
- Public status: active after route validation

The Topic Hub was first published while inactive. This allowed its content and references to be tested without creating a public page. It was activated only after the route compiled and the inactive-state build remained unchanged.

### Public Topic Hub Route

Added:

`src/pages/[lang]/info/topic/[slug].astro`

The route provides:

- static generation only for active Topic Hubs
- language and slug filtering
- safe redirect for missing or inactive hubs
- shared `BaseLayout`, header, and footer
- topic summary and optional Portable Text introduction
- guide count
- reciprocal language switching when an active translation exists
- editorially selected featured guides first
- automatic de-duplication between featured guides and the remaining guide list
- all active guides selected by the stable `topicKey`
- responsible agency, review dates, urgent status, and guide links
- mobile-first responsive presentation
- preservation of existing individual Public Information Guide routes

The active Topic Hub increased the public Astro build from 10 to 11 generated pages.

Public route:

`/ne/info/topic/aagaman-basobas-aaprawasan/`

### Topic Hub Layout Refinement

After live review:

- Removed the artificial empty blue-grey half of the single featured-guide card.
- Changed the featured-guide grid so one guide uses the full available width and multiple guides can form responsive columns.
- Hid the empty `All guides` directory when every available guide is already displayed as featured.
- Kept the directory logic ready to reappear automatically as additional guides are published.
- Improved selected Nepali interface labels from formal `मार्गदर्शन` wording to more natural information-oriented wording:
  - `सुरु गर्न उपयोगी जानकारी`
  - `पूरा जानकारी पढ्नुहोस्`
  - `जानकारीमूलक लेख`
- Astro Check passed with 0 errors and 0 warnings.
- Production build passed with 11 generated pages.

The optional Topic Introduction currently remains populated. Live review found that it visually creates a large white band and partly repeats the summary. The content can later be removed directly in Sanity without a code change. The route already hides the introduction section when the field is empty. Do not spend additional development time on this unless future content demonstrates a need for a different layout.

### Webhook Update

The Sanity-to-Vercel webhook filter was extended to include:

- `publicInformationTopic`

Publishing Topic Hub changes can therefore trigger the public `nepali-no` Vercel build automatically, alongside News Articles, Public Information Guides, Community Events, and Business Listings.

## Git Checkpoints

Topic Hub milestone commits:

- `944d61d topic-hub-schema`
- `28516c9 topic-hub-queries`
- `021a853 topic-hub-route`
- `358cbf8 topic-hub-layout`

Before continuing, verify that `358cbf8 topic-hub-layout` is pushed to `origin/main` and that the working tree is clean.

## Next Recommended Milestone

Do not create all Topic Hubs or import the large guide inventory yet.

The next controlled milestone should be:

1. Link active Topic Hubs from `/ne/info/` and `/nb/info/`.
2. Redesign the Public Information archive around Topic Hubs while preserving a useful fallback list of guides.
3. Show only active Topic Hubs.
4. Keep the current UDI guide visible and reachable throughout the transition.
5. Ensure languages with no active Topic Hubs still have a valid and useful archive.
6. Centralize newly introduced Topic Hub interface labels in the i18n files during an appropriate cleanup checkpoint.
7. Add related-guide, keyword, guide-format, editorial-priority, and maintenance-sensitivity fields only in later isolated schema checkpoints.
8. Create additional Topic Hubs gradually and validate the taxonomy with real content before large-scale import.

## Public Information Knowledge-Centre Archive Milestone

Completed and verified:

- Redesigned the multilingual Public Information archives:
  - `/ne/info/`
  - `/nb/info/`
- Active Public Information Topic Hubs are now the primary navigation model for languages that have active hubs.
- The archive fetches Topic Hubs and active Public Information Guides in parallel.
- Topic Hubs are ordered by their editorial `displayOrder` value.
- Each Topic Hub card displays:
  - language-specific public title
  - public summary
  - active-guide count
  - direct link to the Topic Hub route
- Guides assigned to an active Topic Hub are removed from the archive fallback list to prevent duplicate presentation.
- Active guides whose topic does not yet have an active Topic Hub remain visible as standalone guide cards.
- Languages with no active Topic Hubs remain useful by showing the existing guide-card archive rather than an empty Topic Hub section.
- The existing official-information disclaimer remains prominent.
- Existing individual guide routes and the published UDI guide remain unchanged and directly accessible.
- The Nepali archive currently displays the active Topic Hub:
  - `आगमन, बसोबास र आप्रवासन`
  - `/ne/info/topic/aagaman-basobas-aaprawasan/`
- The current Norwegian archive continues to use the safe guide-card fallback until Norwegian Topic Hubs are created and activated.
- Mobile rendering was reviewed positively.
- Desktop rendering was refined so a single Topic Hub card spans the full grid width and does not leave an artificial empty blue-grey second column.
- When a second active Topic Hub is added, the archive automatically returns to the intended two-column desktop grid.
- Astro Check passed with 0 errors and 0 warnings.
- The production build passed with 11 generated pages.

## Git Checkpoints

- `f1986b2 info-topic-hubs` - added Topic Hubs as the primary Public Information archive navigation with a guide fallback
- `8139010 info-single-topic` - made a single Topic Hub card use the full desktop width

Latest expected pushed checkpoint:

`8139010 info-single-topic`

## Content-Entry Decision

Do not begin large-scale entry of News Articles, Public Information Guides, or other editorial content until the core architecture, taxonomy, relationships, archive behavior, and publishing workflows have been completed and validated.

Reason:

- Avoid orphaned or poorly classified content.
- Avoid later bulk migration caused by premature schema decisions.
- Ensure each guide has a stable topic, route, review workflow, translation strategy, and relationship model before import.
- Use only a small number of controlled test documents while architecture is still evolving.

The large content inventory remains planned and valuable, but architecture and validation take priority over volume at this stage.

## Planned Article and Guide Discussion Integration

A future forum integration should let readers continue a News Article or Public Information Guide discussion in the community forum.

Preferred editorial model:

- Do not embed a full comment thread directly inside the article or guide.
- Keep the authoritative article or guide page focused, readable, and editorially controlled.
- Optionally link the content item to a corresponding forum topic.
- Display a clear call to action such as:
  - `Discuss this article in the forum`
  - `Share your experience in the forum`
  - natural Nepali and Norwegian equivalents
- The forum topic should contain or automatically receive:
  - content title
  - short summary or excerpt
  - canonical link back to the nepali.no article or guide
  - content language
  - content type
  - relevant category or topic
- The article or guide should store an optional forum-topic URL or forum-topic identifier.
- The link should be hidden when no forum topic exists.
- Community experience must be clearly separated from official-source-based guidance.
- Forum contributions must never be presented as verified legal, immigration, tax, health, or public-service instructions.
- Moderation, safeguarding, privacy, spam controls, language handling, and community rules must be designed before public launch.

Discourse remains the leading forum candidate, but no irreversible forum-specific frontend architecture should be introduced before a structured platform and integration review.

Future Discourse review should cover:

- self-hosted versus managed hosting
- single sign-on and user-account strategy
- API-based topic creation
- webhooks
- category and tag mapping
- multilingual topics
- moderation roles and escalation
- spam and abuse prevention
- child and youth safeguarding
- privacy and data-processing responsibilities
- backups, upgrades, email delivery, and operational workload
- canonical-link and search-engine behavior
- how forum discussions appear on the nepali.no homepage without exposing unmoderated content directly

Recommended future content relationship:

`News Article or Public Information Guide -> optional related forum topic -> canonical link back to nepali.no`

This requirement should be considered when the Public Information Guide and News Article schemas are next extended. A generic optional discussion reference should be preferred over hardcoding a presentation-only URL in page templates.

## Next Recommended Development Sequence

1. Document and secure this archive milestone.
2. Review the remaining Public Information architecture and schema requirements before importing content.
3. Add search keywords and related-guide relationships as isolated, tested schema changes.
4. Decide whether guide format, editorial priority, and maintenance sensitivity should be introduced in the same or later milestones.
5. Test all new metadata on the existing UDI guide before bulk use.
6. Perform a structured Discourse integration review before implementing discussion links.
7. Add a generic optional forum-discussion relationship to News Articles and Public Information Guides only after the forum architecture is selected.
8. Continue creating Topic Hubs gradually with real controlled content.
9. Begin larger content import only when taxonomy, search, relationships, review controls, and forum-link strategy are stable.
### Public Information Search Metadata and Related Guides Schema Milestone

Completed and verified on 29 July 2026:
- Extended `sanity/schemaTypes/publicInformationGuide.ts` with two optional, isolated metadata fields:
  - `searchKeywords`
  - `relatedGuides`
- `searchKeywords` supports up to 30 unique strings. Each entry must contain between 2 and 100 characters.
- Editorial guidance explicitly supports natural search phrases in the guide language, everyday Nepali wording, Norwegian official terminology, abbreviations, synonyms, and common alternative spellings.
- Search keywords are editorial metadata and are not displayed publicly by the current frontend.
- `relatedGuides` supports up to 8 unique references to other Public Information Guide documents.
- The Related Guides selector prefers guides in the same language when the current document has a language.
- The selector excludes both the published and draft identifiers of the current guide, preventing self-reference.
- Related Guides remains separate from the existing Translated Version relationship.
- No forum-specific field or irreversible Discourse-specific architecture was introduced.
- Existing fields, Topic Hub behavior, guide routes, and the published UDI guide URL were preserved.

Validation completed:
- Sanity TypeScript validation passed with `npx tsc --noEmit`.
- Sanity Studio production build passed.
- `git diff --check` passed.
- The complete schema diff was reviewed.
- Astro production build passed and generated the expected 11 pages.
- The build introduced no additional tracked changes.

Git checkpoint:
- `1c966ef add guide search and related fields`
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` all pointed to `1c966ef`.
- The working tree was clean after the checkpoint was pushed.

Deployment and editorial verification:
- The normal Studio deployment path remains the existing Vercel project `nepali-no-studio`.
- Do not use `npx sanity deploy` for the ordinary Vercel-hosted Studio workflow.
- The Git push triggered the connected Vercel deployments automatically.
- The new Search Keywords and Synonyms and Related Guides fields were verified in the existing Vercel-hosted Studio at `https://nepali-no-studio.vercel.app`.
- The existing Nepali UDI guide was used as the controlled metadata test document.
- Published search keywords:
  - `oppholdstillatelse`
  - `बसोबास अनुमति`
- The guide was published with no outstanding unpublished changes. The disabled Publish button and Last published status confirmed synchronization.
- Publishing triggered the established Sanity-to-Vercel webhook.
- The resulting public `nepali-no` Vercel production deployment reached Ready.
- The public guide should not visibly change because the frontend does not yet query or display searchKeywords.
- `relatedGuides` remains empty because there is currently no second suitable genuine Nepali guide. Do not create fake content merely to test the relationship.
- Test same-language filtering, self-reference exclusion, duplicate prevention, and public related-guide presentation when a second genuine Nepali guide exists.

Important scale and content-entry note:
- The single UDI guide is only a controlled architecture test. The Public Information collection is expected to grow to hundreds or thousands of guides.
- Do not begin bulk content entry yet. Stabilize taxonomy, search behavior, relationships, review controls, translation strategy, and optional discussion-link architecture first.

### Next Recommended Work
- Append this milestone to `PROJECT_PROGRESS.md`, then commit and push the documentation checkpoint.
- Do not manually redeploy Sanity Studio.
- Do not add a forum-topic field before the structured Discourse integration review.
- Decide the next isolated Public Information schema milestone, likely guide format, editorial priority, or maintenance sensitivity. Do not add all remaining fields in one uncontrolled change.
- Keep Related Guides optional and hidden publicly when empty.
- When a second genuine Nepali guide is created, test the Related Guides editorial selector before adding frontend presentation.
- Continue creating Topic Hubs gradually with controlled real content.
- Continue one verified step at a time, with Git checkpoints after stable milestones.
