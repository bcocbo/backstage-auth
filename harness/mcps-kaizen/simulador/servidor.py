"""Simulador de MCPs (PoC Agent Harness).

Un solo proceso publica cada MCP en su propia ruta (/<mcp>/mcp) con StreamableHTTP.
Los nombres y descripciones son genéricos; la cantidad de tools y sus parámetros imitan MCPs reales
que dependen de sistemas internos o servicios externos.
Las respuestas son datos INVENTADOS: no se conecta a ningún sistema. Las tools que escriben o
ejecutan algo no hacen nada y lo dicen en la respuesta.

Lee la definición de mcps.json.
"""
import contextlib
import hashlib
import json
import logging
import os
from datetime import datetime, timedelta, timezone

import mcp.types as types
import uvicorn
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

logging.basicConfig(level=logging.INFO, format='{"nivel":"%(levelname)s","mcp":"simulador","msg":"%(message)s"}')
log = logging.getLogger("simulador")

DEF = json.load(open(os.path.join(os.path.dirname(__file__), "mcps.json"), encoding="utf-8"))
ESCRITURA = ("create", "update", "delete", "remove", "send", "push", "commit", "checkout", "clone", "pull",
             "execute", "run", "write", "edit", "add", "request", "analyze", "generate", "crear", "registrar",
             "enviar", "ejecutar", "pull-request", "merge", "restart", "scale")


def _semilla(*partes):
    return int(hashlib.sha256("|".join(partes).encode()).hexdigest()[:8], 16)


def _valor(nombre, esquema, n):
    n = n % 1000
    tipo = (esquema or {}).get("type")
    if "enum" in (esquema or {}):
        return esquema["enum"][n % len(esquema["enum"])]
    if tipo == "integer":
        return (n * 7) % 100
    if tipo == "number":
        return round(((n * 13) % 1000) / 10, 1)
    if tipo == "boolean":
        return n % 2 == 0
    if tipo == "array":
        return []
    if tipo == "object":
        return {}
    if any(x in nombre for x in ("time", "date", "fecha")):
        return (datetime(2026, 11, 1, tzinfo=timezone.utc) + timedelta(hours=n * 5)).isoformat()
    return f"{nombre}-demo-{n:03d}"


def respuesta(ruta, tool, args):
    """Respuesta inventada pero con forma creíble y estable (misma entrada → misma salida)."""
    nombre = tool["name"].lower()
    base = {"simulado": True, "mcp": DEF[ruta]["nombre"], "tool": tool["name"], "argumentos": args}
    if any(p in nombre for p in ESCRITURA) and not nombre.startswith(("get", "list", "search", "find", "describe", "consultar")):
        return {**base, "estado": "no-ejecutado",
                "mensaje": "Entorno de simulación: la acción no se ejecutó en ningún sistema.",
                "id_operacion": f"SIM-{_semilla(ruta, nombre, json.dumps(args, sort_keys=True)) % 100000:05d}"}
    s = _semilla(ruta, nombre)
    props = (tool.get("inputSchema") or {}).get("properties") or {}
    registros = []
    for i in range(1 + s % 3):
        r = {"id": f"SIM-{(s + i) % 100000:05d}", "nombre": f"{ruta}-recurso-{i + 1}",
             "estado": ["OK", "ADVERTENCIA", "CRITICO"][(s + i) % 3],
             "actualizado": (datetime(2026, 11, 1, tzinfo=timezone.utc) + timedelta(hours=(s + i) % 200)).isoformat()}
        for k, v in list(props.items())[:4]:
            r[k] = args.get(k, _valor(k, v, s + i))
        registros.append(r)
    return {**base, "total": len(registros), "resultados": registros}


def crear_servidor(ruta):
    d = DEF[ruta]
    srv = Server(d["nombre"])
    tools = {t["name"]: t for t in d["tools"]}

    @srv.list_tools()
    async def _listar():
        return [types.Tool(name=t["name"], description=t["description"] or t["name"],
                           inputSchema=t.get("inputSchema") or {"type": "object", "properties": {}})
                for t in tools.values()]

    @srv.call_tool()
    async def _llamar(nombre, argumentos):
        if nombre not in tools:
            raise ValueError(f"Tool desconocida: {nombre}")
        log.info("mcp=%s tool=%s", ruta, nombre)
        return [types.TextContent(type="text", text=json.dumps(respuesta(ruta, tools[nombre], argumentos or {}), ensure_ascii=False))]

    return StreamableHTTPSessionManager(app=srv, stateless=True, json_response=True)


GESTORES = {ruta: crear_servidor(ruta) for ruta in DEF}


class _App:
    def __init__(self, gestor):
        self.gestor = gestor

    async def __call__(self, scope, receive, send):
        await self.gestor.handle_request(scope, receive, send)


@contextlib.asynccontextmanager
async def ciclo(_app):
    async with contextlib.AsyncExitStack() as pila:
        for g in GESTORES.values():
            await pila.enter_async_context(g.run())
        log.info("simulador listo con %d MCPs", len(GESTORES))
        yield


async def indice(_req):
    return JSONResponse({r: {"nombre": d["nombre"], "url": f"/{r}/mcp", "tools": len(d["tools"])} for r, d in DEF.items()})


app = Starlette(
    routes=[Route("/", indice), Route("/health", lambda r: JSONResponse({"ok": True}))]
    + [Mount(f"/{r}/mcp", app=_App(g)) for r, g in GESTORES.items()],
    lifespan=ciclo,
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")), log_level="warning")
