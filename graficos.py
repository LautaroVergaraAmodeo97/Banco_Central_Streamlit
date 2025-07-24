import matplotlib.pyplot as plt
import pandas as pd
import io
import streamlit as st
import plotly.express as px


def graficar_variable(df, nombre_variable, anio_ini, mes_ini, anio_fin, mes_fin, ylabel):
    try:
        anio_ini = int(anio_ini)
        mes_ini = int(mes_ini)
        anio_fin = int(anio_fin)
        mes_fin = int(mes_fin)

        fecha_inicio = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-01")
        fecha_final = pd.to_datetime(f"{anio_fin}-{mes_fin:02d}-01")
    except Exception as e:
        st.error(f"Error al crear las fechas: {e}")
        return

    if "fecha" not in df.columns:
        st.error("La columna 'fecha' no está en el DataFrame.")
        return

    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")

    if df["fecha"].isnull().any():
        st.error("Hay fechas inválidas en los datos. Verificá el formato.")
        return

    df_filtrado = df[(df["fecha"] >= fecha_inicio) & (df["fecha"] <= fecha_final)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos en el rango seleccionado.")
        return

    fig = px.line(df_filtrado, x="fecha", y="valor", title=nombre_variable, labels={"valor": ylabel})
    fig.update_traces(mode="lines+markers")
    fig.update_layout(xaxis_title="Fecha", yaxis_title=ylabel, hovermode="x")

    st.plotly_chart(fig, use_container_width=True)


def graficar_por_dia(df, nombre_variable, dia_ini, mes_ini, anio_ini, dia_final, mes_final, anio_final, ylabel):

    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-{dia_ini:02d}")
    fecha_fin = pd.to_datetime(f"{anio_final}-{mes_final:02d}-{dia_final:02d}")

    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos disponibles en el rango seleccionado.")
        return

    fig = px.line(df_filtrado, x="fecha", y="valor", title=nombre_variable, labels={"valor": ylabel})
    fig.update_traces(mode="lines+markers")
    fig.update_layout(xaxis_title="Fecha", yaxis_title=ylabel, hovermode="x")

    st.plotly_chart(fig, use_container_width=True)
