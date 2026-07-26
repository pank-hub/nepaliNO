# nepali.no Project Provenance

## Purpose

nepali.no is a purpose-built, nonprofit and public-benefit digital community platform for the Nepali community in Norway.

The platform is designed to:

- provide community news from Norway and Nepal
- improve access to reliable information about Norwegian public services
- support young Nepali Norwegians as well as Nepali-speaking residents
- promote cultural participation, volunteering, integration, and digital inclusion
- provide community events, discussions, and a directory of Nepali-owned businesses
- create a credible bridge between the community, Norwegian public agencies, NGOs, partners, and potential funders

## Custom Development Statement

The application architecture, Sanity content models, multilingual structure, public-information review workflow, GROQ queries, Astro routes, and future user experience are being designed and implemented specifically for nepali.no.

nepali.no is not based on a purchased website template, cloned community portal, or prebuilt news theme.

The project uses established open-source frameworks, libraries, and hosted services as technical foundations. Custom development in this repository integrates and extends those technologies for the specific mission, audience, editorial requirements, and public-benefit goals of nepali.no.

## Project Ownership and Stewardship

Project owner and principal developer:

Pankaj Kafley

The project owner is responsible for:

- defining the platform mission and target audiences
- making product and architectural decisions
- reviewing and testing implementation work
- maintaining the source repository and Git history
- managing content governance, partnerships, and future funding
- ensuring that the platform remains aligned with its nonprofit and public-benefit purpose

## Technology Foundations

The platform currently uses:

- Astro for the public website, routing, rendering, and SEO
- Tailwind CSS for the future visual design system
- Sanity for structured content, editorial workflows, and hosted content data
- GROQ for querying Sanity content
- Vercel as the planned frontend hosting platform
- NodeBB as the planned community discussion platform on a separate VPS
- Domeneshop for domain and DNS management
- GitHub for source control, development history, and recovery checkpoints

Additional open-source packages are recorded in package.json and the relevant lockfiles.

Use of open-source software does not imply that nepali.no is a generic template. The repository contains project-specific architecture, schemas, queries, validation rules, multilingual behavior, routes, and editorial safeguards.

## AI-Assisted Development

Microsoft Copilot has been used as an AI-assisted development partner for:

- architectural planning
- code drafting
- troubleshooting
- documentation
- validation guidance
- project continuity and recovery prompts

The project owner makes the product decisions, reviews the implementation, runs the development commands, verifies results, and controls all Git commits and deployments.

AI assistance is treated as a development tool. It does not replace project ownership, human review, editorial responsibility, testing, governance, or accountability.

## Public Information Safeguards

A major platform pillar is understandable guidance based on official information from Norwegian public bodies such as UDI, Skatteetaten, NAV, Helsenorge, municipalities, and other agencies.

The custom Public Information Guide model includes:

- responsible public agency
- primary and additional official source links
- last-reviewed and next-review dates
- editorial reviewer
- important Norwegian terminology and explanations
- multilingual content and optional linked translations
- active, needs-review, and archived workflow states
- urgent and featured information controls
- optional funding or partner acknowledgement

nepali.no does not present itself as a government agency and does not replace official legal, tax, immigration, health, welfare, or administrative guidance.

## Multilingual and Inclusive Design

The language principle is:

> Nepali-first, but never Nepali-only.

The initial interface languages are Nepali and Norwegian Bokmal. The multilingual architecture is designed to serve both Nepali-speaking residents and young Nepali Norwegians who may prefer Norwegian.

Accessibility, semantic HTML, understandable navigation, image alternative text, mobile usability, and transparent editorial labeling are core project requirements.

## Development Evidence

Development is preserved through incremental Git commits. Each stable milestone is validated, committed, and pushed to the main branch.

The Git history provides evidence of the project's step-by-step development, including:

- Astro, Tailwind CSS, and Sanity initialization
- custom News Article, Community Event, Business Listing, and Public Information Guide schemas
- project-specific GROQ queries
- multilingual News routing
- multilingual Public Information archive routing
- dynamic Public Information guide rendering
- Portable Text and Sanity image integration

Git commit hashes and dates are the authoritative technical record of when each milestone was added.

## Content and Third-Party Rights

Custom editorial content, original branding, and project-specific materials created for nepali.no remain subject to the ownership and licensing decisions of the project owner.

Third-party frameworks, libraries, services, images, trademarks, public-agency materials, and externally sourced content retain their respective licenses, terms, and rights.

Official public information should be explained and linked responsibly. It should not be copied in a way that misrepresents ownership, authority, currency, or legal meaning.

## Funding and Partner Transparency

Future financial support, grants, sponsorships, and partnerships should be disclosed clearly where relevant.

Funding acknowledgement must not obscure editorial responsibility. Sponsored or promoted content must be distinguishable from independent editorial content and public-information guidance.

## Maintenance

This document should be updated when there are material changes to:

- ownership or project stewardship
- core architecture
- licensing
- development methods
- funding arrangements
- major partners
- editorial governance
- public-information safeguards
