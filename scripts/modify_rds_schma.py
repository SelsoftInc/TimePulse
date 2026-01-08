import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

# Database credentials
DB_HOST = ""
DB_PORT = 5432
DB_NAME = ""  
DB_USER = ""
DB_PASSWORD = ""
DB_SSL = "require"

# Path to SQL file
SQL_FILE_PATH = os.path.join(os.path.dirname(__file__), "schema_with_data.sql")

def get_db_connection():
    """Create and return a database connection"""
    try:
        print(f"[STEP 1] Connecting to database at {DB_HOST}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode=DB_SSL
        )
        print("✓ Successfully connected to database")
        return conn
    except Exception as e:
        print(f"✗ Error connecting to database: {e}")
        raise

def drop_all_tables(conn):
    """Drop all tables in the public schema"""
    try:
        print("\n[STEP 2] Dropping all existing tables...")
        cursor = conn.cursor()
        
        # Disable foreign key checks temporarily
        cursor.execute("SET session_replication_role = 'replica';")
        
        # Get all table names
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"Found {len(tables)} tables to drop:")
            for table in tables:
                table_name = table[0]
                print(f"  - Dropping table: {table_name}")
                cursor.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE").format(
                    sql.Identifier(table_name)
                ))
            print("✓ All tables dropped successfully")
        else:
            print("  No tables found to drop")
        
        # Re-enable foreign key checks
        cursor.execute("SET session_replication_role = 'origin';")
        conn.commit()
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error dropping tables: {e}")
        conn.rollback()
        raise

def drop_all_types(conn):
    """Drop all custom types (ENUMs) in the public schema"""
    try:
        print("\n[STEP 3] Dropping all custom types (ENUMs)...")
        cursor = conn.cursor()
        
        # Get all custom types
        cursor.execute("""
            SELECT typname 
            FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
        """)
        types = cursor.fetchall()
        
        if types:
            print(f"Found {len(types)} custom types to drop:")
            for type_name in types:
                print(f"  - Dropping type: {type_name[0]}")
                cursor.execute(sql.SQL("DROP TYPE IF EXISTS {} CASCADE").format(
                    sql.Identifier(type_name[0])
                ))
            print("✓ All custom types dropped successfully")
        else:
            print("  No custom types found to drop")
        
        conn.commit()
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error dropping types: {e}")
        conn.rollback()
        raise

def drop_all_sequences(conn):
    """Drop all sequences in the public schema"""
    try:
        print("\n[STEP 4] Dropping all sequences...")
        cursor = conn.cursor()
        
        # Get all sequences
        cursor.execute("""
            SELECT sequencename 
            FROM pg_sequences 
            WHERE schemaname = 'public'
        """)
        sequences = cursor.fetchall()
        
        if sequences:
            print(f"Found {len(sequences)} sequences to drop:")
            for seq in sequences:
                seq_name = seq[0]
                print(f"  - Dropping sequence: {seq_name}")
                cursor.execute(sql.SQL("DROP SEQUENCE IF EXISTS {} CASCADE").format(
                    sql.Identifier(seq_name)
                ))
            print("✓ All sequences dropped successfully")
        else:
            print("  No sequences found to drop")
        
        conn.commit()
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error dropping sequences: {e}")
        conn.rollback()
        raise

def drop_all_functions(conn):
    """Drop all functions in the public schema"""
    try:
        print("\n[STEP 5] Dropping all functions...")
        cursor = conn.cursor()
        
        # Get all functions
        cursor.execute("""
            SELECT proname, oidvectortypes(proargtypes) as argtypes
            FROM pg_proc 
            INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
            WHERE pg_namespace.nspname = 'public'
        """)
        functions = cursor.fetchall()
        
        if functions:
            print(f"Found {len(functions)} functions to drop:")
            for func_name, arg_types in functions:
                print(f"  - Dropping function: {func_name}({arg_types})")
                cursor.execute(sql.SQL("DROP FUNCTION IF EXISTS {}({}) CASCADE").format(
                    sql.Identifier(func_name),
                    sql.SQL(arg_types)
                ))
            print("✓ All functions dropped successfully")
        else:
            print("  No functions found to drop")
        
        conn.commit()
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error dropping functions: {e}")
        conn.rollback()
        raise

