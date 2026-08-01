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
### Public Information Guide Format Milestone

Completed and verified on 29 July 2026:
- Added one optional `guideFormat` field to `sanity/schemaTypes/publicInformationGuide.ts`.
- The field is a single-choice string displayed as radio buttons in Sanity Studio.
- The field is editorial metadata and is not currently displayed by the public frontend.
- Added six stable format values:
  - Quick answer: `quick-answer`
  - Step-by-step guide: `step-by-step`
  - Comprehensive guide: `comprehensive-guide`
  - Checklist: `checklist`
  - Explainer: `explainer`
  - Emergency information: `emergency-information`
- Guide Format remains separate from `isUrgent`. Guide Format describes the guide's editorial structure, while `isUrgent` controls temporary prominent placement.
- The field is optional, preserving compatibility with existing and future guide documents.
- Existing search keywords, related guides, Topic Hub relationships, translations, routes, and guide metadata were preserved.
- No forum-specific field or irreversible Discourse-specific architecture was introduced.

Validation completed:
- Checksum-protected update applied only to `sanity/schemaTypes/publicInformationGuide.ts`.
- Sanity TypeScript validation passed with `npx tsc --noEmit`.
- Sanity Studio production build passed.
- The known local/runtime Sanity version mismatch was handled with Continue anyway; dependencies were not upgraded during this isolated milestone.
- `git diff --check` passed.
- The complete schema diff was reviewed.
- Astro production build passed and generated the expected 11 pages.
- Build validation introduced no additional tracked changes.

Git checkpoint:
- `2ebb585 add guide format metadata`
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` all pointed to `2ebb585` after push.

Deployment and editorial verification:
- The normal Vercel-hosted Studio workflow deployed the new schema automatically after the Git push.
- No manual `npx sanity deploy` command was used.
- The new Guide Format field and all six radio choices were verified in `https://nepali-no-studio.vercel.app`.
- The existing Nepali UDI guide was used as the controlled editorial test document.
- The UDI guide was classified as Comprehensive guide (`comprehensive-guide`).
- Sanity confirmed publication with a Last published status and an inactive Publish button.
- Publishing triggered the established Sanity-to-Vercel webhook for the public `nepali-no` project.
- The resulting production deployment for commit `2ebb585` reached Ready.
- No visible public change is expected because Guide Format is not yet queried or displayed by the frontend.

Current repository state:
- `git status --short` returned no output after the pushed checkpoint and editorial test.
- The working tree was clean at the break point.
- The Guide Format milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- The repository state was verified clean at `2ebb585 add guide format metadata` before this documentation append.
- Review, stage, commit, and push this documentation-only checkpoint.
- Do not manually redeploy Sanity Studio.
- Keep Guide Format optional and hidden publicly until there is a deliberate frontend use case.
- Consider Editorial Priority as the next isolated Public Information schema milestone.
- Consider Maintenance Sensitivity in a later separate milestone rather than combining several fields at once.
- Do not add forum-specific fields before the structured Discourse integration review.
- Do not begin bulk content entry yet.
- Test Related Guides only when a second genuine Nepali guide exists.
- Events and Business Listings remain planned platform areas and can be resumed after the current Public Information architecture is sufficiently stable.
### Public Information Editorial Priority Milestone

Completed and verified on 29 July 2026:
- Added one optional `editorialPriority` field to `sanity/schemaTypes/publicInformationGuide.ts`.
- The field is a single-choice string displayed as radio buttons in Sanity Studio.
- Added three stable editorial-priority values:
  - Essential: `essential`
  - Recommended: `recommended`
  - Specialist: `specialist`
- Editorial Priority describes a guide's durable importance within its topic and intended audience.
- Editorial Priority remains distinct from:
  - `isFeatured`, which supports temporary editorial promotion
  - `isUrgent`, which supports time-sensitive prominent placement
  - `guideFormat`, which describes the guide's content structure
- The field is optional, preserving compatibility with existing and future guide documents.
- Editorial Priority is currently metadata only and is not yet queried, ordered, filtered, or displayed by the public frontend.
- No forum-specific field or irreversible Discourse-specific architecture was introduced.

Validation completed:
- The checksum-protected update modified only `sanity/schemaTypes/publicInformationGuide.ts`.
- Sanity TypeScript validation passed with `npx tsc --noEmit`.
- Sanity Studio production build passed.
- The known local/runtime Sanity version mismatch was handled with Continue anyway; dependencies were not upgraded during this isolated milestone.
- `git diff --check` passed.
- The complete schema diff was reviewed.
- Astro production build passed and generated the expected 11 pages.
- Build validation introduced no additional tracked changes.

Git checkpoint:
- `986d4f7 add editorial priority metadata`
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` all pointed to `986d4f7` after push.

Deployment and editorial verification:
- The existing Vercel-hosted Studio workflow deployed the schema automatically after the Git push.
- No manual `npx sanity deploy` command was used.
- The new Editorial Priority field and all three choices were verified in `https://nepali-no-studio.vercel.app`.
- The existing Nepali UDI guide was used as the controlled editorial test document.
- The UDI guide was classified as Essential (`essential`).
- Sanity confirmed publication with a green published notification, Last published status, and an inactive Publish button.
- Publishing triggered the established Sanity-to-Vercel webhook for the public `nepali-no` project.
- Vercel showed two Ready Production deployments for commit `986d4f7`: the code deployment after the Git push and the content-triggered deployment after Sanity publication.
- No visible public change is expected because Editorial Priority is metadata only.

Future intended use:
- Editorial Priority may later support Topic Hub ordering, Start here sections, recommended-guide sections, specialist-guide groupings, filtering, and other curated reader journeys.
- Search Keywords remains the metadata primarily intended to improve future search matching.
- Guide Format supports content-type labels, filtering, and presentation.
- None of these effects occur automatically. Future GROQ queries, search indexing, and frontend behavior must intentionally use the metadata.
- Public behavior should be designed only after enough genuine content exists to evaluate the model reliably.

Current repository state:
- `git status --short` returned no output after the pushed checkpoint and editorial test.
- The working tree was clean at the documentation-preparation point.
- The Editorial Priority milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- Review, stage, commit, and push this documentation-only checkpoint.
- Do not manually redeploy Sanity Studio.
- Keep Editorial Priority optional and hidden publicly until there is a deliberate query and frontend use case.
- Consider Maintenance Sensitivity as the next isolated Public Information schema milestone.
- Do not combine several remaining metadata fields into one uncontrolled change.
- Do not add forum-specific fields before the structured Discourse integration review.
- Do not begin bulk content entry yet.
- Test Related Guides only when a second genuine Nepali guide exists.
- Continue creating Topic Hubs gradually with controlled real content.
- Events and Business Listings remain planned platform areas and can resume after the current Public Information architecture is sufficiently stable.
### Public Information Maintenance Sensitivity Milestone

Completed and verified on 29 July 2026:
- Added one optional `maintenanceSensitivity` field to `sanity/schemaTypes/publicInformationGuide.ts`.
- The field is a single-choice string displayed as radio buttons in Sanity Studio.
- Added three stable maintenance-sensitivity values:
  - High: `high`
  - Medium: `medium`
  - Low: `low`
- Maintenance Sensitivity indicates how closely a guide should be monitored for changes.
- Required review dates remain separate and continue to record the actual editorial review schedule.
- The field is optional, preserving compatibility with existing and future guide documents.
- Maintenance Sensitivity is currently editorial metadata only and is not displayed by the public frontend.
- Existing Search Keywords, Related Guides, Guide Format, Editorial Priority, Topic Hub relationships, translations, routes, and review controls were preserved.
- No forum-specific field or irreversible Discourse-specific architecture was introduced.

Validation completed:
- A checksum-protected script modified only `sanity/schemaTypes/publicInformationGuide.ts`.
- Sanity TypeScript validation passed with `npx tsc --noEmit`.
- Sanity Studio production build passed.
- The known local/runtime Sanity version mismatch was handled with Continue anyway; dependencies were not upgraded during this isolated milestone.
- `git diff --check` passed.
- The complete schema diff was reviewed.
- Astro production build passed and generated the expected 11 pages.
- Build validation introduced no additional tracked changes.

Git checkpoint:
- `f456496 add maintenance sensitivity metadata`
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` all pointed to `f456496` after push.

Deployment and editorial verification:
- The existing Vercel-hosted Studio workflow deployed the schema automatically after the Git push.
- No manual `npx sanity deploy` command was used.
- The new Maintenance Sensitivity field and all three choices were verified in `https://nepali-no-studio.vercel.app`.
- The existing Nepali UDI guide was used as the controlled editorial test document.
- The UDI guide was classified as High (`high`).
- Publishing triggered the established Sanity-to-Vercel webhook for the public `nepali-no` project.
- Vercel showed a Ready Production deployment for the content publication and a separate Ready Production deployment for the code push, both using commit `f456496` on `main`.
- No visible public change is expected because Maintenance Sensitivity is metadata only.

