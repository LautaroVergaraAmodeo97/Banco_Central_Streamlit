import requests
import pandas as pd
import urllib3
import time
from datetime import datetime, timedelta
from typing import Optional

# Deshabilitar warnings SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Mapeo de variables del BCRA (IDs oficiales de API v4.0)
VARIABLES_BCRA = {
    "reservas": 1,              # Reservas Internacionales
    "base_monetaria": 15,       # Base Monetaria
    "tc_minorista": 4,          # Tipo de Cambio Minorista
    "tc_mayorista": 5,          # Tipo de Cambio Mayorista
    "baibar": 11,               # Tasa BAIBAR
}

def obtener_datos_bcra_v4(
    var_id: int,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    chunk_years: int = 3
) -> pd.DataFrame:
    """
    Obtiene datos de la API v4.0 del BCRA en chunks para evitar timeouts
    
    Args:
        var_id: ID de la variable en la API del BCRA
        fecha_inicio: Fecha de inicio (default: 1996-01-03)
        fecha_fin: Fecha de fin (default: hoy)
        chunk_years: Años por chunk (default: 3)
    
    Returns:
        DataFrame con columnas 'fecha' y 'valor'
    """
    
    # Configurar rango de fechas
    if fecha_inicio is None:
        fecha_inicio = datetime(1996, 1, 3)
    if fecha_fin is None:
        fecha_fin = datetime.today()
    
    # URL de la API
    url = f'https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/{var_id}'
    
    all_details = []
    current_start = fecha_inicio
    
    print(f"📡 Descargando datos del BCRA (var_id={var_id})")
    print(f"   Desde: {fecha_inicio.strftime('%Y-%m-%d')}")
    print(f"   Hasta: {fecha_fin.strftime('%Y-%m-%d')}")
    
    # Iterar por chunks
    while current_start < fecha_fin:
        # Definir fin del chunk actual
        current_end = min(
            current_start + timedelta(days=chunk_years * 365),
            fecha_fin
        )
        
        params = {
            'desde': current_start.strftime('%Y-%m-%d'),
            'hasta': current_end.strftime('%Y-%m-%d')
        }
        
        try:
            res = requests.get(url, params=params, verify=False, timeout=30)
            
            if res.status_code == 200:
                data = res.json().get('results', [])
                
                if data and 'detalle' in data[0]:
                    chunk_data = data[0]['detalle']
                    all_details.extend(chunk_data)
                    print(f"   ✅ {params['desde']} → {params['hasta']} | {len(chunk_data)} registros")
                else:
                    print(f"   ⚠️ Sin datos: {params['desde']} → {params['hasta']}")
            else:
                print(f"   ❌ Error {res.status_code}: {params['desde']}")
                
        except Exception as e:
            print(f"   ❌ Error de conexión en {params['desde']}: {e}")
        
        # Mover al siguiente chunk
        current_start = current_end + timedelta(days=1)
        
        # Delay para no saturar la API
        time.sleep(0.5)
    
    # Procesar datos
    if not all_details:
        print("❌ No se recuperaron datos")
        return pd.DataFrame(columns=['fecha', 'valor'])
    
    # Crear DataFrame
    df = pd.DataFrame(all_details)
    
    # Limpiar y estandarizar
    # IMPORTANTE: Convertir fecha sin zona horaria para evitar desfases
    df['fecha'] = pd.to_datetime(df['fecha'], utc=True).dt.tz_localize(None)
    df['valor'] = pd.to_numeric(df['valor'], errors='coerce')
    
    # Eliminar duplicados y ordenar
    df = df.drop_duplicates(subset=['fecha'])
    df = df.sort_values(by='fecha')
    df = df.reset_index(drop=True)
    
    # Eliminar filas con valores nulos
    df = df.dropna(subset=['valor'])
    
    print(f"✅ Proceso finalizado: {len(df)} registros únicos")
    print(f"   Rango: {df['fecha'].min()} → {df['fecha'].max()}")
    
    return df[['fecha', 'valor']]


def obtener_reservas_internacionales(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Obtiene datos de Reservas Internacionales
    """
    return obtener_datos_bcra_v4(
        var_id=VARIABLES_BCRA["reservas"],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


def obtener_base_monetaria(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Obtiene datos de Base Monetaria
    """
    return obtener_datos_bcra_v4(
        var_id=VARIABLES_BCRA["base_monetaria"],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


def obtener_tc_minorista(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Obtiene datos de Tipo de Cambio Minorista
    """
    return obtener_datos_bcra_v4(
        var_id=VARIABLES_BCRA["tc_minorista"],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


def obtener_tc_mayorista(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Obtiene datos de Tipo de Cambio Mayorista
    """
    return obtener_datos_bcra_v4(
        var_id=VARIABLES_BCRA["tc_mayorista"],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


def obtener_baibar(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Obtiene datos de Tasa BAIBAR
    """
    return obtener_datos_bcra_v4(
        var_id=VARIABLES_BCRA["baibar"],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


def combinar_con_datos_historicos(
    df_api: pd.DataFrame,
    csv_path: str
) -> pd.DataFrame:
    """
    Combina datos de la API con datos históricos de CSV
    
    Args:
        df_api: DataFrame de la API
        csv_path: Ruta al CSV con datos históricos
    
    Returns:
        DataFrame combinado y sin duplicados
    """
    try:
        # Leer CSV histórico
        df_historico = pd.read_csv(csv_path, parse_dates=['fecha'])
        df_historico['valor'] = pd.to_numeric(df_historico['valor'], errors='coerce')
        
        # Combinar
        df_combinado = pd.concat([df_historico, df_api], ignore_index=True)
        
        # Eliminar duplicados (priorizar datos más recientes)
        df_combinado = df_combinado.drop_duplicates(subset=['fecha'], keep='last')
        df_combinado = df_combinado.sort_values('fecha')
        df_combinado = df_combinado.reset_index(drop=True)
        
        print(f"📊 Datos combinados: {len(df_combinado)} registros totales")
        
        return df_combinado
        
    except FileNotFoundError:
        print(f"⚠️ CSV no encontrado: {csv_path}, usando solo datos de API")
        return df_api
    except Exception as e:
        print(f"❌ Error combinando datos: {e}")
        return df_api


# Test de la función
if __name__ == "__main__":
    print("🧪 Test de API BCRA v4.0\n")
    
    # Probar con un rango pequeño
    df = obtener_reservas_internacionales(
        fecha_inicio=datetime(2024, 1, 1),
        fecha_fin=datetime(2024, 12, 31)
    )
    
    print("\n📊 Primeros registros:")
    print(df.head())
    
    print("\n📊 Últimos registros:")
    print(df.tail())