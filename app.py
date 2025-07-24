import streamlit as st
from procesamiento_bcra import obtener_datos_completos
from graficos import graficar_variable,graficar_por_dia
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


st.set_page_config(page_title="Visualización de Indicadores BCRA", layout="wide")

st.title("📊 Visualización de Indicadores Económicos del BCRA")

# Opciones disponibles
opciones = {
    "Reservas Internacionales": 1,
    "Tipo de Cambio Minorista": 4,
    "Tipo de Cambio Mayorista": 5,
    "Baibar": 11,
    "Base":15
}
opcion = st.selectbox("Seleccioná un indicador", list(opciones.keys()))
modo = st.radio("Tipo de visualización", ["Mensual", "Diaria"])

id_indicador = opciones[opcion]
df = obtener_datos_completos(id_indicador)

if modo == "Mensual":
    col1, col2 = st.columns(2)
    with col1:
        anio_inicio = st.number_input("Año inicio", value=2020)
        mes_inicio = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
    with col2:
        anio_final = st.number_input("Año final", value=2024)
        mes_final = st.number_input("Mes final", min_value=1, max_value=12, value=12)

    graficar_variable(df, opcion, anio_inicio, mes_inicio, anio_final, mes_final)

elif modo == "Diaria":
    if opcion == "Reservas Internacionales":
        st.warning("Los datos de reservas no tienen frecuencia diaria.")
    else:
        col1, col2, col3 = st.columns(3)
        with col1:
            dia_ini = st.number_input("Día inicio", min_value=1, max_value=31, value=1)
        with col2:
            mes_ini = st.number_input("Mes inicio", min_value=1, max_value=12, value=1)
        with col3:
            anio_ini = st.number_input("Año inicio", value=2023)

        col4, col5, col6 = st.columns(3)
        with col4:
            dia_fin = st.number_input("Día final", min_value=1, max_value=31, value=1)
        with col5:
            mes_fin = st.number_input("Mes final", min_value=1, max_value=12, value=1)
        with col6:
            anio_fin = st.number_input("Año final", value=2024)

        graficar_por_dia(df, opcion, dia_ini, mes_ini, anio_ini, dia_fin, mes_fin, anio_fin)