Current controlled UDI guide metadata:
- Search Keywords: `oppholdstillatelse` and `बसोबास अनुमति`
- Guide Format: Comprehensive guide (`comprehensive-guide`)
- Editorial Priority: Essential (`essential`)
- Maintenance Sensitivity: High (`high`)
- Related Guides remains empty until a second suitable genuine Nepali guide exists.

### Editorial and Administrator User Manual Requirement

The Sanity Studio and platform publishing workflow are now extensive enough to require a practical user manual for editors and administrators.

Plan a separate documentation milestone for `EDITORIAL_USER_MANUAL.md`. The manual should eventually cover:
- Studio access and general navigation
- News Article creation, translation, publication, Important Now, and homepage featuring
- Public Information Guide creation, translation, official-source requirements, review dates, and workflow status
- Search Keywords, Related Guides, Guide Format, Editorial Priority, and Maintenance Sensitivity
- Topic Hub creation, activation, ordering, and featured-guide relationships
- Image uploads, alternative text, captions, and credits
- Draft, Publish, Active, Needs Review, and Archived behavior
- The automatic Sanity-to-Vercel publishing workflow
- Events and Business Listings when those public experiences are activated
- Editorial safety, privacy, corrections, source verification, and quality control
- Common troubleshooting and recovery steps

The manual should be practical for future editors, volunteers, administrators, partner organizations, and project handover. A later polished Word or PDF edition may be produced from the maintained Markdown source.

Current repository state:
- `git status --short` returned no output after the pushed checkpoint and editorial test.
- The working tree was clean at the documentation-preparation point.
- The Maintenance Sensitivity milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- Review, stage, commit, and push this documentation-only checkpoint.
- Do not manually redeploy Sanity Studio.
- Keep Maintenance Sensitivity optional and hidden publicly until there is a deliberate query or operational use case.
- Treat `EDITORIAL_USER_MANUAL.md` as a planned separate documentation milestone.
- Review the remaining Public Information architecture before adding more metadata fields.
- Do not add forum-specific fields before the structured Discourse integration review.
- Do not begin bulk content entry yet.
- Test Related Guides only when a second genuine Nepali guide exists.
- Continue creating Topic Hubs gradually with controlled real content.
- Events and Business Listings remain planned platform areas and can resume after the current Public Information architecture is sufficiently stable.
### Public Information Architecture Audit, Second Guide and Second Topic Hub Milestone

Completed and verified on 29 July 2026:

#### Architecture audit
- Audited the complete Public Information Guide schema.
- Audited the Public Information GROQ queries in `src/lib/sanity/queries.ts`.
- Audited the Public Information archive route:
  - `src/pages/[lang]/info/index.astro`
- Audited the individual guide route:
  - `src/pages/[lang]/info/[slug].astro`
- Audited the Topic Hub route:
  - `src/pages/[lang]/info/topic/[slug].astro`
- Confirmed that the schema is ready for controlled real-content growth.
- Confirmed that no additional Public Information metadata field is currently required.
- Confirmed that new metadata should remain internal until GROQ queries and frontend features deliberately use it.
- Confirmed that guides without a matching active Topic Hub remain visible through the archive fallback.
- Confirmed that Topic Hub featured-guide references are filtered by language, topic key, and active status.
- Confirmed that featured guides are de-duplicated from the ordinary Topic Hub guide directory.
- Confirmed that inactive Topic Hubs do not generate public routes or appear on the archive.

