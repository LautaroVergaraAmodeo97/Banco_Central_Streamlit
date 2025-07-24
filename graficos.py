import matplotlib.pyplot as plt
import pandas as pd
import io
import streamlit as st
import plotly.express as px


def graficar_variable(df, anio_ini, mes_ini, anio_fin, mes_fin, titulo, ylabel):
    fecha_inicio = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-01")
    fecha_final = pd.to_datetime(f"{anio_fin}-{mes_fin:02d}-01")

    df = df[(df['fecha'] >= fecha_inicio) & (df['fecha'] <= fecha_final)].copy()
    if df.empty:
        raise ValueError("No hay datos en el rango de fechas seleccionado.")

    df['mes'] = df['fecha'].dt.to_period('M')
    resumen = df.groupby('mes')['valor'].mean().reset_index()
    resumen['mes'] = resumen['mes'].dt.to_timestamp()

    fig = px.line(
        resumen,
        x='mes',
        y='valor',
        title=titulo,
        labels={'mes': 'Fecha', 'valor': ylabel},
        markers=True
    )
    fig.update_layout(xaxis_title="Fecha", yaxis_title=ylabel)

    # Exportar como imagen para FastAPI
    buf = io.BytesIO()
    fig.write_image(buf, format="png")
    buf.seek(0)
    return buf

def graficar_por_dia(df, nombre_variable, dia_ini, mes_ini, anio_ini, dia_fin, mes_fin, anio_fin):
    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-{dia_ini:02d}")
    fecha_fin = pd.to_datetime(f"{anio_fin}-{mes_fin:02d}-{dia_fin:02d}")

    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos disponibles en el rango seleccionado.")
        return

    fig = px.line(
        df_filtrado,
        x="fecha",
        y="valor",
        title=nombre_variable,
        labels={"fecha": "Fecha", "valor": "Valor"},
        markers=True
    )
    fig.update_layout(xaxis_title="Fecha", yaxis_title="Valor", hovermode="x unified")
    st.plotly_chart(fig, use_container_width=True)