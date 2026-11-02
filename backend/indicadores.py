"""
Catálogo de indicadores y carga de series.

Cada serie del BCRA se arma con el CSV histórico local + lo que falta desde
la API v4.0 del BCRA. El ITCRM se obtiene del Excel publicado por el BCRA.
Los resultados se cachean en memoria para no golpear la API en cada request.
"""

import os
import time
import threading
from datetime import date, timedelta

import certifi
import pandas as pd
import requests

from itcrm_bcra import itcrm

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
API_URL = "https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/{id}"
CACHE_TTL = 60 * 60  # 1 hora

INDICADORES = {
    "reservas": {
        "nombre": "Reservas Internacionales",
        "descripcion": "Reservas internacionales del BCRA",
        "unidad": "Millones de USD",
        "id_bcra": 1,
        "csv": "data_vieja.csv",
    },
    "tipo-cambio-minorista": {
        "nombre": "Tipo de Cambio Minorista",
        "descripcion": "Promedio de cotizaciones minoristas del dólar",
        "unidad": "ARS por USD",
        "id_bcra": 4,
        "csv": "tipo_cambio_minorista.csv",
    },
    "tipo-cambio-mayorista": {
        "nombre": "Tipo de Cambio Mayorista",
        "descripcion": "Tipo de cambio de referencia Com. A 3500",
        "unidad": "ARS por USD",
        "id_bcra": 5,
        "csv": "tipo_cambio_mayorista.csv",
    },
    "baibar": {
        "nombre": "Tasa BAIBAR",
        "descripcion": "Tasa de interbancarios a 1 día",
        "unidad": "% n.a.",
        "id_bcra": 11,
        "csv": "df_baibar.csv",
    },
    "base-monetaria": {
        "nombre": "Base Monetaria",
        "descripcion": "Base monetaria total",
        "unidad": "Millones de ARS",
        "id_bcra": 15,
        "csv": "df_base.csv",
    },
    "itcrm": {
        "nombre": "ITCRM",
        "descripcion": "Índice de Tipo de Cambio Real Multilateral",
        "unidad": "Índice (17-12-15 = 100)",
        "id_bcra": None,
        "csv": None,
    },
    # Serie mensual para la calculadora de inflación: no se muestra en el resumen
    "inflacion-mensual": {
        "nombre": "Inflación mensual",
        "descripcion": "Variación mensual del índice de precios al consumidor",
        "unidad": "%",
        "id_bcra": 27,
        "csv": "inflacion_mensual.csv",
        "en_resumen": False,
    },
}

_cache = {}
_locks = {slug: threading.Lock() for slug in INDICADORES}


def _leer_csv(nombre):
    """Lee un CSV histórico tolerando fechas dd/mm/aaaa y decimales con coma."""
    df = pd.read_csv(os.path.join(DATA_DIR, nombre), dtype={"fecha": str, "valor": str})
    fechas = df["fecha"].str.strip()
    df["fecha"] = pd.to_datetime(fechas, format="ISO8601", errors="coerce")
    con_barra = fechas.str.contains("/", na=False)
    df.loc[con_barra, "fecha"] = pd.to_datetime(fechas[con_barra], dayfirst=True, errors="coerce")
    df["valor"] = pd.to_numeric(df["valor"].str.strip().str.replace(",", "."), errors="coerce")
    return df[["fecha", "valor"]].dropna()


def _descargar_api(id_bcra, desde):
    """Descarga de la API v4.0 desde `desde` hasta hoy, paginando de a 3000."""
    filas, offset = [], 0
    while True:
        res = requests.get(
            API_URL.format(id=id_bcra),
            params={
                "desde": desde.isoformat(),
                "hasta": date.today().isoformat(),
                "limit": 3000,
                "offset": offset,
            },
            timeout=30,
            verify=certifi.where(),
        )
        res.raise_for_status()
        cuerpo = res.json()
        resultados = cuerpo.get("results") or []
        detalle = resultados[0].get("detalle", []) if resultados else []
        filas.extend(detalle)
        total = cuerpo.get("metadata", {}).get("resultset", {}).get("count", 0)
        offset += len(detalle)
        if not detalle or offset >= total:
            break

    if not filas:
        return pd.DataFrame(columns=["fecha", "valor"])
    df = pd.DataFrame(filas)
    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
    return df[["fecha", "valor"]].dropna()


def _construir_serie(slug):
    meta = INDICADORES[slug]
    if slug == "itcrm":
        return itcrm(), None

    historico = _leer_csv(meta["csv"])
    aviso = None
    try:
        desde = (historico["fecha"].max() + timedelta(days=1)).date()
        nuevos = _descargar_api(meta["id_bcra"], desde)
        df = pd.concat([historico, nuevos], ignore_index=True) if not nuevos.empty else historico
    # Además de los errores de red, una respuesta con formato inesperado
    # (HTML de error, JSON sin los campos esperados) también cae al histórico
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError) as e:
        print(f"[{slug}] API del BCRA no disponible, se usa solo el histórico: {e}")
        aviso = "La API del BCRA no respondió: se muestran solo datos históricos."
        df = historico

    df = df.drop_duplicates(subset="fecha", keep="last").sort_values("fecha")
    return df.reset_index(drop=True), aviso


def obtener_serie(slug):
    """Devuelve (DataFrame[fecha, valor], aviso | None) usando la caché en memoria."""
    with _locks[slug]:
        cacheado = _cache.get(slug)
        if cacheado and time.time() - cacheado["ts"] < CACHE_TTL:
            return cacheado["df"], cacheado["aviso"]
        df, aviso = _construir_serie(slug)
        if not df.empty:
            _cache[slug] = {"df": df, "aviso": aviso, "ts": time.time()}
        return df, aviso
