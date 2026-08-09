# Forum Integration Contract

**Status:** Resolver and disabled public request contract production-proven; public presentation disabled
**Current checkpoint:** `194deec`
**Last reviewed:** 8 August 2026

## 1. Purpose

This document defines the safe integration between Sanity editorial content, the Astro application on Vercel, and Discourse on Gigahost.

## 2. Ownership model

- Sanity owns News Articles, Public Information Guides, publication state, language, and approved topic relationships.
- Discourse owns topics, posts, users, moderation, visibility, activity, and open or closed state.
- Vercel server functions form the authenticated bridge.
- Browser code never receives the Discourse API key.

## 3. Sanity relationship model

Reusable object: `forumTopicReference`

Stored fields:

- positive numeric Discourse topic ID
- optional internal editorial label

News fields:

- `forumDiscussion`: zero or one companion topic
- `relatedForumTopics`: zero to three curated topics

Guide fields:

- `forumQuestionsTopic`: zero or one long-lived topic
- `relatedForumTopics`: zero to three curated topics

Sanity does not store posts, usernames, reply counts, status, activity, or credentials.

## 4. News behavior

A News article may show a restrained promotional panel such as “Discuss this article in the Forum.”

The panel may show:

- topic link
- reply count
- open or closed state
- short community-content disclaimer

A News topic may later close. A closed discussion may remain readable with a clearly closed state.

## 5. Guide behavior

A Guide may show “Questions and community experiences.”

The topic supports follow-up questions and practical experience sharing and should normally remain open. The interface must state that community contributions do not replace official sources or verified guidance.

## 6. Related-topic presentation

Each content item may eventually show up to three related topics.

Initial selection is editorial and manual. Automatic tag matching may later fill empty positions only after language, moderation, visibility, and relevance rules are proven.

Desktop may use the existing sidebar. Mobile must move related topics below the main content.

## 7. Server-only client

Implementation: `src/lib/forum/discourseMetadata.ts`

The client:

- validates a positive integer topic ID
- reads Production-only Vercel variables at runtime
- sends `Api-Key` and `Api-Username` headers server-side
- uses a five-second timeout
- validates the returned topic ID, title, and post count
- extracts only approved metadata
- does not return post bodies, users, emails, flags, or moderation records

Environment variable names:

- `DISCOURSE_FORUM_METADATA_API_KEY`
- `DISCOURSE_FORUM_METADATA_API_USERNAME`

Never record values in documentation.

## 8. Verified count semantics

Discourse `posts_count` includes the opening topic post.

Production proof using synthetic topic ID 13:

- opening post: 1
- replies: 0
- `postsCount`: 1
- `replyCount`: 0

Public reply count must use:

```ts
Math.max(0, postsCount - 1)
```

Do not display raw `postsCount` as replies.

## 9. Relationship resolver and protected diagnostics

Implementations:

- `src/lib/forum/normalizeForumRelationships.ts`
- `src/lib/forum/resolveContentForumRelationships.ts`
- protected route `/translations/api/forum-metadata-status`

Normal News resolution requires a matching language and slug, defined `publishedAt`, and `publishedAt <= now()`. Normal Guide resolution requires a matching language and slug and `status == "active"`.

The resolver:

- accepts only `ne` and `nb`
- validates bounded ASCII slugs
- validates positive integer topic IDs
- preserves editorial related-topic order
- removes duplicate topic IDs
- excludes a companion topic duplicated among related topics
- limits related topics to three
- distinguishes `newsDiscussion`, `guideQuestions`, and `related` roles

Protected production diagnostics prove that the resolver rejects:

- the future-dated synthetic News article in ordinary production mode
- a published News article without a Forum relationship
- an active Guide without a Forum relationship
- a nonexistent News slug
- an existing News slug with the wrong language

Only after all rejection diagnostics pass does the protected route use the isolated synthetic mode and contact Discourse for topic ID 13.

Synthetic Sanity fixture:

- type: `newsArticle`
- language: `nb`
- slug: `syntetisk-test-forum-integrasjon`
- future publication date: 13 August 2099
- companion topic ID: 13

