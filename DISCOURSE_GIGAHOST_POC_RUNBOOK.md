# Discourse on Gigahost: Proof-of-Concept Runbook

**Status:** Private disposable pilot
**Last updated:** 6 August 2026
**Audience:** Pankaj and authorized infrastructure operators

## 1. Purpose and secret boundary

This runbook records the safe operating boundary for the disposable Discourse proof of concept in Norway.

It intentionally omits the public IP, private SSH key, SSH passphrase, server password, provider credentials, SMTP credential, API keys, and backup links. Store secrets only in the approved password manager.

## 2. Service identity

- Provider: Gigahost AS
- Facility: NO DC2, Sandefjord
- Hostname: `forum-poc.nepali.no`
- OS: Ubuntu 24.04 LTS x86-64
- Resources: 2 vCPU, 4 GB RAM, 40 GB NVMe
- Billing: hourly
- Automatic Gigahost backup: enabled
- Install directory: `/var/discourse`
- Protected config: `/var/discourse/containers/app.yml`
- Container: `app`

The instance is not production.

## 3. Access model

Normal access uses user `pankaj`, a dedicated Ed25519 key, and `sudo` with a separate server password.

Effective SSH policy:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers pankaj
MaxAuthTries 3
LoginGraceTime 30
```

Never copy the private key into Git, Codespaces, chat, email, or an unencrypted cloud folder.

## 4. Firewall

UFW is active. Inbound ports are limited to 22, 80, and 443. Default incoming policy is deny.

Inspect:

```bash
sudo ufw status verbose
```

Never expose database, Redis, Docker API, or administration ports.

## 5. Normal login

From local Windows PowerShell:

```powershell
ssh -o IdentitiesOnly=yes -i "$HOME\.ssh\forum-poc-01-ed25519" pankaj@SERVER_IPV4
```

Replace `SERVER_IPV4` locally. Do not put the address in public documentation.

## 6. Health checks

```bash
sudo docker ps --filter name=app
curl --silent --show-error --location --output /dev/null \
  --write-out 'HTTP status: %{http_code}\nTLS verification: %{ssl_verify_result}\n' \
  https://forum-poc.nepali.no/
sudo systemctl --failed --no-pager
sudo ufw status verbose
```

Healthy: container Up, HTTP 200, TLS verification 0, no failed services.

## 7. Protected configuration

`/var/discourse/containers/app.yml` must remain `root:root` mode `600`.

```bash
sudo stat -c '%U:%G %a %n' /var/discourse/containers/app.yml
```

Never print or commit this file.

## 8. Email

Non-secret settings:

- host `smtp.resend.com`
- port 587
- username `resend`
- STARTTLS
- sender `forum-test@notifications.nepali.no`

Use a forum-specific sending-only key. Never reuse the Astro application key.

If a key appears in output, revoke it immediately, create a replacement, update `app.yml` interactively, rebuild with protected output, verify without printing, and delete temporary logs.

## 9. Safe editing

Use:

```bash
sudo nano /var/discourse/containers/app.yml
sudo chmod 600 /var/discourse/containers/app.yml
```

Do not use commands that place secrets in shell history.

## 10. Rebuilds

From `/var/discourse`:

```bash
sudo ./launcher rebuild app
```

Launcher output may reveal environment values. For sensitive changes, redirect to a root-only log and delete the log after sanitized verification. Never run two rebuilds concurrently.

## 11. Backups

Required before production consideration:

1. Gigahost automatic VPS backup
2. Gigahost manual snapshots
3. Discourse-native database and upload backup copied off-server

Existing pre-Docker snapshot:

- `forum-poc-01-secured-baseline-2026-08-06`

The proof of concept is incomplete until a native backup is restored to a clean disposable VPS.

## 12. Updates

Before an upgrade:

1. create and export a native backup
2. securely export `app.yml`
3. consider a Gigahost snapshot
4. review release notes
5. check disk space
6. upgrade during a maintenance window
7. verify HTTPS, email, login, posting, and moderation

## 13. Shutdown and billing

Powering off may not stop billing. Delete the VPS in Flux to end hourly billing.

Before deletion, export backups and configuration, revoke unused credentials, record findings, and decide the DNS plan.

## 14. Pilot restrictions

- synthetic accounts only
- no real personal data
- no public promotion
- no homepage integration
- no social login
- no private messaging at launch
- no plugins before review
- English interface
- no production commitment

## 15. Immediate sequence

1. Register the administrator.
2. Complete only necessary wizard items.
3. Restrict registration.
4. Disable private messaging.
5. Disable indexing.
6. Configure categories and language tags.
7. Test email with synthetic accounts.
8. Test moderation and recovery.
9. Create and restore a native backup.
10. Document the platform decision.

## 16. Incident record

On 6 August 2026, installer output exposed the first restricted SMTP credential. It was immediately revoked, replaced, applied through protected configuration, verified in the running container, and removed from the temporary log. Never record either value.
