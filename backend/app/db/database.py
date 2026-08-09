import aiosqlite
from app.core.config import settings

DB_PATH = settings.database_url.replace("sqlite+aiosqlite:///", "")


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    yield db
    await db.close()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.executescript(
            """
            -- Multi-tenant schema (Phase A)
            -- Organizations are the tenant boundary.

            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                plan TEXT DEFAULT 'free',          -- billing-ready: free | pro | enterprise
                settings TEXT DEFAULT '{}',         -- JSON org settings
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

            -- Memberships: many-to-many user <-> org with role-based access control.
            CREATE TABLE IF NOT EXISTS organizations_users (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',  -- owner | admin | member
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(organization_id, user_id)
            );

            -- Invitations: owner/admin invites by email; invitee joins on accept.
            CREATE TABLE IF NOT EXISTS invitations (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',
                token TEXT UNIQUE NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | revoked | expired
                invited_by TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (invited_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                system_prompt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                project_id TEXT,
                title TEXT DEFAULT 'New Chat',
                model TEXT DEFAULT 'gpt-4o',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                artifacts TEXT DEFAULT '[]',
                attachments TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS skills (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                prompt_template TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                mime_type TEXT,
                size INTEGER,
                conversation_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS token_usage (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                conversation_id TEXT,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                input_cost REAL DEFAULT 0,
                output_cost REAL DEFAULT 0,
                total_cost REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
            );

            -- Provider registry (Hermes-style dynamic config).
            -- Each provider is a base_url + api_key; models are discovered from it.
            CREATE TABLE IF NOT EXISTS providers (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                enabled BOOLEAN DEFAULT 1,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                UNIQUE(organization_id, name)
            );

            -- Discovered models per provider, with capability metadata.
            CREATE TABLE IF NOT EXISTS provider_models (
                id TEXT PRIMARY KEY,
                provider_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                model_id TEXT NOT NULL,          -- e.g. "deepseek-v4-flash"
                name TEXT,
                capabilities TEXT DEFAULT '{}',   -- JSON: {reasoning, vision, audio, file, multimodal, context_window, ...}
                UNIQUE(provider_id, model_id),
                FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
            );

            -- Prompt Library (Phase B1): reusable org-scoped prompt templates.
            CREATE TABLE IF NOT EXISTS prompt_templates (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'general',
                content TEXT NOT NULL,
                variables TEXT DEFAULT '[]',      -- JSON: list of variable names in the content
                is_public BOOLEAN DEFAULT 0,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

            -- API Keys (Phase B2): org-issued keys for programmatic access.
            -- Only the SHA-256 hash is stored; the plaintext is shown once at creation.
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT UNIQUE NOT NULL,
                prefix TEXT NOT NULL,             -- e.g. "maya_k1Ab2Cd3" — shown in list views
                created_by TEXT,
                last_used_at TIMESTAMP,
                expires_at TIMESTAMP,
                revoked BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

            -- Audit Logs (Phase B3): security-relevant actions per org (compliance).
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                user_id TEXT,                     -- actor (NULL for system/unauthenticated)
                action TEXT NOT NULL,             -- e.g. "auth.login", "org.create", "member.invite"
                resource_type TEXT,               -- e.g. "organization", "api_key", "member"
                resource_id TEXT,
                ip TEXT,
                user_agent TEXT,
                metadata TEXT DEFAULT '{}',       -- JSON extra context
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            -- MCP Servers (Phase B4): external tool servers per org.
            CREATE TABLE IF NOT EXISTS mcp_servers (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,                -- base URL of the MCP/tool server
                enabled BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                UNIQUE(organization_id, name)
            );
            """
        )
        await db.commit()
        await _ensure_columns(db)
        await _migrate_legacy(db)


async def _ensure_columns(db):
    """Add organization_id (and any other new columns) to existing tables.

    CREATE TABLE IF NOT EXISTS doesn't ALTER existing tables, so if the DB was
    created by an older schema we add the new columns here. This makes upgrades
    non-destructive.
    """
    target_tables = ("projects", "conversations", "memories", "skills", "files", "token_usage", "prompt_templates", "api_keys", "audit_logs", "mcp_servers")
    for table in target_tables:
        cur = await db.execute(f"PRAGMA table_info({table})")
        cols = {row[1] for row in await cur.fetchall()}
        if "organization_id" not in cols:
            try:
                await db.execute(f"ALTER TABLE {table} ADD COLUMN organization_id TEXT")
            except Exception:
                pass
    await db.commit()


async def _migrate_legacy(db):
    """Best-effort migration: backfill organization_id when orgs already exist.

    Existing single-tenant data has no organization_id. If exactly one
    organization exists, assign legacy rows to it. If none exists, leaves the
    columns NULL (they'll be written fresh going forward). This keeps old data
    reachable without breaking new multi-tenant writes.
    """
    try:
        cur = await db.execute("SELECT id FROM organizations LIMIT 2")
        orgs = await cur.fetchall()
    except Exception:
        return
    if len(orgs) != 1:
        return
    org_id = orgs[0]["id"]
    for table in ("projects", "conversations", "memories", "skills", "files", "token_usage", "prompt_templates", "api_keys", "audit_logs", "mcp_servers"):
        try:
            await db.execute(
                f"UPDATE {table} SET organization_id = ? WHERE organization_id IS NULL",
                (org_id,),
            )
        except Exception:
            pass
    await db.commit()