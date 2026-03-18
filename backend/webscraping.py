import pandas as pd
import requests
from bs4 import BeautifulSoup
from io import BytesIO
import re
from urllib.parse import urljoin

def obtener_link_descarga_itcrm():
    """
    Extrae el link dinámico de descarga del Excel desde la página del BCRA
    """
    url_pagina = "https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    try:
        print(f"🔍 Accediendo a: {url_pagina}")
        
        response = requests.get(url_pagina, headers=headers, timeout=15)
        response.raise_for_status()
        
        print(f"✅ Página cargada - Status: {response.status_code}")
        
        # Parsear HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Buscar el link de descarga del Excel
        # Patrón 1: Buscar por texto que contenga "serie histórica" y "xlsx"
        links_excel = []
        
        # Buscar todos los links
        all_links = soup.find_all('a', href=True)
        print(f"📊 Total de links encontrados: {len(all_links)}")
        
        for link in all_links:
            href = link.get('href', '')
            text = link.get_text(strip=True).lower()
            
            # Buscar links que mencionen descarga de serie histórica o xlsx
            if any(keyword in text for keyword in ['serie histórica', 'serie historica', 'descargar', 'xlsx', 'excel']) and \
               any(ext in href.lower() for ext in ['.xlsx', '.xls']):
                
                # Convertir a URL absoluta si es relativa
                full_url = urljoin(url_pagina, href)
                links_excel.append({
                    'url': full_url,
                    'text': link.get_text(strip=True),
                    'href': href
                })
                print(f"🎯 Link candidato encontrado:")
                print(f"   Texto: {link.get_text(strip=True)}")
                print(f"   URL: {full_url}")
        
        # También buscar por patrones en href directamente
        for link in all_links:
            href = link.get('href', '')
            if '.xlsx' in href.lower() or 'excel' in href.lower() or 'series' in href.lower():
                full_url = urljoin(url_pagina, href)
                if full_url not in [l['url'] for l in links_excel]:
                    links_excel.append({
                        'url': full_url,
                        'text': link.get_text(strip=True),
                        'href': href
                    })
                    print(f"🔍 Link por href encontrado:")
                    print(f"   Texto: {link.get_text(strip=True)}")
                    print(f"   URL: {full_url}")
        
        if links_excel:
            print(f"\n✅ Encontrados {len(links_excel)} links de descarga potenciales")
            return links_excel[0]['url']  # Devolver el primero
        else:
            print("❌ No se encontró el link de descarga")
            
            # Debug: mostrar algunos links para inspección manual
            print("\n🔍 Links encontrados para debug:")
            for i, link in enumerate(all_links[:10]):
                print(f"   {i+1}. '{link.get_text(strip=True)[:50]}...' -> {link.get('href', '')[:100]}")
            
            return None
            
    except Exception as e:
        print(f"❌ Error accediendo a la página: {e}")
        return None

def descargar_y_procesar_itcrm(url_descarga):
    """
    Descarga y procesa el Excel del ITCRM
    """
    if not url_descarga:
        return None
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*',
        'Referer': 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp'
    }
    
    try:
        print(f"📥 Descargando Excel desde: {url_descarga}")
        
        response = requests.get(url_descarga, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"✅ Excel descargado - {len(response.content)} bytes")
        
        # Leer Excel
        blob = BytesIO(response.content)
        
        # Ver qué hojas tiene
        excel_file = pd.ExcelFile(blob, engine='openpyxl')
        print(f"📊 Hojas disponibles: {excel_file.sheet_names}")
        
        # Buscar la hoja con ITCRM
        target_sheet = None
        for sheet_name in excel_file.sheet_names:
            if 'itcrm' in sheet_name.lower() or 'multilateral' in sheet_name.lower():
                target_sheet = sheet_name
                break
        
        if not target_sheet:
            target_sheet = excel_file.sheet_names[0]  # Usar la primera si no encontramos
        
        print(f"🎯 Procesando hoja: {target_sheet}")
        
        # Leer la hoja
        df = pd.read_excel(blob, sheet_name=target_sheet, engine='openpyxl')
        print(f"📋 Dimensiones originales: {df.shape}")
        print(f"📋 Columnas: {list(df.columns)}")
        print("\n🔍 Primeras filas del archivo:")
        print(df.head(10))
        
        # Intentar procesar (esto puede necesitar ajustes según el formato real)
        return df
        
    except Exception as e:
        print(f"❌ Error procesando Excel: {e}")
        return None

def obtener_itcrm_completo():
    """
    Función principal que obtiene y procesa el ITCRM
    """
    print("🏛️  SCRAPER ITCRM - BANCO CENTRAL DE LA REPÚBLICA ARGENTINA")
    print("=" * 70)
    
    # Paso 1: Obtener el link de descarga
    url_descarga = obtener_link_descarga_itcrm()
    
    if not url_descarga:
        print("💔 No se pudo obtener el link de descarga")
        return None
    
    print(f"\n✅ Link de descarga encontrado: {url_descarga}")
    
    # Paso 2: Descargar y procesar
    df = descargar_y_procesar_itcrm(url_descarga)
    
    if df is not None:
        print(f"\n🎉 ¡Datos obtenidos exitosamente!")
        print(f"📊 Dimensiones finales: {df.shape}")
        return df
    else:
        print("💔 No se pudieron procesar los datos")
        return None

if __name__ == "__main__":
    df_itcrm = obtener_itcrm_completo()
    
    if df_itcrm is not None:
        print("\n" + "="*50)
        print("🎯 DATOS OBTENIDOS:")
        print("="*50)
        print(df_itcrm.head())
        
        # Guardar para inspección
        df_itcrm.to_csv("itcrm_debug.csv", index=False)
        print("\n💾 Datos guardados en 'itcrm_debug.csv' para inspección")
    else:
        print("\n⚠️  No se pudieron obtener los datos. Posibles causas:")
        print("   1. El sitio web cambió su estructura")
        print("   2. Problemas de conectividad")
        print("   3. El link de descarga usa JavaScript dinámico")
        print("\n💡 Próximo paso: Inspeccionar manualmente la página web")