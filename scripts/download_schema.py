from sqlalchemy import create_engine, text, inspect

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

try:
    engine = create_engine(connection_string, pool_pre_ping=True)
    
    with engine.connect() as conn:
        print(" Connection Successful ")
        
        # Get all table names
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\n Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Generate schema SQL
        schema_sql = []
        schema_sql.append("-- TimePulse Database Schema")
        schema_sql.append("-- Generated from existing database\n")
        
        for table_name in tables:
            # Get table schema
            result = conn.execute(text(f"""
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
            
            columns = result.fetchall()
            
            schema_sql.append(f"\n-- Table: {table_name}")
            schema_sql.append(f"CREATE TABLE IF NOT EXISTS {table_name} (")
            
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
            
            schema_sql.append(",\n".join(col_definitions))
            schema_sql.append(");\n")
        
        # Write to file
        schema_file = "database_schema.sql"
        with open(schema_file, 'w') as f:
            f.write('\n'.join(schema_sql))
        
        print(f"\n Schema exported to: {schema_file}")
        
except Exception as e:
    print(f" Error: {e}")