#### Inactive guide-translation safety correction
- Identified one genuine route-level safety gap: a guide could display a link to a translated guide that was no longer active.
- Updated `PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY` to project the translated guide status.
- Updated `src/pages/[lang]/info/[slug].astro` so only an active translated guide receives a direct public link.
- When a referenced translation is not active, the header language switch now falls back to the alternate-language Public Information archive.
- The translation card is hidden when the referenced translation is inactive.
- Astro Check passed across 47 files with 0 errors and 0 warnings.
- The production build passed with the expected 11 generated pages before the second guide and Topic Hub were published.
- `git diff --check` passed.
- The complete two-file diff was reviewed.
- Code checkpoint created and pushed:
  - `ec1d6c2 guard inactive guide translations`
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` were synchronized at `ec1d6c2`.

#### Second genuine Public Information Guide
- Created and published a genuine Nepali guide based on current official Skatteetaten information.
- Public title:
  - `नर्वेमा काम सुरु गर्दा कर कटौती कार्ड कसरी बनाउने?`
- Slug:
  - `norway-ma-kaam-suru-garda-kar-katauti-card`
- Public route:
  - `/ne/info/norway-ma-kaam-suru-garda-kar-katauti-card/`
- Responsible authority:
  - Skatteetaten
- Primary topic:
  - `tax-finance`
- Guide Format:
  - Step-by-step guide
- Editorial Priority:
  - Essential
- Maintenance Sensitivity:
  - High
- Intended audiences:
  - Newly arrived residents
  - Workers and job seekers
- Search keyword added:
  - `skattekort`
- Important Norwegian term added:
  - `skattekort`
- Editorial reviewer:
  - `nepali.no editorial team`
- Last reviewed:
  - `2026-07-29`
- Next review due:
  - `2026-10-29`
- Guide status:
  - Active
- Featured and Urgent controls remained off.
- The guide explains the tax deduction card, application process, identity verification, PAYE, ordinary taxation, corrections, electronic employer retrieval, and possible 50 percent withholding when no valid card is available.
- A duplicated PAYE paragraph was identified during live review, removed, and republished.
- A separate paragraph about choosing ordinary taxation and avoiding personalized tax advice was preserved.
- The guide was reviewed positively on both desktop and mobile.
- Nepali language proofreading remains planned with the user's proofreader before the final public launch.

#### Second active Public Information Topic Hub
- Created and published the second Nepali Public Information Topic Hub.
- Public title:
  - `कर र व्यक्तिगत वित्त`
- Slug:
  - `kar-ra-byaktigat-bitta`
- Topic key:
  - `tax-finance`
- Public route:
  - `/ne/info/topic/kar-ra-byaktigat-bitta/`
- Display order:
  - `80`
- Icon key:
  - `tax`
- Featured starting guide:
  - the published Skatteetaten tax-card guide
- The Topic Hub was first published while inactive.
- The inactive-state deployment was verified:
  - no Tax Topic Hub appeared publicly
  - the Skatteetaten guide remained in the archive fallback section
- The Topic Hub was then activated and republished.
- The active-state deployment was verified:
  - the Tax Topic Hub appeared on `/ne/info/`
  - the Skatteetaten guide disappeared from the fallback section
  - the guide appeared automatically inside the Tax Topic Hub through the matching `tax-finance` values
  - the guide appeared as the featured starting guide
  - the existing Immigration Topic Hub remained unchanged
  - no duplicate or empty all-guides section appeared
- The Nepali archive now presents two active Topic Hubs:
  1. `आगमन, बसोबास र आप्रवासन`
  2. `कर र व्यक्तिगत वित्त`
- The desktop archive automatically uses the intended two-column Topic Hub layout.
- The mobile archive stacks both Topic Hubs cleanly.
- The Tax Topic Hub page and featured guide presentation were reviewed positively on desktop and mobile, with no horizontal overflow.

#### Topic Hub and taxonomy strategy clarified
- Public Information Topic is the enhanced public category-page system.
- Guide membership is automatic when a guide `topic` matches a Topic Hub `topicKey`.
- Featured Guides controls prominent start-here placement but is not required for ordinary category membership.
- The archive fallback is transitional and should not become a permanent mixed collection for established subject areas.
- A known category may receive an active Topic Hub when its first substantial genuine guide provides real public value.
- Empty Topic Hubs should not be activated.
- The existing inventory of approximately 100 planned guides spans eleven broad reader-facing subject areas and is only an initial editorial backlog, not a strict requirement for 100 separate pages.
- Before bulk content entry, reconcile the planned public hubs with the internal topic keys.
- A dedicated Transport and Driving topic key may be required because the current schema has no clear equivalent.
- Some broad reader-facing hubs may eventually need to represent multiple internal topics, which the current single-topic-key hub architecture does not yet support.
- Do not attempt to resolve the full taxonomy through uncontrolled schema changes. Perform a separate structured taxonomy-reconciliation milestone first.

#### Database and platform understanding
- Sanity Content Lake is the current content database for News, Public Information, Topic Hubs, Events, and Business Listings.
- Astro is the public rendering and routing layer.
- Vercel builds and serves the static public site and hosted Studio.
- Supabase or another application database is not currently required.
- Reconsider an application database only for private, transactional, personalized, or user-account data such as learner progress, registrations, saved items, or business-owner self-service.

#### Planned operational readiness
- Before launch, create a cost-effective operational and troubleshooting package including:
  - `OPERATIONS_RUNBOOK.md`
  - safe diagnostic collection and `NEPALI_NO_DIAGNOSTIC_REPORT.txt`
  - incident templates
  - rollback routines
  - monitoring and smoke tests
  - backup and recovery documentation
- The package must help the user, AI assistants, or consultants diagnose production failures without exposing secrets.
- Also create `EDITORIAL_USER_MANUAL.md` for editors and administrators.

#### Sanity and Vercel cost position
- Sanity Growth trial had 26 days remaining when reviewed.
- Current usage was far below Free-plan quotas.
- Do not upgrade Sanity merely because the trial countdown is visible.
- Reconsider Sanity Growth when multiple editors need restricted roles or Growth-only collaboration features.
- Vercel and Sanity can both remain free during development if plan eligibility and limits remain appropriate.
- Before official launch, verify whether the registered nonprofit/public-benefit use is eligible for Vercel Hobby or requires Vercel Pro.
- Connecting the custom domain does not itself require a Sanity upgrade.

### Current Git and Documentation Status
- Latest pushed code checkpoint:
  - `ec1d6c2 guard inactive guide translations`
- `git status --short` returned no output at the documentation-preparation point.
- `git log -1 --oneline` confirmed `ec1d6c2` with local and remote main synchronized.
- The second guide and second Topic Hub are Sanity content changes and therefore required no Git commit.
- The Public Information audit, second-guide, and second-Topic-Hub milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- Review, stage, commit, and push this documentation-only checkpoint.
- Keep the updated recovery prompt outside the Git repository.
- At the next development session, verify Git status and the latest commit before taking action.
- Perform a structured taxonomy-reconciliation milestone using the full planned guide inventory before bulk content entry or creation of all remaining Topic Hubs.
- Preserve the working two-hub architecture and existing guide URLs.
- Do not activate empty Topic Hubs.
- Do not add forum-specific fields before the structured Discourse review.
- After the Public Information taxonomy is stabilized, perform a focused News audit.
- Before connecting `nepali.no`, create the initial editorial manual, operations runbook, diagnostic workflow, rollback documentation, and launch checklist.
### Transport and Driving Topic Key Milestone

Completed and verified on 30 July 2026:
- Reviewed the topic options defined in both Public Information schemas.
- Confirmed that the existing schemas contained 13 topic keys but no dedicated key for the planned Transport and Driving content area.
- Confirmed that at least five genuine Transport and Driving guides are already planned, so these guides should not be forced into the `other` fallback category.
- Added the same stable, language-independent topic option to both schemas:
  - Public title in Studio: `Transport and Driving`
  - Internal key: `transport-driving`
- Updated:
  - `sanity/schemaTypes/publicInformationGuide.ts`
  - `sanity/schemaTypes/publicInformationTopic.ts`
- Inserted the new option immediately before the existing Other fallback option in both schemas.
- No existing topic key was renamed, reordered, or removed.
- No route, GROQ query, frontend component, existing Sanity document, or public page behavior was changed.

Validation completed:
- Used a checksum-protected update script that verified both source files before changing either file.
- Sanity TypeScript validation passed with `npx tsc --noEmit`.
- Sanity Studio production build passed.
- The known local/runtime Sanity version warning was handled with Continue anyway; dependencies were not upgraded.
- `git diff --check` passed for both schema files.
- The complete two-file diff was reviewed and contained only the two intended option additions.
- Astro Check passed across 47 files with 0 errors and 0 warnings.
- Astro production build passed and generated the current expected baseline of 13 pages.
- The new topic key did not generate a public page by itself, which is correct.

Git checkpoint:
- `43ce562 add transport and driving topic`
- Two files changed with two insertions.
- The checkpoint was pushed successfully.
- Verified that `HEAD`, local `main`, `origin/main`, and `origin/HEAD` all pointed to `43ce562`.
- `git status --short` returned no output after push, confirming a clean working tree.

Hosted Studio verification:
- Verified that `Transport and Driving` appears in Public Information Guide under the Topic selector.
- Verified that `Transport and Driving` appears in Public Information Topic under the Topic Key selector.
- Existing Guide and Topic Hub selections were not changed during verification.
- Both sides now support the matching relationship:
  - Guide `topic = transport-driving`
  - Topic Hub `topicKey = transport-driving`

### Reusable Procedure for Future Topic Keys

A Topic Hub for an existing topic key can be created entirely through Sanity Studio and requires no code or Git change.

A genuinely new topic key requires one small controlled schema milestone:
1. Confirm that no existing key accurately represents the planned content.
2. Choose a stable, language-independent internal key.
3. Add the identical option to:
   - `sanity/schemaTypes/publicInformationGuide.ts`
   - `sanity/schemaTypes/publicInformationTopic.ts`
4. Run Sanity TypeScript validation.
5. Build Sanity Studio.
6. Run `git diff --check` and review the complete diff.
7. Run Astro Check and the production build.
8. Commit and push the schema change.
9. Verify both selectors in the Vercel-hosted Studio.
10. Create the language-specific Topic Hub in Sanity only when a genuine anchor guide is ready.
11. Publish the Topic Hub while inactive, verify the inactive state, then activate and republish.
12. Update project documentation.

Important safeguards:
- Never rename an existing internal key casually after documents use it.
- Never translate the internal key. Translate only public titles and summaries.
- Guide `topic` and Topic Hub `topicKey` must match exactly.
- Do not force an established category into `other` merely to avoid a justified schema addition.
- Do not activate an empty Topic Hub.
- Adding a Topic Hub for an already defined key is editorial work in Sanity and does not require code changes.

### Future Transport and Driving Work
- Do not create or activate a Transport Topic Hub until the first genuine Transport and Driving guide is ready.
- Planned Transport and Driving subjects include public transport, driving licences, recognition or exchange of foreign licences, vehicle purchase and registration, electric vehicles and tolls, and winter driving.
- When the first guide is ready, create the language-specific Topic Hub through Sanity using `transport-driving`, publish it inactive first, validate, then activate it.

### Current Documentation Status
- Latest pushed code checkpoint: `43ce562 add transport and driving topic`.
- The working tree was clean at the documentation-preparation point.
- The Transport and Driving topic-key milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- Review, stage, commit, and push this documentation-only checkpoint.
- Keep the current recovery prompt outside the repository and update it after the documentation checkpoint.
- Then resume the focused News audit or the next agreed project priority.
### News Safety, i18n, Proofreading and Homepage Completion Milestone

Completed and verified on 30 July 2026.

#### News publishing safety
- Audited the News schema, public GROQ queries, News archive, individual News route, homepage News queries and the shared Portable Text image component.
- Confirmed that future-dated published News could previously appear before its intended publication time.
- Added `defined(publishedAt)` and `publishedAt <= now()` safeguards to all relevant public News queries:
  - `NEWS_ARTICLES_QUERY`
  - `NEWS_ARTICLES_BY_LANGUAGE_QUERY`
  - `FEATURED_NEWS_ARTICLES_QUERY`
  - `NEWS_ARTICLE_BY_SLUG_QUERY`
  - `IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY`
  - `HOMEPAGE_FEATURED_NEWS_BY_LANGUAGE_QUERY`
  - `HOMEPAGE_LATEST_NEWS_BY_LANGUAGE_QUERY`
- Added the same publication-time safeguard to News article static-path generation.
- Documented that this is a visibility safeguard, not an automatic scheduling system; a build must still occur after the publication time.
- Strengthened translated-News availability:
  - projected translated article `publishedAt`
  - required the expected alternate language, a usable slug and a publication time that has arrived
  - hid the translation card when no eligible translation exists
  - made the header language switch fall back to the alternate-language News archive
- Added optional Image Credit to inline News Article Content images.
- Projected inline image credit through GROQ and reused the existing shared image component for display.
- Required at least one item in News Article Content.
- Sanity TypeScript validation passed.
- Sanity Studio production build passed.
- Astro Check passed across 47 files with 0 errors and 0 warnings.
- Astro production build passed with the expected 13 generated pages.
- `git diff --check` passed and the complete three-file diff was reviewed.
- Code checkpoint created and pushed:
  - `17c9381 strengthen news publishing safety`

#### News interface i18n centralization
- Audited hard-coded Nepali and Norwegian interface copy in the News archive and individual News route.
- Centralized News interface labels in:
  - `src/i18n/ne.ts`
  - `src/i18n/nb.ts`
- Updated:
  - `src/pages/[lang]/news/index.astro`
  - `src/pages/[lang]/news/[slug].astro`
- Centralized:
  - region labels
  - category labels
  - article-count wording
  - More News
  - Author
  - Original Source and its explanation
  - alternate-language link label
  - Region and Category field labels
  - Useful Information title and description
  - Read Guide and Last Reviewed labels
- Preserved the existing wording during the structural move.
- Preserved fallback behavior for unknown Sanity region or category values.
- Left editor-authored content in Sanity and application logic in Astro.
- Astro Check passed with 0 errors and 0 warnings.
- Production build passed with 13 pages.
- `git diff --check` passed and the complete four-file diff was reviewed.
- Code checkpoint created and pushed:
  - `ad4401e centralize news interface translations`

#### Proofreader-approved Nepali interface corrections
- Established and successfully tested the controlled proofreader workflow for `src/i18n/ne.ts`.
- Applied exactly three approved Nepali wording corrections:
  1. `सरकारी स्रोतमा आधारित सरल जानकारी।`
  2. `नयाँ मार्गदर्शन प्रकाशित भएपछि यहाँ उपलब्ध हुनेछ।`
  3. `समाचारका साथै आधिकारिक स्रोतमा आधारित उपयोगी जानकारी।`
- Kept the following proofreader-approved wording unchanged:
  - `मार्गदर्शन पढ्नुहोस्`
  - `अहिलेसम्म कुनै मार्गदर्शन प्रकाशित भएको छैन।`
- Astro Check passed with 0 errors and 0 warnings.
- Production build passed with 13 pages.
- `git diff --check` passed and the exact three-string diff was reviewed.
- Code checkpoint created and pushed:
  - `d98b90a refine Nepali information wording`

#### Homepage Public Information presentation
- Confirmed that the homepage intentionally displays only Public Information Guides marked `isFeatured == true`.
- Confirmed that Active controls public availability, Topic controls Topic Hub membership, and Featured Guide controls homepage selection.
- Marked the genuine UDI and Skatteetaten guides as Featured through Sanity Studio.
- Verified that both guide cards now appear on the Nepali homepage with direct links, summaries and responsible-agency badges.
- Verified the updated proofreader-approved Public Information description on the homepage.
- The Sanity publishing webhook rebuilt the public site automatically; no code commit was required for the Featured changes.
- The no-featured-guides fallback remains a later minor improvement because it can imply that no guides exist even when active guides are available. The archive link remains visible.

#### Homepage News i18n reuse
- Found a second duplicated bilingual News region and category dictionary in `src/pages/[lang]/index.astro`.
- Removed the duplicated homepage dictionaries.
- Reused:
  - `labels.news.regions`
  - `labels.news.categories`
- Preserved fallback behavior for unknown Sanity values.
- No wording, visual design, query, route, date or publication behavior changed.
- Astro Check passed with 0 errors and 0 warnings.
- Production build passed with 13 pages.
- `git diff --check` passed and the complete one-file diff was reviewed.
- Code checkpoint created and pushed:
  - `aa75a92 reuse news translations on homepage`

#### Planned editorial and integration work
- Planned a future optional News-to-Public-Information-Guide relationship:
  - same-language related Guide reference on News
  - supporting Guide panel on the News article
  - reverse GROQ lookup on Guide pages for the latest related News
  - publication-, language-, slug- and status-safe filtering
  - kept separate from future forum discussion relationships
- Planned a later Sanity Studio Interface Language editor so approved proofreaders can update Nepali and Norwegian interface wording through web forms without Codespaces or Git.
- Initial Interface Language editor principle:
  - developers control keys, structure, fallback behavior and application logic
  - proofreaders control approved wording
  - `ne.ts` and `nb.ts` remain safe fallbacks in the first implementation
  - ordinary wording changes can later publish through Sanity and trigger the existing Vercel webhook
- A proofreader workflow guide has been prepared outside the repository and should be reviewed before being committed as maintained documentation.

#### Phase 1 launch priorities reaffirmed
- The homepage must not contain empty Coming Soon sections at official presentation.
- Priority working services before presentation:
  - News
  - Public Information
  - Events calendar
  - governed Business Directory
  - moderated Discussion Board
  - real About, Transparency, Contact, Privacy, Cookie, Editorial, Community, Business-policy and Accessibility pages
  - editorial and operational documentation
  - safe custom-domain launch
- The virtual language school remains Phase 2 and requires substantial donor support.

### Current Git Status
- Latest pushed checkpoint: `aa75a92 reuse news translations on homepage`.
- `git status --short` returned no output.
- `HEAD`, local `main`, `origin/main` and `origin/HEAD` were synchronized at `aa75a92`.
- The News completion milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only commit.

### Next Recommended Work
- Review, stage, commit and push this documentation-only checkpoint.
- Keep the updated master recovery prompt outside the repository.
- Review whether the proofreader workflow guide should be committed under a project documentation directory.
- Complete any final small News audit items without unnecessary redesign.
- Begin the Events milestone, followed by governed Business Listings and the structured Discourse review.
### Events Foundation Milestone

Completed and verified on 30 July 2026.

#### Phase 1 operating model
- Authorized nepali.no staff create, review and publish approved public Events through Sanity Studio.
- Organizers will later submit Event proposals through a bilingual public web form.
- Public organizer submissions will enter a private moderation queue and will never publish automatically.
- Visitors register or buy tickets directly from the organizer or an external service.
- nepali.no will not collect participant names, attendance lists, payment details, dietary requirements, cancellation requests or other participant-registration data during Phase 1.
- Registration, ticketing, payment, refunds and participant communications remain the organizer's responsibility.
- Essential Event information must be available as structured text on nepali.no and must not exist only inside a Facebook post or promotional poster.

#### Existing Event foundation audit
- Audited `sanity/schemaTypes/communityEvent.ts` and the original Event query block in `src/lib/sanity/queries.ts`.
- Confirmed that the prototype schema already supported basic title, summary, category, dates, venue, organizer, external registration link, price, image, description, homepage featuring and cancellation.
- Confirmed that the prototype did not support multilingual public pages, translated Events, hybrid Events, detailed status, Event languages, flexible pricing, verification metadata or a Past Events lifecycle.
- Confirmed there were no Event pages, routes or components under `src`.
- Confirmed the production Sanity dataset contained zero `communityEvent` documents.
- Because no Event documents existed, the prototype `isOnline` and `isCancelled` fields could be replaced cleanly without data migration.

#### Community Event schema expansion
- Expanded `sanity/schemaTypes/communityEvent.ts` into the Phase 1 public Event model.
- Added public content language:
  - Nepali: `ne`
  - Norwegian Bokmal: `nb`
- Added an optional translated Event reference with alternate-language filtering and self-reference protection.
- Added actual Event languages as a separate required multi-select field:
  - Nepali
  - Norwegian
  - English
  - Language-independent
  - Other
- Added conditional Other Event Language.
- Made Language-independent exclusive from spoken or working languages.
- Kept public English Event pages deferred; organizers may provide English source material and Events may be conducted in English while the public page remains Nepali or Norwegian in Phase 1.
- Expanded Event categories to cover genuine community use cases:
  - cultural celebrations
  - festivals
  - concerts and visiting artists
  - community gatherings
  - social meetups
  - students and youth
  - children and families
  - workshops and seminars
  - information and integration sessions
  - sports tournaments and recreation
  - religious and traditional programmes
  - charity, fundraising and volunteering
  - business and networking
  - other community Events
- Replaced the Online boolean with Event Format:
  - In person
  - Online
  - Hybrid
- Replaced the cancellation boolean with Event Status:
  - Scheduled
  - Postponed
  - Rescheduled
  - Cancelled
- Added all-day presentation support while retaining required underlying datetimes.
- Retained optional end time with validation that it must be later than the start time.
- Added physical Event details:
  - venue name
  - street address
  - postal code
  - city
  - map URL
  - accessibility information
  - transport or parking information
- Added Online and Hybrid details:
  - online platform
  - public Event or joining-information URL
  - warning not to expose private meeting links
- Expanded organizer information:
  - organizer name
  - organizer website or public page
  - public organizer email
  - public organizer telephone
- Added external registration workflow:
  - no registration required
  - registration recommended
  - registration required
  - tickets required
- Added registration status:
  - not applicable
  - not yet open
  - open
  - closed
  - sold out
- Added external registration or ticket URL and registration deadline.
- Clarified that registration and payment are handled externally.
- Added flexible pricing through simple NOK price plus public price description.
- Added optional intended audience guidance.
- Retained featured image with required alt text, caption, credit and hotspot.
- Added inline images to Event Description with required alt text, caption and credit.
- Required at least one Event Description item.
- Added original Event or source URL, last verification date and editorial reviewer.
- Improved Studio previews with language, date, format, location, Event status and significant registration status.
- Sanity TypeScript validation passed.
- Sanity Studio production build passed.
- Final whitespace validation passed.
- Complete schema diff was reviewed in focused sections.
- Schema checkpoint created and pushed:
  - `df72612 expand community event schema`

#### Automatic Event lifecycle queries
- Replaced the unused prototype Event query block with multilingual lifecycle-aware queries:
  - `UPCOMING_EVENTS_BY_LANGUAGE_QUERY`
  - `PAST_EVENTS_BY_LANGUAGE_QUERY`
  - `HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY`
  - updated `EVENT_BY_SLUG_QUERY`
- Upcoming Events are language-filtered and remain visible while ongoing.
- Current-versus-Past classification uses:
  - `coalesce(endDateTime, startDateTime) >= now()` for Upcoming or ongoing
  - `coalesce(endDateTime, startDateTime) < now()` for Past
- An Event without an end time uses its start time as the lifecycle cutoff.
- Past Events are ordered most recently completed first.
- Homepage query shows up to three Upcoming or ongoing Events.
- Featured Events receive priority; remaining positions are filled by soonest Events.
- Cancelled Events are excluded from homepage promotion but remain available in archives and individual pages.
- Postponed and Rescheduled Events remain discoverable and must be labelled clearly by the frontend.
- Individual Event lookup requires both slug and public content language.
- Expanded Event fields, verification metadata and inline image credits are projected.
- GROQ lifecycle expression was tested read-only against the production dataset and returned an expected empty array without query errors.
- Astro Check passed across 47 files with 0 errors and 0 warnings.
- Astro production build passed with the existing 13-page baseline.
- Query whitespace validation passed and complete Event-only diff was reviewed.
- Query checkpoint created and pushed:
  - `ffcaba9 add event lifecycle queries`

#### Event interface translations
- Confirmed only navigation-level Event labels previously existed.
- Added a complete symmetrical `events` translation object to:
  - `src/i18n/ne.ts`
  - `src/i18n/nb.ts`
- Added centralized labels for:
  - Upcoming, ongoing and Past Events
  - empty states and archive navigation
  - Event details, date, time and all-day presentation
  - ongoing and completed states
  - venue, address, map, accessibility and transport
  - organizer, contact and organizer website
  - actual Event languages and intended audience
  - free and paid Event information
  - registration requirement, status and deadline
  - external registration and ticket actions
  - external registration privacy notice
  - original source and last verification date
  - translation link
  - In-person, Online and Hybrid formats
  - Event submission call to action
  - Event statuses
  - registration requirements and statuses
  - Event-language labels
  - all Event category labels
- Used proofreader-approved Nepali Event wording before the translation milestone was applied.
- Retained a matching Norwegian translation structure.
- Astro Check passed across 47 files with 0 errors and 0 warnings.
- Production build passed with the existing 13-page baseline.
- Translation whitespace validation passed.
- Both translation files received exactly 87 insertions.
- Translation checkpoint created and pushed:
  - `6591f7a add event interface translations`

#### Event lifecycle and archive decision
- Ordinary completed Events will not be automatically unpublished.
- After an Event finishes, it will:
  - disappear from homepage promotion
  - leave the Upcoming section
  - appear automatically in a Past Events archive
  - retain its stable individual URL
  - display a Completed state
  - hide expired registration or ticket actions
- Cancelled Events remain visible until and after their original date with a prominent Cancelled state.
- Postponed Events remain accessible while awaiting a new date.
- Rescheduled Events display their new date with a Rescheduled state.
- Manual unpublishing is reserved for fraud, duplicates, unauthorized publication, privacy problems, safety concerns, legal issues or genuine organizer-removal requests.
- Time determines Upcoming, ongoing or Past classification; editorial status determines Scheduled, Postponed, Rescheduled or Cancelled presentation.

#### Planned organizer submission workflow
- Build a separate private `eventSubmission` document type instead of allowing public submissions directly into approved `communityEvent` documents.
- Planned bilingual organizer submission routes:
  - `/ne/events/submit/`
  - `/nb/events/submit/`
- Planned workflow:
  - organizer submits through a public form
  - submission enters a private moderation queue
  - staff verifies, edits and approves
  - staff creates or converts the approved public Event
  - staff publishes through Sanity
- Planned submission statuses:
  - New
  - Under review
  - More information requested
  - Approved
  - Converted to Event
  - Rejected
  - Duplicate
  - Withdrawn
  - Archived
- Separate private moderation contacts from public organizer contacts.
- Accept organizer source submissions in Nepali, Norwegian or English.
- Planned image requirements:
  - JPG, PNG or WebP
  - preferred landscape image around 1600 x 900 pixels
  - minimum recommended width around 1200 pixels
  - proposed maximum file size around 5 MB
  - alt text, image credit and publication-permission confirmation
  - posters accepted only as supplementary images; all essential details must also be entered as structured text
- Planned server-side validation, upload controls, rate limiting, spam protection, moderation, privacy declarations and retention rules.
- A Sanity write token must never be exposed in browser JavaScript.
- Public submissions must never publish automatically.

### Current Git Status
- Latest pushed checkpoint: `6591f7a add event interface translations`.
- The working tree should be verified after resuming.
- No public Event routes have been created yet.
- This append was prepared outside the repository and has not yet been appended or committed.

### Next Recommended Work
- Verify Git state at `6591f7a`.
- Append this milestone to `PROJECT_PROGRESS.md` and create a documentation-only checkpoint when convenient.
- Build bilingual public Event routes:
  - `/ne/events/`
  - `/nb/events/`
  - `/ne/events/past/`
  - `/nb/events/past/`
  - `/ne/events/[slug]/`
  - `/nb/events/[slug]/`
- Implement automatic Ongoing and Completed presentation.
- Hide registration actions after completion and for Cancelled Events.
- Implement safe translated-Event language-switch fallback.
- Integrate up to three Upcoming or ongoing Events on the homepage.
- Create one genuine controlled test Event in Sanity and verify desktop and mobile behavior.
- Build the private organizer-submission and moderation workflow only after the approved public Event routes are stable.
### Public Events Routes and Visual Validation Milestone

Completed and verified on 30 July 2026.

#### Public route package
- Created the first complete bilingual public Events route package:
  - `src/pages/[lang]/events/index.astro`
  - `src/pages/[lang]/events/past.astro`
  - `src/pages/[lang]/events/[slug].astro`
- Public routes now include:
  - `/ne/events/`
  - `/nb/events/`
  - `/ne/events/past/`
  - `/nb/events/past/`
  - future generated individual routes at `/ne/events/[slug]/` and `/nb/events/[slug]/`
- The route creator refused to overwrite existing files.
- Confirmed that no earlier Event route or placeholder existed under `src/pages/[lang]`.

#### Upcoming and ongoing Events archive
- Built a mobile-first chronological archive using `UPCOMING_EVENTS_BY_LANGUAGE_QUERY`.
- Events are presented soonest first rather than through a desktop-oriented month grid.
- Event cards support:
  - prominent date block
  - Event title and summary
  - Event category
  - In-person, Online or Hybrid format
  - venue, city or online platform
  - organizer
  - registration status where relevant
  - Featured image or a safe visual fallback
  - direct link to the individual Event page
- Ongoing Events receive an automatic Ongoing label.
- Postponed, Rescheduled and Cancelled states receive prominent labels.
- The archive includes a clear link to Past Events.
- The empty Sanity result displays the proofreader-approved Nepali empty state instead of a Coming Soon placeholder.

#### Past Events archive
- Built a separate bilingual Past Events archive using `PAST_EVENTS_BY_LANGUAGE_QUERY`.
- Past Events are ordered most recently completed first.
- Past Event cards retain:
  - completed date
  - title and summary
  - category
  - Event status
  - location
  - organizer
  - direct link to the persistent individual Event page
- The archive includes a clear link back to Upcoming Events.
- Empty Past Events state uses the proofreader-approved Nepali wording.

#### Individual Event pages
- Built language-safe static Event pages using `EVENT_BY_SLUG_QUERY`.
- Static paths are generated for published Nepali and Norwegian Event documents with usable slugs.
- Individual pages support:
  - breadcrumbs
  - title and summary
  - Event category and format
  - Scheduled, Postponed, Rescheduled and Cancelled states
  - automatic Ongoing and Completed states
  - featured image with caption and credit
  - Portable Text Event Description
  - credited inline images through the shared Sanity image component
  - date, time and all-day presentation
  - venue, address, city and map link
  - online platform details
  - organizer website
  - approved public organizer email and telephone
  - actual Event languages, including English
  - intended audience
  - price and flexible price description
  - registration requirement, status and deadline
  - accessibility information
  - transport or parking information
  - original source and last verification date
- Completed and Cancelled Event pages remain accessible as stable public records.

#### Registration safety
- Visitors register or buy tickets externally through the organizer or an external service.
- nepali.no does not collect participant-registration or payment data in Phase 1.
- External registration actions are shown only when:
  - the Event has not finished
  - the Event is not Cancelled
  - the Event is not Postponed
  - registration status is Open
  - a valid external registration or ticket URL exists
  - registration or tickets are required
  - the registration deadline has not passed, when a deadline exists
- Rescheduled Events may still accept registration when the above conditions are satisfied.
- Completed, Cancelled, Postponed, closed, sold-out or deadline-expired Events show an unavailable or status message instead of an active registration action.
- The individual Event page displays the centralized external-registration privacy notice.

#### Translation behavior
- A direct translated-Event link is used only when the referenced Event has:
  - a usable slug
  - the expected alternate public language
- When no eligible translated Event exists, the header language switch falls back to the alternate-language Events archive.
- Interface wording is taken from the centralized `labels.events` objects in `ne.ts` and `nb.ts`.

#### Validation
- Astro Check passed across 50 files with:
  - 0 errors
  - 0 warnings
  - 55 informational hints
- Astro production build passed.
- Static page baseline increased from 13 to 17 pages.
- Generated routes included both Upcoming and both Past Events archives.
- No individual Event route was generated because the production dataset still contained zero Event documents.
- `git diff --check` passed.
- The three new route files were reviewed and staged as Added files.
- Route checkpoint created and pushed:
  - `cc2467c add public event routes`

#### Visual deployment validation
- Verified the deployed Nepali Upcoming Events archive on desktop and mobile.
- Verified the deployed Nepali Past Events archive on desktop and mobile.
- Confirmed:
  - responsive header and mobile menu
  - proofreader-approved Nepali Events wording
  - clear Upcoming/Past archive navigation
  - readable headings and empty states
  - no horizontal overflow in supplied mobile screenshots
  - complete responsive footer
  - no empty Coming Soon placeholder on the Event archive pages
- The large desktop empty-state space is acceptable for the empty dataset and should be reassessed after genuine Event cards are present rather than redesigned prematurely.

### Current Git Status
- Latest pushed checkpoint: `cc2467c add public event routes`.
- `git status --short` returned no output after the push.
- The working tree was clean when this append was prepared.
- This milestone has now been appended to PROJECT_PROGRESS.md and is awaiting a documentation-only checkpoint.

### Exact Next Work
1. Create one genuine controlled Nepali Event in Sanity Studio.
2. Publish it and allow the existing Sanity webhook to rebuild the public site.
3. Validate:
   - Upcoming archive card
   - localized date and time
   - category and format labels
   - organizer and location information
   - actual Event-language labels
   - external registration safety
   - image, caption and credit
   - individual Event page
   - source and verification metadata
   - desktop and mobile presentation
4. Create a Norwegian translated Event only if useful for the first test; a missing translation must safely fall back to the Norwegian Events archive.
5. Integrate up to three Upcoming or ongoing Events into the homepage using `HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY`.
6. After the approved public Event workflow is stable, build the separate private `eventSubmission` schema, bilingual organizer submission form and moderated staff workflow.
### First Genuine Event, Timezone and Compact Date Presentation Milestone

Completed and verified on 31 July 2026.

#### First genuine controlled Nepali Event
- Created and published the first genuine Nepali Community Event through the Vercel-hosted Sanity Studio.
- The Event is based on the official IMDi conference:
  - Fagverksted for bosetting og kvalifisering 2026 - "A hore til"
  - 15-16 October 2026
  - Clarion Hotel & Congress Oslo Airport, Gardermoen
- Public content language: Nepali.
- Actual Event language: Norwegian.
- Event type: Workshops and seminars.
- Event format: In person.
- Event status: Scheduled.
- Organizer: Integrerings- og mangfoldsdirektoratet (IMDi).
- Registration is handled externally by the organizer.
- No Norwegian translated Event document was created for this controlled milestone.
- The Event was published without an image because no organizer-approved reusable image was available.
- The existing no-image archive fallback was therefore exercised intentionally.
- Sanity publication triggered the established public Vercel deploy webhook automatically.
- The public Astro production build increased from 17 to 18 generated pages.
- Generated individual route:
  - `/ne/events/imdi-fagverksted-bosetting-kvalifisering-2026/`

#### Public Event workflow validation
- Verified that the genuine Event appears in the Nepali Upcoming Events archive.
- Verified the individual Nepali Event page.
- Confirmed public presentation of:
  - Event title and summary
  - Event category and in-person format
  - venue and city
  - organizer and public contact
  - actual Event language
  - intended audience
  - external registration status and action
  - official source
  - last verification date
  - all-day and multi-day data
- Verified the archive card and individual page on desktop and mobile.
- Confirmed that the Event Description uses normal body weight after accidental Portable Text bold formatting was removed in Sanity and republished.
- Confirmed that no manual public Vercel redeployment was required for the Sanity content correction.

#### Event timezone correction
- Genuine Event testing revealed that a Norwegian midnight timestamp could display as the previous calendar date in Vercel's UTC build environment.
- The Sanity Event value was correct; the defect was in frontend date formatting without an explicit display timezone.
- Added the IANA timezone `Europe/Oslo` to Event date and time formatting in:
  - `src/pages/[lang]/events/index.astro`
  - `src/pages/[lang]/events/past.astro`
  - `src/pages/[lang]/events/[slug].astro`
- Daylight-saving changes are now handled automatically by the timezone database.
- Editors do not need and must not receive a manual daylight-saving switch.
- Event lifecycle comparisons remain based on absolute timestamps and were not changed.
- Code checkpoint created and pushed:
  - `7be4e4d fix Event timezone formatting`

#### Multi-day Event range presentation
- Genuine Event testing showed that the archive metadata and individual Event page displayed only the start date even when an end date existed.
- Added locale-aware `Intl.DateTimeFormat.formatRange()` handling to:
  - the Upcoming Events archive metadata
  - the individual Event details panel
- Preserved the compact calendar block as a start-date marker.
- Used neutral HTML wrappers for visible date ranges rather than associating a multi-day visible range with a single-instant `datetime` value.
- Code checkpoint created and pushed:
  - `28c07e2 show Event date ranges`

#### Compact localized date presentation
- Live review showed that full weekday-rich date ranges were accurate but visually crowded in compact Event layouts.
- Refined the Upcoming archive to omit weekday names and omit the year when the complete Event falls within the current Oslo calendar year.
- Current-year archive example:
  - `15-16 October • All day`, localized by the active page language
- Another-year archive example:
  - `15-16 October 2027 • All day`, localized by the active page language
- Refined the individual Event page to omit weekday names while retaining the year.
- Current individual-page example:
  - `15-16 October 2026`, localized by the active page language
- Current-year detection uses `Europe/Oslo`, not the Vercel server timezone.
- Cross-month and cross-year ranges remain unambiguous through locale-aware range formatting.
- Removed the archive helper that became unused after the compact-date refinement.
- Code checkpoint created and pushed:
  - `5e1a953 compact Event date ranges`

#### Validation
- `git diff --check` passed for each code checkpoint.
- Astro Check passed across 50 files with:
  - 0 errors
  - 0 warnings
  - 55 informational hints
- Astro production build passed with 18 generated pages.
- Live deployment confirmed:
  - correct 15 October start date rather than the previous-day UTC shift
  - complete 15-16 October range
  - compact archive presentation
  - year retained on the individual Event page
  - no weekday names in the compact range
  - unchanged venue, organizer, registration, source and lifecycle presentation

#### Known visual refinement
- The current no-image archive fallback is a large dark empty rectangle.
- It is functional and acceptable for the present milestone but visually dominant and not purpose-specific.
- Later evaluate a lightweight branded Event placeholder, category-aware fallback, or a compact no-image card layout.
- Do not delay homepage Events integration or the current Phase 1 milestone for this refinement.

### Current Git Status
- Latest pushed checkpoint: `5e1a953 compact Event date ranges`.
- `git status --short` returned no output after the push.
- HEAD, local `main`, `origin/main` and `origin/HEAD` were synchronized at `5e1a953`.
- This milestone has now been appended to `PROJECT_PROGRESS.md` and is awaiting a documentation-only checkpoint.

### Exact Next Work
1. Verify the individual Event page language switch safely falls back to `/nb/events/` when no Norwegian translated Event exists.
2. Confirm the compact date presentation on the Norwegian archive with genuine or controlled language-appropriate data when practical.
3. Integrate up to three Upcoming or ongoing Events into the multilingual homepage using `HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY`.
4. Preserve the existing homepage rule that no empty Coming Soon Event section should appear at official presentation.
5. After homepage Events integration is stable, design the separate private `eventSubmission` schema, bilingual organizer-submission form and moderated staff workflow.
6. Revisit the no-image Event fallback as a later isolated visual refinement.

### Private Event Submission Foundation and Moderation Workspace Milestone

Completed and verified on 31 July 2026.

#### Storage and plan decision
- Selected Sanity Growth for private organizer-submission storage.
- Upgraded the Sanity project from Growth Trial to the active paid Growth plan.
- Created the second included dataset:
  - name: `submissions`
  - visibility: Private
  - started empty
  - no copy or clone of `production`
- Preserved the existing public `production` dataset for approved public editorial content only.
- Current dataset boundary:
  - `production`: public News, Public Information, Topic Hubs, approved Community Events, approved Business Listings and other public editorial content
  - `submissions`: private organizer proposals, private contacts, moderation records, declarations and retention metadata
- Sanity Growth currently uses both included datasets, 2 of 2.
- The future forum platform has not been selected. Discourse remains only the current front-runner pending a structured platform review. The future forum must maintain its own appropriate operational data store and must not use the private Sanity submission dataset as its forum database.

#### Permanent Event-submission architecture
- Added `EVENT_SUBMISSION_ARCHITECTURE.md` as the authoritative repository document for the submission boundary.
- Documented:
  - Nepali, Norwegian Bokmal and English submission interfaces
  - English as a submission and source-information language, not a complete English public website
  - separation of form language, submission language, actual Event language and requested public output language
  - strict separation between `eventSubmission` and public `communityEvent`
  - no automatic public publication
  - no browser-side Sanity write token
  - private and proposed public organizer-contact separation
  - server-side allowlisting and validation requirements
  - direct file-upload deferral
  - moderation workflow
  - privacy, retention and deletion requirements
  - Sanity private dataset as the selected production architecture
  - requirement to use synthetic data until the complete endpoint and privacy workflow are verified
- Foundation checkpoint created and pushed:
  - `43d0a7d add Event submission foundation`

#### Private Event Submission schema
- Added:
  - `sanity/schemaTypes/eventSubmission.ts`
  - `sanity/schemaTypes/submissionSchemaTypes.ts`
- The private submission schema supports:
  - moderation statuses: New, Under review, More information requested, Approved, Converted, Rejected, Duplicate, Withdrawn and Archived
  - server-generated submission timestamp
  - Nepali, Norwegian and English form-interface languages
  - submission content language, including Other
  - requested Nepali, Norwegian, both or editorial-decision public output
  - assigned reviewer, internal notes and clarification notes
  - retention review date
  - final public Event ID, URL and conversion timestamp
  - private organizer name, contact person, email, telephone and preferred contact language
  - conditional Other preferred contact language
  - separately proposed public organizer name, website, email and telephone
  - explicit permission before proposed public email or telephone may be published
  - proposed Event title, summary and full plain-text source description
  - actual Event languages and conditional Other language
  - Event category, format, all-day setting, dates, venue, map, online information, accessibility, transport and audience
  - source URL
  - registration requirement, status, URL and deadline
  - validation that No registration required uses Not applicable status and other requirements use a real current status
  - free or described pricing
  - proposed image URL, alternative-text suggestion, image credit and publication-rights confirmation
  - required authority, accuracy, editing/translation, no-publication-guarantee and privacy/retention declarations
- No reference to public `communityEvent` was introduced.
- Cross-dataset references are deliberately avoided; approved public Event ID and URL are stored as controlled metadata after staff conversion.
- The schema was not registered in the public `production` schema index.
- Sanity TypeScript validation and Studio build passed before the foundation checkpoint.

#### Separate Sanity Studio workspaces
- Updated `sanity/sanity.config.ts` to define two workspaces.
- Public Content workspace:
  - workspace name: `public-content`
  - base path: `/content`
  - dataset: `production`
  - existing public `schemaTypes`
  - Structure and Vision tools retained
- Event Moderation workspace:
  - workspace name: `event-moderation`
  - base path: `/event-moderation`
  - dataset: private `submissions`
  - only `submissionSchemaTypes`
  - Structure tool only
  - Publish, Unpublish and Duplicate actions removed for `eventSubmission`
- The workspace selector was visually confirmed in the deployed Vercel-hosted Studio.
- Private moderation-workspace checkpoint created and pushed:
  - `e3efbc6 add private Event moderation workspace`

#### Vercel Studio SPA routing correction
- Multi-workspace Studio navigation initially produced Vercel `404: NOT_FOUND` responses on direct workspace URLs.
- Confirmed that Sanity Studio built as a single-page application with `sanity/dist/index.html` and static assets under `sanity/dist/static/`.
- Added a narrowly scoped root `vercel.json` for Studio workspace SPA rewrites.
- An initial downloaded `vercel.json` was accidentally saved as an empty file and transparently committed:
  - `fdc7f86 fix Studio workspace routing`
- The empty file produced an expected failed Vercel deployment and was corrected immediately without rewriting Git history.
- Added the real JSON configuration:
  - `31e125b configure Studio workspace rewrites`
- Initial wildcard rules did not match the workspace root URLs.
- Added explicit exact rules for workspace roots with and without trailing slashes while preserving nested wildcard rules:
  - `/content`
  - `/content/`
  - `/content/:path*`
  - `/event-moderation`
  - `/event-moderation/`
  - `/event-moderation/:path*`
- Final routing checkpoint created and pushed:
  - `ec88d63 cover Studio workspace root routes`
- The rewrites remain narrowly scoped. No global catch-all was introduced.

#### Routing and visual validation
- Confirmed HTTP 200 for:
  - `https://nepali-no-studio.vercel.app/`
  - `https://nepali-no-studio.vercel.app/content`
  - `https://nepali-no-studio.vercel.app/content/`
  - `https://nepali-no-studio.vercel.app/event-moderation`
  - `https://nepali-no-studio.vercel.app/event-moderation/`
  - `https://nepali-no.vercel.app/ne/events/`
