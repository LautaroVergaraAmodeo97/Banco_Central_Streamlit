import pandas as pd
import os
from api_client import obtener_datos_api

# Diccionario que relaciona el ID del indicador con el nombre del CSV histórico
archivos = {
    1: "data_vieja.csv",
    4: "tipo_cambio_minorista.csv",
    5: "tipo_cambio_mayorista.csv",
    11: "df_baibar.csv",
    15:"df_base.csv"
}

def cargar_csv_local(nombre_archivo):
    path = os.path.join("data", nombre_archivo)
    df = pd.read_csv(path, parse_dates=["fecha"])
    # Forzar columna 'valor' como float
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
    df = df.dropna(subset=["valor"])
    return df

def obtener_datos_completos(id_indicador):
    try:
        df_local = cargar_csv_local(archivos[id_indicador])
    except KeyError:
        raise ValueError(f"No hay archivo local para el ID {id_indicador}")

    df_api = obtener_datos_api(id_indicador)
    df_api['fecha'] = pd.to_datetime(df_api['fecha'], errors='coerce')

    df = pd.concat([df_local, df_api], ignore_index=True)
    df = df.drop_duplicates(subset="fecha")

    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")
    df = df.dropna(subset=["fecha"])
    df = df.sort_values("fecha")
    
    return df
