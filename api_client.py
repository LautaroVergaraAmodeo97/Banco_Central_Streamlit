import requests
import pandas as pd

BASE_URL = "https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias"


def obtener_datos_api(indicador_id: int):
    url = f"{BASE_URL}/{indicador_id}"
    response = requests.get(url, verify=False)  
    data = response.json()
    return pd.DataFrame(data["results"])
