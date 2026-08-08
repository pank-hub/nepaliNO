# Forum Integration Contract

**Status:** Resolver and disabled public request contract production-proven; public presentation disabled
**Current checkpoint:** `ac20866`
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
- category ID 5
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

Current pilot key:

- dedicated `forum-metadata` account
- non-admin and non-moderator
- granular `topics -> read`
- restricted to synthetic topic ID 13
- stored as a Production-only Sensitive variable in the public Vercel project

This scope is suitable for the synthetic proof but not yet a scalable production scheme. Do not broaden the key until the general allowlist and visibility design is approved.

## 12. Failure behavior

- Missing relationship: no public Forum presentation.
- Missing, hidden, deleted, private, staff, or inaccessible topic: no public presentation.
- Discourse timeout or failure: News or Guide remains fully usable.
- Missing credential: controlled server failure, never credential detail.
- Unexpected response: reject metadata.
- Closed Guide topic: controlled state or editorial review, not a false invitation to reply.

## 13. Automated verification

Every pull request targeting `main` now runs:

- 9 relationship-normalization tests
- 11 public request-contract tests
- Astro Check
- the production build

The test suites are dependency-free Node tests and do not contact Sanity or Discourse.

## 14. Next implementation stage

- connect the enabled-state endpoint path to the server-owned relationship resolver while keeping `contentIntegrationEnabled` false
- return metadata only for eligible published News or active Guides
- prevent general topic enumeration and caller-supplied topic IDs
- define companion and related-topic response structure
- define partial-success behavior for unavailable approved topics
- define allowed categories and public visibility
- test one reply, closed, archived, missing, and unavailable states
- define safe short caching and stale behavior
- broaden or replace the topic-13-only API key only after private endpoint proof
- build shared presentation components only after the endpoint contract is proven
- preserve the public disable switch and emergency rollback


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

The future publishing service will choose category 10 for News and category 11 for Guides. Editors and webhook payloads never choose category IDs. No webhook, write credential, or automatic Discourse mutation is enabled by this schema milestone.
