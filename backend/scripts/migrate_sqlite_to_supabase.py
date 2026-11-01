"""
CivicConnect — SQLite to Supabase PostgreSQL Automated Migration Script.
Migrates all benchmark policies (with all 5 regional language summaries),
citizen accounts, civic grievances, and verification audits directly into Supabase.

Usage:
    python backend/scripts/migrate_sqlite_to_supabase.py
    (or specify connection URI as argument):
    python backend/scripts/migrate_sqlite_to_supabase.py "postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:6543/postgres"
"""

import os
import sys
import sqlite3
import json
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("[ERROR] psycopg2 is not installed. Please run: pip install psycopg2-binary")
    sys.exit(1)

import re
import urllib.parse
from app.core.config import settings

def sanitize_database_url(database_url: str) -> str:
    # 1. Normalize postgres:// to postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # 2. Check and remove accidental literal brackets [your-password]
    bracket_match = re.search(r":\[([^\]]+)\]@", database_url)
    if bracket_match:
        raw_pass = bracket_match.group(1)
        encoded_pass = urllib.parse.quote_plus(raw_pass)
        database_url = database_url[:bracket_match.start()] + ":" + encoded_pass + "@" + database_url[bracket_match.end():]
        print(f"[Auto-Fix] Removed literal square brackets from password.")

    return database_url

def get_supabase_conn(database_url: str):
    clean_url = sanitize_database_url(database_url)
    try:
        conn = psycopg2.connect(clean_url)
        conn.autocommit = False
        return conn
    except psycopg2.OperationalError as e:
        err_msg = str(e)
        if "could not translate host name" in err_msg and "db." in clean_url:
            print("\n[DIAGNOSTIC TIP - IPv6 vs IPv4 Issue]")
            print("Direct connections (db.[project-ref].supabase.co:5432) require IPv6, which is often not supported by local ISPs/networks.")
            print("Instead, use Supabase's IPv4 Connection Pooler URI (Port 6543):")
            print("  1. In Supabase Dashboard, go to: Project Settings -> Database -> Connection string.")
            print("  2. Select 'Transaction' or 'Session' Pooler (Mode).")
            print("  3. The host will look like: aws-0-[region].pooler.supabase.com (Port 6543).")
            print("  4. The user will be: postgres.[project-ref]\n")
        raise e

def execute_schema(pg_conn):
    schema_path = BASE_DIR / "supabase_schema.sql"
    if not schema_path.exists():
        schema_path = BASE_DIR.parent / "supabase_schema.sql"
    
    if not schema_path.exists():
        print(f"[WARN] Schema file not found at {schema_path}, assuming tables are already created.")
        return

    print("[1/3] Applying PostgreSQL schema to Supabase...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    with pg_conn.cursor() as cur:
        cur.execute(schema_sql)
    pg_conn.commit()
    print("      ✓ Schema verified and applied successfully.")

def migrate_table(sqlite_conn, pg_conn, table_name: str, pkey: str = "id"):
    s_cur = sqlite_conn.cursor()
    try:
        s_cur.execute(f"SELECT * FROM {table_name}")
    except sqlite3.OperationalError:
        print(f"      - Table '{table_name}' does not exist in SQLite, skipping.")
        return 0
    
    rows = s_cur.fetchall()
    if not rows:
        print(f"      - Table '{table_name}' has 0 rows in SQLite.")
        return 0

    col_names = [description[0] for description in s_cur.description]
    cols_str = ", ".join(col_names)
    placeholders = ", ".join(["%s"] * len(col_names))
    
    insert_sql = f"""
        INSERT INTO {table_name} ({cols_str})
        VALUES ({placeholders})
        ON CONFLICT ({pkey}) DO NOTHING
    """

    data_to_insert = [tuple(row) for row in rows]

    with pg_conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, insert_sql, data_to_insert)
        
        # Reset the PostgreSQL sequence to max(id) so future inserts don't collide
        try:
            cur.execute(f"SELECT setval(pg_get_serial_sequence('{table_name}', '{pkey}'), coalesce(max({pkey}), 1)) FROM {table_name};")
        except Exception:
            pass

    pg_conn.commit()
    print(f"      ✓ Table '{table_name}': {len(rows)} records migrated.")
    return len(rows)

def main():
    print("=" * 65)
    print("  CivicConnect — Automated Supabase Migration Engine")
    print("=" * 65)

    # 1. Determine Supabase Connection URI
    db_url = None
    if len(sys.argv) > 1 and sys.argv[1].startswith(("postgres://", "postgresql://")):
        db_url = sys.argv[1]
    else:
        db_url = os.getenv("DATABASE_URL") or getattr(settings, "DATABASE_URL", None)

    if not db_url:
        print("\n[CONFIG NEEDED] No Supabase DATABASE_URL found.")
        print("Please provide it as a command line argument or set DATABASE_URL in your .env file:")
        print("Usage:")
        print('  python backend/scripts/migrate_sqlite_to_supabase.py "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres"')
        sys.exit(1)

    # 2. Check local SQLite DB
    sqlite_db_path = settings.DATABASE_PATH
    if not sqlite_db_path.exists():
        print(f"[ERROR] Local SQLite database not found at: {sqlite_db_path}")
        sys.exit(1)

    print(f"\nSource (Local SQLite): {sqlite_db_path}")
    print(f"Target (Supabase Postgres): {db_url.split('@')[-1] if '@' in db_url else 'Supabase'}\n")

    # 3. Connect
    try:
        pg_conn = get_supabase_conn(db_url)
        print("✓ Connected to Supabase PostgreSQL successfully.")
    except Exception as e:
        print(f"[ERROR] Could not connect to Supabase: {e}")
        print("\nTip: Make sure you used your correct database password and selected 'Session pooler' (port 6543 or 5432).")
        sys.exit(1)

    sqlite_conn = sqlite3.connect(sqlite_db_path)
    sqlite_conn.row_factory = sqlite3.Row

    # 4. Schema check
    execute_schema(pg_conn)

    # 5. Migration in foreign-key safe dependency order
    tables = [
        "users",
        "profiles",
        "digilocker_records",
        "policy_announcements",
        "grievances",
        "grievance_votes",
        "grievance_comments",
        "grievance_audit_logs",
        "applications",
        "verifications",
        "system_audit_logs"
    ]

    print("\n[2/3] Migrating data records to Supabase...")
    total_migrated = 0
    for tbl in tables:
        count = migrate_table(sqlite_conn, pg_conn, tbl)
        total_migrated += count

    sqlite_conn.close()
    pg_conn.close()

    print("\n[3/3] Migration Complete!")
    print(f"Total records processed: {total_migrated}")
    print("=" * 65)
    print("Next Steps:")
    print("1. Set DATABASE_URL in your .env file:")
    print(f'   DATABASE_URL="{db_url}"')
    print("2. Restart your backend server:")
    print("   uvicorn app.main:app --reload")
    print("CivicConnect is now running live on Supabase!")
    print("=" * 65)

if __name__ == "__main__":
    main()
