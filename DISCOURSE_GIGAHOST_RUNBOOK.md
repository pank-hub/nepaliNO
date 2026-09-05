# Discourse on Gigahost Operations Runbook

**Status:** Private pilot
**Last reviewed:** 11 August 2026
**Audience:** Authorized infrastructure operators

## 1. Secret boundary

Never record the public IP, SSH private key, passphrase, server password, provider credentials, SMTP credential, API keys, session cookies, backup links, or `app.yml` contents in Git, documentation, screenshots, chat, or ordinary email.

Store secrets only in the approved password manager.

## 2. Service identity

- Provider: Gigahost AS
- Facility: NO DC2, Sandefjord
- Hostname: `forum-poc.nepali.no`
- OS: Ubuntu 24.04 LTS x86-64
- Capacity: 2 vCPU, 4 GB RAM, 40 GB NVMe
- Install directory: `/var/discourse`
- Protected configuration: `/var/discourse/containers/app.yml`
- Container: `app`
- Automatic Gigahost backup: enabled

The Forum database is not stored in Sanity or Vercel.

## 3. Access and firewall

Normal SSH uses the ordinary `pankaj` account, a dedicated Ed25519 key, and `sudo`.

Required SSH policy:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers pankaj
MaxAuthTries 3
LoginGraceTime 30
```

UFW defaults to deny incoming and permits only TCP 22, 80, and 443. Never expose PostgreSQL, Redis, the Docker API, or internal administration ports.

## 4. Health checks

```bash
sudo docker ps --filter name=app
sudo systemctl --failed --no-pager
sudo ufw status verbose
curl --silent --show-error --location --output /dev/null   --write-out 'HTTP status: %{http_code}
TLS verification: %{ssl_verify_result}
'   https://forum-poc.nepali.no/
```

Healthy baseline:

- container is Up
- HTTPS returns 200
- TLS verification result is 0
- no failed services

## 5. Protected configuration and rebuilds

`app.yml` must remain owned by root with mode 600.

```bash
sudo stat -c '%U:%G %a %n' /var/discourse/containers/app.yml
```

Edit interactively. Do not place secrets in shell commands or history.

```bash
cd /var/discourse
sudo nano containers/app.yml
sudo chmod 600 containers/app.yml
sudo ./launcher rebuild app
```

Launcher output may expose environment values. For sensitive changes, redirect output to a root-only file, inspect sanitized results, then delete the file. Never run concurrent rebuilds.

## 6. Email and Resend

Non-secret SMTP settings:

- host: `smtp.resend.com`
- port: 587
- username: `resend`
- STARTTLS
- sender under `notifications.nepali.no`

Use a Forum-specific sending-only credential. Never reuse application keys.

Troubleshooting order:

1. Discourse Admin -> Email logs -> Sent, Skipped, Bounced, Rejected
2. inspect SMTP acceptance status
3. inspect Resend event status
4. verify recipient mailbox independently
5. if the address hard-bounced, fix the mailbox before removing Resend suppression
6. send one fresh activation message

A Discourse SMTP `250` response means the outbound relay accepted the message; it does not prove final inbox delivery.

## 7. Forum accounts and API integration

Public companion and homepage metadata is read from public topic JSON without
an account or API credential. Keep the relevant Discourse categories and topics
publicly readable for a companion card to be eligible.

Dedicated publisher account: `forum-publisher`

Required properties:

- active service user
- not administrator
- not moderator
- locked at Trust Level 0
- member of `forum-publishers`
- may create topics only in News Discussions (10) and Questions about Guides (11)

Publisher API key:

- Single User
- user `forum-publisher`
- Granular scope
- `topics -> write`

General categories 5 to 9 require Trust Level 1 for topic creation. The locked publisher remains read/reply only there. Categories 10 and 11 grant Create through `forum-publishers` while `everyone` retains See and Reply only.

Credential values live only in Discourse, the password manager, and
Production-only Vercel configuration. Publishing, Sanity automation, and
webhook-signing credentials remain separate. If a key appears in chat, output,
screenshot, or history, revoke and rotate immediately.

## 8. Backups

Current proof:

- pre-promotion and post-promotion native Discourse backups were created with database and uploads
- the Discourse-managed server originals were retained
- the post-promotion archive was copied by SCP to an encrypted laptop through the named-key workflow
- server and local byte sizes matched
- server and local SHA-256 checksums matched exactly
- only the restricted temporary home-directory transfer copy was removed after verification

Still required:

- restore a native backup to a clean disposable VPS
- record recovery time, missing steps, and credential-rotation responsibilities
- define retention and a periodic restore-test schedule

Before upgrades or high-risk changes:

- create a native backup
- copy it off-server
- securely preserve required configuration
- consider a Gigahost snapshot
- confirm disk space

## 9. Upgrade procedure

- review Discourse release notes and security notices
- verify current backup and off-server copy
- plan a maintenance window
- run the supported upgrade path
- verify HTTPS, login, activation, recovery, posting, flags, moderation, API metadata, and backups
- record the tested version and outcome

## 10. Current pilot policy

- login required
- invite-only registration
- anonymous reading disabled
- public signup disabled
- Norwegian Bokmal interface by default
- signed-in users and guests can choose English
- full Nepali interface translation is deferred
- Nepali, Norwegian, and English discussion permitted
- Chat disabled
- ordinary member personal-message initiation disabled
- no public launch authorization

## 11. Emergency controls

If the integration behaves unexpectedly:

- keep or set `contentIntegrationEnabled` to false
- keep or set `relatedTopicsEnabled` to false
- revoke the affected metadata, publishing, Sanity, or webhook credential if misuse is suspected
- keep the public site operating independently

If the Forum itself is at risk:

- close registration
- enable read-only mode if appropriate
- preserve logs and backups
- revoke affected credentials
- notify responsible operators
- avoid destructive deletion until evidence and recovery needs are understood

## 12. Shutdown and billing

Powering off may not stop hourly billing. Deleting the VPS ends the resource and must occur only after backup export, config preservation, credential review, DNS planning, and an approved shutdown decision.

## 13. Incident history

- 6 August 2026: installer output exposed the first restricted SMTP credential. The credential was revoked, replaced, applied safely, verified, and removed from temporary logs.
- 7 August 2026: first metadata API key appeared in a screenshot. The tightly scoped key was revoked and replaced immediately.
- 7 August 2026: a newly created metadata mailbox initially bounced; Resend suppressed later messages. The mailbox was verified, suppression removed, and one fresh activation succeeded.

Do not record credential values.


## 14. Final hostname transition to forum.nepali.no

Approved final hostname:

```text
https://forum.nepali.no
```

Current pilot hostname:

```text
https://forum-poc.nepali.no
```

Do not retire or redirect the pilot hostname until the final hostname is fully proven.

Prerequisites:

1. create a current native Discourse backup including database and uploads
2. copy the backup off-server and verify its checksum
3. complete a clean restore to a disposable VPS and record recovery time and missing steps
4. preserve the current `app.yml` configuration securely without exposing secrets
5. document rollback DNS values and the exact canonical-hostname reversal procedure
6. verify the current publisher, metadata, email, moderator, and administrator identities

Controlled transition sequence:

1. configure DNS for `forum.nepali.no`
2. obtain and verify TLS
3. change the Discourse hostname and canonical URL using the supported configuration and rebuild process
4. verify asset URLs, login, logout, invitations, activations, password recovery, and outbound email links
5. verify category permissions, topic 13, Guide topic 17, and News topic 18
6. verify metadata reads and one controlled automatic publication against the final hostname
7. update the Astro server-owned Forum base URL only after Discourse is operational at the final hostname
8. redeploy the public application and rerun protected diagnostics
9. keep public News and Guide panels disabled until a separate frontend milestone is approved
10. preserve rollback ability until DNS, email, APIs, backups, and mobile behavior remain stable

Avoid two competing canonical Forum identities. If the pilot hostname remains reachable temporarily, it must redirect deliberately only after the final hostname is verified.

## 15. Theme and language readiness

After hostname and recovery readiness are proven, align Discourse visually with nepali.no using upgrade-safe theme work:

- logo and favicon
- principal colors
- compatible typography
- restrained cards, borders, buttons, and links
- clear return link to nepali.no
- mobile-first spacing and accessible contrast
- a visible `Norsk | English` selector for guests and signed-in users

Do not attempt a pixel-identical Astro clone or depend on obsolete locale-switcher components. Preserve familiar Discourse usability and upgrade safety.

## 16. Automatic publishing operational checks

The signed Sanity workflow is production-proven:

- Guide topic 17 in category 11 using the Norwegian template
- News topic 18 in category 10 using the Norwegian template
- Nepali News topic 27 in category 10 using the Nepali template on the final hostname
- all were authored by `forum-publisher`
- topic relationships and completed automation state were written back to Sanity
- a later ordinary republication of the topic 27 fixture preserved the relationship and created no duplicate

If automation is marked `creating`, `created` without a confirmed relationship, or contains `forum-publishing-result-unconfirmed`, do not republish or clear fields. Inspect the Sanity document, Discourse categories, publisher-account activity, and Vercel function logs before deciding whether reconciliation is safe.

Archiving or unpublishing source content must not delete the Forum topic. Topic closure, archival, unlisting, renaming, or deletion requires a separate moderation decision.

## Final-hostname state and HTTP 422 publishing diagnostics

Current hostname state:

- canonical Forum: `https://forum.nepali.no`
- preserved alias: `https://forum-poc.nepali.no`
- both hostnames have valid TLS
- the alias redirects to the canonical hostname
- the existing Discourse installation, database, uploads, users, categories, permissions, and topic IDs were preserved
- the active `app.yml` uses `forum.nepali.no` as `DISCOURSE_HOSTNAME` and `forum-poc.nepali.no` as `DISCOURSE_HOSTNAME_ALIASES`
- a root-only pre-transition `app.yml` rollback copy exists

