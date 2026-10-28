# Despliega el caso real en el namespace harness-poc: modelo, MCPs con Istio y agente.
# Requiere haber corrido identidad\crear-identidad-cognito.ps1 (crea el Secret del agente).
$ErrorActionPreference = 'Stop'
$d = $PSScriptRoot
$ns = 'harness-poc'
kubectl apply -f "$d\k8s\00-namespace-llm.yaml"
kubectl create configmap mcp-consulta-productos-codigo -n $ns --from-file=server.py="$d\mcps\consulta_productos_smcp\server.py" --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap mcp-cartera-codigo -n $ns --from-file=server.py="$d\mcps\cartera_smcp\server.py" --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap agente-atencion-prueba-codigo -n $ns --from-file=app.py="$d\agente\app.py" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$d\k8s\10-mcps.yaml"
kubectl apply -f "$d\k8s\20-agente.yaml"
kubectl rollout restart deployment -n $ns consulta-productos-smcp cartera-smcp atencion-prueba-aiagent
kubectl get pods -n $ns
