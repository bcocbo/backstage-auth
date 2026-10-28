"""Agente atencion-prueba_aiagent (PoC Agent Harness), pro-code con LangGraph.

Lo que aporta el harness externo, y no el código del agente:
- Identidad propia: App Client de Cognito <codigoApp>-<nombre>, token por client credentials.
- Mínimo acceso: el token solo trae los scopes de los MCPs elegidos en la plantilla; Istio bloquea el resto.
- Modelo vía una API compatible con OpenAI (LLM_BASE_URL), como el LLM Gateway corporativo.
- Trazas: cada pregunta, tool y bloqueo queda en un log estructurado.
"""
import json
import logging
import os
import time
import uuid

import httpx
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

AGENTE = os.getenv("AGENT_NAME", "atencion-prueba_aiagent")
logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(AGENTE)


def traza(evento: str, **datos) -> None:
    log.info(json.dumps({"agente": AGENTE, "evento": evento, "ts": time.time(), **datos}, ensure_ascii=False))


MCPS = json.loads(os.environ["MCP_URLS"])  # {"consulta-productos_smcp": "http://.../mcp"}
SCOPES = os.environ["SCOPES"]  # "consumo-mcps/a consumo-mcps/b"
_token = {"valor": None, "expira": 0.0}


def obtener_token() -> str:
    """Token M2M de Cognito con solo los scopes del blueprint; se cachea hasta poco antes de expirar."""
    if _token["valor"] and time.time() < _token["expira"] - 60:
        return _token["valor"]
    r = httpx.post(
        os.environ["TOKEN_URL"],
        data={"grant_type": "client_credentials", "scope": SCOPES},
        auth=(os.environ["CLIENT_ID"], os.environ["CLIENT_SECRET"]),
        timeout=15,
    )
    r.raise_for_status()
    datos = r.json()
    _token.update(valor=datos["access_token"], expira=time.time() + datos["expires_in"])
    traza("token_obtenido", scopes=SCOPES.split())
    return _token["valor"]


modelo = ChatOpenAI(
    base_url=os.environ["LLM_BASE_URL"],
    api_key=os.getenv("LLM_API_KEY", "poc"),
    model=os.getenv("LLM_MODEL", "qwen2.5:3b"),
    temperature=0,
    timeout=240,
)

INSTRUCCIONES = (
    "Eres el agente de atención al cliente de un banco y tienes herramientas conectadas. "
    "Antes de responder cualquier pregunta sobre productos DEBES llamar a la herramienta buscar_producto "
    "(por ejemplo con texto='tarjeta') y, si hace falta, a detalle_producto. "
    "Responde en español, breve y claro, solo con los datos que devuelvan las herramientas."
)

app = FastAPI(title=AGENTE)


class Pregunta(BaseModel):
    pregunta: str


@app.get("/health")
def health():
    return {"estado": "ok"}