Backup state:

- a fresh pre-transition native backup including uploads was exported off-server and its SHA-256 checksum matched
- a fresh post-promotion native backup including uploads was also exported off-server
- server and local byte sizes and SHA-256 checksums matched exactly
- the temporary transfer copy was removed and the Discourse-managed original was preserved
- a clean disposable restore test, recovery-time record, retention policy, and periodic restore schedule remain outstanding

Publishing incident resolution:

- the 10 August real Nepali News attempt remains preserved with its historical uncertain code and empty relationship
- a controlled synthetic fixture returned the bounded `forum-publishing-rejected-post` code without creating a topic
- Norwegian and Nepali representative posts both passed in-memory text and post validation
- `forum-publisher` had two existing links to `nepali.no`; the proposed third link reached `newuser_spam_host_threshold`, causing host-spam rejection
- `nepali.no` was added narrowly to `allowed_spam_host_domains`
- the global threshold remained unchanged, and `forum-publisher` remained Trust Level 0, non-staff, non-admin, and category-limited
- a fresh synthetic Nepali publication created topic 27 and wrote the durable Sanity relationship successfully
- ordinary republication of the already-linked fixture created no duplicate

### Checklist for an automatic publication returning HTTP 422

1. Do not republish, clear workflow fields, enter a topic ID, or create a replacement topic manually.
2. Check the Sanity automation status, Attempt ID, timestamps, safe failure code, and companion topic relationship.
3. Search the intended Discourse category and `forum-publisher` activity for a matching topic.
4. Inspect the Discourse access log for `POST /posts.json`, confirming the HTTP status and authenticated publisher identity without exposing credentials or request headers.
5. Verify category visibility and topic-creation permissions for `forum-publisher`.
6. Check title limits, minimum post length, account suspension or silencing, and category tag requirements only as read-only diagnostics.
7. If no topic exists and the deployed publisher records a `forum-publishing-rejected-*` code, treat the outcome as a confirmed rejection and correct the validated condition before one authorized retry.
8. If the result remains `forum-publishing-result-unconfirmed`, inspect both systems and require manual reconciliation before any retry.
9. Prefer a clearly labelled synthetic fixture when proving a corrected publishing path.
10. Record the outcome and create a new backup at the next meaningful operational checkpoint.

Never run `db:create`, modify `database.yml`, change Git safe-directory settings, or alter category permissions merely to diagnose an API validation response.

## 17. 2026-09-01 presentation and social-sharing continuity update

The next Discourse presentation pass must remain upgrade-safe and light-first. Verify the canonical hostname `forum.nepali.no`, the TLS-covered redirect alias, login, invitation, activation, password recovery, outbound email links, Norwegian default locale, accessible English selection, mobile layout, contrast, keyboard focus, and a restrained return link to `https://nepali.no` after every theme deployment.

Do not add Meta, Facebook, X, or other social tracking scripts merely to support link previews. The public Astro application now supplies canonical Open Graph and X Card metadata independently. Forum theme work must not weaken cookie, privacy, backup, least-privilege, moderation, or category-governance controls.
