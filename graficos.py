import matplotlib.pyplot as plt
import pandas as pd
import io
import streamlit as st

def graficar_variable(df, nombre_variable, anio_ini, mes_ini, anio_fin, mes_fin):
    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-01")
    fecha_fin = pd.to_datetime(f"{anio_fin}-{mes_fin:02d}-01")

    # Filtra por rango de fechas
    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos disponibles en el rango seleccionado.")
        return

    # Agrega columna "mes" para agrupación
    df_filtrado['mes'] = df_filtrado['fecha'].dt.to_period('M')
    resumen = df_filtrado.groupby('mes')['valor'].mean().reset_index()
    resumen['mes'] = resumen['mes'].dt.to_timestamp()

    # Crear gráfico
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(resumen['mes'], resumen['valor'], linestyle='-')
    ax.set_title(f"{nombre_variable}", fontsize=14)
    ax.set_xlabel("Fecha")
    ax.set_ylabel("Valor promedio mensual")
    ax.grid(True)

    st.pyplot(fig)
