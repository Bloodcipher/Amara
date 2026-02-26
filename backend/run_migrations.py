"""
AMARA ERP/MIS - Migration Runner
Executes SQL migration files against Supabase PostgreSQL
"""
import psycopg2
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DATABASE_URL = os.environ.get('DATABASE_URL')

def run_migrations():
    migrations_dir = ROOT_DIR / 'migrations'
    migration_files = sorted(migrations_dir.glob('*.sql'))
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    print(f"Connected to database. Running {len(migration_files)} migrations...\n")
    
    for mf in migration_files:
        print(f"  Running: {mf.name}")
        try:
            sql = mf.read_text()
            cur.execute(sql)
            print(f"  OK: {mf.name}")
        except Exception as e:
            print(f"  ERROR in {mf.name}: {e}")
    
    cur.close()
    conn.close()
    print("\nAll migrations complete!")

if __name__ == '__main__':
    run_migrations()