- Confirmed the nested moderation route loads:
  - `/event-moderation/structure/eventSubmission`
- Visually confirmed that Event Moderation shows only:
  - Event Submission
- Confirmed the private moderation workspace does not show News Articles, approved Community Events, Business Listings, Public Information Guides or Topic Hubs.
- Confirmed no Vision tool is shown in Event Moderation.
- The private `submissions` dataset is empty at this checkpoint.
- No genuine organizer names, email addresses, telephone numbers or confidential proposals have been entered.

#### Codespaces operational note
- GitHub Codespaces free included usage was exhausted during this milestone.
- Codespaces paid usage had a zero-dollar stopping budget, so the existing Codespace was temporarily blocked without generating a charge.
- A controlled paid Codespaces budget was enabled to resume work.
- All project work had already been pushed before the interruption.
- Continue stopping the Codespace during breaks and keep spending capped.

### Current Git Status
- Latest pushed checkpoint: `ec88d63 cover Studio workspace root routes`.
- `git status --short` returned no output after the push and routing validation.
- HEAD, local `main`, `origin/main` and `origin/HEAD` were synchronized at `ec88d63`.
- This milestone has now been appended to `PROJECT_PROGRESS.md` and is awaiting a documentation-only checkpoint.

### Exact Next Work
1. Open the blank Event Submission editor in the private Event Moderation workspace.
2. Confirm Publish, Unpublish and Duplicate actions are absent before entering data.
3. Create one clearly marked synthetic submission only:
   - title: `SYNTHETIC TEST - Delete after moderation validation`
   - use fictional organizer and contact information
   - do not use any real email address, telephone number or confidential proposal
