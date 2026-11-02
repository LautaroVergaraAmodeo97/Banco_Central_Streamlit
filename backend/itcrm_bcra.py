"""
ITCRM (Índice de Tipo de Cambio Real Multilateral).

Busca el Excel de la serie diaria en la página del BCRA, lo descarga y lo
procesa. Si el sitio no responde, usa la copia local `data/itcrm.xlsx`.
"""

import os
from io import BytesIO
from urllib.parse import urljoin

import certifi
import pandas as pd
import requests
from bs4 import BeautifulSoup

URL_PAGINA = "https://www.bcra.gob.ar/PublicacionesEstadisticas/Indices_tipo_cambio_multilateral.asp"
ARCHIVO_LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "itcrm.xlsx")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9",
}


def _link_excel():
    res = requests.get(URL_PAGINA, headers=HEADERS, timeout=20, verify=certifi.where())
    res.raise_for_status()
    soup = BeautifulSoup(res.content, "html.parser")
    for link in soup.find_all("a", href=True):
        href = link["href"].lower()
        if href.endswith((".xlsx", ".xls")) and "itcrm" in href:
            return urljoin(URL_PAGINA, link["href"])
    for link in soup.find_all("a", href=True):
        if link["href"].lower().endswith((".xlsx", ".xls")):
            return urljoin(URL_PAGINA, link["href"])
    raise ValueError("No se encontró el Excel del ITCRM en la página del BCRA")


def _procesar_excel(contenido):
    """Toma la hoja diaria y devuelve las columnas Período e ITCRM como fecha/valor."""
    excel = pd.ExcelFile(contenido)
    hoja = excel.sheet_names[0]
    crudo = pd.read_excel(excel, sheet_name=hoja, header=None)

    # La fila de encabezados es la primera que tiene una celda exactamente "ITCRM"
    fila_header = next(
        i for i, fila in crudo.iterrows()
        if any(str(c).strip().upper() == "ITCRM" for c in fila)
    )
    encabezados = [str(c).strip().upper() for c in crudo.iloc[fila_header]]
    col_valor = encabezados.index("ITCRM")

    df = crudo.iloc[fila_header + 1:, [0, col_valor]].copy()
    df.columns = ["fecha", "valor"]
    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
    return df.dropna().sort_values("fecha").reset_index(drop=True)


def itcrm():
    try:
        url = _link_excel()
        res = requests.get(url, headers=HEADERS, timeout=60, verify=certifi.where())
        res.raise_for_status()
        return _procesar_excel(BytesIO(res.content))
    except Exception as e:
        print(f"[itcrm] No se pudo descargar del BCRA ({e}); se usa la copia local")
        return _procesar_excel(ARCHIVO_LOCAL)


if __name__ == "__main__":
    df = itcrm()
    print(f"{len(df)} registros, {df['fecha'].min()} → {df['fecha'].max()}")
    print(df.tail())
