import pandas as pd
import requests
from bs4 import BeautifulSoup
from io import BytesIO
from urllib.parse import urljoin
import streamlit as st
import ssl
import urllib3
import time

# Deshabilitar warnings SSL para deployment
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

@st.cache_data(ttl=3600)  # Cache por 1 hora
def itcrm():
  
    def obtener_link_descarga():
        
        url_pagina = "https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp"
        
        # User-Agents optimizados para cloud
        user_agents = [
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        for i, user_agent in enumerate(user_agents):
            headers = {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',  
                'Connection': 'keep-alive',
                'DNT': '1',
                'Upgrade-Insecure-Requests': '1'
            }
            
            try:
                
                try:
                    if i == 0:
                        st.info(f"🔍 Buscando datos en BCRA... (intento {i+1})")
                except:
                    pass
                
                # Configuración de sesión más conservadora para cloud
                session = requests.Session()
                session.headers.update(headers)
                
                # Primer intento con SSL normal
                try:
                    response = session.get(
                        url_pagina, 
                        timeout=20,  # Timeout más corto
                        verify=True,
                        allow_redirects=True
                    )
                    response.raise_for_status()
                    
                except requests.exceptions.SSLError:
                    # Segundo intento sin verificación SSL
                    print("⚠️ Problema SSL, reintentando sin verificación...")
                    response = session.get(
                        url_pagina, 
                        timeout=20,
                        verify=False,  # Crítico para cloud
                        allow_redirects=True
                    )
                    response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Búsqueda más agresiva de links
                for link in soup.find_all('a', href=True):
                    href = link.get('href', '').lower()
                    text = link.get_text(strip=True).lower()
                    title = link.get('title', '').lower()
                    
                    # Múltiples patrones de búsqueda
                    keywords = [
                        'serie histórica', 'serie historica', 'histórica', 'historica',
                        'itcrm', 'multilateral', 'tipo de cambio', 'descargar',
                        'excel', 'xlsx', 'xls'
                    ]
                    
                    # Verificar en texto, href y title
                    if any(keyword in text for keyword in keywords) and \
                       any(ext in href for ext in ['.xlsx', '.xls']) or \
                       any(keyword in title for keyword in keywords):
                        
                        full_url = urljoin(url_pagina, link.get('href'))
                        print(f" Link encontrado: {full_url}")
                        return full_url
                
                # Fallback: buscar cualquier link de Excel
                for link in soup.find_all('a', href=True):
                    href = link.get('href', '').lower()
                    if any(ext in href for ext in ['.xlsx', '.xls']):
                        full_url = urljoin(url_pagina, link.get('href'))
                        print(f"🎯 Link Excel encontrado (fallback): {full_url}")
                        return full_url
                        
            except Exception as e:
                print(f" Error con intento {i+1}: {str(e)[:100]}")
                # Esperar entre intentos
                if i < len(user_agents) - 1:
                    time.sleep(2)
                continue
        
        return None
    
    def descargar_y_procesar_excel(url_descarga):
        
        if not url_descarga:
            return pd.DataFrame()
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Referer': 'https://www.bcra.gob.ar/',
            'Connection': 'keep-alive'
        }
        
        max_retries = 2  # Reducir intentos para cloud
        for attempt in range(max_retries):
            try:
                # Mostrar progreso
                try:
                    st.info(f"Descargando archivo... (intento {attempt + 1})")
                except:
                    pass
                
                # Intento con SSL normal primero
                try:
                    response = requests.get(
                        url_descarga, 
                        headers=headers, 
                        timeout=30,  # Timeout moderado
                        verify=True,
                        allow_redirects=True,
                        stream=True
                    )
                    response.raise_for_status()
                    
                except requests.exceptions.SSLError:
                    # Fallback sin SSL
                    print(" SSL error")
                    response = requests.get(
                        url_descarga, 
                        headers=headers, 
                        timeout=30,
                        verify=False,  # Crítico para cloud
                        allow_redirects=True,
                        stream=True
                    )
                    response.raise_for_status()
                
                print(f" Archivo descargado - {len(response.content)} bytes")
                
                # Procesamiento robusto del Excel
                blob = BytesIO(response.content)
                
                try:
                    # Intentar con openpyxl primero
                    excel_file = pd.ExcelFile(blob, engine='openpyxl')
                except:
                    try:
                        # Fallback a xlrd para archivos .xls
                        blob.seek(0)
                        excel_file = pd.ExcelFile(blob, engine='xlrd')
                    except:
                        print(" Error leyendo Excel con ambos engines")
                        continue
                
                print(f"📊 Hojas disponibles: {excel_file.sheet_names}")
                
                # Seleccionar hoja correcta
                target_sheet = excel_file.sheet_names[0]  # Por defecto la primera
                
                for sheet_name in excel_file.sheet_names:
                    sheet_lower = sheet_name.lower()
                    if any(keyword in sheet_lower for keyword in ['itcrm', 'multilateral', 'serie', 'histórica']):
                        target_sheet = sheet_name
                        break
                
                print(f" Procesando hoja: {target_sheet}")
                
                # Leer datos con manejo de errores robusto
                try:
                    df = pd.read_excel(blob, sheet_name=target_sheet, engine='openpyxl')
                except:
                    blob.seek(0)
                    df = pd.read_excel(blob, sheet_name=target_sheet)
                
                # Mostrar primeras filas para debug
                print("📋 Primeras filas del DataFrame:")
                print(df.head())
                print("📋 Columnas disponibles:")
                print(df.columns.tolist())
                
                # Búsqueda inteligente de columnas
                fecha_col = None
                itcrm_col = None
                
                # Buscar columna de fecha
                for col in df.columns:
                    col_str = str(col).lower().strip()
                    if any(keyword in col_str for keyword in ['periodo', 'fecha', 'date', 'time', 'año', 'mes']):
                        fecha_col = col
                        break
                
                # Buscar columna ITCRM
                for col in df.columns:
                    col_str = str(col).lower().strip()
                    if 'itcrm' in col_str or 'multilateral' in col_str:
                        itcrm_col = col
                        break
                
                # Si no encontramos columnas específicas, usar las primeras dos
                if fecha_col is None or itcrm_col is None:
                    print(" Usando primeras dos columnas como fallback")
                    fecha_col = df.columns[0]
                    itcrm_col = df.columns[1]
                
                print(f"Columna fecha: {fecha_col}")
                print(f"Columna ITCRM: {itcrm_col}")
                
                # Procesar datos
                df_clean = df[[fecha_col, itcrm_col]].copy()
                df_clean.columns = ['fecha', 'valor']
                
                # Limpiar datos con múltiples formatos de fecha
                df_clean['fecha'] = pd.to_datetime(
                    df_clean['fecha'], 
                    errors='coerce',
                    infer_datetime_format=True,
                    dayfirst=True
                )
                
                df_clean['valor'] = pd.to_numeric(df_clean['valor'], errors='coerce')
                
                # Eliminar filas vacías y ordenar
                df_clean = df_clean.dropna().sort_values('fecha').reset_index(drop=True)
                
                if len(df_clean) > 0:
                    print(f"Datos procesados: {len(df_clean)} registros")
                    print(f"Rango: {df_clean['fecha'].min()} - {df_clean['fecha'].max()}")
                    print("Últimos valores:")
                    print(df_clean.tail())
                    
                    # Mostrar éxito en Streamlit
                    try:
                        st.success(f"✅ {len(df_clean)} registros de ITCRM obtenidos")
                    except:
                        pass
                    
                    return df_clean
                else:
                    print("No hay datos válidos después del procesamiento")
                    
            except Exception as e:
                error_msg = str(e)[:200]
                print(f"Error en intento {attempt + 1}: {error_msg}")
                
                if attempt < max_retries - 1:
                    time.sleep(3)  # Esperar entre intentos
                    
        return pd.DataFrame()
    
    # Proceso principal con mejor manejo de errores
    try:
        print("Iniciando obtención de ITCRM para Streamlit Cloud...")
        
        # Mostrar estado inicial
        try:
            st.info("Conectando con BCRA...")
        except:
            pass
        
        url_descarga = obtener_link_descarga()
        
        if not url_descarga:
            print("No se encontró el link de descarga")
            try:
                st.error("No se encontró el archivo de datos en BCRA")
            except:
                pass
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        df_resultado = descargar_y_procesar_excel(url_descarga)
        
        if df_resultado.empty:
            print("No se pudieron procesar los datos")
            try:
                st.error("No se pudieron procesar los datos del ITCRM")
            except:
                pass
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        print(f"ITCRM obtenido exitosamente: {len(df_resultado)} registros")
        return df_resultado
            
    except Exception as e:
        error_msg = str(e)
        print(f"Error crítico: {error_msg}")
        
        try:
            st.error(f"Error obteniendo ITCRM: {error_msg}")
        except:
            pass
            
        return pd.DataFrame(columns=['fecha', 'valor'])

# Test función
if __name__ == "__main__":
    print("Test de ITCRM optimizado para cloud...")
    df = itcrm()
    
    if not df.empty:
        print(f"Test exitoso: {len(df)} registros")
        print("Muestra de datos:")
        print(df.head())
        print(df.tail())
    else:
        print("Test falló - DataFrame vacío")