# ADR-001: Use Discourse on Gigahost for the Phase 1 Forum

- Status: Accepted
- Decision date: 8 August 2026
- Owner: Pankaj Kafley

## Context

nepali.no requires a moderated community Forum that remains separate from verified editorial content. Discourse, NodeBB, and Flarum were evaluated. A private Discourse proof of concept was installed and operated on Gigahost in Norway. Moderation, email, backup, category, account, and API behavior were tested sufficiently to settle the Phase 1 platform direction.

## Decision

Use Discourse as the Phase 1 Forum platform and keep it hosted separately on Gigahost.

Sanity remains the editorial content system. Vercel hosts the public Astro application and server-side metadata bridge. Vercel does not host Discourse.

## Consequences

- Discourse owns users, topics, posts, moderation, and Forum backups.
- Gigahost server operation, patching, recovery, and monitoring remain project responsibilities.
- Forum credentials remain server-side.
- News and Guides may hold approved numeric topic references in Sanity.
- Forum failure must not break editorial pages.
- Public activation remains reversible through developer-controlled flags.
- NodeBB and Flarum evaluation is archived and no longer part of ordinary Phase 1 implementation decisions.

## Security rationale

The Vercel server function stores the restricted caller credential because Vercel makes the authenticated request to Discourse. The browser receives only normalized, approved metadata.

The current pilot key is tied to a dedicated non-staff account, uses granular topic-read scope, and is restricted to synthetic topic ID 13.

## Remaining conditions

The platform decision does not itself authorize public launch. Restoration testing, moderation staffing, privacy documentation, incident procedures, and public integration gates remain mandatory.
