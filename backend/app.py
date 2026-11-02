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
from correo import router as router_correo
from indicadores import INDICADORES, obtener_serie

log = logging.getLogger("api")

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
