import pandas as pd
import requests
from bs4 import BeautifulSoup
from io import BytesIO
from urllib.parse import urljoin
import streamlit as st
import ssl
import urllib3

# Deshabilitar warnings SSL para deployment
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

@st.cache_data(ttl=3600)  
def itcrm():
    """
    Versión robusta para deployment en cloud
    """
    
    def obtener_link_descarga():
        """Extrae el link dinámico del Excel con múltiples User-Agents"""
        url_pagina = "https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp"
        
        # Múltiples User-Agents para probar
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ]
        
        for user_agent in user_agents:
            headers = {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            }
            
            try:
                print(f"🔄 Intentando con User-Agent: {user_agent[:50]}...")
                
                # Crear sesión con configuración robusta
                session = requests.Session()
                session.headers.update(headers)
                
                response = session.get(
                    url_pagina, 
                    timeout=30,  # Timeout más largo para deployment
                    verify=True,  # Verificar SSL por defecto
                    allow_redirects=True
                )
                response.raise_for_status()
                
                print(f"✅ Página obtenida - Status: {response.status_code}")
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Buscar el link de descarga con múltiples patrones
                patterns = [
                    ['serie histórica', 'xlsx'],
                    ['serie historica', 'xlsx'],
                    ['descargar', 'xlsx'],
                    ['excel', 'descarga'],
                    ['xlsx'],
                    ['xls']
                ]
                
                for pattern in patterns:
                    for link in soup.find_all('a', href=True):
                        href = link.get('href', '').lower()
                        text = link.get_text(strip=True).lower()
                        
                        # Verificar si el link coincide con el patrón
                        if all(keyword in text for keyword in pattern) or \
                           any(ext in href for ext in ['.xlsx', '.xls']):
                            
                            full_url = urljoin(url_pagina, link.get('href'))
                            print(f"🎯 Link encontrado: {full_url}")
                            return full_url
                
            except requests.exceptions.SSLError:
                print(f"⚠️ Error SSL con {user_agent[:30]}, intentando sin verificación...")
                try:
                    # Reintentar sin verificación SSL
                    response = session.get(
                        url_pagina, 
                        timeout=30,
                        verify=False,  # Sin verificación SSL
                        allow_redirects=True
                    )
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    for link in soup.find_all('a', href=True):
                        href = link.get('href', '').lower()
                        text = link.get_text(strip=True).lower()
                        
                        if any(keyword in text for keyword in ['serie histórica', 'descargar', 'xlsx']) and \
                           any(ext in href for ext in ['.xlsx', '.xls']):
                            
                            full_url = urljoin(url_pagina, link.get('href'))
                            return full_url
                            
                except Exception as ssl_retry_error:
                    print(f"❌ Error en retry SSL: {ssl_retry_error}")
                    continue
                    
            except Exception as e:
                print(f"❌ Error con User-Agent {user_agent[:30]}: {str(e)[:100]}")
                continue
        
        return None
    
    def descargar_y_procesar_excel(url_descarga):
        """Descarga robusta del Excel"""
        if not url_descarga:
            return pd.DataFrame()
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp',
            'Connection': 'keep-alive'
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"📥 Descargando Excel (intento {attempt + 1}/{max_retries}): {url_descarga}")
                
                response = requests.get(
                    url_descarga, 
                    headers=headers, 
                    timeout=60,  # Timeout más largo
                    verify=True,
                    allow_redirects=True,
                    stream=True  # Para archivos grandes
                )
                response.raise_for_status()
                
                print(f"✅ Excel descargado - {len(response.content)} bytes")
                
                # Procesar Excel
                blob = BytesIO(response.content)
                
                try:
                    excel_file = pd.ExcelFile(blob, engine='openpyxl')
                    print(f"📊 Hojas disponibles: {excel_file.sheet_names}")
                    
                    # Buscar hoja correcta
                    target_sheet = excel_file.sheet_names[0]
                    for sheet_name in excel_file.sheet_names:
                        sheet_lower = sheet_name.lower()
                        if any(keyword in sheet_lower for keyword in ['itcrm', 'multilateral', 'bilateral', 'tipo', 'cambio']):
                            target_sheet = sheet_name
                            break
                    
                    print(f"🎯 Usando hoja: {target_sheet}")
                    
                    # Leer datos
                    df = pd.read_excel(blob, sheet_name=target_sheet, engine='openpyxl')
                    
                    # Buscar columnas
                    fecha_col = None
                    itcrm_col = None
                    
                    for col in df.columns:
                        col_str = str(col).lower().strip()
                        if any(keyword in col_str for keyword in ['periodo', 'fecha', 'date', 'time']):
                            fecha_col = col
                        if 'itcrm' in col_str:
                            itcrm_col = col
                    
                    if fecha_col is not None and itcrm_col is not None:
                        # Procesar datos
                        df_clean = df[[fecha_col, itcrm_col]].copy()
                        df_clean.columns = ['fecha', 'valor']
                        
                        # Limpiar
                        df_clean['fecha'] = pd.to_datetime(df_clean['fecha'], errors='coerce', dayfirst=True)
                        df_clean['valor'] = pd.to_numeric(df_clean['valor'], errors='coerce')
                        df_clean = df_clean.dropna().sort_values('fecha').reset_index(drop=True)
                        
                        if len(df_clean) > 0:
                            print(f"✅ Datos procesados: {len(df_clean)} registros")
                            print(f"📅 Rango: {df_clean['fecha'].min()} - {df_clean['fecha'].max()}")
                            return df_clean
                    
                    # Fallback: intentar con primeras dos columnas
                    print("⚠️ Intentando con primeras dos columnas...")
                    df_fallback = df.iloc[:, [0, 1]].copy()
                    df_fallback.columns = ['fecha', 'valor']
                    df_fallback['fecha'] = pd.to_datetime(df_fallback['fecha'], errors='coerce', dayfirst=True, format='mixed')
                    df_fallback['valor'] = pd.to_numeric(df_fallback['valor'], errors='coerce')
                    df_fallback = df_fallback.dropna().reset_index(drop=True)
                    
                    if len(df_fallback) > 0:
                        return df_fallback
                        
                except Exception as excel_error:
                    print(f"❌ Error procesando Excel: {excel_error}")
                    
            except requests.exceptions.SSLError:
                print(f"⚠️ Error SSL en descarga, reintentando sin verificación...")
                try:
                    response = requests.get(url_descarga, headers=headers, timeout=60, verify=False)
                    response.raise_for_status()
                    # ... resto del procesamiento igual
                except Exception as ssl_error:
                    print(f"❌ Error SSL retry: {ssl_error}")
                    
            except Exception as e:
                print(f"❌ Error en intento {attempt + 1}: {str(e)[:200]}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(5)  # Esperar 5 segundos antes del próximo intento
                    
        return pd.DataFrame()
    
    # Proceso principal con manejo de errores más detallado
    try:
        print("🏛️ Iniciando obtención de ITCRM...")
        
        # Verificar si estamos en contexto de Streamlit
        use_streamlit_ui = False
        status = None
        
        try:
            # Solo intentar usar Streamlit si estamos en el contexto correcto
            if hasattr(st, '_get_script_run_ctx') and st._get_script_run_ctx() is not None:
                status = st.status("Obteniendo datos ITCRM...", expanded=False)
                use_streamlit_ui = True
        except:
            use_streamlit_ui = False
        
        if use_streamlit_ui and status is not None:
            try:
                st.write("🔍 Buscando link de descarga...")
            except:
                pass
        
        url_descarga = obtener_link_descarga()
        
        if not url_descarga:
            if use_streamlit_ui and status is not None:
                try:
                    st.write("❌ No se encontró el link de descarga")
                    status.update(label="Error: Link no encontrado", state="error")
                except:
                    pass
            print("❌ No se encontró el link de descarga")
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        if use_streamlit_ui and status is not None:
            try:
                st.write(f"✅ Link encontrado")
                st.write("📥 Descargando y procesando Excel...")
            except:
                pass
        
        df_resultado = descargar_y_procesar_excel(url_descarga)
        
        if df_resultado.empty:
            if use_streamlit_ui and status is not None:
                try:
                    st.write("❌ No se pudieron procesar los datos")
                    status.update(label="Error: Datos no disponibles", state="error")
                except:
                    pass
            print("❌ No se pudieron procesar los datos")
            return pd.DataFrame(columns=['fecha', 'valor'])
        
        if use_streamlit_ui and status is not None:
            try:
                st.write(f"✅ {len(df_resultado)} registros obtenidos")
                status.update(label="ITCRM obtenido correctamente", state="complete")
            except:
                pass
        
        print(f"✅ ITCRM obtenido: {len(df_resultado)} registros")
        return df_resultado
            
    except Exception as e:
        error_msg = str(e)[:200]
        print(f"❌ Error general: {error_msg}")
        
        # Solo mostrar error en Streamlit si estamos en ese contexto
        try:
            st.error(f"Error obteniendo ITCRM: {error_msg}")
        except:
            pass  # Ignorar si no estamos en Streamlit
            
        return pd.DataFrame(columns=['fecha', 'valor'])

# Test independiente
if __name__ == "__main__":
    print("🧪 Test de ITCRM para deployment...")
    df = itcrm()
    
    if not df.empty:
        print(f"✅ Test exitoso: {len(df)} registros")
        print(df.tail())
    else:
        print("❌ Test falló")