4. Validate moderation defaults, language choices, conditional Other-language fields, private/public contact separation, registration consistency, date validation, image permission and required declarations.
5. Confirm the synthetic document is stored only in the private `submissions` dataset and never appears in `production` or public Event routes.
6. Delete the synthetic submission after moderation validation unless it is temporarily needed for endpoint testing.
7. Only after the private moderation workflow is stable, install the Vercel adapter and build the server-side submission endpoint.
8. The future endpoint must use a dedicated server-only robot token, allowlist visitor fields, generate internal fields server-side, add spam protection and rate limiting, and never expose the token to browser JavaScript.
9. Add Nepali, Norwegian and English public submission forms only after endpoint, privacy, retention and abuse controls are validated.
### Secure Event Submission Endpoint and Private Storage Milestone

Completed and verified on 1 August 2026.

#### Public Event completion validation
- Reconfirmed the Nepali individual IMDi Event, Upcoming archive and Past archive.
- Confirmed the untranslated Event language switch safely falls back from the Nepali individual Event to `/nb/events/`.
- Confirmed the Norwegian Upcoming and Past archives display correct localized empty states and support navigation in both directions.
- Confirmed the external registration, organizer, map and original-source links open the expected destinations.
- Confirmed the public Events archive remains isolated from all private submission records.
- The large dark no-image Event fallback remains accepted temporarily and is reserved for a later isolated visual refinement.

