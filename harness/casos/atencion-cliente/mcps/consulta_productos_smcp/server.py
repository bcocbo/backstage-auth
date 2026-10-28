"""MCP consulta-productos_smcp (PoC Agent Harness).

Tools de solo lectura sobre un portafolio de productos ficticio. No valida tokens: en la arquitectura
de Kaizen eso lo hace Istio (RequestAuthentication + AuthorizationPolicy por scope) antes de que la
petición llegue al contenedor.
"""
import logging
import os

from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format='{"nivel":"%(levelname)s","mcp":"consulta-productos_smcp","msg":"%(message)s"}')
log = logging.getLogger(__name__)

PRODUCTOS = {
    "CA-001": {"nombre": "Cuenta de ahorros digital", "tipo": "cuenta", "cuota_manejo": 0, "tasa_ea": 1.5},
    "TC-010": {"nombre": "Tarjeta de crédito clásica", "tipo": "tarjeta", "cuota_manejo": 21900, "tasa_ea": 28.5},
    "TC-020": {"nombre": "Tarjeta de crédito sin cuota de manejo", "tipo": "tarjeta", "cuota_manejo": 0, "tasa_ea": 29.1},
    "CL-100": {"nombre": "Crédito de libre inversión", "tipo": "credito", "cuota_manejo": 0, "tasa_ea": 18.9},
    "CDT-90": {"nombre": "CDT a 90 días", "tipo": "inversion", "cuota_manejo": 0, "tasa_ea": 9.2},
}

mcp = FastMCP("consulta-productos_smcp", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))


@mcp.tool()
def buscar_producto(texto: str) -> list[dict]:
    """Busca productos del portafolio cuyo nombre o tipo contenga el texto (ej. 'tarjeta', 'ahorros')."""
    t = texto.lower()
    hallados = [{"codigo": c, **p} for c, p in PRODUCTOS.items() if t in p["nombre"].lower() or t in p["tipo"]]
    log.info("tool=buscar_producto texto=%s resultados=%d", texto, len(hallados))
    return hallados


@mcp.tool()
def detalle_producto(codigo: str) -> dict:
    """Devuelve las condiciones de un producto por su código (ej. 'TC-020')."""
    log.info("tool=detalle_producto codigo=%s", codigo)
    p = PRODUCTOS.get(codigo.upper())
    return {"codigo": codigo.upper(), **p} if p else {"error": f"No existe el producto {codigo}"}


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
