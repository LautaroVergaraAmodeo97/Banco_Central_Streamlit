import pandas as pd
import requests
from bs4 import BeautifulSoup
from io import BytesIO
from urllib.parse import urljoin
import streamlit as st

@st.cache_data(ttl=3600)  # Cache por 1 hora - se renueva automáticamente
def itcrm():
  
    
    def obtener_link_descarga():
        
        url_pagina = "https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Connection': 'keep-alive'
        }
        
        try:
            response = requests.get(url_pagina, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Buscar el link de descarga
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                text = link.get_text(strip=True).lower()
                
                # Buscar links que mencionen descarga de serie histórica o xlsx
                if any(keyword in text for keyword in ['serie histórica', 'serie historica', 'descargar', 'xlsx', 'excel']) and \
                   any(ext in href.lower() for ext in ['.xlsx', '.xls']):
                    
                    # Convertir a URL absoluta si es relativa
                    full_url = urljoin(url_pagina, href)
                    return full_url
            
            # Si no encuentra por texto, buscar por href directamente
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if '.xlsx' in href.lower() or 'excel' in href.lower():
                    full_url = urljoin(url_pagina, href)
                    return full_url
            
            return None
            
        except Exception as e:
            print(f"Error obteniendo link de descarga: {e}")
            return None
    
    def descargar_y_procesar_excel(url_descarga):
        """Descarga y procesa el Excel del ITCRM"""
        if not url_descarga:
            return pd.DataFrame()
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*',
            'Referer': 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp'
        }
        
        try:
            response = requests.get(url_descarga, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Leer Excel
            blob = BytesIO(response.content)
            excel_file = pd.ExcelFile(blob, engine='openpyxl')
            
            # Buscar hoja con ITCRM
            target_sheet = excel_file.sheet_names[0]  # Por defecto la primera
            for sheet_name in excel_file.sheet_names:
                if 'itcrm' in sheet_name.lower() or 'multilateral' in sheet_name.lower() or 'bilateral' in sheet_name.lower():
                    target_sheet = sheet_name
                    break
            
            # Leer la hoja
            df = pd.read_excel(blob, sheet_name=target_sheet, engine='openpyxl')
            
            # Buscar columnas relevantes (pueden tener nombres ligeramente diferentes)
            fecha_col = None
            itcrm_col = None
            
            for col in df.columns:
                col_lower = str(col).lower().strip()
                if any(keyword in col_lower for keyword in ['periodo', 'fecha', 'date']):
                    fecha_col = col
                if 'itcrm' in col_lower:
                    itcrm_col = col
            
            if fecha_col is not None and itcrm_col is not None:
                # Procesar datos
                df_clean = df[[fecha_col, itcrm_col]].copy()
                df_clean = df_clean.rename(columns={fecha_col: 'fecha', itcrm_col: 'valor'})
                
                # Limpiar datos
                df_clean['fecha'] = pd.to_datetime(df_clean['fecha'], errors='coerce', dayfirst=True)
                df_clean['valor'] = pd.to_numeric(df_clean['valor'], errors='coerce')
                
                # Eliminar filas con valores nulos
                df_clean = df_clean.dropna().reset_index(drop=True)
                
                # Ordenar por fecha
                df_clean = df_clean.sort_values('fecha').reset_index(drop=True)
                
                # Verificar que tenemos datos
                if len(df_clean) > 0:
                    print(f"✅ ITCRM obtenido: {len(df_clean)} registros desde {df_clean['fecha'].min()} hasta {df_clean['fecha'].max()}")
                    return df_clean
                else:
                    print("❌ No se encontraron datos válidos después del procesamiento")
                    return pd.DataFrame()
            else:
                print(f"❌ No se encontraron columnas esperadas. Columnas disponibles: {list(df.columns)}")
                # Intentar con las primeras dos columnas si parecen ser fecha y valor
                if len(df.columns) >= 2:
                    df_clean = df.iloc[:, [0, 1]].copy()
                    df_clean.columns = ['fecha', 'valor']
                    df_clean['fecha'] = pd.to_datetime(df_clean['fecha'], errors='coerce', dayfirst=True)
                    df_clean['valor'] = pd.to_numeric(df_clean['valor'], errors='coerce')
                    df_clean = df_clean.dropna().reset_index(drop=True)
                    
                    if len(df_clean) > 0:
                        print(f"✅ ITCRM obtenido usando primeras columnas: {len(df_clean)} registros")
                        return df_clean
                
                return pd.DataFrame()
                
        except Exception as e:
            print(f"❌ Error procesando Excel de ITCRM: {e}")
            return pd.DataFrame()
    
    # Proceso principal
    try:
        # Obtener link de descarga
        url_descarga = obtener_link_descarga()
        
        if not url_descarga:
            print("❌ No se pudo obtener el link de descarga del ITCRM")
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        print(f"🔗 Link encontrado: {url_descarga}")
        
        # Descargar y procesar
        df_resultado = descargar_y_procesar_excel(url_descarga)
        
        if df_resultado.empty:
            print("❌ No se pudieron obtener datos de ITCRM")
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        return df_resultado
        
    except Exception as e:
        print(f"❌ Error general obteniendo ITCRM: {e}")
        return pd.DataFrame(columns=['fecha', 'valor'])

# Función adicional para testing (opcional)
if __name__ == "__main__":
    print("🧪 Testeando función ITCRM...")
    df = itcrm()
    
    if not df.empty:
        print(f"✅ Test exitoso: {len(df)} registros obtenidos")
        print(f"📅 Rango: {df['fecha'].min()} a {df['fecha'].max()}")
        print(f"📊 Últimos valores:")
        print(df.tail())
    else:
        print("❌ Test falló: No se obtuvieron datos")