#### Private moderation workflow validation
- Completed a full synthetic Event Submission manually in the private Event Moderation workspace.
- Confirmed Publish, Unpublish and Duplicate actions are absent.
- Confirmed moderation groups, defaults and conditional fields work.
- Confirmed Other submission language, Other preferred contact language and Other Event language behavior.
- Confirmed private and proposed public organizer contacts remain separate.
- Confirmed proposed public email or telephone requires explicit publication permission.
- Confirmed Event end time must be later than the start time.
- Confirmed registration requirement and status consistency.
- Confirmed an image URL requires image-publication permission.
- Confirmed all five required declarations validate correctly.
- Confirmed the manually created synthetic record remains a private draft.

#### Secure Vercel server adapter
- Installed and configured `@astrojs/vercel@11.0.4` while preserving static output for public pages.
- Added a targeted npm override so `@vercel/routing-utils@5.3.3` resolves patched `path-to-regexp@6.3.0` instead of vulnerable `6.1.0`.
- Added `.vercel` to `.gitignore`.
- Verified Astro Check with 0 errors and 0 warnings.
- Verified all existing public routes remained prerendered while the Event-submission API was emitted as a Vercel server function.
- Adapter checkpoint created and pushed:
  - `d808511 add secure Vercel server adapter`

#### Event-submission endpoint skeleton
- Added the on-demand endpoint:
  - `src/pages/api/event-submissions.ts`