PAGINA = """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agente atención al cliente</title><style>
body{font-family:Segoe UI,Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1d2433;background:#f6f7fb}
h1{font-size:20px;margin:0 0 4px}.sub{color:#5b6475;font-size:13px;margin-bottom:16px}
.card{background:#fff;border:1px solid #e3e6ee;border-radius:8px;padding:14px;margin:12px 0}
textarea{width:100%;box-sizing:border-box;height:64px;font:inherit;padding:8px}
button{background:#12305a;color:#fff;border:0;border-radius:6px;padding:8px 14px;margin:6px 6px 0 0;cursor:pointer}
button.sec{background:#fff;color:#12305a;border:1px solid #12305a}pre{white-space:pre-wrap;font-size:12px;background:#f1f3f8;padding:8px;border-radius:6px}
.ok{color:#11793b;font-weight:600}.no{color:#b42318;font-weight:600}</style></head><body>
<h1>atencion-prueba_aiagent</h1><div class="sub">Agente creado con la plantilla Agente con Harness · identidad propia (Cognito) · acceso por scope (Istio) · trazas</div>
<div class="card"><b>Pregúntale al agente</b><textarea id="q">¿Qué tarjetas de crédito tienen y cuál no cobra cuota de manejo?</textarea>
<button onclick="preguntar()">Preguntar</button><div id="r"></div></div>
<div class="card"><b>¿Qué deja pasar el harness?</b><br>
<button class="sec" onclick="probar('http://consulta-productos-smcp/mcp')">Usar consulta-productos_smcp (elegido)</button>
<button class="sec" onclick="probar('http://cartera-smcp/mcp')">Usar cartera_smcp (no elegido)</button><div id="a"></div></div>
<script>
async function preguntar(){const r=document.getElementById('r');r.textContent='Pensando… (el modelo corre en CPU, puede tardar ~1 min)';
const res=await fetch('preguntar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pregunta:document.getElementById('q').value})});
const j=await res.json();r.innerHTML='<p>'+(j.respuesta||'(sin respuesta)')+'</p><pre>tools usadas: '+(j.tools_usadas||[]).join(', ')+'\\nid de traza: '+j.id_traza+'</pre>';}
async function probar(u){const a=document.getElementById('a');a.textContent='Probando…';const j=await (await fetch('probar-acceso?url='+encodeURIComponent(u))).json();
a.innerHTML='<p class="'+(j.permitido?'ok':'no')+'">'+(j.permitido?'Permitido':'Bloqueado')+' · HTTP '+j.codigo_http+'</p><pre>'+u+'\\n'+(j.permitido?'El token trae el scope de este MCP.':j.detalle)+'</pre>';}
</script></body></html>"""


@app.get("/", response_class=HTMLResponse)
def inicio():
    return PAGINA


@app.get("/agent-card")
def agent_card():
    """Tarjeta del agente al estilo A2A: quién es y qué piezas usa."""
    return {"name": AGENTE, "description": "Responde consultas de productos y radica PQR de clientes",
            "mcps": list(MCPS), "scopes": SCOPES.split(), "modelo": os.getenv("LLM_MODEL")}


@app.post("/preguntar")
async def preguntar(p: Pregunta):
    id_traza = str(uuid.uuid4())
    traza("pregunta", id=id_traza, pregunta=p.pregunta)
    token = obtener_token()
    cliente = MultiServerMCPClient({
        nombre: {"transport": "streamable_http", "url": url, "headers": {"Authorization": f"Bearer {token}"}}
        for nombre, url in MCPS.items()
    })
    tools = await cliente.get_tools()
    agente = create_react_agent(modelo, tools, prompt=INSTRUCCIONES)
    resultado = await agente.ainvoke({"messages": [("user", p.pregunta)]})
    usadas = [tc["name"] for m in resultado["messages"] for tc in (getattr(m, "tool_calls", None) or [])]
    for nombre in usadas:
        traza("tool_usada", id=id_traza, tool=nombre)
    respuesta = resultado["messages"][-1].content
    traza("respuesta", id=id_traza, tools=usadas)
    return {"id_traza": id_traza, "respuesta": respuesta, "tools_usadas": usadas}


# MCPs del namespace contra los que se puede probar el acceso (lista cerrada: el endpoint es público).
MCPS_PROBABLES = {"http://consulta-productos-smcp/mcp", "http://cartera-smcp/mcp"}


@app.get("/probar-acceso")
def probar_acceso(url: str):
    """Intenta abrir sesión con un MCP usando la identidad del agente; muestra si el harness lo deja pasar."""
    if url not in MCPS_PROBABLES:
        return {"url": url, "codigo_http": 400, "permitido": False, "detalle": "MCP no reconocido"}
    token = obtener_token()
    cuerpo = {"jsonrpc": "2.0", "id": 1, "method": "initialize",
              "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": AGENTE, "version": "0.1"}}}
    r = httpx.post(url, json=cuerpo, timeout=15, headers={
        "Authorization": f"Bearer {token}", "Accept": "application/json, text/event-stream"})
    permitido = r.status_code < 400
    traza("acceso_mcp", url=url, codigo=r.status_code, permitido=permitido)
    return {"url": url, "codigo_http": r.status_code, "permitido": permitido, "detalle": r.text[:200]}
