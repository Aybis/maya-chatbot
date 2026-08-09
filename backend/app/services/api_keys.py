"""API key service: generation, hashing, and resolution.

Keys are generated as ``maya_<urlsafe-random>``. Only the SHA-256 hash is
persisted; the plaintext is returned once at creation and never stored.
"""
import hashlib
import secrets
from datetime import datetime
from typing import Optional

KEY_PREFIX = "maya_"


def generate_api_key() -> tuple[str, str, str]:
    """Return (plaintext_key, key_hash, display_prefix)."""
    token = secrets.token_urlsafe(32)  # ~43 chars, URL-safe
    plaintext = f"{KEY_PREFIX}{token}"
    key_hash = hash_key(plaintext)
    # Display prefix: "maya_" + first 8 chars of the token for list UIs.
    display_prefix = f"{KEY_PREFIX}{token[:8]}"
    return plaintext, key_hash, display_prefix


def hash_key(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode()).hexdigest()


async def resolve_api_key(db, plaintext: str) -> Optional[dict]:
    """Resolve a plaintext API key to its row if valid (not revoked, not expired).

    Returns the full api_keys row as a dict, or None.
    """
    if not plaintext or not plaintext.startswith(KEY_PREFIX):
        return None
    key_hash = hash_key(plaintext)
    cursor = await db.execute(
        "SELECT * FROM api_keys WHERE key_hash = ? AND revoked = 0",
        (key_hash,),
    )
    row = await cursor.fetchone()
    if not row:
        return None
    # Expiry check
    if row["expires_at"]:
        try:
            raw = str(row["expires_at"]).replace("Z", "+00:00")
            exp = datetime.fromisoformat(raw)
            now = datetime.now(exp.tzinfo) if exp.tzinfo else datetime.now()
            if now > exp:
                return None
        except Exception:
            # If the timestamp can't be parsed, treat as non-expiring rather than lock out.
            pass
    return dict(row)


async def touch_api_key(db, key_id: str) -> None:
    """Update last_used_at for a key (fire-and-forget)."""
    try:
        await db.execute(
            "UPDATE api_keys SET last_used_at = ? WHERE id = ?",
            (datetime.now().isoformat(), key_id),
        )
        await db.commit()
    except Exception:
        pass
