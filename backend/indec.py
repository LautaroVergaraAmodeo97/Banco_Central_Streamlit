"""
Cliente del Catálogo API-INDEC (https://api.indec.gob.ar/docs).

La API es estilo PostgREST: devuelve como máximo 1000 filas por pedido, así
que se pagina con limit/offset ordenando por la clave completa de cada tabla.
Todas las tablas requieren el token personal INDEC_TOKEN, que nunca sale del
backend. El catálogo de tablas se generó a partir del documento OpenAPI.
"""

import json
import os
import threading
import time
from collections import OrderedDict

import certifi
import requests

import config

API_URL = "https://api.indec.gob.ar/v1/{tabla}"
POR_PAGINA = 1000
MAX_FILAS = 50_000
CACHE_TTL = 6 * 60 * 60  # los datos del INDEC son mensuales o trimestrales
CACHE_MAX = 64

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "indec_catalogo.json"), encoding="utf-8") as f:
    CATALOGO = {t["id"]: t for t in json.load(f)}

_cache = OrderedDict()
_lock = threading.Lock()


class TokenFaltante(Exception):
    pass


class DemasiadasFilas(Exception):
    def __init__(self, total):
        super().__init__(f"La consulta devuelve {total} filas (máximo {MAX_FILAS}). Agregá filtros.")
        self.total = total


def _pedir(tabla, params, contar=False):
    headers = {"Authorization": f"Bearer {config.INDEC_TOKEN}"}
    if contar:
        headers["Prefer"] = "count=exact"
    res = requests.get(API_URL.format(tabla=tabla), params=params, headers=headers, timeout=60, verify=certifi.where())
    res.raise_for_status()
    total = None
    if contar and "/" in res.headers.get("Content-Range", ""):
        total = res.headers["Content-Range"].rsplit("/", 1)[1]
        total = int(total) if total.isdigit() else None
    return res.json(), total


def consultar(tabla, filtros=None):
    """Todas las filas de una tabla del catálogo, con filtros de igualdad por columna."""
    if not config.INDEC_TOKEN:
        raise TokenFaltante("Falta configurar INDEC_TOKEN en el backend")
    meta = CATALOGO[tabla]
    filtros = {k: v for k, v in (filtros or {}).items() if k in meta["columnas"]}

    clave = (tabla, tuple(sorted(filtros.items())))
    with _lock:
        cacheado = _cache.get(clave)
        if cacheado and time.time() - cacheado[0] < CACHE_TTL:
            _cache.move_to_end(clave)
            return cacheado[1]

    params = {col: f"eq.{valor}" for col, valor in filtros.items()}
    params["order"] = ",".join(meta["orden"])

    filas, offset = [], 0
    while True:
        pagina, total = _pedir(tabla, {**params, "limit": POR_PAGINA, "offset": offset}, contar=offset == 0)
        if total is not None and total > MAX_FILAS:
            raise DemasiadasFilas(total)
        filas.extend(pagina)
        offset += len(pagina)
        if len(pagina) < POR_PAGINA:
            break

    with _lock:
        _cache[clave] = (time.time(), filas)
        _cache.move_to_end(clave)
        while len(_cache) > CACHE_MAX:
            _cache.popitem(last=False)
    return filas


# ---------------------------------------------------------------------------
# Series clave: una serie temporal por indicador, lista para graficar
# ---------------------------------------------------------------------------