Verified normalized metadata:

- relationship role `newsDiscussion`
- topic ID 13
- `postsCount` 1
- `replyCount` 0
- open and not archived
- category ID 10
- no tags

## 10. Public endpoint request contract and disabled state

Public route: `/api/forum-content`

Future enabled-state identity parameters:

- `contentType`: exactly one of `newsArticle` or `publicInformationGuide`
- `language`: exactly one of `ne` or `nb`
- `slug`: one bounded ASCII slug

The request parser rejects missing, empty, duplicate, unknown, unsupported, path-like, and Unicode parameters. A caller cannot supply a topic ID, relationship role, Forum URL, category, or synthetic-mode switch.

Current disabled behavior:

- the feature flag is checked before the request URL is parsed
- generic HTTP 404
- `Cache-Control: no-store`
- no article identity, validation detail, Sanity lookup, or Forum metadata
- no query parameters, valid-looking identities, and malformed requests all receive the same response

Production verification included a malformed request containing `topicId=13`; the response remained the same generic 404.

Configuration flags remain false:

- `contentIntegrationEnabled`
- `relatedTopicsEnabled`

## 11. Production key boundary

Metadata and publishing credentials remain separate:

- `forum-metadata`: dedicated non-admin, non-moderator metadata identity with the restricted pilot read credential used by protected diagnostics
- `forum-publisher`: dedicated non-admin, non-moderator account, locked at Trust Level 0, with a Single User granular `topics -> write` key
- Sanity automation uses a separate Editor robot token for authoritative production-document updates
- Sanity webhook signatures use a separate shared secret

All values are stored only in the password manager and Production-only Sensitive Vercel variables. No browser receives any credential or write capability.

## 12. Failure behavior

- Missing relationship: no public Forum presentation.
- Missing, hidden, deleted, private, staff, or inaccessible topic: no public presentation.
- Discourse timeout or failure: News or Guide remains fully usable.
- Missing credential: controlled server failure, never credential detail.
- Unexpected response: reject metadata.
- Closed Guide topic: controlled state or editorial review, not a false invitation to reply.

## 13. Automated verification

Every pull request targeting `main` now runs dependency-free Node suites covering:

- relationship normalization
- public request-contract parsing
- metadata orchestration and role-aware category eligibility
- companion-topic draft construction and publisher validation
- signed Sanity publishing workflow and reconciliation behavior
- the Sanity slug-object regression

The expected full Forum total after PR #39 is 54 passing tests, followed by Astro Check and the production build. CI does not contact live Sanity or Discourse services.

## 14. Next implementation stage

- complete backup restoration and rollback proof before hostname changes
- establish `forum.nepali.no` as the sole final canonical Forum identity
- update the server-owned Forum base URL only after DNS, TLS, Discourse, and email are verified
- repeat protected metadata and automatic publishing proofs on the final hostname
- apply upgrade-safe visual alignment and a visible `Norsk | English` selector
- build shared News and Guide presentation components only after the final hostname is stable
- preserve the public disable switch, safe empty states, and independent site operation
- add the controlled homepage discussion feed as a separate later milestone


## Role-aware category policy

Category eligibility is server-controlled and relationship-role specific:

- `newsDiscussion`: category 10, News Discussions
- `guideQuestions`: category 11, Questions about Guides
- `related`: categories 5, 6, 7, 8, or 9
- future homepage feed: categories 10 and 11 only

A News companion in the Guide category is rejected. A Guide companion in the News category is rejected. Dedicated companion categories are not used as generic related-topic sources. Closed topics remain eligible when the category and relationship role are valid; archived topics and topics without a valid category are rejected.

Homepage eligibility will remain separate from content-panel eligibility. A topic in category 10 or 11 must also be reverse-verified as linked from eligible Sanity content before homepage presentation. Discourse category placement alone never authorizes homepage promotion.


## Companion topic automation model

News Articles and Public Information Guides may optionally store a `forumCompanionAutomation` object. Editors choose one mode: no Forum discussion, automatic creation when eligible, or manual linking of an existing topic.

