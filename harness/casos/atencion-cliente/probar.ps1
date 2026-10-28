# Prueba de punta a punta del caso real desde dentro del pod del agente:
# 1) acceso permitido al MCP elegido, 2) acceso bloqueado al MCP no elegido, 3) pregunta real al agente.
$ns = 'harness-poc'
function T($t) { Write-Output "`n=== $t ===" }
T 'pods'; kubectl get pods -n $ns
T 'modelo descargado'; kubectl exec deploy/llm-gateway-poc -n $ns -c ollama -- ollama list
$py = @'
import httpx, json, sys
base = "http://localhost:8080"
paso = sys.argv[1]
if paso == "permitido":
    print(json.dumps(httpx.get(base + "/probar-acceso", params={"url": "http://consulta-productos-smcp/mcp"}, timeout=30).json(), ensure_ascii=False))
elif paso == "bloqueado":
    print(json.dumps(httpx.get(base + "/probar-acceso", params={"url": "http://cartera-smcp/mcp"}, timeout=30).json(), ensure_ascii=False))
else:
    r = httpx.post(base + "/preguntar", json={"pregunta": "Que tarjetas de credito tienen y cual no cobra cuota de manejo?"}, timeout=300)
    print(r.status_code, json.dumps(r.json(), ensure_ascii=False, indent=1))
'@
# PowerShell 5.1 pierde las comillas al pasar argumentos a programas nativos: el script viaja en base64.
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($py))
$run = "import base64;exec(base64.b64decode('$b64'))"
T 'acceso permitido (consulta-productos_smcp)'; kubectl exec deploy/atencion-prueba-aiagent -n $ns -c agente -- python -c $run permitido
T 'acceso bloqueado (cartera_smcp, no elegido)'; kubectl exec deploy/atencion-prueba-aiagent -n $ns -c agente -- python -c $run bloqueado
T 'pregunta al agente'; kubectl exec deploy/atencion-prueba-aiagent -n $ns -c agente -- python -c $run pregunta
T 'trazas del agente'; kubectl logs deploy/atencion-prueba-aiagent -n $ns -c agente --tail=15