SERIES = [
    # Precios
    {"id": "ipc-mensual", "grupo": "Precios", "nombre": "Inflación mensual (IPC)", "unidad": "%",
     "descripcion": "Variación mensual del IPC, nivel general nacional",
     "tabla": "ipc_nacional", "filtros": {"codigo": "0", "region": "Nacional", "tipo_de_indicador": "v_m"}},
    {"id": "ipc-interanual", "grupo": "Precios", "nombre": "Inflación interanual (IPC)", "unidad": "%",
     "descripcion": "Variación interanual del IPC, nivel general nacional",
     "tabla": "ipc_nacional", "filtros": {"codigo": "0", "region": "Nacional", "tipo_de_indicador": "v_ia"}},
    {"id": "ipim-interanual", "grupo": "Precios", "nombre": "Precios mayoristas (IPIM)", "unidad": "%",
     "descripcion": "Variación interanual del índice de precios internos al por mayor",
     "tabla": "sipm_precios_mayoristas", "filtros": {"indicador": "IPIM", "nivel": "Nivel general", "tipo_de_indicador": "v_ia"}},
    {"id": "icc-interanual", "grupo": "Precios", "nombre": "Costo de la construcción (ICC)", "unidad": "%",
     "descripcion": "Variación interanual del índice del costo de la construcción en GBA",
     "tabla": "icc_precios_construccion", "filtros": {"nivel": "Nivel general", "tipo_de_indicador": "v_ia"}},
    # Ingresos y canastas
    {"id": "salarios-interanual", "grupo": "Ingresos y canastas", "nombre": "Salarios", "unidad": "%",
     "descripcion": "Variación interanual del índice de salarios, nivel general",
     "tabla": "indice_salarios", "filtros": {"codigo": "0", "tipo_de_indicador": "v_ia"}},
    {"id": "cba-adulto", "grupo": "Ingresos y canastas", "nombre": "Canasta básica alimentaria", "unidad": "$",
     "descripcion": "CBA por adulto equivalente en GBA (línea de indigencia)",
     "tabla": "valorizacion_canastas_cba_cbt", "filtros": {"codigo": "CBA", "tipo_de_indicador": "CBA"}},
    {"id": "cbt-adulto", "grupo": "Ingresos y canastas", "nombre": "Canasta básica total", "unidad": "$",
     "descripcion": "CBT por adulto equivalente en GBA (línea de pobreza)",
     "tabla": "valorizacion_canastas_cba_cbt", "filtros": {"codigo": "CBT", "tipo_de_indicador": "CBT"}},
    {"id": "cbt-hogar-tipo", "grupo": "Ingresos y canastas", "nombre": "CBT de una familia tipo", "unidad": "$",
     "descripcion": "Canasta básica total de un hogar de 4 integrantes (2 adultos y 2 hijos) en GBA",
     "tabla": "valorizacion_canastas_cba_cbt", "filtros": {"codigo": "CBT H2"}},
    {"id": "crianza-1a3", "grupo": "Ingresos y canastas", "nombre": "Canasta de crianza (1 a 3 años)", "unidad": "$",
     "descripcion": "Costo mensual de bienes, servicios y cuidado de un niño de 1 a 3 años",
     "tabla": "canasta-crianza", "columna": "tot_1a3", "periodo": "Periodo"},
    # Pobreza y empleo
    {"id": "pobreza-personas", "grupo": "Pobreza y empleo", "nombre": "Pobreza", "unidad": "%",
     "descripcion": "Personas bajo la línea de pobreza, total 31 aglomerados (semestral)",
     "tabla": "pobreza_eph", "columna": "tasa_pobreza_personas"},
    {"id": "indigencia-personas", "grupo": "Pobreza y empleo", "nombre": "Indigencia", "unidad": "%",
     "descripcion": "Personas bajo la línea de indigencia, total 31 aglomerados (semestral)",
     "tabla": "pobreza_eph", "columna": "tasa_indigencia_personas"},
    {"id": "desocupacion", "grupo": "Pobreza y empleo", "nombre": "Desocupación", "unidad": "%",
     "descripcion": "Tasa de desocupación, total 31 aglomerados (trimestral)",
     "tabla": "mercado_trabajo_eph", "columna": "tasa_de_desocupacion"},
    {"id": "empleo-informal", "grupo": "Pobreza y empleo", "nombre": "Empleo informal", "unidad": "%",
     "descripcion": "Tasa de empleo informal sobre la población total, 31 aglomerados (trimestral)",
     "tabla": "mercado_trabajo_eph", "columna": "tasa_de_empleo_informal"},
    # Actividad
    {"id": "emae", "grupo": "Actividad", "nombre": "Actividad económica (EMAE)", "unidad": "índice",
     "descripcion": "Estimador mensual de actividad económica, serie desestacionalizada (2004 = 100)",
     "tabla": "estimador-mensual-de-actividad-economica-nivel-general",
     "filtros": {"tipo_de_indicador_descripcion": "Índice serie desestacionalizada"}},
    {"id": "emae-interanual", "grupo": "Actividad", "nombre": "EMAE interanual", "unidad": "%",
     "descripcion": "Variación interanual del EMAE, serie original",
     "tabla": "estimador-mensual-de-actividad-economica-nivel-general",
     "filtros": {"tipo_de_indicador_descripcion": "Var % interanual serie original"}},
    {"id": "ipi-manufacturero", "grupo": "Actividad", "nombre": "Industria manufacturera", "unidad": "índice",
     "descripcion": "Índice de producción industrial manufacturero, serie desestacionalizada (2016 = 100)",
     "tabla": "ipi_manufacturero",
     "filtros": {"descripcion": "IPI Manufacturero - Nivel general", "serie": "Serie desestacionalizada", "tipo_de_indicador": "Índice"}},
    {"id": "ipi-minero", "grupo": "Actividad", "nombre": "Minería", "unidad": "índice",
     "descripcion": "Índice de producción industrial minero, serie desestacionalizada (2016 = 100)",
     "tabla": "ipi_minero",
     "filtros": {"descripcion": "Nivel General - IPI Minero", "serie": "Serie Desestacionalizada", "tipo_de_indicador": "Índice"}},
    # Población
    {"id": "poblacion", "grupo": "Población", "nombre": "Población proyectada", "unidad": "personas",
     "descripcion": "Población total de Argentina al 1° de julio de cada año (estimaciones y proyecciones 2022-2040)",
     "tabla": "proyecciones_poblacion_nacional_2022_2040", "columna": "poblacion", "periodo": "fecha", "sumar": True},
]
_FRECUENCIAS = {
    "pobreza-personas": "semestral", "indigencia-personas": "semestral",
    "desocupacion": "trimestral", "empleo-informal": "trimestral", "poblacion": "anual",
}
for _s in SERIES:
    _s["frecuencia"] = _FRECUENCIAS.get(_s["id"], "mensual")
