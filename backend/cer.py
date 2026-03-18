import pandas as pd



def calcular_cer(df_cer,df_mayorista):
    
    if df_cer.empty or df_mayorista.empty:
        raise ValueError("Hay datos vacios")
    
    df_cer = df_cer.sort('fecha')
    df_mayorista=df_mayorista.sort('fecha')
        
    
    ultimo_dato_mayorista= df_mayorista['valor'].iloc[-1]
    ultimo_dato_cer=df_cer['valor'].iloc[-1]
   
    formula = (ultimo_dato_mayorista/ultimo_dato_cer)*ultimo_dato_cer


    return formula

