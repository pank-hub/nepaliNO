# Discourse on Gigahost Operations Runbook

**Status:** Private pilot
**Last reviewed:** 8 August 2026
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

Dedicated metadata account: `forum-metadata`

Required properties:

- active basic user
- not administrator
- not moderator
- not Staff
- no posting purpose

Current pilot API key:

- Single user
- Granular scope
- only `topics -> read`
- allowed topic ID 13

Credential values live only in Discourse, the password manager, and Production-only Vercel configuration. If a key appears in chat, output, screenshot, or history, revoke and rotate immediately.

## 8. Backups

Current proof:

- native Discourse backup created with database and uploads
- server copy retained
- archive copied by SCP to an encrypted laptop
- SHA-256 checksum matched

Still required:

- restore that native backup to a clean disposable VPS
- record recovery time and missing steps
- define retention and periodic test schedule

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
- English interface
- Nepali, Norwegian, and English discussion permitted
- Chat disabled
- ordinary member personal-message initiation disabled
- no public launch authorization

## 11. Emergency controls

If the integration behaves unexpectedly:

- keep or set `contentIntegrationEnabled` to false
- keep or set `relatedTopicsEnabled` to false
- revoke the metadata API key if misuse is suspected
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