SERIES_POR_ID = {s["id"]: s for s in SERIES}


def _fecha(periodo):
    """Convierte los períodos del INDEC a una fecha AAAA-MM-DD.

    Formatos: '202609' (mensual), '20261S' (semestre), '20262T' (trimestre)
    y '2026' (anual, a mitad de año como las proyecciones de población).
    """
    s = str(periodo).strip()
    if len(s) == 6 and s.isdigit():
        return f"{s[:4]}-{s[4:]}-01"
    if len(s) == 6 and s[-1] in "ST" and s[:5].isdigit():
        n = int(s[4])
        mes = (1 if n == 1 else 7) if s[-1] == "S" else 3 * n - 2
        return f"{s[:4]}-{mes:02d}-01"
    if len(s) == 4 and s.isdigit():
        return f"{s}-07-01"
    return None


def serie(id_serie):
    """Puntos [{fecha, valor}] de una serie clave, ordenados por fecha."""
    spec = SERIES_POR_ID[id_serie]
    filas = consultar(spec["tabla"], spec.get("filtros"))
    columna = spec.get("columna", "valor")
    col_periodo = spec.get("periodo", "periodo")

    valores = {}
    for fila in filas:
        fecha, valor = _fecha(fila.get(col_periodo)), fila.get(columna)
        if fecha is None or valor is None:
            continue
        valores[fecha] = valores.get(fecha, 0) + valor if spec.get("sumar") else valor
    return [{"fecha": f, "valor": float(v)} for f, v in sorted(valores.items())]


