# Forum Integration Contract

**Status:** Protected synthetic proof successful; public presentation disabled
**Current checkpoint:** `b9f62a0`
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

## 9. Sanity allowlisting proof

Protected route: `/translations/api/forum-metadata-status`

The route requires the existing Pankaj-only Translation Editor session. It resolves fixed synthetic News content in Sanity, reads its approved topic relationship, and only then calls Discourse.

Synthetic Sanity fixture:

- type: `newsArticle`
- language: `nb`
- slug: `syntetisk-test-forum-integrasjon`
- future publication date: 13 August 2099
- companion topic ID: 13

The future date keeps the synthetic article out of public News queries and static paths.

Verified normalized metadata:

- topic ID 13
- `postsCount` 1
- `replyCount` 0
- open and not archived
- category ID 5
- no tags

## 10. Public endpoint state

Public route: `/api/forum-content`

Current behavior:

- deliberately disabled
- generic HTTP 404
- `Cache-Control: no-store`
- no article identity or Forum metadata

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

## 13. Next implementation stage

- replace fixed synthetic lookup with server-owned published-content lookup
- return metadata only for eligible News or active Guides
- prevent general topic enumeration
- define allowed categories and public visibility
- test one reply, closed, archived, missing, and unavailable states
- define safe short caching and stale behavior
- build shared presentation components only after the server contract is proven
- preserve public disable switch and emergency rollback
