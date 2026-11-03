"""
API de indicadores económicos del BCRA (FastAPI).

Correr en desarrollo:
    uvicorn app:app --reload --port 8000
Documentación interactiva en http://localhost:8000/docs
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

import config
from correo import _ip_cliente, router as router_correo
import indec
from limite import LimitePorIP
from indicadores import INDICADORES, obtener_serie

log = logging.getLogger("api")

# Consultas que llegan a la API del INDEC con el token personal: 60 por minuto por IP
limite_indec = LimitePorIP(maximo=60, ventana_segundos=60)


def _controlar_limite(request: Request):
    if limite_indec.excedido(_ip_cliente(request)):
        raise HTTPException(429, "Hiciste muchas consultas seguidas. Esperá un minuto y probá de nuevo.")

# En producción no se publica la documentación interactiva
app = FastAPI(
    title="Prognosis · API BCRA",
    version="2.0.0",
    docs_url=None if config.EN_PRODUCCION else "/docs",
    redoc_url=None,
    openapi_url=None if config.EN_PRODUCCION else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(router_correo, prefix="/api")


@app.middleware("http")
async def cabeceras_de_seguridad(request: Request, call_next):
    respuesta = await call_next(request)
    respuesta.headers["X-Content-Type-Options"] = "nosniff"
    respuesta.headers["X-Frame-Options"] = "DENY"
    respuesta.headers["Referrer-Policy"] = "no-referrer"
    return respuesta


def _meta(slug):
    meta = INDICADORES[slug]
    return {
        "id": slug,
        "nombre": meta["nombre"],
        "descripcion": meta["descripcion"],
        "unidad": meta["unidad"],
    }


def _variacion(df, dias):
    """Variación % entre el último valor y el último disponible `dias` antes."""
    ultima = df["fecha"].iloc[-1]
    previos = df[df["fecha"] <= ultima - timedelta(days=dias)]
    if previos.empty or previos["valor"].iloc[-1] == 0:
        return None
    return round((df["valor"].iloc[-1] / previos["valor"].iloc[-1] - 1) * 100, 2)


def _puntos(df):
    return [
        {"fecha": f.strftime("%Y-%m-%d"), "valor": float(v)}
        for f, v in zip(df["fecha"], df["valor"])
    ]


def _resumen(slug):
    try:
        df, aviso = obtener_serie(slug)
    except Exception:
        log.exception("[%s] Error al construir el resumen", slug)
        return {**_meta(slug), "error": "No se pudieron obtener los datos."}
    if df.empty:
        return {**_meta(slug), "error": "Sin datos disponibles"}

    ultimo_anio = df[df["fecha"] >= df["fecha"].iloc[-1] - timedelta(days=365)]
    return {
        **_meta(slug),
        "ultimo_valor": float(df["valor"].iloc[-1]),
        "ultima_fecha": df["fecha"].iloc[-1].strftime("%Y-%m-%d"),
        "variacion_30d": _variacion(df, 30),
        "variacion_1a": _variacion(df, 365),
        "sparkline": _puntos(ultimo_anio.iloc[::5]),
        "aviso": aviso,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/indicadores")
def listar_indicadores():
    return [_meta(slug) for slug in INDICADORES]


@app.get("/api/resumen")
def resumen():
    """Último valor, variaciones y sparkline de los indicadores del dashboard."""
    slugs = [s for s, m in INDICADORES.items() if m.get("en_resumen", True)]
    with ThreadPoolExecutor(max_workers=len(slugs)) as pool:
        return list(pool.map(_resumen, slugs))


@app.get("/api/indec")
def catalogo_indec():
    """Tablas del Catálogo API-INDEC disponibles, agrupadas por área."""
    return {
        "configurado": bool(config.INDEC_TOKEN),
        "tablas": [
            {k: t[k] for k in ("id", "area", "nombre", "descripcion", "columnas")}
            for t in indec.CATALOGO.values()
        ],
    }


def _desde_indec(funcion, *args, contexto=""):
    """Ejecuta una consulta al INDEC y traduce sus errores a respuestas HTTP."""
    try:
        return funcion(*args)
    except indec.TokenFaltante:
        raise HTTPException(503, "Los datos del INDEC no están disponibles: falta configurar el token.")
    except indec.DemasiadasFilas as e:
        raise HTTPException(413, str(e))
    except indec.FiltroInvalido:
        raise HTTPException(400, "Algún filtro tiene un valor que no corresponde a esa columna.")
    except Exception:
        log.exception("[indec:%s] Error al consultar la API del INDEC", contexto)
        raise HTTPException(502, "No se pudieron obtener los datos del INDEC. Probá de nuevo más tarde.")


def _resumen_indec(spec):
    meta = {k: spec[k] for k in ("id", "grupo", "nombre", "descripcion", "unidad", "frecuencia")}
    try:
        puntos = indec.serie(spec["id"])
    except Exception:
        log.exception("[indec:%s] Error al construir el resumen", spec["id"])
        return {**meta, "error": "No se pudieron obtener los datos."}
    if not puntos:
        return {**meta, "error": "Sin datos disponibles"}
    # Las proyecciones (población) llegan hasta 2040: la tarjeta muestra el dato vigente
    hasta_hoy = [p for p in puntos if p["fecha"] <= date.today().isoformat()] or puntos
    return {
        **meta,
        "ultimo_valor": hasta_hoy[-1]["valor"],
        "ultima_fecha": hasta_hoy[-1]["fecha"],
        "valor_anterior": hasta_hoy[-2]["valor"] if len(hasta_hoy) > 1 else None,
        "sparkline": puntos[-24:],
    }


@app.get("/api/indec/series")
def series_indec():
    """Resumen de las series clave del INDEC: último valor, el anterior y los últimos 24 puntos."""
    if not config.INDEC_TOKEN:
        raise HTTPException(503, "Los datos del INDEC no están disponibles: falta configurar el token.")
    with ThreadPoolExecutor(max_workers=6) as pool:
        return list(pool.map(_resumen_indec, indec.SERIES))


@app.get("/api/indec/series/{id_serie}")
def serie_indec(id_serie: str):
    if id_serie not in indec.SERIES_POR_ID:
        raise HTTPException(404, f"Serie del INDEC desconocida: {id_serie}")
    spec = indec.SERIES_POR_ID[id_serie]
    datos = _desde_indec(indec.serie, id_serie, contexto=id_serie)
    return {**{k: spec[k] for k in ("id", "grupo", "nombre", "descripcion", "unidad", "frecuencia")}, "datos": datos}


@app.get("/api/indec/comercio/{anio}")
def comercio_indec(anio: int, request: Request):
    """Exportaciones e importaciones de un año, agregadas por mes, rubro y país."""
    _controlar_limite(request)
    if not 1986 <= anio <= date.today().year:
        raise HTTPException(400, "El año debe estar entre 1986 y el actual.")
    return _desde_indec(indec.comercio, anio, contexto=f"comercio-{anio}")


@app.get("/api/indec/{tabla}/dimensiones")
def dimensiones_indec(tabla: str, request: Request):
    """Valores posibles de cada columna de categorías, para armar filtros en el explorador."""
    _controlar_limite(request)
    if tabla not in indec.CATALOGO:
        raise HTTPException(404, f"Tabla del INDEC desconocida: {tabla}")
    return _desde_indec(indec.dimensiones, tabla, contexto=f"{tabla}-dimensiones")


@app.get("/api/indec/{tabla}")
def tabla_indec(tabla: str, request: Request):
    """Filas de una tabla del INDEC. Cada parámetro de la URL filtra por igualdad una columna."""
    _controlar_limite(request)
    if tabla not in indec.CATALOGO:
        raise HTTPException(404, f"Tabla del INDEC desconocida: {tabla}")
    columnas = indec.CATALOGO[tabla]["columnas"]
    filtros = {k: v for k, v in request.query_params.items() if k in columnas and len(v) <= 100}
    filas = _desde_indec(indec.consultar, tabla, filtros, contexto=tabla)
    return {"tabla": tabla, "filtros": filtros, "total": len(filas), "filas": filas}


@app.get("/api/{slug}")
def serie(
    slug: str,
    fecha_inicio: Optional[date] = Query(None, description="AAAA-MM-DD"),
    fecha_fin: Optional[date] = Query(None, description="AAAA-MM-DD"),
):
    if slug not in INDICADORES:
        raise HTTPException(404, f"Indicador desconocido: {slug}")
    try:
        df, aviso = obtener_serie(slug)
    except Exception:
        log.exception("[%s] Error al obtener la serie", slug)
        raise HTTPException(502, "No se pudieron obtener los datos del BCRA. Probá de nuevo más tarde.")

    if fecha_inicio:
        df = df[df["fecha"] >= pd.Timestamp(fecha_inicio)]
    if fecha_fin:
        df = df[df["fecha"] <= pd.Timestamp(fecha_fin)]

    return {
        **_meta(slug),
        "total_registros": len(df),
        "fecha_minima": df["fecha"].min().strftime("%Y-%m-%d") if len(df) else None,
        "fecha_maxima": df["fecha"].max().strftime("%Y-%m-%d") if len(df) else None,
        "aviso": aviso,
        "datos": _puntos(df),
    }
