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
        # Tablas Core
        df_users = fetch_table_data("User")
        df_bodyweight = fetch_table_data("BodyWeightRecord")
        df_exercise = fetch_table_data("Exercise")
        df_records = fetch_table_data("ExerciseRecord")
        
        # Nuevas Tablas de Negocio
        df_roles = fetch_table_data("user_roles")
        df_plans = fetch_table_data("subscription_plans")
        df_durations = fetch_table_data("plan_durations")
        df_subscriptions = fetch_table_data("subscriptions")
        df_invoices = fetch_table_data("invoices")
        
    except Exception as e:
        print(f"Error al extraer datos (posible fallo de RLS o nombre de tabla): {e}")
        return

    # 2. Transformación (Transform)
    print("--- INICIANDO TRANSFORMACIÓN (Pandas) ---")
    
    # Procesar fechas
    for df in [df_bodyweight, df_records, df_subscriptions, df_invoices]:
        if not df.empty:
            # Detectar columna de fecha (date o created_at)
            date_col = 'date' if 'date' in df.columns else 'created_at'
            if date_col in df.columns:
                df[date_col] = pd.to_datetime(df[date_col])
                df = df.sort_values(by=date_col)
        
    # Cruce (JOIN) entre ExerciseRecord y Exercise
    if not df_records.empty and not df_exercise.empty:
        df_records = pd.merge(
            df_records, 
            df_exercise[['id', 'name']], 
            left_on='exerciseId', 
            right_on='id', 
            how='left',
            suffixes=('', '_exercise')
        )
        df_records.rename(columns={'name': 'exercise_name'}, inplace=True)
        if 'id_exercise' in df_records.columns:
            df_records.drop(columns=['id_exercise'], inplace=True)

    # Cruce de Suscripciones con Planes y Duraciones
    if not df_subscriptions.empty:
        if not df_plans.empty:
            df_subscriptions = pd.merge(df_subscriptions, df_plans[['id', 'name']], left_on='plan_id', right_on='id', how='left', suffixes=('', '_plan'))
            df_subscriptions.rename(columns={'name': 'plan_name'}, inplace=True)
        if not df_durations.empty:
            df_subscriptions = pd.merge(df_subscriptions, df_durations[['id', 'label']], left_on='duration_id', right_on='id', how='left')
            df_subscriptions.rename(columns={'label': 'duration_label'}, inplace=True)

    # 3. Carga (Load) - Exportar a CSV
    print("--- EXPORTANDO DATOS ---")
    
    exports_dir = os.path.join(os.path.dirname(__file__), 'exports')
    os.makedirs(exports_dir, exist_ok=True)
    
    # Mapeo de DataFrames a nombres de archivo
    dfs_to_export = {
        'users.csv': df_users,
        'bodyweight_records.csv': df_bodyweight,
        'exercise_records.csv': df_records,
        'exercises_catalog.csv': df_exercise,
        'user_roles.csv': df_roles,
        'subscription_plans.csv': df_plans,
        'plan_durations.csv': df_durations,
        'subscriptions.csv': df_subscriptions,
        'invoices.csv': df_invoices
    }
    
    for filename, df in dfs_to_export.items():
        if not df.empty:
            df.to_csv(os.path.join(exports_dir, filename), index=False)
            print(f"{filename} generado.")

    print("\nProceso ETL completado con exito! Tienes los archivos listos para Power BI en la carpeta 'analytics/exports/'")


if __name__ == "__main__":
    main()