# ---------------------------------------------------------------------------
# Comercio exterior: totales de un año a partir del detalle por país y rubro
# ---------------------------------------------------------------------------

def _nomenclatura(columna):
    filas = consultar("comercio_exterior_nomenclaturas", {"nombre_columna": columna})
    return {f["codigo"]: f["codigo_descripcion"] for f in filas}


def comercio(anio):
    """Exportaciones (FOB) e importaciones (CIF) de un año: por mes, por rubro y por país."""
    expo = consultar("comercio_exterior_exportacion_bienes", {"Anio": str(anio)})
    impo = consultar("comercio_exterior_importacion_bienes", {"Anio": str(anio)})
    paises = _nomenclatura("pais_cod")
    rubros = _nomenclatura("rubro_cod")
    usos = _nomenclatura("uso_economico_cod")

    def sumar(filas, clave, columna):
        totales = {}
        for f in filas:
            if f.get(columna) is not None:
                totales[f[clave]] = totales.get(f[clave], 0) + f[columna]
        return totales

    expo_mes = sumar(expo, "Mes", "valor_FOB")
    impo_mes = sumar(impo, "Mes", "valor_CIF")
    meses = sorted(set(expo_mes) | set(impo_mes))

    def ranking(totales, nombres, n=None):
        orden = sorted(totales.items(), key=lambda kv: kv[1], reverse=True)
        return [{"codigo": k, "nombre": nombres.get(k, k), "valor": v} for k, v in orden[:n]]

    return {
        "anio": anio,
        "unidad": "US$",
        "exportaciones": sum(expo_mes.values()),
        "importaciones": sum(impo_mes.values()),
        "por_mes": [
            {"fecha": f"{anio}-{m:02d}-01", "exportaciones": expo_mes.get(m, 0), "importaciones": impo_mes.get(m, 0)}
            for m in meses
        ],
        "exportaciones_por_rubro": ranking(sumar(expo, "rubro_cod", "valor_FOB"), rubros),
        "importaciones_por_uso": ranking(sumar(impo, "uso_economico_cod", "valor_CIF"), usos),
        "destinos": ranking(sumar(expo, "pais_cod", "valor_FOB"), paises, 10),
        "origenes": ranking(sumar(impo, "pais_cod", "valor_CIF"), paises, 10),
    }


# ---------------------------------------------------------------------------
# Explorador: valores posibles de cada columna de categorías de una tabla
# ---------------------------------------------------------------------------

# Columnas con valores numéricos o códigos sin significado: no sirven como filtro
_NO_FILTRABLES = {"valor", "observaciones", "anio", "mes", "periodo", "Anio", "Mes", "Periodo", "poblacion", "fecha"}


def dimensiones(tabla):
    """Valores distintos de las columnas de categorías, tomados del último período publicado.

    Pedir los valores de toda la tabla costaría cientos de miles de filas; el
    último período alcanza porque cada período trae todas las categorías.
    """
    meta = CATALOGO[tabla]
    col_periodo = next((c for c in meta["columnas"] if c.lower() == "periodo"), None)
    if col_periodo:
        ultimo, _ = _pedir(tabla, {"select": col_periodo, "order": f"{col_periodo}.desc", "limit": 1})
        filas = consultar(tabla, {col_periodo: ultimo[0][col_periodo]}) if ultimo else []
    else:
        _, total = _pedir(tabla, {"limit": 1}, contar=True)
        filas = consultar(tabla) if total and total <= MAX_FILAS else _pedir(tabla, {"limit": POR_PAGINA})[0]

    resultado = {}
    for col in meta["columnas"]:
        if col in _NO_FILTRABLES or col.startswith(("valor", "tasa_", "tot_", "bys_", "cuid_", "Peso", "peso")):
            continue
        valores = sorted({str(f[col]) for f in filas if f.get(col) not in (None, "")})
        if 1 < len(valores) <= 300:
            resultado[col] = valores
    return {"periodo": col_periodo, "dimensiones": resultado}
