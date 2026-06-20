# EstateLab Authentication

## Purpose

Authentication protects personal Jarvis conversations without weakening the owner-controlled knowledge boundary. Creating an account does not allow a user to modify EstateLab beliefs, references, decisions, framework files, properties, or comparable data.

## User Experience

- Jarvis remains immediately usable as a guest.
- Guest chat sessions are available only to the originating browser client ID.
- A member can register or sign in through the inline Account panel.
- Member chat sessions are attached to the member ID and can be resumed on another signed-in device.
- Signing out starts a clean guest session on that browser.

## Security Model

- Passwords are hashed with Node.js `scrypt` and a unique random salt.
- Raw passwords are never stored.
- Login tokens use 32 random bytes.
- Only SHA-256 hashes of login tokens are stored in `data/db.json`.
- Login cookies are `HttpOnly`, `SameSite=Strict`, and scoped to the whole app.
- Cookies receive the `Secure` attribute when the request arrives through HTTPS, including Render's forwarded HTTPS requests.
- Authentication attempts are limited in memory by source address.
- JSON request bodies are limited to 1 MB.
- Unauthorized session access returns `404` so the API does not confirm whether another user's session exists.

## Storage Boundary

The current prototype stores users and hashed auth sessions under `auth` in the runtime `data/db.json`. This is suitable for controlled early use with a persistent Render disk, but not the final scale architecture.

The first authentication deployment clears legacy pre-authentication guest sessions from an existing runtime database. Those sessions had no enforceable user owner, so retaining them would weaken the new access boundary.

The next storage phase should migrate users, auth sessions, and Jarvis sessions to PostgreSQL with transactional writes, indexed ownership queries, persistent rate limits, and an audit trail. The owner knowledge base must remain logically separate from public account data.

## Current Limitations

- No email verification.
- No password reset or account recovery.
- No owner-facing account administration.
- Rate limiting resets when the Node process restarts.
- File storage does not provide transactional concurrency across multiple server instances.
