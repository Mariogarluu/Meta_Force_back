import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar las variables de entorno del archivo .env del backend (un nivel arriba)
# Esto asegura que usa la misma base de datos que la aplicación
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url: str = os.environ.get("SUPABASE_URL")
# Para analítica de datos es OBLIGATORIO usar la SERVICE_ROLE_KEY
# ya que la anon_key está bloqueada por el RLS (Row Level Security)
# y devuelve las tablas vacías (0 filas).
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Falta SUPABASE_SERVICE_ROLE_KEY en el archivo .env. Ve a Supabase -> Project Settings -> API y cópiala.")

print("Conectando a Supabase...")
supabase: Client = create_client(url, key)

def fetch_table_data(table_name: str) -> pd.DataFrame:
    """Extrae todos los registros de una tabla dada (paginado automático si es necesario)"""
    print(f"Extrayendo datos de la tabla: {table_name}...")
    response = supabase.table(table_name).select("*").execute()
    data = response.data
    return pd.DataFrame(data)

def main():
    # 1. Extracción (Extract)
    print("--- INICIANDO EXTRACCIÓN ---")
    
    try:
        df_users = fetch_table_data("User")
        df_bodyweight = fetch_table_data("BodyWeightRecord")
        df_exercise = fetch_table_data("Exercise")
        df_records = fetch_table_data("ExerciseRecord")
    except Exception as e:
        print(f"Error al extraer datos (posible fallo de RLS o nombre de tabla): {e}")
        return

    # 2. Transformación (Transform)
    print("--- INICIANDO TRANSFORMACIÓN (Pandas) ---")
    
    # Asegurarnos de que las fechas sean objetos datetime de Pandas
    if not df_bodyweight.empty:
        df_bodyweight['date'] = pd.to_datetime(df_bodyweight['date'])
        # Ordenar por fecha
        df_bodyweight = df_bodyweight.sort_values(by='date')
        
    if not df_records.empty:
        df_records['date'] = pd.to_datetime(df_records['date'])
        
        # Cruce (JOIN) entre ExerciseRecord y Exercise para tener los nombres de los ejercicios
        if not df_exercise.empty:
            df_records = pd.merge(
                df_records, 
                df_exercise[['id', 'name']], 
                left_on='exerciseId', 
                right_on='id', 
                how='left',
                suffixes=('', '_exercise')
            )
            # Renombrar columnas para mayor claridad
            df_records.rename(columns={'name': 'exercise_name'}, inplace=True)
            # Eliminar la columna id duplicada
            if 'id_exercise' in df_records.columns:
                df_records.drop(columns=['id_exercise'], inplace=True)

    # 3. Carga (Load) - Exportar a CSV
    print("--- EXPORTANDO DATOS ---")
    
    exports_dir = os.path.join(os.path.dirname(__file__), 'exports')
    os.makedirs(exports_dir, exist_ok=True)
    
    # Exportar los DataFrames a CSV
    if not df_users.empty:
        df_users.to_csv(os.path.join(exports_dir, 'users.csv'), index=False)
        print("users.csv generado.")
        
    if not df_bodyweight.empty:
        df_bodyweight.to_csv(os.path.join(exports_dir, 'bodyweight_records.csv'), index=False)
        print("bodyweight_records.csv generado.")
        
    if not df_records.empty:
        df_records.to_csv(os.path.join(exports_dir, 'exercise_records.csv'), index=False)
        print("exercise_records.csv generado.")
        
    if not df_exercise.empty:
        df_exercise.to_csv(os.path.join(exports_dir, 'exercises_catalog.csv'), index=False)
        print("exercises_catalog.csv generado.")

    print("\nProceso ETL completado con exito! Tienes los archivos listos para Power BI en la carpeta 'analytics/exports/'")

if __name__ == "__main__":
    main()
