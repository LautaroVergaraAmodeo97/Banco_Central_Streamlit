import matplotlib.pyplot as plt
import pandas as pd
import io
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

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
    fig.update_traces(mode="lines")
    fig.update_layout(xaxis_title="Fecha", yaxis_title=ylabel, hovermode="x")

# Crear gráfico con línea y sombreado
    fig = go.Figure()

    fig.add_trace(go.Scatter(
            x=df_filtrado["fecha"],
            y=df_filtrado["valor"],
            mode="lines",  
            fill='tozeroy',  
            fillcolor="rgba(0, 123, 255, 0.3)",  
            line=dict(color="rgb(0, 123, 255)", width=2),
            name=nombre_variable,
            hovertemplate="%{x|%d-%m-%Y}<br>Valor: %{y:.2f}<extra></extra>"
        ))

    fig.update_layout(
            title=nombre_variable,
            xaxis_title="Fecha",
            yaxis_title=ylabel,
            hovermode="x",
            template="simple_white"
        )


    st.plotly_chart(fig, use_container_width=True)


def graficar_base_monetaria(df, nombre_variable, dia_ini, mes_ini, anio_ini, dia_final, mes_final, anio_final, ylabel):

    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-{dia_ini:02d}")
    fecha_fin = pd.to_datetime(f"{anio_final}-{mes_final:02d}-{dia_final:02d}")

    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos disponibles en el rango seleccionado.")
        return
       # Crear gráfico con línea y sombreado
    fig = go.Figure()

    fig.add_trace(go.Scatter(
            x=df_filtrado["fecha"],
            y=df_filtrado["valor"],
            mode="lines",  
            fill='tozeroy',  
            fillcolor="rgba(0, 123, 255, 0.3)",  
            line=dict(color="rgb(0, 123, 255)", width=2),
            name=nombre_variable,
            hovertemplate="%{x|%d-%m-%Y}<br>Valor: %{y:.2f}<extra></extra>"
        ))

    fig.update_layout(
            title=nombre_variable,
            xaxis_title="Fecha",
            yaxis_title=ylabel,
            hovermode="x",
            template="simple_white"
        )

    st.plotly_chart(fig, use_container_width=True)
    
def graficar_por_dia(df, nombre_variable, dia_ini, mes_ini, anio_ini, dia_final, mes_final, anio_final, ylabel):
    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-{dia_ini:02d}")
    fecha_fin = pd.to_datetime(f"{anio_final}-{mes_final:02d}-{dia_final:02d}")

    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos disponibles en el rango seleccionado.")
        return

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df_filtrado["fecha"],
        y=df_filtrado["valor"],
        mode="lines",  
        line=dict(color="rgb(0, 123, 255)", width=2),
        name=nombre_variable,
        hovertemplate="%{x|%d-%m-%Y}<br>Valor: %{y:.2f}<extra></extra>"
    ))

    fig.update_layout(
        title=nombre_variable,
        xaxis_title="Fecha",
        yaxis_title=ylabel,
        hovermode="x",
        template="simple_white"
    )

    st.plotly_chart(fig, use_container_width=True)
    
    
def graficar_itcrm(df, dia_ini, mes_ini, anio_ini, dia_final, mes_final, anio_final):
   
    fecha_ini = pd.to_datetime(f"{anio_ini}-{mes_ini:02d}-{dia_ini:02d}")
    fecha_fin = pd.to_datetime(f"{anio_final}-{mes_final:02d}-{dia_final:02d}")

    df_filtrado = df[(df["fecha"] >= fecha_ini) & (df["fecha"] <= fecha_fin)].copy()

    if df_filtrado.empty:
        st.warning("No hay datos de ITCRM disponibles en el rango seleccionado.")
        return

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df_filtrado["fecha"],
        y=df_filtrado["valor"],
        mode="lines",  
        line=dict(color="rgb(255, 87, 34)", width=2),  # Color naranja distintivo para ITCRM
        name="ITCRM",
        hovertemplate="%{x|%d-%m-%Y}<br>ITCRM: %{y:.2f}<extra></extra>"
    ))

    fig.update_layout(
        title="Índice de Tipo de Cambio Real Multilateral (ITCRM)",
        xaxis_title="Fecha",
        yaxis_title="Índice (Base 17-12-15=100)",
        hovermode="x",
        template="simple_white"
    )

    st.plotly_chart(fig, use_container_width=True, key="grafico_itcrm_unico")
    
  
    #if not df_filtrado.empty:
    #    col1, col2, col3 = st.columns(3)
        
    #    with col1:
    #        valor_actual = df_filtrado["valor"].iloc[-1]
    #        st.metric("Valor Actual", f"{valor_actual:.2f}")
        
    #    with col2:
    #        valor_max = df_filtrado["valor"].max()
    #        st.metric("Máximo del Período", f"{valor_max:.2f}")
            
    #    with col3:
    #        valor_min = df_filtrado["valor"].min()
    #        st.metric("Mínimo del Período", f"{valor_min:.2f}")
        
     
        #with st.expander("ℹ️ ¿Qué significa el ITCRM?"):
        #    st.info("""
        #    **Índice de Tipo de Cambio Real Multilateral (ITCRM)**
            
        #    - **Base**: 17 de diciembre de 2015 = 100
        #    - **Interpretación**:
        #      - ↗️ **Aumento**: Pérdida de competitividad de productos argentinos
        #      - ↘️ **Disminución**: Ganancia de competitividad de productos argentinos
            
        #    - **Actualización**: Diaria a las 15:00 hs por el BCRA
        #    - **Fuente**: Banco Central de la República Argentina
        #    """)