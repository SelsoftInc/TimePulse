from sqlalchemy import create_engine, text, inspect
import json

DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "timepulse_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_SSL = "disable"

connection_string = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode={DB_SSL}"
)

def escape_sql_string(value):
    """Escape single quotes in SQL strings"""
    if value is None:
        return "NULL"
    if isinstance(value, str):
        return f"'{value.replace(chr(39), chr(39)+chr(39))}'"
    if isinstance(value, bool):
        return str(value).upper()
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, dict) or isinstance(value, list):
        return f"'{json.dumps(value).replace(chr(39), chr(39)+chr(39))}'"
    return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'"

try:
    engine = create_engine(connection_string, pool_pre_ping=True)
    
    with engine.connect() as conn:
        print("✅ Connection Successful!")
        
        # Get all table names
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\n📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Generate schema and data SQL
        sql_output = []
        sql_output.append("-- TimePulse Database Schema with Data")
        sql_output.append("-- Generated from existing database")
        sql_output.append("-- Database: timepulse_db\n")
        
        for table_name in tables:
            print(f"\n📋 Processing table: {table_name}")
            
            # Get table schema
            schema_result = conn.execute(text(f"""
                SELECT 
                    column_name, 
                    data_type, 
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """))
            
            columns = schema_result.fetchall()
            column_names = [col[0] for col in columns]
            
            # Create table definition
            sql_output.append(f"\n-- ============================================")
            sql_output.append(f"-- Table: {table_name}")
            sql_output.append(f"-- ============================================")
            sql_output.append(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
            sql_output.append(f"CREATE TABLE {table_name} (")
            
            col_definitions = []
            for col in columns:
                col_name, data_type, max_length, nullable, default = col
                
                # Build column definition
                col_def = f"    {col_name} {data_type.upper()}"
                
                if max_length:
                    col_def += f"({max_length})"
                
                if nullable == 'NO':
                    col_def += " NOT NULL"
                
                if default:
                    col_def += f" DEFAULT {default}"
                
                col_definitions.append(col_def)
            
            sql_output.append(",\n".join(col_definitions))
            sql_output.append(");\n")
            
            # Get primary keys
            pk_result = conn.execute(text(f"""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = '{table_name}'::regclass AND i.indisprimary
            """))
            
            primary_keys = [row[0] for row in pk_result.fetchall()]
            if primary_keys:
                sql_output.append(f"ALTER TABLE {table_name} ADD PRIMARY KEY ({', '.join(primary_keys)});\n")
            
            # Get table data
            data_result = conn.execute(text(f"SELECT * FROM {table_name}"))
            rows = data_result.fetchall()
            
            if rows:
                print(f"  📦 Exporting {len(rows)} rows")
                sql_output.append(f"-- Data for table: {table_name}")
                
                for row in rows:
                    values = []
                    for value in row:
                        values.append(escape_sql_string(value))
                    
                    insert_stmt = f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({', '.join(values)});"
                    sql_output.append(insert_stmt)
                
                sql_output.append("")
            else:
                print(f"  ⚠️  No data found")
                sql_output.append(f"-- No data in table: {table_name}\n")
        
        # Get foreign keys
        sql_output.append("\n-- ============================================")
        sql_output.append("-- Foreign Key Constraints")
        sql_output.append("-- ============================================\n")
        
        fk_result = conn.execute(text("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
        """))
        
        foreign_keys = fk_result.fetchall()
        for fk in foreign_keys:
            table, column, ref_table, ref_column, constraint_name = fk
            sql_output.append(
                f"ALTER TABLE {table} ADD CONSTRAINT {constraint_name} "
                f"FOREIGN KEY ({column}) REFERENCES {ref_table}({ref_column});"
            )
        
        # Write to file

        output_file = "D:/selsoft/WebApp/TimePulse/scripts/database_schema_with_data.sql"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_output))
        
        print(f"\n✅ Schema and data exported to: {output_file}")
        print(f"📊 Total tables: {len(tables)}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()