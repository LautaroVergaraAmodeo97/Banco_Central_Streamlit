"""
Límite de pedidos por IP en una ventana de tiempo, en memoria.

Protege las rutas que consultan la API del INDEC con el token personal:
sin límite, cualquiera podría usar el explorador para hacer miles de
consultas y que el INDEC bloquee el token.
"""

import threading
import time
from collections import defaultdict, deque


class LimitePorIP:
    def __init__(self, maximo, ventana_segundos):
        self.maximo = maximo
        self.ventana = ventana_segundos
        self._pedidos = defaultdict(deque)
        self._lock = threading.Lock()

    def excedido(self, ip):
        """Registra un pedido de `ip` y devuelve True si ya superó el máximo."""
        ahora = time.monotonic()
        with self._lock:
            # Olvida las IPs sin pedidos recientes para que el registro no crezca sin fin
            for otra in [i for i, p in self._pedidos.items() if not p or ahora - p[-1] > self.ventana]:
                del self._pedidos[otra]
            pedidos = self._pedidos[ip]
            while pedidos and ahora - pedidos[0] > self.ventana:
                pedidos.popleft()
            if len(pedidos) >= self.maximo:
                return True
            pedidos.append(ahora)
            return False