- The initial endpoint:
  - accepted POST requests only
  - accepted JSON only
  - enforced a 64 KiB request limit using declared and actual byte length
  - rejected malformed JSON and non-object payloads
  - returned JSON with `Cache-Control: no-store`
  - performed no Sanity mutation
  - returned a deliberate service-disabled response for valid input
- Confirmed the generated Vercel routing configuration maps `/api/event-submissions` to the server function.
- Live deployment tests passed for method rejection, malformed JSON, invalid payload shape, valid disabled input and oversized requests.
- Astro additionally blocked browser-style cross-site plain-text POST submissions before the endpoint handler.
- Endpoint-skeleton checkpoint created and pushed:
  - `9646a64 add Event submission endpoint skeleton`

#### Strict allowlisting and validation
- Added:
  - `src/lib/eventSubmissions/validateEventSubmission.ts`
- The validator now:
  - accepts only explicit visitor-facing fields
  - rejects unknown and internal fields such as `_id`, `_type`, `moderationStatus`, reviewer notes and conversion metadata
  - trims and normalizes strings
  - enforces field-length limits
  - validates supported interface, submission, public-output and Event languages
  - validates Event categories, formats and registration values
  - validates email addresses and HTTP or HTTPS URLs
  - requires ISO datetimes with explicit timezones
  - rejects impossible calendar dates
  - requires end time later than start time
  - enforces conditional Other-language values
  - enforces physical and online Event requirements
  - enforces registration requirement and status consistency
  - enforces free and paid price consistency
  - enforces public-contact and image-publication permission
  - requires all five declarations
  - normalizes duplicate Event-language values
  - supports a `website` honeypot field
  - limits returned validation errors
