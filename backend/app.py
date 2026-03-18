from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
import pandas as pd

# Importar módulos
from api_bcra_v4 import obtener_datos_bcra_v4
from correo import router as correo_router

try:
    from itcrm_bcra import itcrm
    print("✅ Módulo ITCRM cargado")
except ImportError:
    print("⚠️ No se encontró itcrm_bcra.py")
    itcrm = None

# Crear app FastAPI
app = FastAPI(
    title="API BCRA - Banco Central Argentina",
    description="API para consultar datos económicos del BCRA usando API v4.0",
    version="2.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de correo
app.include_router(correo_router, tags=["Contacto"])

# ==================== MAPEO DE VARIABLES BCRA ====================

VARIABLES_BCRA = {
    "reservas": 1,              # Reservas Internacionales
    "tc_minorista": 4,          # Tipo de Cambio Minorista
    "tc_mayorista": 5,          # Tipo de Cambio Mayorista
    "baibar": 11,               # Tasa BAIBAR
    "base_monetaria": 15,       # Base Monetaria
}

# ==================== FUNCIÓN AUXILIAR ====================

def endpoint_bcra_generico(var_id: int, descripcion: str, fecha_inicio: Optional[str], fecha_fin: Optional[str]):
    """
    Función genérica para crear endpoints de la API del BCRA
    """
    try:
        # Convertir strings a datetime si se proporcionan
        dt_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d') if fecha_inicio else None
        dt_fin = datetime.strptime(fecha_fin, '%Y-%m-%d') if fecha_fin else None
        
        # Obtener datos de la API v4.0
        df = obtener_datos_bcra_v4(
            var_id=var_id,
            fecha_inicio=dt_inicio,
            fecha_fin=dt_fin
        )
        
        if df.empty:
            return {"error": "No hay datos disponibles"}
        
        # Convertir a lista de diccionarios
        datos = []
        for _, row in df.iterrows():
            datos.append({
                "fecha": row['fecha'].strftime('%Y-%m-%d'),
                "valor": float(row['valor'])
            })
        
        return {
            "datos": datos,
            "total_registros": len(datos),
            "fecha_minima": df['fecha'].min().strftime('%Y-%m-%d'),
            "fecha_maxima": df['fecha'].max().strftime('%Y-%m-%d'),
            "metadata": {
                "fuente": "API BCRA v4.0",
                "descripcion": descripcion,
                "variable_id": var_id,
                "filtros_aplicados": {
                    "fecha_inicio": fecha_inicio,
                    "fecha_fin": fecha_fin
                }
            }
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    """Información general de la API"""
    return {
        "mensaje": "API del Banco Central Argentina",
        "version": "2.0.0",
        "api_bcra": "v4.0",
        "endpoints_principales": {
            "itcrm": "/api/itcrm",
            "reservas": "/api/reservas",
            "tipo_cambio_minorista": "/api/tipo-cambio-minorista",
            "tipo_cambio_mayorista": "/api/tipo-cambio-mayorista",
            "baibar": "/api/baibar",
            "base_monetaria": "/api/base-monetaria"
        },
        "utilidades": {
            "listar_indicadores": "/api/indicadores",
            "health": "/health"
        },
        "documentacion": "/docs"
    }

@app.get("/health")
def health():
    """Health check"""
    return {
        "status": "ok",
        "servicio": "API BCRA",
        "version": "2.0.0",
        "api_bcra_version": "4.0"
    }

# ==================== ITCRM (sigue usando scraping) ====================

@app.get("/api/itcrm")
def obtener_itcrm_endpoint(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """
    Obtiene datos del ITCRM (aún usa scraping)
    """
    if itcrm is None:
        return {"error": "Módulo ITCRM no disponible"}
    
    try:
        df = itcrm()
        
        if df.empty:
            return {"error": "No hay datos disponibles"}
        
        df['fecha'] = pd.to_datetime(df['fecha'])
        
        # Aplicar filtros
        if fecha_inicio:
            df = df[df['fecha'] >= pd.to_datetime(fecha_inicio)]
        if fecha_fin:
            df = df[df['fecha'] <= pd.to_datetime(fecha_fin)]
        
        if df.empty:
            return {"error": "No hay datos en el rango especificado"}
        
        datos = [
            {"fecha": row['fecha'].strftime('%Y-%m-%d'), "valor": float(row['valor'])}
            for _, row in df.iterrows()
        ]
        
        return {
            "datos": datos,
            "total_registros": len(datos),
            "fecha_minima": df['fecha'].min().strftime('%Y-%m-%d'),
            "fecha_maxima": df['fecha'].max().strftime('%Y-%m-%d'),
            "metadata": {
                "fuente": "BCRA (scraping)",
                "descripcion": "Índice de Tipo de Cambio Real Multilateral"
            }
        }
    except Exception as e:
        return {"error": str(e)}

# ==================== ENDPOINTS CON API v4.0 ====================

@app.get("/api/reservas")
def obtener_reservas(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """Reservas Internacionales - API v4.0"""
    return endpoint_bcra_generico(
        var_id=VARIABLES_BCRA["reservas"],
        descripcion="Reservas Internacionales",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

@app.get("/api/base-monetaria")
def obtener_base_monetaria(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """Base Monetaria - API v4.0"""
    return endpoint_bcra_generico(
        var_id=VARIABLES_BCRA["base_monetaria"],
        descripcion="Base Monetaria",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

@app.get("/api/tipo-cambio-minorista")
def obtener_tc_minorista(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """Tipo de Cambio Minorista - API v4.0"""
    return endpoint_bcra_generico(
        var_id=VARIABLES_BCRA["tc_minorista"],
        descripcion="Tipo de Cambio Minorista",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

@app.get("/api/tipo-cambio-mayorista")
def obtener_tc_mayorista(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """Tipo de Cambio Mayorista - API v4.0"""
    return endpoint_bcra_generico(
        var_id=VARIABLES_BCRA["tc_mayorista"],
        descripcion="Tipo de Cambio Mayorista",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

@app.get("/api/baibar")
def obtener_baibar(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    """Tasa BAIBAR - API v4.0"""
    return endpoint_bcra_generico(
        var_id=VARIABLES_BCRA["baibar"],
        descripcion="Tasa BAIBAR",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

@app.get("/api/indicadores")
def listar_indicadores():
    """Lista todos los indicadores disponibles"""
    return {
        "indicadores": [
            {
                "nombre": "ITCRM",
                "descripcion": "Índice de Tipo de Cambio Real Multilateral",
                "endpoint": "/api/itcrm",
                "fuente": "Scraping (legacy)",
                "disponible": itcrm is not None
            },
            {
                "nombre": "Reservas Internacionales",
                "descripcion": "Reservas en USD del BCRA",
                "endpoint": "/api/reservas",
                "fuente": "API v4.0",
                "variable_id": VARIABLES_BCRA["reservas"],
                "disponible": True
            },
            {
                "nombre": "Base Monetaria",
                "descripcion": "Base Monetaria",
                "endpoint": "/api/base-monetaria",
                "fuente": "API v4.0",
                "variable_id": VARIABLES_BCRA["base_monetaria"],
                "disponible": True
            },
            {
                "nombre": "Tipo de Cambio Minorista",
                "descripcion": "TC Minorista",
                "endpoint": "/api/tipo-cambio-minorista",
                "fuente": "API v4.0",
                "variable_id": VARIABLES_BCRA["tc_minorista"],
                "disponible": True
            },
            {
                "nombre": "Tipo de Cambio Mayorista",
                "descripcion": "TC Mayorista",
                "endpoint": "/api/tipo-cambio-mayorista",
                "fuente": "API v4.0",
                "variable_id": VARIABLES_BCRA["tc_mayorista"],
                "disponible": True
            },
            {
                "nombre": "BAIBAR",
                "descripcion": "Tasa BAIBAR",
                "endpoint": "/api/baibar",
                "fuente": "API v4.0",
                "variable_id": VARIABLES_BCRA["baibar"],
                "disponible": True
            }
        ],
        "total": 6
    }

# Para correr: uvicorn app:app --reload