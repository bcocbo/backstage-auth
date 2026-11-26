# Servicio de decisión del gateway de MCPs. agentgateway le pregunta por cada tools/call (gRPC, ext_mcp)
# y este servicio le pregunta a OPA (localhost:8181). Falla cerrado: si OPA no responde, agentgateway corta.
# Identidad: el token de Cognito del agente. Istio ya lo validó en el sidecar del gateway (RequestAuthentication
# + AuthorizationPolicy), así que aquí solo se leen sus claims (client_id y scope).
import base64, concurrent.futures, hashlib, json, sys, threading, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
import grpc

sys.path.insert(0, "/tmp/gen")
import ext_mcp_pb2 as pb, ext_mcp_pb2_grpc as rpc

aprobadas = set()


def opa(entrada):
    cuerpo = json.dumps({"input": entrada}).encode()
    req = urllib.request.Request("http://localhost:8181/v1/data/harness/gateway/decision", cuerpo,
                                 {"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=2))["result"]


def claims(headers):
    auth = headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return {}
    try:
        carga = auth.split()[1].split(".")[1]
        return json.loads(base64.urlsafe_b64decode(carga + "=" * (-len(carga) % 4)))
    except Exception:
        return {}


def error(motivo):
    return pb.McpRequestResult(error=pb.AuthorizationError(code=pb.AuthorizationError.PERMISSION_DENIED, reason=motivo))


class Servicio(rpc.ExtMcpServicer):
    def CheckRequest(self, r, ctx):
        if r.method != "tools/call":
            return pb.McpRequestResult(**{"pass": pb.Pass()})
        p = json.loads(r.mcp_request)
        c = claims({h.key.lower(): h.value.decode() for h in r.headers})
        entrada = {
            "agente": c.get("client_id"),
            "scopes": (c.get("scope") or "").split(),
            "mcp": r.service_names[0] if r.service_names else "",
            "tool": p.get("name"),
            "args": p.get("arguments") or {},
        }
        # La aprobación queda atada al agente, al MCP, a la tool y a sus argumentos exactos, y es de un solo uso.
        huella = hashlib.sha256(json.dumps({k: entrada[k] for k in ("agente", "mcp", "tool", "args")},
                                           sort_keys=True).encode()).hexdigest()
        d = opa(entrada)
        print(json.dumps({"traza": "decision_gateway", **entrada, "hash": huella, **d}, ensure_ascii=False), flush=True)
        motivos = "; ".join(d["motivos"])
        if d["resultado"] == "allow":
            return pb.McpRequestResult(**{"pass": pb.Pass()})
        if d["resultado"] == "approval":
            if huella in aprobadas:
                aprobadas.discard(huella)
                return pb.McpRequestResult(**{"pass": pb.Pass()})
            return error(f"requiere aprobacion hash={huella}: {motivos}")
        return error(f"negado: {motivos}")

    def CheckResponse(self, r, ctx):
        return pb.McpResponseResult(**{"pass": pb.Pass()})


class Aprobador(BaseHTTPRequestHandler):
    # POST /aprobar/<hash>. El puerto 8080 no lo abre ninguna AuthorizationPolicy: solo con kubectl port-forward.
    def do_POST(self):
        huella = self.path.rsplit("/", 1)[-1]
        aprobadas.add(huella)
        print(json.dumps({"traza": "aprobacion", "hash": huella}), flush=True)
        self.send_response(200); self.end_headers(); self.wfile.write(b"aprobada\n")


s = grpc.server(concurrent.futures.ThreadPoolExecutor(8))
rpc.add_ExtMcpServicer_to_server(Servicio(), s)
s.add_insecure_port("0.0.0.0:9001")
s.start()
threading.Thread(target=HTTPServer(("0.0.0.0", 8080), Aprobador).serve_forever, daemon=True).start()
s.wait_for_termination()
