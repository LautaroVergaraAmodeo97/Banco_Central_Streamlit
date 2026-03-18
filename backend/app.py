import streamlit as st
import pandas as pd
from procesamiento_bcra import obtener_datos_completos
from graficos import graficar_variable, graficar_por_dia, graficar_base_monetaria, graficar_itcrm
from itcrm_bcra import itcrm

st.set_page_config(page_title="Visualización BCRA", layout="wide")

st.title("Visualización de Indicadores Económicos del BCRA")

# Opciones disponibles
opciones = [
    "Reservas Internacionales",
    "Tipo de Cambio Minorista",
    "Tipo de Cambio Mayorista",
    "Baibar",
    "Base Monetaria",
    "ITCRM"
]

opcion = st.selectbox("Seleccioná el indicador", opciones)

# Etiquetas de cada variable
etiquetas = {
    "Reservas Internacionales": "Millones de USD",
    "Tipo de Cambio Minorista": "ARS por USD",
    "Tipo de Cambio Mayorista": "ARS por USD",
    "Baibar": "%",
    "Base Monetaria": "ARS",
    "ITCRM": "Índice (Base 17-12-15=100)"
}

# IDs de los indicadores (excepto ITCRM que es especial)
ids = {
    "Reservas Internacionales": 1,
    "Tipo de Cambio Minorista": 4,
    "Tipo de Cambio Mayorista": 5,
    "Baibar": 11,
    "Base Monetaria": 15
}

# ---------------------------
# Lógica principal - SIN DUPLICACIÓN
# ---------------------------

if opcion == "ITCRM":
    # ✅ CASO ESPECIAL: ITCRM (scraping del Excel)
    df = itcrm()

    col1, col2, col3 = st.columns(3)
    with col1:
        anio_inicio = st.number_input("Año inicio", min_value=2000, max_value=2100, value=2023)
        mes_inicio = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
        dia_inicio = st.number_input("Día inicio", min_value=1, max_value=31, value=1)
    with col2:
        anio_final = st.number_input("Año final", min_value=2000, max_value=2100, value=2024)
        mes_final = st.number_input("Mes final", min_value=1, max_value=12, value=12)
        dia_final = st.number_input("Día final", min_value=1, max_value=31, value=1)

    # Usar la nueva función específica para ITCRM
    graficar_itcrm(df, dia_inicio, mes_inicio, anio_inicio,
                   dia_final, mes_final, anio_final)

elif opcion == "Reservas Internacionales":
    # ✅ CASO ESPECIAL: Reservas (solo año/mes)
    id_indicador = ids[opcion]
    df = obtener_datos_completos(id_indicador)
    
    col1, col2 = st.columns(2)
    with col1:
        anio_inicio = st.number_input("Año inicio", min_value=1996, max_value=2100, value=2015)
        mes_inicio = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
    with col2:
        anio_final = st.number_input("Año final", min_value=1996, max_value=2100, value=2024)
        mes_final = st.number_input("Mes final", min_value=1, max_value=12, value=12)

    graficar_variable(df, opcion, anio_inicio, mes_inicio, anio_final, mes_final, etiquetas[opcion])

elif opcion == "Base Monetaria":
    # ✅ CASO ESPECIAL: Base Monetaria (función específica)
    id_indicador = ids[opcion]
    df = obtener_datos_completos(id_indicador)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        anio_inicio = st.number_input("Año inicio", min_value=2000, max_value=2100, value=2023)
        mes_inicio = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
        dia_inicio = st.number_input("Día inicio", min_value=1, max_value=31, value=1)
    with col2:
        anio_final = st.number_input("Año final", min_value=2000, max_value=2100, value=2024)
        mes_final = st.number_input("Mes final", min_value=1, max_value=12, value=12)
        dia_final = st.number_input("Día final", min_value=1, max_value=31, value=1)

    graficar_base_monetaria(df, opcion, dia_inicio, mes_inicio, anio_inicio,
                            dia_final, mes_final, anio_final, etiquetas[opcion])

else:
   
    id_indicador = ids[opcion]
    df = obtener_datos_completos(id_indicador)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        anio_inicio = st.number_input("Año inicio", min_value=2000, max_value=2100, value=2023)
        mes_inicio = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
        dia_inicio = st.number_input("Día inicio", min_value=1, max_value=31, value=1)
    with col2:
        anio_final = st.number_input("Año final", min_value=2000, max_value=2100, value=2024)
        mes_final = st.number_input("Mes final", min_value=1, max_value=12, value=12)
        dia_final = st.number_input("Día final", min_value=1, max_value=31, value=1)

    graficar_por_dia(df, opcion, dia_inicio, mes_inicio, anio_inicio,
                     dia_final, mes_final, anio_final, etiquetas[opcion])