The durable topic relationship remains in `forumDiscussion` for News and `forumQuestionsTopic` for Guides. Automation status, attempt timestamps, completion timestamps, and safe failure codes are server-managed and read-only in Studio.

Missing automation configuration is treated as no automatic request. Existing documents and existing topic references require no migration. Manual mode requires an existing companion topic ID. Automatic mode may coexist with a topic ID after successful creation or when an existing relationship prevents duplicate creation.

The publishing service chooses category 10 for News and category 11 for Guides. Editors and webhook payloads never choose category IDs. The schema remains backward-compatible; automatic creation occurs only when an editor selects automatic mode and the published content is eligible.


## Server-only companion topic publisher

The application contains an operational server-only Discourse publisher for companion topics. News is always mapped to category 10 and Guides are always mapped to category 11. Callers cannot supply or override category IDs.

The publisher validates content type, language, title, and an HTTPS `nepali.no` content URL. It creates a short localized opening post that links to the complete News article or Guide. It sends credentials only in server-side headers, uses a five-second timeout, and accepts only a positive returned topic ID.

The publishing credential is separate from the read-only metadata credential. No credential value is stored in Git. The publisher credential is configured as a Production-only Sensitive Vercel variable. Publishing is reached only through the signed Sanity workflow; callers cannot choose category IDs or raw topic payloads.


## Signed Sanity publishing workflow

The operational server endpoint `/api/sanity-forum-publishing` accepts only signed Sanity document webhooks. It verifies the raw body before parsing, accepts only a minimal document ID and type, re-fetches authoritative production content, and uses Sanity's idempotency key as a server-managed attempt identifier.

Eligible automatic News and Guides are revision-claimed before Discourse publication. Existing topic relationships, future News, inactive Guides, manual mode, and in-progress claims do not create topics. A successful Discourse publication is written back to the durable Sanity relationship. An uncertain final write-back requires manual reconciliation and must never trigger automatic duplicate creation.


## 15. Production automation proof and content lifecycle

The signed workflow is proven in production for both supported content types.

Guide proof:

- `Synthetic Guide Companion Automation Test`
- Sanity language `nb`
- topic 17 created by `forum-publisher`
- category 11, Questions about Guides
- Norwegian Guide template
- topic ID, editorial label, attempt state, and completion timestamps written back to Sanity
- Guide subsequently published as archived; the public Guide route now returns 404 while the Forum topic remains preserved

News proof:

- `Synthetic News Companion Automation Test`
- Sanity language `nb`
- topic 18 created by `forum-publisher`
- category 10, News Discussions
- Norwegian News template
- topic ID, editorial label, attempt state, and completion timestamps written back to Sanity
- the synthetic article must remain future-dated after verification so it is not publicly eligible

Companion opening text follows the Sanity content language, not the Discourse interface locale. Current templates support `nb` and `ne` for both News and Guides.

The first Guide proof exposed a malformed `[object Object]` URL because a post-claim Sanity document contained the full slug object. Topic 17 was corrected manually. PR #39 now constructs publication input from the normalized pre-claim document, and a regression test proves that a claimed slug object cannot corrupt the public URL.

Archiving a Guide, future-dating News, unpublishing content, or changing editorial mode never automatically deletes or closes community discussion. Topic lifecycle actions require a separate governed moderation decision.

Public News and Guide pages still show no Forum panel because `contentIntegrationEnabled` and `relatedTopicsEnabled` remain false. The frontend connection is intentionally deferred until `forum.nepali.no` is operational and verified.


## Connected News and Guide relationship

News Articles may optionally select one active same-language Public Information Guide as their Primary Supporting Guide. The relationship is editorially curated and should be left empty when no Guide genuinely helps readers understand or act on the News.

The individual News query projects the Guide only when it remains active, matches the News language, and has a valid slug. Guide pages will later use the reverse relationship to find at most three eligible same-language News articles, ordered newest first and excluding future-dated content.

This relationship milestone adds no public card, context rail, homepage feed, or Forum presentation. The public Forum flags remain disabled. Presentation and activation require separate reviewed milestones with safe empty states.