def execute_sql_file(conn, sql_file_path):
    """Execute SQL file to restore schema and data"""
    try:
        print(f"\n[STEP 6] Reading SQL file: {sql_file_path}")
        
        if not os.path.exists(sql_file_path):
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
        
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_lines = f.readlines()
        
        print(f"✓ SQL file read successfully ({len(sql_lines)} lines)")
        
        print("\n[STEP 7] Parsing and executing SQL file...")
        cursor = conn.cursor()
        
        current_statement = []
        in_copy_mode = False
        copy_statement = ""
        copy_data = []
        statements_executed = 0
        copy_statements_executed = 0
        in_dollar_quote = False  # Track if we're inside a dollar-quoted string
        dollar_quote_tag = ""     # Track the dollar quote tag (e.g., $$, $body$, etc.)
        
        for line_num, line in enumerate(sql_lines, 1):
            # Skip \restrict and \unrestrict commands
            if line.strip().startswith('\\restrict') or line.strip().startswith('\\unrestrict'):
                continue
            
            # Skip SET transaction_timeout (not supported in all PostgreSQL versions)
            if 'transaction_timeout' in line.lower():
                continue
            
            # Check if this is a COPY statement
            if line.strip().upper().startswith('COPY ') and 'FROM stdin' in line:
                # Execute any pending regular statement first
                if current_statement:
                    stmt = ''.join(current_statement).strip()
                    if stmt and not stmt.startswith('--'):
                        try:
                            cursor.execute(stmt)
                            statements_executed += 1
                        except Exception as e:
                            print(f"✗ Error at line {line_num}: {e}")
                            print(f"   Statement: {stmt[:200]}...")
                            raise
                    current_statement = []
                
                # Start COPY mode
                in_copy_mode = True
                copy_statement = line.strip()
                copy_data = []
                continue
            
            # Handle COPY data
            if in_copy_mode:
                if line.strip() == '\\.':
                    # End of COPY data
                    in_copy_mode = False
                    
                    # Execute the COPY statement with data
                    try:
                        from io import StringIO
                        copy_data_str = ''.join(copy_data)
                        copy_buffer = StringIO(copy_data_str)
                        
                        # Convert COPY ... FROM stdin to COPY ... FROM STDIN
                        copy_cmd = copy_statement.replace('FROM stdin', 'FROM STDIN')
                        
                        cursor.copy_expert(copy_cmd, copy_buffer)
                        copy_statements_executed += 1
                        
                        if copy_statements_executed % 5 == 0:
                            print(f"  - Executed {copy_statements_executed} COPY statements...")
                        
                    except Exception as e:
                        print(f"✗ Error executing COPY at line {line_num}: {e}")
                        print(f"   COPY statement: {copy_statement}")
                        raise
                    
                    copy_statement = ""
                    copy_data = []
                else:
                    # Accumulate COPY data
                    copy_data.append(line)
                continue
            
            # Skip empty lines and comment-only lines
            stripped_line = line.strip()
            if not stripped_line or stripped_line.startswith('--'):
                # But keep them for context in multi-line statements
                if current_statement:
                    current_statement.append(line)
                continue
            
            # Regular SQL statement
            current_statement.append(line)
            
            # Check for dollar-quoted strings
            import re
            # Find all dollar quote markers in the line (e.g., $$, $body$, $function$)
            dollar_quotes = re.findall(r'\$[a-zA-Z0-9_]*\$', line)
            for dq in dollar_quotes:
                if not in_dollar_quote:
                    # Starting a dollar quote
                    in_dollar_quote = True
                    dollar_quote_tag = dq
                elif dq == dollar_quote_tag:
                    # Ending the dollar quote
                    in_dollar_quote = False
                    dollar_quote_tag = ""
            
            # Check if statement is complete (ends with semicolon and not in dollar quote)
            if stripped_line.endswith(';') and not in_dollar_quote:
                stmt = ''.join(current_statement).strip()
                
                # Only execute if it's not just comments
                if stmt and not all(l.strip().startswith('--') or not l.strip() 
                                   for l in current_statement):
                    try:
                        cursor.execute(stmt)
                        statements_executed += 1
                        
                        if statements_executed % 50 == 0:
                            print(f"  - Executed {statements_executed} SQL statements...")
                        
                    except Exception as e:
                        print(f"✗ Error at line {line_num}: {e}")
                        print(f"   Statement preview: {stmt[:200]}...")
                        # Show more context for debugging
                        if len(stmt) > 200:
                            print(f"   ... (total length: {len(stmt)} characters)")
                        raise
                
                current_statement = []
        
        # Execute any remaining statement
        if current_statement:
            stmt = ''.join(current_statement).strip()
            if stmt and not stmt.startswith('--'):
                try:
                    cursor.execute(stmt)
                    statements_executed += 1
                except Exception as e:
                    print(f"✗ Error in final statement: {e}")
                    raise
        
        conn.commit()
        print(f"✓ SQL file executed successfully")
        print(f"  - Total SQL statements executed: {statements_executed}")
        print(f"  - Total COPY statements executed: {copy_statements_executed}")
        print("✓ Schema and data restored successfully")
        
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error in execute_sql_file: {e}")
        conn.rollback()
        raise

def verify_restoration(conn):
    """Verify that tables were created successfully"""
    try:
        print("\n[STEP 8] Verifying restoration...")
        cursor = conn.cursor()
        
        # Count tables
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        table_count = cursor.fetchone()[0]
        
        # Count types
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
        """)
        type_count = cursor.fetchone()[0]
        
        print(f"✓ Verification complete:")
        print(f"  - Tables created: {table_count}")
        print(f"  - Custom types created: {type_count}")
        
        # List all tables
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n  Tables in database:")
            for table in tables:
                print(f"    - {table[0]}")
        
        cursor.close()
        
    except Exception as e:
        print(f"✗ Error during verification: {e}")
        raise

def main():
    """Main function to orchestrate the database reset and restoration"""
    conn = None
    try:
        print("=" * 70)
        print("DATABASE RESET AND RESTORATION SCRIPT")
        print("=" * 70)
        
        # Connect to database
        conn = get_db_connection()
        
        # Drop all existing objects
        drop_all_tables(conn)
        drop_all_sequences(conn)
        drop_all_types(conn)
        drop_all_functions(conn)
        
        # Execute SQL file to restore
        execute_sql_file(conn, SQL_FILE_PATH)
        
        # Verify restoration
        verify_restoration(conn)
        
        print("\n" + "=" * 70)
        print("✓ DATABASE RESET AND RESTORATION COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        
    except Exception as e:
        print("\n" + "=" * 70)
        print(f"✗ SCRIPT FAILED: {e}")
        print("=" * 70)
        raise
        
    finally:
        if conn:
            conn.close()
            print("\n[CLEANUP] Database connection closed")

if __name__ == "__main__":
    main()