- All 16 automated synthetic validation tests passed.
- Live tests confirmed rejection of internal fields, filled honeypot, impossible dates and missing declarations.
- A fully valid synthetic payload reached the deliberate disabled-storage response.
- Validation checkpoint created and pushed:
  - `5fc192b validate Event submission payloads`

#### Server-only Sanity credential
- Created the Sanity robot token:
  - name: `nepali.no Event Submission Endpoint`
  - role: Contributor
  - expiration: No expiration
- Stored the token only in the public `nepali-no` Vercel project as:
  - `SANITY_EVENT_SUBMISSION_TOKEN`
- The value is Sensitive and enabled for Production only.
- The token was not placed in Git, source files, chat, screenshots, Codespaces environment files or a `PUBLIC_` variable.
- Contributor can create and edit drafts but cannot publish documents.
- Growth does not provide a custom dataset-scoped role, so the endpoint independently hard-codes the private dataset and server-controlled document fields.

#### Controlled private draft storage
- Added:
  - `src/lib/eventSubmissions/createEventSubmission.ts`
- The storage helper hard-codes:
  - Sanity project: `f9johco4`
  - dataset: `submissions`
  - API version: `2026-03-01`
  - document type: `eventSubmission`
  - moderation status: `new`
- The server generates:
  - UUID submission reference
  - draft ID using `drafts.eventSubmission-<UUID>`
  - `submittedAt` timestamp
- Server-controlled fields are applied after normalized visitor data so they cannot be overwritten even if the validator changes later.
- The storage client uses `useCdn: false` and never exposes the token.
- Missing-token failures return a generic 503 response.
- Sanity storage failures return a generic 500 response and log only the error class name, not the payload, contacts or token.
- Private-storage checkpoint created and pushed:
  - `12be7cd store private Event submissions`

#### End-to-end private storage proof
- Submitted one fully synthetic payload through the deployed public endpoint.
- Received HTTP 201 with `submission_received`, a server-generated submission reference and server-generated timestamp.
- Confirmed the endpoint-generated record appears in the private Event Moderation workspace as:
  - `SYNTHETIC ENDPOINT TEST - Delete after storage validation`
- Confirmed the endpoint-generated record is a Draft.
- Confirmed moderation status is `New`.
- Confirmed Submitted At is server-generated and appears in Studio using local display time.
- Confirmed the form interface language and normalized synthetic Event data were stored correctly.
- Confirmed the record did not create a public Community Event.
- Retained both clearly marked synthetic records temporarily for notification, form-mapping and endpoint workflow tests.

#### Current security boundary
- Public visitors cannot control the dataset, document type, document ID, moderation status, submission timestamp, reviewer fields, internal notes or conversion metadata.
- The browser never receives the Sanity write token.
- Submissions are drafts in the private `submissions` dataset.
- The Contributor robot token cannot publish documents.
- Staff must review, edit and intentionally create approved public `communityEvent` documents in `production`.
- The public Events archive continues to read only approved public Event documents from `production`.

### Current Git Status
- Latest pushed checkpoint: `12be7cd store private Event submissions`.
- `git status --short` returned no output after the push and end-to-end test.
- HEAD, local `main`, `origin/main` and `origin/HEAD` were synchronized at `12be7cd`.
- This milestone has now been appended to `PROJECT_PROGRESS.md` and is awaiting a documentation-only checkpoint.

### Exact Next Work
1. Add basic rate limiting before opening the endpoint to genuine visitors.
2. Add an administrative notification for each successfully stored new submission.
3. Keep the private moderation queue as the authoritative record even if notification delivery fails.
4. Ensure notification content contains only minimal operational information and a secure moderation link, not full private contact details.
5. Test successful notification, notification failure and duplicate or repeated submissions using synthetic data only.
6. Build the Nepali Event-submission form.
7. Build the Norwegian Event-submission form.
8. Build the limited English Event-submission form without enabling a complete English public website.
9. Add localized success, validation and temporary-failure states.
10. Add `Submit an Event` links to the Nepali and Norwegian Events archives only after the form service is operational.
11. Later add submission links to the homepage Events section and the appropriate footer participation area.
12. Connect `HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY`, show Featured and Upcoming Events and hide the section when no suitable Events exist.
13. Remove remaining homepage dummy, placeholder and Coming Soon content.
14. Delete both synthetic submission records before public launch unless one is formally retained as a governed test fixture.
