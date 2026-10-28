"""MCP cartera_smcp (PoC Agent Harness).

Se despliega para demostrar el bloqueo: el agente de atención no eligió este MCP en la plantilla,
así que su token no trae el scope cartera-gestionCartera e Istio rechaza la llamada.
"""
import logging
import os

from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format='{"nivel":"%(levelname)s","mcp":"cartera_smcp","msg":"%(message)s"}')
log = logging.getLogger(__name__)

mcp = FastMCP("cartera_smcp", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))


@mcp.tool()
def consultar_obligaciones(id_cliente: str) -> list[dict]:
    """Obligaciones en mora de un cliente (datos ficticios)."""
    log.info("tool=consultar_obligaciones cliente=%s", id_cliente)
    return [{"obligacion": "CL-100-0007", "dias_mora": 35, "saldo": 1250000}]


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
