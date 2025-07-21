import streamlit as st
from procesamiento_bcra import obtener_datos_completos
from graficos import graficar_variable
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


st.set_page_config(page_title="Visualización de Indicadores BCRA", layout="wide")

st.title("📊 Visualización de Indicadores Económicos del BCRA")

# Opciones disponibles
opciones = {
    "Reservas Internacionales": 1,
    "Tipo de Cambio Minorista": 4,
    "Tipo de Cambio Mayorista": 5,
    "Tasa de Política Monetaria": 7
}

opcion = st.selectbox("Seleccioná el indicador a visualizar:", list(opciones.keys()))
id_indicador = opciones[opcion]

# Parámetros de fecha (interactivos)
st.sidebar.header("Parámetros de fecha")
anio_inicio = st.sidebar.number_input("Año de inicio", min_value=1990, max_value=2025, value=2022)
mes_inicio = st.sidebar.selectbox("Mes de inicio", list(range(1, 13)), index=0)

anio_final = st.sidebar.number_input("Año final", min_value=1990, max_value=2025, value=2024)
mes_final = st.sidebar.selectbox("Mes final", list(range(1, 13)), index=11)

# Validación básica
if (anio_inicio, mes_inicio) > (anio_final, mes_final):
    st.error("⚠️ La fecha de inicio debe ser anterior a la de finalización.")
else:
    try:
        df = obtener_datos_completos(id_indicador)
        st.markdown(f"### Mostrando datos desde **{mes_inicio}/{anio_inicio}** hasta **{mes_final}/{anio_final}**")
        graficar_variable(df, opcion, anio_inicio, mes_inicio, anio_final, mes_final)
    except Exception as e:
        st.error(f"Ocurrió un error al graficar los datos: {e}")